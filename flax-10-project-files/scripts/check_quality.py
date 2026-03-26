#!/usr/bin/env python3
"""
Code Quality Checker - BAND V COMPLIANCE
Requirements: ≤20 lines | ≤1 nesting | ≤400 lines/file
Test helpers: ≤20 lines | test functions: ≤25 lines | ≤1 nesting

Python version of check_quality.js
Usage:
    python check_quality.py [target_dir]

Default target_dir:
    ../backend
"""

from __future__ import annotations

import ast
import os
import re
import sys
from dataclasses import dataclass
from typing import Callable, List


class Colors:
    RED = "\033[91m"
    YELLOW = "\033[33m"
    MAGENTA = "\033[95m"
    BOLD = "\033[1m"
    END = "\033[0m"


@dataclass
class FunctionViolation:
    file: str
    name: str
    lines: int
    limit: int
    is_test: bool
    is_test_function: bool


@dataclass
class FileViolation:
    file: str
    lines: int
    over: int


@dataclass
class NestingViolation:
    file: str
    name: str
    nesting: int
    limit: int
    is_test: bool


def print_header() -> None:
    print("\n" + "=" * 75)
    title = "BAND V CODE QUALITY REPORT - PYTHON"
    print(f"{Colors.BOLD}{Colors.MAGENTA}{title.rjust(50)}{Colors.END}")
    print("=" * 75)
    print("Requirements: ≤20 lines | ≤1 nesting | ≤400 lines/file")
    print("Test helpers: ≤20 lines | test functions: ≤25 lines | ≤1 nesting\n")


def print_section(number: str, title: str) -> None:
    print(f"\n{Colors.BOLD}{Colors.YELLOW}{number}. {title}{Colors.END}")
    print("─" * 75)


def print_subsection(title: str) -> None:
    print(f"\n{Colors.BOLD}{title}{Colors.END}")
    print("·" * 75)


def shorten_path(file_path: str) -> str:
    normalized = file_path.replace("\\", "/")
    normalized = re.sub(r"^\.\./(?:frontend|backend)/", "", normalized)
    return normalized


def is_test_file(file_path: str) -> bool:
    normalized = file_path.replace("\\", "/")
    return (
        "/tests/" in normalized
        or "/test/" in normalized
        or normalized.endswith("_test.py")
        or normalized.endswith("_tests.py")
        or normalized.startswith("test_")
        or "/test_" in normalized
    )


def walk_dir(directory: str, callback: Callable[[str], None]) -> None:
    ignored = {"node_modules", "coverage", "build", "dist", ".git", "__pycache__", ".venv", "venv"}
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in ignored]
        for file_name in files:
            callback(os.path.join(root, file_name))


def parse_file(file_path: str) -> ast.AST:
    with open(file_path, "r", encoding="utf-8") as f:
        code = f.read()
    return ast.parse(code, filename=file_path)


def count_function_lines(node: ast.AST) -> int:
    start = getattr(node, "lineno", None)
    end = getattr(node, "end_lineno", None)
    if start is None or end is None:
        return 0
    return max(0, end - start + 1)


def get_function_name(node: ast.AST) -> str:
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
        return node.name
    return "anonymous"


def is_pytest_test_function(node: ast.AST) -> bool:
    if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
        return False
    return node.name.startswith("test_")


def is_nested_function(parent_stack: List[ast.AST]) -> bool:
    return any(isinstance(parent, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda)) for parent in parent_stack)


def get_nesting_level(node: ast.AST) -> int:
    nesting_nodes = (
        ast.If,
        ast.For,
        ast.AsyncFor,
        ast.While,
        ast.Try,
        ast.With,
        ast.AsyncWith,
        ast.Match if hasattr(ast, "Match") else tuple(),
    )

    def visit(current: ast.AST, level: int) -> int:
        max_level = level
        for child in ast.iter_child_nodes(current):
            next_level = level + 1 if isinstance(child, nesting_nodes) else level
            child_max = visit(child, next_level)
            max_level = max(max_level, child_max)
        return max_level

    return visit(node, 0)


