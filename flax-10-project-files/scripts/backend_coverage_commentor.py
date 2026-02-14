#!/usr/bin/env python3
"""
Parse coverage.py XML (coverage.xml) and comment a Markdown table on the PR.

"""

from __future__ import annotations

import json
import os
import sys
import textwrap
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
    with open(event_path, "r", encoding="utf-8") as f:
        event = json.load(f)
    pr = event.get("pull_request")
    return int(pr["number"]) if isinstance(pr, dict) and "number" in pr else None


def parse_coverage_xml(xml_path: Path) -> tuple[list[FileCoverage], dict]:
    tree = ET.parse(xml_path)
    root = tree.getroot()

    files: list[FileCoverage] = []
    total_statements = 0
    total_missing = 0

    # coverage.py style: <packages><package><classes><class ...><lines><line .../></lines></class>
    for class_el in root.findall(".//class"):
        filename = (class_el.attrib.get("filename") or "").strip()
        if not filename:
            continue

        line_els = class_el.findall("./lines/line")
        statements = 0
        missing = 0
        missing_lines: list[int] = []

        for line_el in line_els:
            # Defensive parsing
            try:
                num = int(line_el.attrib.get("number", "0"))
            except ValueError:
                continue
            try:
                hits = int(line_el.attrib.get("hits", "0"))
            except ValueError:
                hits = 0

            statements += 1
            if hits == 0:
                missing += 1
                if num > 0:
                    missing_lines.append(num)

        covered = statements - missing
        rate_pct = (covered / statements * 100.0) if statements else 100.0
        missing_lines.sort()

        files.append(
            FileCoverage(
                filename=filename,
                statements=statements,
                missing=missing,
                rate_pct=rate_pct,
                missing_lines=missing_lines,
            )
        )

        total_statements += statements
        total_missing += missing

    total_covered = total_statements - total_missing
    totals = {
        "statements": total_statements,
        "missing": total_missing,
        "rate_pct": (total_covered / total_statements * 100.0) if total_statements else 100.0,
    }

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
    xml_path = Path(os.getenv("COVERAGE_XML_PATH", "coverage.xml"))
    repo = os.getenv("GITHUB_REPOSITORY", "")
    token = os.getenv("GITHUB_TOKEN", "")
    event_path = os.getenv("GITHUB_EVENT_PATH", "")

    if not xml_path.exists():
        print(f"ERROR: Coverage XML not found: {xml_path}", file=sys.stderr)
        return 2

    pr_number = load_pr_number(event_path) if event_path else None
    if not pr_number:
        print("Not a pull_request run; skipping PR comment.")
        return 0

    if not repo or not token:
        print("ERROR: Missing GITHUB_REPOSITORY or GITHUB_TOKEN", file=sys.stderr)
        return 2

    files, totals = parse_coverage_xml(xml_path)

    body = "\n".join([
    "✅ **Coverage Report**",
    "",
    f"**Total coverage:** {totals['rate_pct']:.2f}%",
    f"• Statements: {totals['statements']}",
    f"• Missing: {totals['missing']}",
    "",
    markdown_table(files),
    ]).strip()

    post_pr_comment(repo, pr_number, token, body)
    print(f"Posted coverage comment to PR #{pr_number}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())