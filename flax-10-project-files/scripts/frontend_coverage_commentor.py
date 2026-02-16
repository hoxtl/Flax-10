#!/usr/bin/env python3
"""frontend_coverage_commentor.py

Parse an Istanbul/nyc Clover XML report (clover.xml) and post a Markdown coverage
summary + per-file table as a PR comment.

"""

from __future__ import annotations

import json
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path


@dataclass
class FileCoverage:
    filename: str
    statements: int
    missing: int
    rate_pct: float
    missing_lines: list[int]


def load_pr_number(event_path: str) -> int | None:
    try:
        with open(event_path, "r", encoding="utf-8") as f:
            event = json.load(f)
    except OSError:
        return None
    except json.JSONDecodeError:
        return None

    pr = event.get("pull_request")
    return int(pr["number"]) if isinstance(pr, dict) and "number" in pr else None


def _trim_path(path_str: str, anchor: str | None) -> str:
    path_str = (path_str or "").strip()
    if not path_str:
        return ""

    # Normalise Windows separators if any appear.
    p = path_str.replace("\\", "/")

    if anchor:
        idx = p.find(anchor)
        if idx != -1:
            return p[idx:]

    # Heuristics: prefer repo-relative looking segments.
    for seg in ("/frontend/src/", "/src/", "/frontend/"):
        idx = p.find(seg)
        if idx != -1:
            return p[idx + 1 :]

    # Fallback: just the file name.
    return p.split("/")[-1]


def parse_clover_xml(xml_path: Path) -> tuple[list[FileCoverage], dict]:
    """Return (files, totals).

    Clover structure (nyc/istanbul):
      <coverage><project><metrics .../>
      <package><file ...><metrics .../><line .../></file></package>
    """

    tree = ET.parse(xml_path)
    root = tree.getroot()

    project_metrics = root.find("./project/metrics")
    if project_metrics is not None:
        try:
            total_statements = int(project_metrics.attrib.get("statements", "0"))
        except ValueError:
            total_statements = 0
        try:
            total_covered = int(project_metrics.attrib.get("coveredstatements", "0"))
        except ValueError:
            total_covered = 0
    else:
        total_statements = 0
        total_covered = 0

    total_missing = max(total_statements - total_covered, 0)
    total_rate = (total_covered / total_statements * 100.0) if total_statements else 100.0

    totals = {
        "statements": total_statements,
        "missing": total_missing,
        "rate_pct": total_rate,
    }

    anchor = os.getenv("PATH_TRIM_ANCHOR")

    files: list[FileCoverage] = []
    for file_el in root.findall(".//file"):
        # Prefer the path attribute (absolute), fallback to name.
        path_attr = (file_el.attrib.get("path") or "").strip()
        name_attr = (file_el.attrib.get("name") or "").strip()
        display_name = _trim_path(path_attr or name_attr, anchor)
        if not display_name:
            continue

        metrics_el = file_el.find("./metrics")
        if metrics_el is None:
            # If metrics are missing, try deriving from <line type="stmt">.
            stmt_lines = [ln for ln in file_el.findall("./line") if (ln.attrib.get("type") == "stmt")]
            statements = len(stmt_lines)
            missing_lines: list[int] = []
            for ln in stmt_lines:
                try:
                    num = int(ln.attrib.get("num", "0"))
                except ValueError:
                    continue
                try:
                    count = int(ln.attrib.get("count", "0"))
                except ValueError:
                    count = 0
                if count == 0 and num > 0:
                    missing_lines.append(num)
            missing_lines.sort()
            missing = len(missing_lines)
            covered = statements - missing
            rate_pct = (covered / statements * 100.0) if statements else 100.0
        else:
            try:
                statements = int(metrics_el.attrib.get("statements", "0"))
            except ValueError:
                statements = 0
            try:
                covered = int(metrics_el.attrib.get("coveredstatements", "0"))
            except ValueError:
                covered = 0
            covered = min(max(covered, 0), max(statements, 0))
            missing = max(statements - covered, 0)
            rate_pct = (covered / statements * 100.0) if statements else 100.0

            # Missing lines: look at <line type="stmt" count="0"/>
            missing_lines: list[int] = []
            for ln in file_el.findall("./line"):
                if (ln.attrib.get("type") or "").strip() != "stmt":
                    continue
                try:
                    num = int(ln.attrib.get("num", "0"))
                except ValueError:
                    continue
                try:
                    count = int(ln.attrib.get("count", "0"))
                except ValueError:
                    count = 0
                if count == 0 and num > 0:
                    missing_lines.append(num)
            missing_lines.sort()

        files.append(
            FileCoverage(
                filename=display_name,
                statements=statements,
                missing=missing,
                rate_pct=rate_pct,
                missing_lines=missing_lines,
            )
        )

    # Worst coverage first, then bigger files, then name
    files.sort(key=lambda f: (f.rate_pct, -f.statements, f.filename))
    return files, totals


def markdown_table(rows: list[FileCoverage], max_lines: int = 40) -> str:
    out = [
        "| File | Statements | Missing | Coverage | Lines missing |",
        "|---|---:|---:|---:|---|",
    ]

    for r in rows:
        miss_lines = ", ".join(map(str, r.missing_lines[:max_lines]))
        if len(r.missing_lines) > max_lines:
            miss_lines += f", … (+{len(r.missing_lines) - max_lines} more)"

        out.append(
            f"| `{r.filename}` | {r.statements} | {r.missing} | {r.rate_pct:.2f}% | {miss_lines} |"
        )

    return "\n".join(out)


def post_pr_comment(repo: str, pr_number: int, token: str, body: str) -> None:
    url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
    data = json.dumps({"body": body}).encode("utf-8")

    req = urllib.request.Request(
        url=url,
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "coverage-xml-commenter",
        },
        method="POST",
    )

    with urllib.request.urlopen(req) as resp:
        if resp.status not in (200, 201):
            raise RuntimeError(f"GitHub API returned HTTP {resp.status}")


def main() -> int:
    xml_path = Path(os.getenv("COVERAGE_XML_PATH", "clover.xml"))
    repo = os.getenv("GITHUB_REPOSITORY", "")
    token = os.getenv("GITHUB_TOKEN", "")
    event_path = os.getenv("GITHUB_EVENT_PATH", "")

    if not xml_path.exists():
        print(f"ERROR: Clover XML not found: {xml_path}", file=sys.stderr)
        return 2

    pr_number = load_pr_number(event_path) if event_path else None
    if not pr_number:
        print("Not a pull_request run; skipping PR comment.")
        return 0

    if not repo or not token:
        print("ERROR: Missing GITHUB_REPOSITORY or GITHUB_TOKEN", file=sys.stderr)
        return 2

    files, totals = parse_clover_xml(xml_path)

    body = "\n".join(
        [
            "✅ **Coverage Report (Frontend)**",
            "",
            f"**Total coverage:** {totals['rate_pct']:.2f}%",
            f"• Statements: {totals['statements']}",
            f"• Missing: {totals['missing']}",
            "",
            markdown_table(files),
        ]
    ).strip()

    post_pr_comment(repo, pr_number, token, body)
    print(f"Posted coverage comment to PR #{pr_number}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