class FunctionCollector(ast.NodeVisitor):
    def __init__(self) -> None:
        self.functions: List[tuple[ast.AST, List[ast.AST]]] = []
        self.stack: List[ast.AST] = []

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.functions.append((node, self.stack.copy()))
        self.stack.append(node)
        self.generic_visit(node)
        self.stack.pop()

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        self.functions.append((node, self.stack.copy()))
        self.stack.append(node)
        self.generic_visit(node)
        self.stack.pop()

    def visit_Lambda(self, node: ast.Lambda) -> None:
        self.functions.append((node, self.stack.copy()))
        self.stack.append(node)
        self.generic_visit(node)
        self.stack.pop()


def check_function_length(target_dir: str) -> List[FunctionViolation]:
    violations: List[FunctionViolation] = []

    def process(file_path: str) -> None:
        if not file_path.endswith(".py"):
            return

        is_test = is_test_file(file_path)

        try:
            tree = parse_file(file_path)
            collector = FunctionCollector()
            collector.visit(tree)

            for fn_node, parent_stack in collector.functions:
                if isinstance(fn_node, ast.Lambda):
                    continue

                is_test_function = False
                if is_test:
                    if is_nested_function(parent_stack):
                        continue
                    is_test_function = is_pytest_test_function(fn_node)

                limit = 25 if is_test_function else 20
                lines = count_function_lines(fn_node)
                if lines > limit:
                    violations.append(
                        FunctionViolation(
                            file=shorten_path(file_path),
                            name=get_function_name(fn_node),
                            lines=lines,
                            limit=limit,
                            is_test=is_test,
                            is_test_function=is_test_function,
                        )
                    )
        except SyntaxError as e:
            if not is_test:
                print(f"Parse error in {shorten_path(file_path)}: {e.msg}")

    walk_dir(target_dir, process)
    return violations


def check_file_length(target_dir: str) -> List[FileViolation]:
    violations: List[FileViolation] = []

    def process(file_path: str) -> None:
        if not re.search(r"\.(py|css|js|jsx)$", file_path):
            return
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                lines = len(f.read().splitlines())
            if lines > 400:
                violations.append(
                    FileViolation(
                        file=shorten_path(file_path),
                        lines=lines,
                        over=lines - 400,
                    )
                )
        except OSError:
            pass

    walk_dir(target_dir, process)
    return violations


def check_nesting(target_dir: str) -> List[NestingViolation]:
    violations: List[NestingViolation] = []

    def process(file_path: str) -> None:
        if not file_path.endswith(".py"):
            return

        is_test = is_test_file(file_path)
        limit = 1

        try:
            tree = parse_file(file_path)
            collector = FunctionCollector()
            collector.visit(tree)

            for fn_node, parent_stack in collector.functions:
                if isinstance(fn_node, ast.Lambda):
                    continue

                if is_test and is_nested_function(parent_stack):
                    continue

                nesting = get_nesting_level(fn_node)
                if nesting > limit:
                    violations.append(
                        NestingViolation(
                            file=shorten_path(file_path),
                            name=get_function_name(fn_node),
                            nesting=nesting,
                            limit=limit,
                            is_test=is_test,
                        )
                    )
        except SyntaxError:
            pass

    walk_dir(target_dir, process)
    return violations


