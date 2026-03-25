#!/usr/bin/env python3
"""
StudyFlax Code Quality Audit
Run from the scripts/ folder: python audit_code_quality.py --path ..

Checks
──────
Backend  (Python AST)
  1. DRY                        — duplicate normalised statement blocks
  2. Single Responsibility      — functions/classes mixing too many concerns
  3. Single Level of Abstraction— orchestration mixed with low-level ops
  4. Dead Code                  — unused imports, unreachable code, unused assignments

Frontend (JS/JSX heuristic)
  5. Function length / nesting  — >20 lines or >1 control-flow nesting level
  6. SRP / Abstraction          — fetch + state + render in same unit
  7. Inline / hardcoded styles  — style={{}} with multiple props or hex/rgb values
  8. DRY                        — duplicate normalised blocks across source files
  9. Dead Code                  — console.log, commented-out code blocks, unused vars

Comments (JS)
 10. Banner comments            — decorative separators
 11. American spelling          — in comment text
 12. Emojis in comments
 13. Arrow text in comments
"""

from __future__ import annotations

import ast
import hashlib
import re
import sys
import argparse
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable


# ══════════════════════════════════════════════════════════════════════════════
#  COLOURS
# ══════════════════════════════════════════════════════════════════════════════

class C:
    RED    = "\033[91m"
    YELLOW = "\033[33m"
    CYAN   = "\033[96m"
    GREEN  = "\033[92m"
    BOLD   = "\033[1m"
    DIM    = "\033[2m"
    END    = "\033[0m"


# ══════════════════════════════════════════════════════════════════════════════
#  CONFIG
# ══════════════════════════════════════════════════════════════════════════════

BACKEND_ROOT  = Path("backend")
FRONTEND_ROOT = Path("frontend/src")

SKIP_DIRS = {
    "__pycache__", "node_modules", ".git", "migrations",
    "venv", ".venv", "dist", "build", "coverage",
}

# Excluded from DRY / bloat — data files are repetitive by design
DATA_PATH_PATTERNS = [
    r"/fixtures/", r"/seed", r"factory", r"factories",
    r"/helpers/", r"conftest", r"testSetup",
    r"historyTestHelpers", r"timerTestHelpers", r"test-utils",
]

# ── Python thresholds ──
PY_MIN_DRY_BLOCK       = 6   # statements in a block before flagging duplicate
PY_MAX_FUNC_CATEGORIES = 3   # responsibility categories before SRP flag
PY_MAX_CLASS_METHODS   = 10  # public methods before flagging class
PY_MAX_COLLABORATORS   = 8   # distinct call targets before SRP flag

# ── JS thresholds ──
JS_MAX_FUNC_LINES  = 20
JS_MAX_NESTING     = 1
JS_MAX_FILE_LINES  = 400
JS_MAX_TEST_LINES  = 25
JS_MIN_DRY_LINES   = 5
JS_MIN_DRY_CHARS   = 150

# ── Comment rules ──
AMERICAN_TO_BRITISH = {
    "color":"colour","colors":"colours","colored":"coloured","coloring":"colouring",
    "favorite":"favourite","favorites":"favourites","favor":"favour",
    "initialize":"initialise","initialized":"initialised","initializing":"initialising",
    "initialization":"initialisation","organize":"organise","organized":"organised",
    "organizing":"organising","organization":"organisation",
    "customize":"customise","customized":"customised","customizing":"customising",
    "customization":"customisation","optimize":"optimise","optimized":"optimised",
    "optimizing":"optimising","optimization":"optimisation",
    "recognize":"recognise","recognized":"recognised","recognizing":"recognising",
    "synchronize":"synchronise","synchronized":"synchronised",
    "analyze":"analyse","analyzed":"analysed","analyzing":"analysing",
    "behavior":"behaviour","behaviors":"behaviours",
    "neighbor":"neighbour","neighbors":"neighbours",
    "honor":"honour","humor":"humour","labor":"labour",
    "center":"centre","centers":"centres","meter":"metre","meters":"metres",
    "dialog":"dialogue","dialogs":"dialogues",
    "defense":"defence","offense":"offence","license":"licence",
    "gray":"grey","canceled":"cancelled","canceling":"cancelling",
    "traveled":"travelled","traveling":"travelling",
    "modeled":"modelled","modeling":"modelling",
    "labeled":"labelled","labeling":"labelling",
    "enrollment":"enrolment","fulfill":"fulfil","fulfillment":"fulfilment",
}
# Terms that are valid as code identifiers — only flag them in natural-language comments
COMMENT_CODE_TERMS = {
    "color","colors","gray","center","centers","dialog","initialize",
    "initialized","initializing","initialization","optimize","optimized",
    "optimizing","optimization","synchronize","synchronized",
    "license","canceled","labeled","modeled","modeling",
    "serialize","serialized","deserialize","deserialized","normalize","normalized",
}
BANNER_PATTERNS_RE = [
    re.compile(r"^\s*//\s*[-=~*#]{5,}"),
    re.compile(r"^\s*//\s*[─━═]{3,}"),
    re.compile(r"^\s*/\*\s*[-=~*#─━═]{5,}"),
    re.compile(r"^\s*\*\s*[-=~*#─━═]{5,}"),
    re.compile(r"^\s*[-=~*#─━═]{5,}\s*\*/"),
    re.compile(r"^\s*//\s*[╔╗╚╝║│┌┐└┘├┤┬┴┼]"),
]
ARROW_RE = re.compile(r"-->|<--|==>|<==|~>|<~|[→←⇒⇐⟶⟵]")
EMOJI_RE = re.compile(
    "[\U0001F300-\U0001F9FF\U00002600-\U000026FF\U00002700-\U000027BF"
    "\U0001FA00-\U0001FA6F\U0001FA70-\U0001FAFF]"
)

CONTROL_FLOW_NODES = (
    ast.If, ast.For, ast.While, ast.Try,
    ast.ExceptHandler, ast.With,
    *([ast.Match] if hasattr(ast, "Match") else []),
)


# ══════════════════════════════════════════════════════════════════════════════
#  DATA CLASSES
# ══════════════════════════════════════════════════════════════════════════════

@dataclass(frozen=True)
class PyLoc:
    file: str
    name: str
    line: int

@dataclass(frozen=True)
class DryBlock:
    block_size: int
    locations:  tuple[PyLoc, ...]
    preview:    str

@dataclass(frozen=True)
class SRPIssue:
    file:      str
    unit_type: str
    name:      str
    line:      int
    reasons:   tuple[str, ...]

@dataclass(frozen=True)
class AbsIssue:
    file:    str
    name:    str
    line:    int
    reasons: tuple[str, ...]

