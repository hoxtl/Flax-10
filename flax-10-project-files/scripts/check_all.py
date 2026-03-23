#!/usr/bin/env python3
"""
Code Quality Checker - BAND V COMPLIANCE
Requirements: ≤20 lines | ≤1 nesting | ≤400 lines/file
Test files: ≤25 lines for test functions | ≤2 nesting |
"""

import os
import ast

# ANSI Colors
class Colors:
    RED = '\033[91m'
    YELLOW = '\033[33m'
    MAGENTA = '\033[95m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header():
    print(f"\n{'='*75}")
    print(f"{Colors.BOLD}{Colors.MAGENTA}{'BAND V CODE QUALITY REPORT - PYTHON'.center(75)}{Colors.END}")
    print(f"{'='*75}")
    print(f"Requirements: ≤20 lines | ≤1 nesting | ≤400 lines/file")
    print(f"Test files: ≤25 lines for test functions\n")

def print_section(number, title):
    print(f"\n{Colors.BOLD}{Colors.YELLOW}{number}. {title}{Colors.END}")
    print(f"{'─'*75}")

def print_subsection(title):
    print(f"\n{Colors.BOLD}{title}{Colors.END}")
    print(f"{'·'*75}")

def shorten_path(path):
    return path.replace('../backend/studyFlax/', '')

def check_function_length(target_dir):
    violations = []
    
    for root, dirs, files in os.walk(target_dir):
        dirs[:] = [d for d in dirs if d not in ['__pycache__', 'migrations', 'venv']]
        
        for file in files:
            if not file.endswith('.py'):
                continue
                
            filepath = os.path.join(root, file)
            is_test = '/tests/' in filepath or file.startswith('test_')
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    tree = ast.parse(f.read(), filepath)
            except:
                continue
            
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    start = node.lineno
                    if node.body and isinstance(node.body[0], ast.Expr):
                        if isinstance(node.body[0].value, ast.Constant):
                            start = node.body[0].end_lineno + 1
                    
                    lines = node.end_lineno - start + 1 if hasattr(node, 'end_lineno') else 0
                    limit = 25 if is_test else 20
                    
                    if lines > limit:
                        violations.append({
                            'file': shorten_path(filepath),
                            'name': node.name,
                            'lines': lines,
                            'limit': limit,
                            'is_test': is_test
                        })
    
    return violations

def check_file_length(target_dir):
    violations = []
    
    for root, dirs, files in os.walk(target_dir):
        dirs[:] = [d for d in dirs if d not in ['__pycache__', 'migrations', 'venv']]
        
        for file in files:
            if not file.endswith('.py'):
                continue
                
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    lines = len(f.readlines())
            except:
                continue
            
            if lines > 400:
                violations.append({
                    'file': shorten_path(filepath),
                    'lines': lines,
                    'over': lines - 400
                })
    
    return violations

def check_nesting(target_dir):
    violations = []
    
    def get_nesting(node, level=0):
        max_level = level
        for child in ast.iter_child_nodes(node):
            if isinstance(child, (ast.If, ast.For, ast.While, ast.With, ast.Try)):
                child_level = get_nesting(child, level + 1)
                max_level = max(max_level, child_level)
            else:
                child_level = get_nesting(child, level)
                max_level = max(max_level, child_level)
        return max_level
    
    for root, dirs, files in os.walk(target_dir):
        dirs[:] = [d for d in dirs if d not in ['__pycache__', 'migrations', 'venv']]
        
        for file in files:
            if not file.endswith('.py'):
                continue
                
            filepath = os.path.join(root, file)
            is_test = '/tests/' in filepath or file.startswith('test_')
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    tree = ast.parse(f.read(), filepath)
            except:
                continue
            
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    nesting = get_nesting(node)
                    limit = 2 if is_test else 1
                    
                    if nesting > limit:
                        violations.append({
                            'file': shorten_path(filepath),
                            'name': node.name,
                            'nesting': nesting,
                            'limit': limit,
                            'is_test': is_test
                        })
    
    return violations