def main() -> int:
    target = sys.argv[1] if len(sys.argv) > 1 else "../backend"

    print_header()

    print_section("1", "FUNCTION LENGTH")
    func_violations = check_function_length(target)
    regular_func = [v for v in func_violations if not v.is_test]
    test_helpers = [v for v in func_violations if v.is_test and not v.is_test_function]
    test_func = [v for v in func_violations if v.is_test_function]

    print_subsection("Regular Files (≤20 lines)")
    if regular_func:
        print(f"\n{Colors.RED}❌ {len(regular_func)} VIOLATION(S){Colors.END}\n")
        for v in sorted(regular_func, key=lambda x: x.lines, reverse=True):
            print(f"{Colors.BOLD}{v.file}{Colors.END}")
            print(f"  {v.name}() → {Colors.RED}{v.lines} lines{Colors.END} (limit: {v.limit})\n")
    else:
        print("\n✅ All regular functions within 20 lines\n")

    print_subsection("Test Helpers (≤20 lines)")
    if test_helpers:
        print(f"\n{Colors.RED}❌ {len(test_helpers)} VIOLATION(S){Colors.END}\n")
        for v in sorted(test_helpers, key=lambda x: x.lines, reverse=True):
            print(f"{Colors.BOLD}{v.file}{Colors.END}")
            print(f"  {v.name}() → {Colors.RED}{v.lines} lines{Colors.END} (limit: {v.limit})\n")
    else:
        print("\n✅ All test helpers within 20 lines\n")

    print_subsection("Test Functions (≤25 lines for test_* functions)")
    if test_func:
        print(f"\n{Colors.RED}❌ {len(test_func)} VIOLATION(S){Colors.END}\n")
        for v in sorted(test_func, key=lambda x: x.lines, reverse=True):
            print(f"{Colors.BOLD}{v.file}{Colors.END}")
            print(f"  {v.name}() → {Colors.RED}{v.lines} lines{Colors.END} (limit: {v.limit})\n")
    else:
        print("\n✅ All test functions within 25 lines\n")

    print_section("2", "FILE LENGTH")
    file_violations = check_file_length(target)
    if file_violations:
        print(f"\n{Colors.RED}❌ {len(file_violations)} VIOLATION(S){Colors.END}\n")
        for v in sorted(file_violations, key=lambda x: x.lines, reverse=True):
            print(f"{Colors.BOLD}{v.file}{Colors.END}")
            print(f"  {Colors.RED}{v.lines} lines{Colors.END} (over by {v.over})\n")
    else:
        print("\n✅ All files within 400 lines\n")

    print_section("3", "NESTING DEPTH")
    nest_violations = check_nesting(target)
    regular_nest = [v for v in nest_violations if not v.is_test]
    test_nest = [v for v in nest_violations if v.is_test]

    print_subsection("Regular Files (≤1 level)")
    if regular_nest:
        print(f"\n{Colors.RED}❌ {len(regular_nest)} VIOLATION(S){Colors.END}\n")
        for v in sorted(regular_nest, key=lambda x: x.nesting, reverse=True):
            print(f"{Colors.BOLD}{v.file}{Colors.END}")
            print(f"  {v.name}() → {Colors.RED}{v.nesting} levels{Colors.END} (limit: {v.limit})\n")
    else:
        print("\n✅ All regular functions within 1 nesting level\n")

    print_subsection("Test Files (≤1 level)")
    if test_nest:
        print(f"\n{Colors.RED}❌ {len(test_nest)} VIOLATION(S){Colors.END}\n")
        for v in sorted(test_nest, key=lambda x: x.nesting, reverse=True):
            print(f"{Colors.BOLD}{v.file}{Colors.END}")
            print(f"  {v.name}() → {Colors.RED}{v.nesting} levels{Colors.END} (limit: {v.limit})\n")
    else:
        print("\n✅ All test functions within 1 nesting level\n")

    print("─" * 75)
    print(f"{Colors.BOLD}{Colors.YELLOW}SUMMARY{Colors.END}")
    print("─" * 75 + "\n")

    total_violations = len(func_violations) + len(file_violations) + len(nest_violations)
    print(
        f"Function Length:  {'❌' if func_violations else '✅'} "
        f"{len(func_violations)} violation(s) ({len(regular_func)} regular, {len(test_helpers)} test helper, {len(test_func)} test)"
    )
    print(f"File Length:      {'❌' if file_violations else '✅'} {len(file_violations)} violation(s)")
    print(
        f"Nesting Depth:    {'❌' if nest_violations else '✅'} "
        f"{len(nest_violations)} violation(s) ({len(regular_nest)} regular, {len(test_nest)} test)"
    )

    print("\n" + "=" * 75)
    if total_violations == 0:
        print(f"{Colors.YELLOW}🎉 BAND V READY! ALL REQUIREMENTS MET!{Colors.END}")
    else:
        print(f"{Colors.YELLOW}⚠️  {total_violations} TOTAL VIOLATIONS - REFACTORING REQUIRED{Colors.END}")
    print("=" * 75 + "\n")

    return 1 if total_violations > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