@dataclass
class Issue:
    """Generic issue for JS checks and comments."""
    category: str   # section name
    rule:     str   # short rule id
    severity: str   # ERROR | WARN | INFO
    file:     str
    line:     int
    detail:   str
    fix:      str = ""


# ══════════════════════════════════════════════════════════════════════════════
#  SHARED HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def rel(path: Path) -> str:
    try:
        return str(path.relative_to(Path.cwd()))
    except ValueError:
        return str(path)

def short(path_str: str) -> str:
    s = path_str.replace("\\", "/")
    s = re.sub(r"^\.\./backend/studyFlax/", "backend/", s)
    s = re.sub(r"^\.\./frontend/src/", "src/", s)
    s = re.sub(r"^\.\./", "", s)
    return s

def read_lines(path: Path) -> list[str]:
    try:
        return path.read_text(encoding="utf-8", errors="replace").splitlines()
    except Exception:
        return []

def is_test(path: Path) -> bool:
    s = str(path).replace("\\", "/")
    n = path.name
    return ("/tests/" in s or "/test/" in s or "/__tests__/" in s
            or n.startswith("test_") or "test" in n.lower()
            or n.endswith("_test.py") or "spec" in n.lower())

def is_data(path: Path) -> bool:
    s = str(path).replace("\\", "/")
    return any(re.search(p, s) for p in DATA_PATH_PATTERNS)

def iter_py(root: Path) -> Iterable[Path]:
    for p in root.rglob("*.py"):
        if not any(d in p.parts for d in SKIP_DIRS):
            yield p

def iter_js(root: Path) -> Iterable[Path]:
    for ext in ("*.js", "*.jsx", "*.ts", "*.tsx"):
        for p in root.rglob(ext):
            if not any(d in p.parts for d in SKIP_DIRS):
                yield p

def parse_py(path: Path) -> ast.Module | None:
    try:
        return ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    except SyntaxError as e:
        print(f"  {C.DIM}Parse error {short(rel(path))}: {e.msg}{C.END}")
        return None

def dotted(node: ast.AST) -> str | None:
    if isinstance(node, ast.Name):      return node.id
    if isinstance(node, ast.Attribute):
        base = dotted(node.value)
        return f"{base}.{node.attr}" if base else node.attr
    return None

def fname(node: ast.AST) -> str:
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
        return node.name
    return "anonymous"


# ══════════════════════════════════════════════════════════════════════════════
#  PYTHON — DRY
# ══════════════════════════════════════════════════════════════════════════════

def get_end(node: ast.AST) -> int:
    return getattr(node, "end_lineno", getattr(node, "lineno", 0))

def stmt_text(lines: list[str], stmt: ast.stmt) -> str:
    start = max(0, stmt.lineno - 1)
    end   = max(start, get_end(stmt))
    return "".join(lines[start:end])

def normalise_stmt(text: str) -> str:
    text = re.sub(r"#.*", "", text)
    text = re.sub(r'".*?"|\'.*?\'', '"S"', text)
    text = re.sub(r"\b\d+\b", "N", text)
    return re.sub(r"\s+", " ", text).strip()

def collect_py_blocks(path: Path, tree: ast.Module, lines: list[str]) -> dict:
    out: dict[tuple, list[PyLoc]] = defaultdict(list)
    def add(body: list[ast.stmt], owner: str) -> None:
        stmts = []
        for s in body:
            if isinstance(s, (ast.Import, ast.ImportFrom, ast.Pass)):
                continue
            n = normalise_stmt(stmt_text(lines, s))
            if n:
                stmts.append((n, s.lineno))
        if len(stmts) < PY_MIN_DRY_BLOCK:
            return
        for i in range(len(stmts) - PY_MIN_DRY_BLOCK + 1):
            w   = stmts[i: i + PY_MIN_DRY_BLOCK]
            sig = tuple(x[0] for x in w)
            out[sig].append(PyLoc(file=short(rel(path)), name=owner, line=w[0][1]))
    add(tree.body, "<module>")
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            add(node.body, fname(node))
    return out

def find_py_dry(root: Path) -> list[DryBlock]:
    sigs: dict[tuple, list[PyLoc]] = defaultdict(list)
    for path in iter_py(root):
        if is_test(path) or is_data(path):
            continue
        lines = [l + "\n" for l in read_lines(path)]
        tree  = parse_py(path)
        if tree is None:
            continue
        for sig, locs in collect_py_blocks(path, tree, lines).items():
            sigs[sig].extend(locs)
    out = []
    for sig, locs in sigs.items():
        unique = tuple(dict.fromkeys(locs))
        if len(unique) >= 2:
            out.append(DryBlock(len(sig), unique, sig[0][:120]))
    out.sort(key=lambda v: (-len(v.locations), -v.block_size))
    return out


# ══════════════════════════════════════════════════════════════════════════════
#  PYTHON — SRP
# ══════════════════════════════════════════════════════════════════════════════

class RespVisitor(ast.NodeVisitor):
    def __init__(self):
        self.cats:  set[str] = set()
        self.calls: set[str] = set()
    def visit_Call(self, node):
        n = dotted(node.func)
        if n:
            self.calls.add(n)
            low = n.lower()
            if any(t in low for t in ("save","create","update","delete","insert","write")): self.cats.add("persistence")
            if any(t in low for t in ("request","response","render","json","api","http")):  self.cats.add("transport")
            if any(t in low for t in ("print","logger","log","notify","email")):            self.cats.add("output")
            if any(t in low for t in ("sort","filter","map","validate","parse","build","calculate")): self.cats.add("transformation")
        self.generic_visit(node)
    def visit_If(self, n):       self.cats.add("branching");     self.generic_visit(n)
    def visit_For(self, n):      self.cats.add("iteration");     self.generic_visit(n)
    def visit_AsyncFor(self, n): self.cats.add("iteration");     self.generic_visit(n)
    def visit_While(self, n):    self.cats.add("iteration");     self.generic_visit(n)
    def visit_Try(self, n):      self.cats.add("error_handling");self.generic_visit(n)
    def visit_ListComp(self, n): self.cats.add("transformation");self.generic_visit(n)
    def visit_DictComp(self, n): self.cats.add("transformation");self.generic_visit(n)
    def visit_GeneratorExp(self,n):self.cats.add("transformation");self.generic_visit(n)

def method_cats(m: ast.FunctionDef) -> set[str]:
    v = RespVisitor(); v.visit(m); cats = set(v.cats); n = m.name.lower()
    if any(t in n for t in ("get","list","fetch")):          cats.add("query")
    if any(t in n for t in ("create","update","delete","save")): cats.add("command")
    if any(t in n for t in ("validate","clean","parse")):    cats.add("validation")
    if any(t in n for t in ("render","serialize","format")): cats.add("presentation")
    return cats

