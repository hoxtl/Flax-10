#!/usr/bin/env python3
"""
Backend naming and documentation checker for Python files.
"""

import ast
import os
import re
import sys
import tokenize
from io import StringIO
from pathlib import Path


class Colors:
    RED = "\033[91m"
    YELLOW = "\033[33m"
    MAGENTA = "\033[95m"
    BOLD = "\033[1m"
    END = "\033[0m"


SKIP_DIRS = {".git", ".venv", "__pycache__", "htmlcov", "media", "migrations", "node_modules", "venv"}
ALLOWED_ROOT_DIRS = {"Flax10", "studyFlax"}
DIRECTORY_NAME_PATTERN = re.compile(r"^[a-z][a-z0-9_]*$")
PYTHON_FILE_NAME_PATTERN = re.compile(r"^[a-z][a-z0-9_]*\.py$")
FUNCTION_NAME_PATTERN = re.compile(r"^[a-z_][a-z0-9_]*$")
FUNCTION_NAME_EXCEPTIONS = {"setUp", "tearDown", "setUpClass", "tearDownClass", "setUpTestData"}
EMPTY_TOKEN_TYPES = {
    tokenize.COMMENT,
    tokenize.DEDENT,
    tokenize.ENCODING,
    tokenize.ENDMARKER,
    tokenize.INDENT,
    tokenize.NEWLINE,
    tokenize.NL,
}


def print_header():
    print(f"\n{'=' * 75}")
    title = "BACKEND NAMING AND DOCSTRING REPORT - PYTHON"
    print(f"{Colors.BOLD}{Colors.MAGENTA}{title.center(75)}{Colors.END}")
    print(f"{'=' * 75}")
    print("Rules: test_ file names | snake_case backend paths | backend symbol names")
    print("       header docstrings | optional function docstrings | one-line class docstrings")
    print("       function spacing | comment-only and header-only files\n")


def print_section(number, title):
    print(f"\n{Colors.BOLD}{Colors.YELLOW}{number}. {title}{Colors.END}")
    print(f"{'─' * 75}")


def shorten_path(path, target):
    try:
        return str(path.relative_to(target))
    except ValueError:
        return str(path)


def iter_python_files(target):
    for root, dirs, files in os.walk(target):
        dirs[:] = [name for name in dirs if name not in SKIP_DIRS]
        for file_name in files:
            if file_name.endswith(".py"):
                yield Path(root) / file_name


def read_source(path):
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return None


def parse_tree(source, path):
    try:
        return ast.parse(source, filename=str(path))
    except SyntaxError as exc:
        return exc


def docstring_statement(body):
    if not body:
        return None
    first = body[0]
    if not isinstance(first, ast.Expr):
        return None
    value = getattr(first, "value", None)
    if isinstance(value, ast.Constant) and isinstance(value.value, str):
        return first
    return None


def docstring_text(node):
    return ast.get_docstring(node, clean=False)


def docstring_source(source, node):
    statement = docstring_statement(node.body)
    if not statement:
        return ""
    return (ast.get_source_segment(source, statement) or "").strip()


def has_triple_double_quotes(raw_docstring):
    return raw_docstring.startswith('"""') and raw_docstring.endswith('"""')


def starts_with_capital(text):
    stripped = text.strip()
    return bool(stripped) and stripped[0].isupper()


def ends_with_full_stop(text):
    return text.strip().endswith(".")


def is_test_file(path):
    return "tests" in path.parts


def is_package_init(path):
    return path.name == "__init__.py"


def top_level_import_gap(tree, source_lines):
    body = list(tree.body)
    if docstring_statement(body):
        body = body[1:]
    imports = []
    while body and isinstance(body[0], (ast.Import, ast.ImportFrom)):
        imports.append(body.pop(0))
    if not imports or not body:
        return None
    last_import_line = imports[-1].end_lineno
    next_code_line = body[0].lineno
    blank_count = 0
    for index in range(last_import_line, next_code_line - 1):
        if source_lines[index].strip() == "":
            blank_count += 1
    return imports[-1].end_lineno, body[0].lineno, blank_count


def empty_file_kind(source, tree):
    if tree.body:
        if len(tree.body) == 1 and docstring_statement(tree.body):
            return "header_only"
        return None
    try:
        tokens = tokenize.generate_tokens(StringIO(source).readline)
    except tokenize.TokenError:
        return None
    for token in tokens:
        if token.type not in EMPTY_TOKEN_TYPES:
            return None
    return "comment_only"