def main():
    target = '../backend/studyFlax'
    
    print_header()
    
    # 1. Function Length
    print_section("1", "FUNCTION LENGTH")
    func_violations = check_function_length(target)
    
    # Separate regular and test violations
    regular_func = [v for v in func_violations if not v['is_test']]
    test_func = [v for v in func_violations if v['is_test']]
    
    # Regular files
    print_subsection("Regular Files (≤20 lines)")
    if regular_func:
        print(f"\n{Colors.RED}❌ {len(regular_func)} VIOLATION(S){Colors.END}\n")
        for v in sorted(regular_func, key=lambda x: x['lines'], reverse=True):
            print(f"{Colors.BOLD}{v['file']}{Colors.END}")
            print(f"  {v['name']}() → {Colors.RED}{v['lines']} lines{Colors.END} (limit: {v['limit']})\n")
    else:
        print(f"\n✅ All regular functions meet Band V requirements\n")
    
    # Test files
    print_subsection("Test Files (≤25 lines)")
    if test_func:
        print(f"\n{Colors.RED}❌ {len(test_func)} VIOLATION(S){Colors.END}\n")
        for v in sorted(test_func, key=lambda x: x['lines'], reverse=True):
            print(f"{Colors.BOLD}{v['file']}{Colors.END}")
            print(f"  {v['name']}() → {Colors.RED}{v['lines']} lines{Colors.END} (limit: {v['limit']})\n")
    else:
        print(f"\n✅ All test functions meet Band V requirements\n")
    
    # 2. File Length
    print_section("2", "FILE LENGTH")
    file_violations = check_file_length(target)
    
    if file_violations:
        print(f"\n{Colors.RED}❌ {len(file_violations)} VIOLATION(S){Colors.END}\n")
        for v in sorted(file_violations, key=lambda x: x['lines'], reverse=True):
            print(f"{Colors.BOLD}{v['file']}{Colors.END}")
            print(f"  {Colors.RED}{v['lines']} lines{Colors.END} (over by {v['over']})\n")
    else:
        print(f"\n✅ All files meet Band V requirements\n")
    
    # 3. Nesting Depth
    print_section("3", "NESTING DEPTH")
    nest_violations = check_nesting(target)
    
    # Separate regular and test violations
    regular_nest = [v for v in nest_violations if not v['is_test']]
    test_nest = [v for v in nest_violations if v['is_test']]
    
    # Regular files
    print_subsection("Regular Files (≤1 level)")
    if regular_nest:
        print(f"\n{Colors.RED}❌ {len(regular_nest)} VIOLATION(S){Colors.END}\n")
        for v in sorted(regular_nest, key=lambda x: x['nesting'], reverse=True):
            print(f"{Colors.BOLD}{v['file']}{Colors.END}")
            print(f"  {v['name']}() → {Colors.RED}{v['nesting']} levels{Colors.END} (limit: {v['limit']})\n")
    else:
        print(f"\n✅ All regular functions meet Band V requirements\n")
    
    # Test files
    print_subsection("Test Files (≤2 levels)")
    if test_nest:
        print(f"\n{Colors.RED}❌ {len(test_nest)} VIOLATION(S){Colors.END}\n")
        for v in sorted(test_nest, key=lambda x: x['nesting'], reverse=True):
            print(f"{Colors.BOLD}{v['file']}{Colors.END}")
            print(f"  {v['name']}() → {Colors.RED}{v['nesting']} levels{Colors.END} (limit: {v['limit']})\n")
    else:
        print(f"\n✅ All test functions meet Band V requirements\n")
    
    # Summary
    print(f"{'─'*75}")
    print(f"{Colors.BOLD}{Colors.YELLOW}SUMMARY{Colors.END}")
    print(f"{'─'*75}\n")
    
    total_violations = len(func_violations) + len(file_violations) + len(nest_violations)
    
    print(f"Function Length:  {'❌' if func_violations else '✅'} {len(func_violations)} violation(s) ({len(regular_func)} regular, {len(test_func)} test)")
    print(f"File Length:      {'❌' if file_violations else '✅'} {len(file_violations)} violation(s)")
    print(f"Nesting Depth:    {'❌' if nest_violations else '✅'} {len(nest_violations)} violation(s) ({len(regular_nest)} regular, {len(test_nest)} test)")
    
    print(f"\n{'='*75}")
    
    if total_violations == 0:
        print(f"{Colors.YELLOW}🎉 BAND V READY! ALL REQUIREMENTS MET!{Colors.END}")
    else:
        print(f"{Colors.YELLOW}⚠️  {total_violations} TOTAL VIOLATIONS - REFACTORING REQUIRED{Colors.END}")
    
    print(f"{'='*75}\n")
    
    return 1 if total_violations > 0 else 0

if __name__ == '__main__':
    exit(main())