def check_func_srp(path: Path, node: ast.AST) -> SRPIssue | None:
    v = RespVisitor(); v.visit(node); reasons = []
    if len(v.cats) > PY_MAX_FUNC_CATEGORIES:
        reasons.append(f"mixes {len(v.cats)} categories: {', '.join(sorted(v.cats))}")
    if len(v.calls) >= PY_MAX_COLLABORATORS:
        reasons.append(f"coordinates {len(v.calls)} call targets")
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and len(node.body) >= 12:
        reasons.append(f"large body ({len(node.body)} statements)")
    if not reasons: return None
    return SRPIssue(short(rel(path)), "function", fname(node), getattr(node,"lineno",0), tuple(reasons))

def check_class_srp(path: Path, node: ast.ClassDef) -> SRPIssue | None:
    methods = [c for c in node.body
               if isinstance(c,(ast.FunctionDef,ast.AsyncFunctionDef)) and not c.name.startswith("_")]
    cats: set[str] = set()
    for m in methods: cats.update(method_cats(m))
    reasons = []
    if len(cats) > PY_MAX_FUNC_CATEGORIES:
        reasons.append(f"public API spans {len(cats)} categories: {', '.join(sorted(cats))}")
    if len(methods) > PY_MAX_CLASS_METHODS:
        reasons.append(f"has {len(methods)} public methods")
    if not reasons: return None
    return SRPIssue(short(rel(path)), "class", node.name, node.lineno, tuple(reasons))

def find_py_srp(root: Path) -> list[SRPIssue]:
    out = []
    for path in iter_py(root):
        if is_test(path) or is_data(path): continue
        tree = parse_py(path)
        if tree is None: continue
        for node in ast.walk(tree):
            if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef)):
                v = check_func_srp(path, node)
                if v: out.append(v)
            if isinstance(node, ast.ClassDef):
                v = check_class_srp(path, node)
                if v: out.append(v)
    out.sort(key=lambda v: (v.file, v.line))
    return out


# ══════════════════════════════════════════════════════════════════════════════
#  PYTHON — ABSTRACTION LEVEL
# ══════════════════════════════════════════════════════════════════════════════

def is_low_level(name: str) -> bool:
    return any(t in name.lower() for t in
               ("append","extend","strip","split","join","replace","lower","upper","encode","decode"))

def stmt_kind(s: ast.stmt) -> str:
    if isinstance(s,(ast.Assign,ast.AnnAssign,ast.AugAssign)): return "assignment"
    if isinstance(s,ast.Expr) and isinstance(s.value,ast.Call): return "call"
    if isinstance(s,ast.Return):  return "return"
    if isinstance(s,ast.If):      return "branch"
    if isinstance(s,(ast.For,ast.AsyncFor,ast.While)): return "loop"
    if isinstance(s,ast.Try):     return "try"
    return type(s).__name__.lower()

def check_abstraction(path: Path, node: ast.FunctionDef | ast.AsyncFunctionDef) -> AbsIssue | None:
    if len(node.body) < 5: return None
    kinds = {stmt_kind(s) for s in node.body}
    total, low = 0, 0
    for s in node.body:
        for child in ast.walk(s):
            if isinstance(child, ast.Call):
                n = dotted(child.func) or ""
                total += 1
                if n and is_low_level(n): low += 1
            if isinstance(child,(ast.BinOp,ast.Compare,ast.Subscript,ast.Slice)): low += 1
    reasons = []
    if {"assignment","call","branch"} <= kinds and low >= 4:
        reasons.append("mixes orchestration, branching, and low-level data manipulation")
    if total >= 8 and low >= 4:
        reasons.append(f"coordinates {total} calls alongside {low} low-level ops")
    if not reasons: return None
    return AbsIssue(short(rel(path)), node.name, node.lineno, tuple(reasons))

def find_py_abstraction(root: Path) -> list[AbsIssue]:
    out = []
    for path in iter_py(root):
        if is_test(path) or is_data(path): continue
        tree = parse_py(path)
        if tree is None: continue
        for node in ast.walk(tree):
            if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef)):
                v = check_abstraction(path, node)
                if v: out.append(v)
    out.sort(key=lambda v: (v.file, v.line))
    return out


# ══════════════════════════════════════════════════════════════════════════════
#  PYTHON — DEAD CODE
# ══════════════════════════════════════════════════════════════════════════════

def find_py_dead_code(root: Path) -> list[Issue]:
    issues = []
    for path in iter_py(root):
        if is_test(path) or is_data(path): continue
        lines = read_lines(path)
        tree  = parse_py(path)
        if tree is None: continue
        fstr  = short(rel(path))

        # Unused imports
        imported: dict[str, int] = {}
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    name = alias.asname or alias.name.split(".")[0]
                    imported[name] = node.lineno
            elif isinstance(node, ast.ImportFrom):
                for alias in node.names:
                    if alias.name == "*": continue
                    name = alias.asname or alias.name
                    imported[name] = node.lineno

        used_names: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Name) and not isinstance(node.ctx, ast.Store):
                used_names.add(node.id)
            if isinstance(node, ast.Attribute):
                if isinstance(node.value, ast.Name):
                    used_names.add(node.value.id)

        for name, lineno in imported.items():
            if name not in used_names and not name.startswith("_"):
                issues.append(Issue("Dead Code","UNUSED_IMPORT","WARN",fstr,lineno,
                    f"Imported name `{name}` is never used",
                    f"Remove the import or use it."))

        # Unreachable code after return/raise
        for node in ast.walk(tree):
            if not isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef)): continue
            for i, stmt in enumerate(node.body[:-1]):
                if isinstance(stmt,(ast.Return,ast.Raise)):
                    next_stmt = node.body[i+1]
                    if not isinstance(next_stmt,(ast.Return,ast.Raise,ast.Pass)):
                        issues.append(Issue("Dead Code","UNREACHABLE","WARN",fstr,
                            getattr(next_stmt,"lineno",0),
                            f"Unreachable code after `{type(stmt).__name__.lower()}` in `{node.name}`",
                            "Remove or restructure."))

    return issues


# ══════════════════════════════════════════════════════════════════════════════
#  JS — FUNCTION LENGTH / NESTING
# ══════════════════════════════════════════════════════════════════════════════

_ARROW_FUNC_RE = re.compile(
    r"^\s*(?:export\s+(?:default\s+)?)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\("
)
_NAMED_FUNC_RE = re.compile(
    r"^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\("
)