class ConventionVisitor(ast.NodeVisitor):
    def __init__(self, source, path, target):
        self.source = source
        self.path = path
        self.target = target
        self.source_lines = source.splitlines()
        self.class_stack = []
        self.naming_violations = []
        self.function_violations = []
        self.class_violations = []
        self.spacing_violations = []

    def current_name(self, name):
        if not self.class_stack:
            return name
        return ".".join([*self.class_stack, name])

    def visit_ClassDef(self, node):
        self.check_class_name(node)
        self.check_class_docstring(node)
        self.check_sibling_spacing(node.body)
        self.class_stack.append(node.name)
        self.generic_visit(node)
        self.class_stack.pop()

    def visit_AsyncFunctionDef(self, node):
        self.check_function_name(node)
        self.check_function_docstring(node)
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        self.check_function_name(node)
        self.check_function_docstring(node)
        self.generic_visit(node)

    def add_naming_violation(self, node, message):
        self.naming_violations.append(
            {
                "file": shorten_path(self.path, self.target),
                "line": node.lineno,
                "name": self.current_name(node.name),
                "message": message,
            }
        )

    def add_function_violation(self, node, message):
        self.function_violations.append(
            {
                "file": shorten_path(self.path, self.target),
                "line": node.lineno,
                "name": self.current_name(node.name),
                "message": message,
            }
        )

    def add_class_violation(self, node, message):
        self.class_violations.append(
            {
                "file": shorten_path(self.path, self.target),
                "line": node.lineno,
                "name": self.current_name(node.name),
                "message": message,
            }
        )

    def add_spacing_violation(self, current_node, previous_name, blank_lines):
        self.spacing_violations.append(
            {
                "file": shorten_path(self.path, self.target),
                "line": current_node.lineno,
                "name": self.current_name(current_node.name),
                "message": f"Keep 1 blank line between functions after {previous_name} (found {blank_lines}).",
            }
        )

    def check_function_docstring(self, node):
        raw = docstring_source(self.source, node)
        text = docstring_text(node)
        statement = docstring_statement(node.body)
        if not statement or text is None:
            return
        if statement.lineno != statement.end_lineno:
            self.add_function_violation(node, "Use a one-line docstring.")
        if not has_triple_double_quotes(raw):
            self.add_function_violation(node, 'Use """double-quoted""" docstrings.')
        if not starts_with_capital(text):
            self.add_function_violation(node, "Start the docstring with a capital letter.")
        if not ends_with_full_stop(text):
            self.add_function_violation(node, "End the docstring with a full stop.")
        if self.blank_lines_after_statement(node.body, statement.end_lineno) != 0:
            self.add_function_violation(node, "Do not leave a blank line after function docstrings.")

    def check_class_docstring(self, node):
        raw = docstring_source(self.source, node)
        text = docstring_text(node)
        statement = docstring_statement(node.body)
        if not statement or text is None:
            self.add_class_violation(node, "Missing class docstring.")
            return
        if statement.lineno != statement.end_lineno:
            self.add_class_violation(node, "Use a one-line class docstring.")
        if statement.lineno != node.lineno + 1:
            self.add_class_violation(node, "Place the docstring directly under the class line.")
        if not has_triple_double_quotes(raw):
            self.add_class_violation(node, 'Use """double-quoted""" docstrings.')
        if not starts_with_capital(text):
            self.add_class_violation(node, "Start the docstring with a capital letter.")
        if not ends_with_full_stop(text):
            self.add_class_violation(node, "End the docstring with a full stop.")

    def check_function_name(self, node):
        name = node.name
        if name in FUNCTION_NAME_EXCEPTIONS:
            return
        if name.startswith("__") and name.endswith("__"):
            return
        if FUNCTION_NAME_PATTERN.match(name):
            return
        self.add_naming_violation(node, "Use snake_case function names.")

    def check_class_name(self, node):
        clean_name = node.name.lstrip("_")
        if clean_name and clean_name[0].isupper() and "_" not in clean_name:
            return
        self.add_naming_violation(node, "Use PascalCase class names.")

    def check_sibling_spacing(self, body):
        previous = None
        for node in body:
            if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            if previous is not None:
                self.check_function_gap(previous, node)
            previous = node

    def check_function_gap(self, previous, current):
        previous_name = self.current_name(previous.name)
        blank_lines = self.blank_lines_between(previous, current)
        if blank_lines != 1:
            self.add_spacing_violation(current, previous_name, blank_lines)

    def blank_lines_between(self, previous, current):
        current_start = definition_start_line(current)
        blank_lines = 0
        for index in range(previous.end_lineno, current_start - 1):
            if self.source_lines[index].strip() == "":
                blank_lines += 1
        return blank_lines

    def blank_lines_after_statement(self, body, end_lineno):
        if len(body) < 2:
            return 0
        next_start = body[1].lineno
        blank_lines = 0
        for index in range(end_lineno, next_start - 1):
            if self.source_lines[index].strip() == "":
                blank_lines += 1
        return blank_lines