def extract_js_funcs(lines: list[str]) -> list[tuple[str,int,int]]:
    regions = []
    i = 0
    while i < len(lines):
        m = _ARROW_FUNC_RE.match(lines[i]) or _NAMED_FUNC_RE.match(lines[i])
        if m:
            name, depth, start = m.group(1), 0, i
            for j in range(i, len(lines)):
                depth += lines[j].count("{") - lines[j].count("}")
                if j > start and depth <= 0:
                    regions.append((name, start, j))
                    i = j
                    break
        i += 1
    return regions

def js_nesting(lines: list[str]) -> int:
    depth = peak = 0
    for line in lines:
        s = line.strip()
        if re.search(r"\b(if|for|while|switch)\b.*\{", s) or re.search(r"\b(catch|else\s*\{)", s):
            depth += 1; peak = max(peak, depth)
        elif s in ("}", "};", "},"):
            depth = max(0, depth - 1)
    return peak

def check_js_abstraction_mixing(name: str, body: list[str], fstr: str, lineno: int, issues: list[Issue]) -> None:
    text = "\n".join(body)
    fetch  = bool(re.search(r"\bfetch\(|axios\.|api\.", text))
    render = bool(re.search(r"\breturn\s*\(?\s*<", text))
    state  = bool(re.search(r"\buseState\b|\bdispatch\b", text))
    if fetch and render and state:
        issues.append(Issue("SRP/Abstraction","JS_SRP","WARN",fstr,lineno,
            f"`{name}` handles state + fetch + render",
            "Split into custom hook (data) + presentational component (render)."))
    elif fetch and render:
        issues.append(Issue("SRP/Abstraction","JS_ABSTRACTION","WARN",fstr,lineno,
            f"`{name}` mixes data fetching with JSX rendering",
            "Move fetch logic into a custom hook or api service."))

def check_js_funcs(path: Path, issues: list[Issue]) -> None:
    lines = read_lines(path)
    if not lines: return
    fstr  = short(rel(path))
    tst   = is_test(path)
    limit = JS_MAX_TEST_LINES if tst else JS_MAX_FUNC_LINES

    if len(lines) > JS_MAX_FILE_LINES:
        issues.append(Issue("Function/Nesting","JS_FILE_LONG","ERROR",fstr,1,
            f"{len(lines)} lines (max {JS_MAX_FILE_LINES})",
            "Split into smaller modules."))

    for name, start, end in extract_js_funcs(lines):
        flen  = end - start + 1
        depth = js_nesting(lines[start:end])
        if flen > limit:
            issues.append(Issue("Function/Nesting","JS_FUNC_LONG","ERROR",fstr,start+1,
                f"`{name}` is {flen} lines (max {limit})",
                "Extract logic into smaller helper functions."))
        if depth > JS_MAX_NESTING:
            issues.append(Issue("Function/Nesting","JS_NESTING","ERROR",fstr,start+1,
                f"`{name}` nesting depth {depth} (max {JS_MAX_NESTING})",
                "Use early returns / extract inner blocks."))
        if not tst:
            check_js_abstraction_mixing(name, lines[start:end], fstr, start+1, issues)


# ══════════════════════════════════════════════════════════════════════════════
#  JS — REACT COMPONENT SRP
# ══════════════════════════════════════════════════════════════════════════════

def check_react_srp(path: Path, issues: list[Issue]) -> None:
    if path.suffix not in (".jsx",".tsx") or is_test(path): return
    lines = read_lines(path)
    if not lines: return
    fstr  = short(rel(path))
    body  = "\n".join(lines)
    fetches   = bool(re.search(r"useEffect\b.*(?:fetch|api\.)", body, re.DOTALL))
    state_cnt = len(re.findall(r"\buseState\b", body))
    renders   = bool(re.search(r"return\s*\(?\s*<", body))
    calcs     = len(re.findall(r"\.map\(|\.filter\(|\.reduce\(", body))
    if fetches and state_cnt >= 4 and renders:
        issues.append(Issue("SRP/Abstraction","COMPONENT_SRP","WARN",fstr,1,
            f"Manages fetching + {state_cnt} useState hooks + rendering",
            "Extract fetch+state into a custom hook."))
    if calcs >= 3 and renders and state_cnt >= 4:
        issues.append(Issue("SRP/Abstraction","COMPONENT_SRP","WARN",fstr,1,
            f"Mixes {calcs} computation chains with rendering",
            "Move .map/.filter/.reduce into utils or useMemo."))


# ══════════════════════════════════════════════════════════════════════════════
#  JS — INLINE / HARDCODED STYLES
# ══════════════════════════════════════════════════════════════════════════════

_HEX_RE  = re.compile(r"#[0-9a-fA-F]{3,8}\b")
_RGB_RE  = re.compile(r"\brgba?\s*\(")
_HSL_RE  = re.compile(r"\bhsla?\s*\(")

def check_js_styles(path: Path, issues: list[Issue]) -> None:
    if path.suffix not in (".jsx",".tsx",".js",".html") or is_test(path): return
    lines = read_lines(path)
    fstr  = short(rel(path))
    for i, line in enumerate(lines, 1):
        # Multi-prop inline style object
        m = re.search(r'style=\{\{([^}]+)\}\}', line)
        if m and len(m.group(1).split(",")) >= 2:
            issues.append(Issue("Styles","INLINE_STYLE","WARN",fstr,i,
                f"Multi-prop inline style: {m.group(0)[:55]}",
                "Move to CSS module — IV.2.1 forbids inline styling."))
        # Hardcoded colour values (outside CSS files)
        if _HEX_RE.search(line) or _RGB_RE.search(line) or _HSL_RE.search(line):
            # Skip CSS variable definitions and imports
            if not re.search(r"--[\w-]+\s*:", line) and not line.strip().startswith("//"):
                colour = (_HEX_RE.search(line) or _RGB_RE.search(line) or _HSL_RE.search(line))
                if colour:
                    issues.append(Issue("Styles","HARDCODED_COLOUR","WARN",fstr,i,
                        f"Hardcoded colour value: {colour.group(0)}",
                        "Use a CSS variable from variables.css instead."))


# ══════════════════════════════════════════════════════════════════════════════
#  JS — DRY
# ══════════════════════════════════════════════════════════════════════════════

def check_js_dry(all_files: list[tuple[Path,list[str]]], issues: list[Issue]) -> None:
    blocks: dict[str, list[tuple[str,int]]] = defaultdict(list)
    for path, raw in all_files:
        if is_data(path) or is_test(path): continue
        normed = []
        for l in raw:
            s = l.strip()
            if s and not s.startswith("//") and not s.startswith("*"):
                s = re.sub(r"`[^`]*`|\"[^\"]*\"|'[^']*'", '""', s)
                s = re.sub(r"\b\d+\b", "0", s)
                normed.append(s)
        if len(normed) < JS_MIN_DRY_LINES: continue
        for i in range(len(normed) - JS_MIN_DRY_LINES + 1):
            chunk = normed[i: i + JS_MIN_DRY_LINES]
            text  = "\n".join(chunk)
            if len(text) < JS_MIN_DRY_CHARS: continue
            non_trivial = [l for l in chunk if l not in {"","}", "};","{"}
                           and not l.startswith("import ")]
            if len(non_trivial) < 3: continue
            key = hashlib.md5(text.encode()).hexdigest()
            blocks[key].append((short(rel(path)), i + 1))

    seen: set[frozenset] = set()
    for key, locs in blocks.items():
        if len(locs) < 2: continue
        for idx, (fa, la) in enumerate(locs):
            for fb, lb in locs[idx+1:]:
                if fa == fb: continue
                pair = frozenset([f"{fa}:{la}", f"{fb}:{lb}"])
                if pair in seen: continue
                seen.add(pair)
                issues.append(Issue("DRY","JS_DRY","WARN",fa,la,
                    f"Duplicate block also at {fb}:{lb}",
                    "Extract into a shared utility/hook."))


# ══════════════════════════════════════════════════════════════════════════════
#  JS — DEAD CODE
# ══════════════════════════════════════════════════════════════════════════════

_COMMENTED_CODE_RE = re.compile(
    r"^\s*//\s*(const|let|var|function|return|if|for|while|import|export)\b"
)

def check_js_dead_code(path: Path, issues: list[Issue]) -> None:
    if is_test(path): return
    lines = read_lines(path)
    fstr  = short(rel(path))
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if re.search(r"\bconsole\.(log|warn|error|debug)\b", line):
            issues.append(Issue("Dead Code","CONSOLE_LOG","WARN",fstr,i,
                f"console.* left in source: {line.strip()[:60]}",
                "Remove before submission."))
        if _COMMENTED_CODE_RE.match(line):
            issues.append(Issue("Dead Code","COMMENTED_CODE","INFO",fstr,i,
                f"Possibly commented-out code: {line.strip()[:60]}",
                "Remove dead code — do not leave it commented out."))
        if stripped.startswith("//") and re.search(r"\btodo\b|\bfixme\b|\bhack\b|\bxxx\b", stripped, re.IGNORECASE):
            issues.append(Issue("Dead Code","TODO_COMMENT","INFO",fstr,i,
                f"TODO/FIXME left in code: {line.strip()[:60]}",
                "Resolve or remove before submission."))


# ══════════════════════════════════════════════════════════════════════════════
#  COMMENT CHECKS  (JS/JSX)
# ══════════════════════════════════════════════════════════════════════════════

def extract_js_comments(code: str) -> list[tuple[int,str]]:
    """Return [(line_number, comment_text), ...]"""
    out = []
    lines = code.splitlines()
    for i, line in enumerate(lines, 1):
        m = re.search(r"//(.*)", line)
        if m:
            out.append((i, m.group(1).strip()))
        m = re.search(r"/\*(.*?)\*/", line)
        if m:
            out.append((i, m.group(1).strip()))
    # Multi-line block comments
    for m in re.finditer(r"/\*[\s\S]*?\*/", code):
        start_line = code[:m.start()].count("\n") + 1
        for j, bline in enumerate(m.group(0).splitlines()):
            cleaned = re.sub(r"^\s*/?[*]+/?", "", bline).strip()
            if cleaned:
                out.append((start_line + j, cleaned))
    return out

def check_comments(path: Path, issues: list[Issue]) -> None:
    if path.suffix not in (".js",".jsx",".ts",".tsx"): return
    raw_lines = read_lines(path)
    fstr = short(rel(path))
    code = "\n".join(raw_lines)

    # Banner comments
    for i, line in enumerate(raw_lines, 1):
        for pat in BANNER_PATTERNS_RE:
            if pat.match(line):
                issues.append(Issue("Comments","BANNER","WARN",fstr,i,
                    f"Decorative separator: {line.strip()[:55]}",
                    "Remove banner comments — use plain section labels if needed."))
                break

    comments = extract_js_comments(code)
    for lineno, text in comments:
        # American spelling
        words = re.split(r"\W+", text.lower())
        for word in words:
            if word in AMERICAN_TO_BRITISH and word not in COMMENT_CODE_TERMS:
                issues.append(Issue("Comments","SPELLING","WARN",fstr,lineno,
                    f'"{word}" → use "{AMERICAN_TO_BRITISH[word]}"',
                    "Use British spelling in comment text."))
        # Emojis
        if EMOJI_RE.search(text):
            issues.append(Issue("Comments","EMOJI","WARN",fstr,lineno,
                f"Emoji in comment: {text[:55]}",
                "Remove emojis from comments."))
        # Arrow text
        if ARROW_RE.search(text):
            issues.append(Issue("Comments","ARROW_TEXT","WARN",fstr,lineno,
                f"Arrow notation in comment: {text[:55]}",
                "Use plain English instead of arrows (-->, =>, →)."))


# ══════════════════════════════════════════════════════════════════════════════
#  REPORTING
# ══════════════════════════════════════════════════════════════════════════════

SEV_ORDER = {"ERROR": 0, "WARN": 1, "INFO": 2}
SEV_COLOUR = {"ERROR": C.RED, "WARN": C.YELLOW, "INFO": C.DIM}

def _sev_badge(sev: str) -> str:
    col = SEV_COLOUR.get(sev, "")
    return f"{col}{sev:<5}{C.END}"

def divider(char="─", width=88) -> None:
    print(char * width)

def section_header(num: str, title: str, subtitle: str = "") -> None:
    print(f"\n{C.BOLD}{C.CYAN}{'─'*4} {num}. {title.upper()} {'─'*(70 - len(title) - len(num))}{C.END}")
    if subtitle:
        print(f"  {C.DIM}{subtitle}{C.END}")

def ok(msg: str) -> None:
    print(f"\n  {C.GREEN}✓{C.END}  {msg}\n")

def count_badge(n: int) -> str:
    if n == 0:  return f"{C.GREEN}0{C.END}"
    if n < 10:  return f"{C.YELLOW}{n}{C.END}"
    return f"{C.RED}{n}{C.END}"


# ── Python sections ───────────────────────────────────────────────────────────

def print_py_dry(violations: list[DryBlock]) -> None:
    section_header("1", "Backend — DRY", "duplicate normalised statement blocks across source files")
    if not violations:
        ok("No duplicate blocks found"); return
    print(f"\n  {C.RED}✗{C.END}  {len(violations)} duplicate block(s)\n")
    for v in violations[:20]:
        print(f"  {C.BOLD}{v.block_size}-statement block{C.END}")
        for loc in v.locations[:4]:
            print(f"    {C.DIM}{loc.file}:{loc.line}{C.END}  in {loc.name}")
        print(f"    {C.DIM}↳ {v.preview[:100]}{C.END}\n")
    if len(violations) > 20:
        print(f"  {C.DIM}... and {len(violations)-20} more{C.END}\n")