def definition_start_line(node):
    decorator_lines = [decorator.lineno for decorator in getattr(node, "decorator_list", [])]
    return min([node.lineno, *decorator_lines]) if decorator_lines else node.lineno


def check_test_file_names(target):
    violations = []
    for path in iter_python_files(target):
        if not is_test_file(path):
            continue
        if is_package_init(path):
            continue
        if path.name.startswith("test_"):
            continue
        violations.append(
            {
                "file": shorten_path(path, target),
                "line": 1,
                "message": "Test files must start with test_.",
            }
        )
    return violations


def check_backend_path_names(target):
    violations = []
    for root, dirs, files in os.walk(target):
        dirs[:] = [name for name in dirs if name not in SKIP_DIRS]
        root_path = Path(root)
        for dir_name in dirs:
            dir_path = root_path / dir_name
            rel = dir_path.relative_to(target)
            if len(rel.parts) == 1 and dir_name in ALLOWED_ROOT_DIRS:
                continue
            if DIRECTORY_NAME_PATTERN.match(dir_name):
                continue
            violations.append(
                {
                    "file": shorten_path(dir_path, target),
                    "line": 1,
                    "message": "Directory names must use snake_case.",
                }
            )
        for file_name in files:
            if not file_name.endswith(".py"):
                continue
            file_path = root_path / file_name
            if file_name == "__init__.py" or is_test_file(file_path):
                continue
            if PYTHON_FILE_NAME_PATTERN.match(file_name):
                continue
            violations.append(
                {
                    "file": shorten_path(file_path, target),
                    "line": 1,
                    "message": "Python file names must use snake_case.",
                }
            )
    return violations


def check_backend_files(target):
    results = {
        "symbol_names": [],
        "headers": [],
        "functions": [],
        "classes": [],
        "spacing": [],
        "function_spacing": [],
        "empty": [],
        "parse_errors": [],
    }
    for path in iter_python_files(target):
        if is_package_init(path):
            continue
        source = read_source(path)
        if source is None:
            continue
        tree = parse_tree(source, path)
        if isinstance(tree, SyntaxError):
            results["parse_errors"].append(
                {
                    "file": shorten_path(path, target),
                    "line": tree.lineno or 0,
                    "message": tree.msg,
                }
            )
            continue
        check_header_docstring(path, source, tree, target, results["headers"])
        check_import_spacing(path, source, tree, target, results["spacing"])
        check_empty_file(path, source, tree, target, results["empty"])
        visitor = ConventionVisitor(source, path, target)
        visitor.check_sibling_spacing(tree.body)
        visitor.visit(tree)
        results["symbol_names"].extend(visitor.naming_violations)
        results["functions"].extend(visitor.function_violations)
        results["classes"].extend(visitor.class_violations)
        results["function_spacing"].extend(visitor.spacing_violations)
    return results


def check_header_docstring(path, source, tree, target, violations):
    raw = docstring_source(source, tree)
    text = docstring_text(tree)
    statement = docstring_statement(tree.body)
    if not statement or text is None:
        violations.append(
            {
                "file": shorten_path(path, target),
                "line": 1,
                "message": "Missing header docstring.",
            }
        )
        return
    if statement.lineno == statement.end_lineno:
        violations.append(
            {
                "file": shorten_path(path, target),
                "line": statement.lineno,
                "message": "Use a block header docstring on separate lines.",
            }
        )
    if not has_triple_double_quotes(raw):
        violations.append(
            {
                "file": shorten_path(path, target),
                "line": statement.lineno,
                "message": 'Use """double-quoted""" header docstrings.',
            }
        )
    if not starts_with_capital(text):
        violations.append(
            {
                "file": shorten_path(path, target),
                "line": statement.lineno,
                "message": "Start the header docstring with a capital letter.",
            }
        )
    if not ends_with_full_stop(text):
        violations.append(
            {
                "file": shorten_path(path, target),
                "line": statement.lineno,
                "message": "End the header docstring with a full stop.",
            }
        )


def check_import_spacing(path, source, tree, target, violations):
    gap = top_level_import_gap(tree, source.splitlines())
    if gap is None:
        return
    last_import_line, next_code_line, blank_count = gap
    if blank_count == 2:
        return
    violations.append(
        {
            "file": shorten_path(path, target),
            "line": last_import_line,
            "message": f"Use 2 blank lines after imports before line {next_code_line} (found {blank_count}).",
        }
    )


def check_empty_file(path, source, tree, target, violations):
    kind = empty_file_kind(source, tree)
    if not kind:
        return
    label = "Header-only file." if kind == "header_only" else "Comment-only file."
    violations.append({"file": shorten_path(path, target), "line": 1, "message": label})


def print_simple_section(number, title, violations, formatter):
    print_section(number, title)
    if not violations:
        print("\n✅ No violations found\n")
        return
    print(f"\n{Colors.RED}❌ {len(violations)} VIOLATION(S){Colors.END}\n")
    for violation in sorted(violations, key=lambda item: (item["file"], item["line"])):
        print(formatter(violation))
        print("")


def format_named_violation(violation):
    file_label = f"{Colors.BOLD}{violation['file']}{Colors.END}"
    return f"{file_label}\n  {violation['name']} (line {violation['line']}) → {Colors.RED}{violation['message']}{Colors.END}"


def format_file_violation(violation):
    file_label = f"{Colors.BOLD}{violation['file']}{Colors.END}"
    return f"{file_label}\n  line {violation['line']} → {Colors.RED}{violation['message']}{Colors.END}"


def print_summary(results):
    print(f"{'─' * 75}")
    print(f"{Colors.BOLD}{Colors.YELLOW}SUMMARY{Colors.END}")
    print(f"{'─' * 75}\n")
    total = sum(len(items) for items in results.values())
    for label, violations in results.items():
        marker = "✅" if not violations else "❌"
        print(f"{label.replace('_', ' ').title():<18} {marker} {len(violations)} violation(s)")
    print(f"\n{'=' * 75}")
    if total == 0:
        print(f"{Colors.YELLOW}🎉 BACKEND CONVENTIONS READY! ALL REQUIREMENTS MET!{Colors.END}")
    else:
        print(f"{Colors.YELLOW}⚠️  {total} TOTAL VIOLATIONS - ACTION REQUIRED{Colors.END}")
    print(f"{'=' * 75}\n")
    return total


def main():
    target = Path(sys.argv[1] if len(sys.argv) > 1 else "../backend").resolve()
    print_header()
    results = {
        "test_names": check_test_file_names(target),
        "path_names": check_backend_path_names(target),
        **check_backend_files(target),
    }
    print_simple_section("1", "TEST FILE NAMES", results["test_names"], format_file_violation)
    print_simple_section("2", "BACKEND PATH NAMES", results["path_names"], format_file_violation)
    print_simple_section("3", "BACKEND SYMBOL NAMES", results["symbol_names"], format_named_violation)
    print_simple_section("4", "HEADER DOCSTRINGS", results["headers"], format_file_violation)
    print_simple_section("5", "FUNCTION DOCSTRINGS", results["functions"], format_named_violation)
    print_simple_section("6", "CLASS DOCSTRINGS", results["classes"], format_named_violation)
    print_simple_section("7", "IMPORT SPACING", results["spacing"], format_file_violation)
    print_simple_section("8", "FUNCTION SPACING", results["function_spacing"], format_named_violation)
    print_simple_section("9", "EMPTY OR HEADER-ONLY FILES", results["empty"], format_file_violation)
    print_simple_section("10", "PARSE ERRORS", results["parse_errors"], format_file_violation)
    return 1 if print_summary(results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