def print_py_srp(violations: list[SRPIssue]) -> None:
    section_header("2", "Backend — Single Responsibility", "functions/classes mixing too many concerns")
    if not violations:
        ok("No SRP violations found"); return
    print(f"\n  {C.RED}✗{C.END}  {len(violations)} violation(s)\n")
    for v in violations[:30]:
        print(f"  {C.BOLD}{v.file}:{v.line}{C.END}  {C.DIM}[{v.unit_type}]{C.END}  {v.name}")
        for r in v.reasons:
            print(f"    {C.YELLOW}·{C.END} {r}")
        print()
    if len(violations) > 30:
        print(f"  {C.DIM}... and {len(violations)-30} more{C.END}\n")

def print_py_abs(violations: list[AbsIssue]) -> None:
    section_header("3", "Backend — Single Level of Abstraction", "orchestration mixed with low-level ops")
    if not violations:
        ok("No abstraction violations found"); return
    print(f"\n  {C.RED}✗{C.END}  {len(violations)} violation(s)\n")
    for v in violations[:30]:
        print(f"  {C.BOLD}{v.file}:{v.line}{C.END}  {v.name}")
        for r in v.reasons:
            print(f"    {C.YELLOW}·{C.END} {r}")
        print()
    if len(violations) > 30:
        print(f"  {C.DIM}... and {len(violations)-30} more{C.END}\n")


# ── JS / grouped sections ─────────────────────────────────────────────────────

SECTION_META = {
    # category          : (num,  title,                        subtitle)
    "Function/Nesting"  : ("4",  "Frontend — Function Length & Nesting",  ">20 lines or >1 control-flow depth"),
    "SRP/Abstraction"   : ("5",  "Frontend — SRP & Abstraction",          "fetch + state + render in same unit"),
    "Styles"            : ("6",  "Frontend — Inline & Hardcoded Styles",  "style={{}} or hardcoded hex/rgb values"),
    "DRY"               : ("7",  "Frontend — DRY",                        "duplicate normalised blocks across source files"),
    "Dead Code"         : ("8",  "Dead Code",                             "console.log, commented-out blocks, unused imports"),
    "Unused Files"      : ("9",  "Unused Files",                          "files never imported and not a convention entry point"),
    "Formatting"        : ("10", "Docstring Spacing",                     "exactly one blank line required after every docstring"),
    "Comments"          : ("11", "Frontend — Comment Quality",            "banners, American spelling, emojis, arrow text"),
}

def print_issues_by_category(all_issues: list[Issue], show_fix: bool) -> None:
    by_cat: dict[str, list[Issue]] = defaultdict(list)
    for iss in all_issues:
        by_cat[iss.category].append(iss)

    for cat, (num, title, subtitle) in SECTION_META.items():
        iss_list = sorted(by_cat.get(cat, []), key=lambda i: (SEV_ORDER.get(i.severity,9), i.file, i.line))
        section_header(num, title, subtitle)
        if not iss_list:
            ok("No issues found"); continue

        errors = sum(1 for i in iss_list if i.severity == "ERROR")
        warns  = sum(1 for i in iss_list if i.severity == "WARN")
        infos  = sum(1 for i in iss_list if i.severity == "INFO")
        parts  = []
        if errors: parts.append(f"{C.RED}{errors} error{'s' if errors>1 else ''}{C.END}")
        if warns:  parts.append(f"{C.YELLOW}{warns} warning{'s' if warns>1 else ''}{C.END}")
        if infos:  parts.append(f"{C.DIM}{infos} info{C.END}")
        print(f"\n  {C.RED}✗{C.END}  {',  '.join(parts)}\n")

        for iss in iss_list[:25]:
            badge = _sev_badge(iss.severity)
            print(f"  [{badge}]  {C.BOLD}{iss.file}:{iss.line}{C.END}")
            print(f"           {iss.detail}")
            if show_fix and iss.fix:
                print(f"           {C.DIM}→ {iss.fix}{C.END}")
        if len(iss_list) > 25:
            print(f"\n  {C.DIM}... and {len(iss_list)-25} more{C.END}")
        print()


# ── Summary ───────────────────────────────────────────────────────────────────

def print_summary(
    py_dry: list, py_srp: list, py_abs: list,
    py_dead: list[Issue], js_issues: list[Issue],
    unused: list[Issue], formatting: list[Issue],
) -> None:
    divider("═")
    print(f"{C.BOLD}  SUMMARY{C.END}")
    divider("─")

    def row(icon, label, count):
        col = C.GREEN if count == 0 else (C.RED if count >= 10 else C.YELLOW)
        print(f"  {icon}  {label:<50}  {col}{count}{C.END}")

    ok_icon   = f"{C.GREEN}✓{C.END}"
    fail_icon = f"{C.RED}✗{C.END}"
    def icon(n): return ok_icon if n == 0 else fail_icon

    row(icon(len(py_dry)), "Backend DRY",                     len(py_dry))
    row(icon(len(py_srp)), "Backend Single Responsibility",    len(py_srp))
    row(icon(len(py_abs)), "Backend Single Level of Abstraction", len(py_abs))

    cats = defaultdict(int)
    for iss in py_dead + js_issues + unused + formatting:
        cats[iss.category] += 1

    for cat, (_, title, _) in SECTION_META.items():
        n = cats.get(cat, 0)
        row(icon(n), title.replace("Frontend — ","").replace("Backend — ","").replace("Frontend / Backend — ",""), n)

    total = len(py_dry)+len(py_srp)+len(py_abs)+sum(cats.values())
    print()
    divider("═")
    if total == 0:
        print(f"  {C.GREEN}🎉 ALL CHECKS PASSED — no violations found{C.END}")
    else:
        errors = sum(1 for i in js_issues+py_dead+unused+formatting if i.severity == "ERROR")
        print(f"  {C.YELLOW}⚠  {total} total finding(s){C.END}"
              + (f"  ·  {C.RED}{errors} error(s){C.END}" if errors else ""))
    divider("═")
    print()


# ══════════════════════════════════════════════════════════════════════════════
#  UNUSED FILES  (import-graph tracing)
# ══════════════════════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════════════════════
#  UNUSED FILES  (import-graph tracing)
# ══════════════════════════════════════════════════════════════════════════════

# Python files loaded by convention — never imported directly
PY_CONVENTION_FILES = {
    "apps.py", "admin.py", "signals.py", "tasks.py",
    "conftest.py", "manage.py", "wsgi.py", "asgi.py",
    "settings.py", "urls.py", "__init__.py",
}

# JS files loaded by convention — never imported directly
JS_CONVENTION_PATTERNS = [
    r"main\.(jsx?|tsx?)$", r"index\.(jsx?|tsx?)$",
    r"App\.(jsx?|tsx?)$", r"setupTests\.(js|ts)$",
    r"vite\.config\.", r"\.config\.(js|ts)$",
]


def _path_to_module(path: Path, root: Path) -> str:
    """Convert a Python file path under root to a dotted module path."""
    relative = path.relative_to(root)
    parts = list(relative.parts)
    if parts[-1] == "__init__.py":
        parts = parts[:-1]
    else:
        parts[-1] = Path(parts[-1]).stem
    return ".".join(parts)


def _resolve_relative_module(
    module: str | None,
    level: int,
    current_module: str,
    is_package_module: bool,
) -> str | None:
    """Resolve an ImportFrom module against the current module path."""
    if level == 0:
        return module

    package_parts = current_module.split(".")
    if not package_parts:
        return module
    if not is_package_module:
        package_parts = package_parts[:-1]

    if level > len(package_parts):
        return module

    base_parts = package_parts[:len(package_parts) - level + 1]
    if module:
        base_parts.extend(module.split("."))
    return ".".join(part for part in base_parts if part)


def _collect_py_imports(path: Path, root: Path) -> set[str]:
    """Return set of dotted module names imported by this file."""
    names: set[str] = set()
    try:
        tree = ast.parse(path.read_text(encoding="utf-8", errors="replace"))
    except Exception:
        return names
    current_module = _path_to_module(path, root)
    is_package_module = path.name == "__init__.py"
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                names.add(alias.name)
        elif isinstance(node, ast.ImportFrom):
            resolved_module = _resolve_relative_module(
                node.module,
                node.level,
                current_module,
                is_package_module,
            )
            if resolved_module:
                names.add(resolved_module)
            for alias in node.names:
                if alias.name == "*":
                    continue
                if resolved_module:
                    names.add(f"{resolved_module}.{alias.name}")
                elif node.level > 0:
                    parent_module = _resolve_relative_module(
                        alias.name,
                        node.level,
                        current_module,
                        is_package_module,
                    )
                    if parent_module:
                        names.add(parent_module)
    return names


def _module_to_path(module: str, root: Path) -> Path | None:
    """Best-effort: convert a dotted import to a filesystem path under root."""
    parts = module.split(".")
    candidate = root.joinpath(*parts)
    if (candidate.with_suffix(".py")).exists():
        return candidate.with_suffix(".py")
    if (candidate / "__init__.py").exists():
        return candidate / "__init__.py"
    return None


def find_unused_py_files(root: Path) -> list[Issue]:
    all_files = set(iter_py(root))
    reachable: set[Path] = set()
    queue: list[Path] = []

    # Seed: convention entry points + test files (tests import source)
    for p in all_files:
        is_management_command = "management/commands" in p.as_posix() and p.name != "__init__.py"
        is_nested_url_module = "/urls/" in p.as_posix()
        if p.name in PY_CONVENTION_FILES or is_management_command or is_nested_url_module or is_test(p) or is_data(p):
            reachable.add(p)
            queue.append(p)

    visited: set[Path] = set()
    while queue:
        current = queue.pop()
        if current in visited:
            continue
        visited.add(current)
        for mod in _collect_py_imports(current, root):
            resolved = _module_to_path(mod, root)
            if resolved and resolved in all_files and resolved not in reachable:
                reachable.add(resolved)
                queue.append(resolved)

    issues = []
    for p in sorted(all_files - reachable):
        if p.name.startswith("_") or is_data(p):
            continue
        issues.append(Issue(
            "Unused Files", "UNUSED_PY_FILE", "WARN",
            short(rel(p)), 1,
            "Python file never imported and not a convention entry point",
            "Delete it or import it where needed.",
        ))
    return issues


def _collect_js_imports(lines: list[str]) -> set[str]:
    """Extract relative import paths from JS/JSX source lines."""
    paths: set[str] = set()
    import_re = re.compile(r"""from\s+['"](\.[^'"]+)['"]""")
    require_re = re.compile(r"""require\s*\(\s*['"](\.[^'"]+)['"]\s*\)""")
    for line in lines:
        for m in import_re.finditer(line):
            paths.add(m.group(1))
        for m in require_re.finditer(line):
            paths.add(m.group(1))
    return paths


def _resolve_js_import(raw: str, importer: Path, root: Path) -> Path | None:
    """Resolve a relative JS import to an absolute Path."""
    base = (importer.parent / raw).resolve()
    # Try exact match first
    for candidate in [base,
                       base.with_suffix(".js"),
                       base.with_suffix(".jsx"),
                       base.with_suffix(".ts"),
                       base.with_suffix(".tsx")]:
        if candidate.is_file():
            return candidate
    # Try index file
    for ext in (".js", ".jsx", ".ts", ".tsx"):
        idx = base / f"index{ext}"
        if idx.is_file():
            return idx
    return None


def find_unused_js_files(root: Path) -> list[Issue]:
    all_files = {p.resolve(): p for p in iter_js(root)}
    reachable: set[Path] = set()
    queue: list[Path] = []

    # Seed: convention entry points + test files
    for resolved, p in all_files.items():
        is_convention = any(re.search(pat, p.name) for pat in JS_CONVENTION_PATTERNS)
        if is_convention or is_test(p) or is_data(p):
            reachable.add(resolved)
            queue.append(p)

    visited: set[Path] = set()
    while queue:
        current = queue.pop()
        cr = current.resolve()
        if cr in visited:
            continue
        visited.add(cr)
        lines = read_lines(current)
        for raw in _collect_js_imports(lines):
            resolved = _resolve_js_import(raw, current, root)
            if resolved:
                rr = resolved.resolve()
                if rr in all_files and rr not in reachable:
                    reachable.add(rr)
                    queue.append(all_files[rr])

    issues = []
    for resolved, p in sorted(all_files.items(), key=lambda x: str(x[1])):
        if resolved not in reachable and not is_test(p) and not is_data(p):
            issues.append(Issue(
                "Unused Files", "UNUSED_JS_FILE", "WARN",
                short(rel(p)), 1,
                "JS/JSX file never imported and not a convention entry point",
                "Delete it or import it where needed.",
            ))
    return issues


# ══════════════════════════════════════════════════════════════════════════════
#  DOCSTRING SPACING
# ══════════════════════════════════════════════════════════════════════════════

def check_py_docstring_spacing(root: Path) -> list[Issue]:
    """
    Every module/function/class docstring must be followed by exactly one blank
    line before the next code statement.
    """
    issues = []
    for path in iter_py(root):
        lines = read_lines(path)
        if not lines:
            continue
        fstr = short(rel(path))
        tree = parse_py(path)
        if tree is None:
            continue

        for node in ast.walk(tree):
            if not isinstance(node, (ast.Module, ast.FunctionDef,
                                     ast.AsyncFunctionDef, ast.ClassDef)):
                continue
            body = node.body
            if not body:
                continue
            first = body[0]
            # Check if first statement is a docstring
            if not (isinstance(first, ast.Expr) and
                    isinstance(first.value, ast.Constant) and
                    isinstance(first.value.value, str)):
                continue
            # Line index (0-based) of the last line of the docstring
            doc_end = (getattr(first, "end_lineno", first.lineno)) - 1
            # Line index of the next statement (if any)
            if len(body) < 2:
                continue
            next_start = body[1].lineno - 1

            # Count blank lines between docstring end and next statement
            blank_count = 0
            for li in range(doc_end + 1, next_start):
                if lines[li].strip() == "":
                    blank_count += 1

            if blank_count == 0:
                issues.append(Issue(
                    "Formatting", "DOCSTRING_NO_BLANK", "WARN",
                    fstr, doc_end + 1,
                    f"No blank line after docstring in `{getattr(node, 'name', '<module>')}`",
                    "Add one blank line after the closing triple-quote.",
                ))
            elif blank_count > 1:
                issues.append(Issue(
                    "Formatting", "DOCSTRING_EXTRA_BLANK", "WARN",
                    fstr, doc_end + 1,
                    f"{blank_count} blank lines after docstring in `{getattr(node, 'name', '<module>')}` (expected 1)",
                    "Remove extra blank lines — keep exactly one.",
                ))
    return issues


def check_js_docstring_spacing(path: Path, issues: list[Issue]) -> None:
    """
    JSDoc /** ... */ blocks must be followed by exactly one blank line
    before the next non-empty line.
    """
    lines = read_lines(path)
    if not lines:
        return
    fstr = short(rel(path))
    i = 0
    while i < len(lines):
        # Find end of a /** ... */ block
        if lines[i].strip().startswith("/**") or lines[i].strip() == "/*":
            # Walk forward to closing */
            j = i
            while j < len(lines) and "*/" not in lines[j]:
                j += 1
            if j >= len(lines):
                i = j + 1
                continue
            doc_end = j  # 0-based index of closing */ line
            # Count blank lines after
            blank_count = 0
            k = doc_end + 1
            while k < len(lines) and lines[k].strip() == "":
                blank_count += 1
                k += 1
            if k < len(lines):  # there is a next statement
                if blank_count == 0:
                    issues.append(Issue(
                        "Formatting", "DOCSTRING_NO_BLANK", "WARN",
                        fstr, doc_end + 1,
                        "No blank line after /** */ block",
                        "Add one blank line after the closing */.",
                    ))
                elif blank_count > 1:
                    issues.append(Issue(
                        "Formatting", "DOCSTRING_EXTRA_BLANK", "WARN",
                        fstr, doc_end + 1,
                        f"{blank_count} blank lines after /** */ block (expected 1)",
                        "Remove extra blank lines — keep exactly one.",
                    ))
            i = j + 1
        else:
            i += 1


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════════════

def main() -> None:
    parser = argparse.ArgumentParser(description="StudyFlax code quality audit")
    parser.add_argument("--backend",   action="store_true", help="Backend checks only")
    parser.add_argument("--frontend",  action="store_true", help="Frontend checks only")
    parser.add_argument("--fix-hints", action="store_true", help="Show fix hints")
    parser.add_argument("--no-dry",    action="store_true", help="Skip DRY checks")
    parser.add_argument("--path",      type=str, default=".", help="Project root (default: .)")
    args = parser.parse_args()

    root        = Path(args.path)
    do_backend  = args.backend  or not args.frontend
    do_frontend = args.frontend or not args.backend

    divider("═")
    print(f"{C.BOLD}{'STUDYFLAX CODE QUALITY AUDIT'.center(88)}{C.END}")
    divider("═")
    print(f"  {C.DIM}Backend: deep AST analysis  |  Frontend: heuristic analysis{C.END}")
    print(f"  {C.DIM}Checks:  DRY · SRP · Abstraction · Dead Code · Styles · Comments{C.END}\n")

    py_dry_v:   list[DryBlock]  = []
    py_srp_v:   list[SRPIssue]  = []
    py_abs_v:   list[AbsIssue]  = []
    py_dead:    list[Issue]     = []
    js_issues:  list[Issue]     = []
    unused_v:   list[Issue]     = []
    format_v:   list[Issue]     = []

    # ── Backend ──────────────────────────────────────────────────────────────
    if do_backend:
        backend_root = root / BACKEND_ROOT
        if not backend_root.exists():
            print(f"  {C.RED}⚠  Backend root not found: {backend_root}{C.END}")
        else:
            print(f"  {C.DIM}Scanning backend …{C.END}")
            if not args.no_dry:
                py_dry_v = find_py_dry(backend_root)
            py_srp_v = find_py_srp(backend_root)
            py_abs_v = find_py_abstraction(backend_root)
            py_dead  = find_py_dead_code(backend_root)
            format_v += check_py_docstring_spacing(backend_root)
            unused_v += find_unused_py_files(backend_root)

            print_py_dry(py_dry_v)
            print_py_srp(py_srp_v)
            print_py_abs(py_abs_v)

    # ── Frontend ─────────────────────────────────────────────────────────────
    if do_frontend:
        frontend_root = root / FRONTEND_ROOT
        if not frontend_root.exists():
            print(f"  {C.RED}⚠  Frontend root not found: {frontend_root}{C.END}")
        else:
            print(f"  {C.DIM}Scanning frontend …{C.END}")
            js_files: list[tuple[Path,list[str]]] = []
            for path in iter_js(frontend_root):
                lines = read_lines(path)
                js_files.append((path, lines))
                check_js_funcs(path, js_issues)
                check_react_srp(path, js_issues)
                check_js_styles(path, js_issues)
                check_js_dead_code(path, js_issues)
                check_comments(path, js_issues)

            if not args.no_dry:
                check_js_dry(js_files, js_issues)

            unused_v += find_unused_js_files(frontend_root)
            for path in iter_js(frontend_root):
                check_js_docstring_spacing(path, format_v)

    # Merge all issues
    all_issues = py_dead + js_issues + unused_v + format_v
    print_issues_by_category(all_issues, show_fix=args.fix_hints)

    print_summary(py_dry_v, py_srp_v, py_abs_v, py_dead, js_issues, unused_v, format_v)

    sys.exit(1 if any(i.severity == "ERROR" for i in all_issues) else 0)


if __name__ == "__main__":
    main()
