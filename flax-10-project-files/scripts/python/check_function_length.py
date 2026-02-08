import ast
import os

def count_function_lines(node):
    """Count physical lines in a function (excluding docstring)."""
    if not hasattr(node, 'body') or not node.body:
        return 0
    
    # Get start and end lines
    start_line = node.lineno
    
    # Skip docstring if present
    first_stmt = node.body[0]
    if (isinstance(first_stmt, ast.Expr) and 
        isinstance(first_stmt.value, ast.Constant)):
        start_line = first_stmt.end_lineno + 1 if hasattr(first_stmt, 'end_lineno') else first_stmt.lineno + 1
    
    # Find last line
    end_line = node.end_lineno if hasattr(node, 'end_lineno') else node.lineno
    
    return end_line - start_line + 1

def check_file(filepath):
    """Check all functions in a file."""
    results = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read(), filepath)
    except:
        return results
    
    is_test = '/tests/' in filepath
    
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            lines = count_function_lines(node)
            
            # Band V limits
            if is_test:
                limit = 25  # Test functions: max 25 lines
            else:
                limit = 15  # Production: ideal 15, acceptable 25
            
            if lines > limit:
                results.append({
                    'file': filepath,
                    'line': node.lineno,
                    'name': node.name,
                    'lines': lines,
                    'limit': limit,
                    'is_test': is_test
                })
    
    return results

# Collect all results
all_results = []
for root, dirs, files in os.walk('recipes'):
    dirs[:] = [d for d in dirs if d not in ['__pycache__', 'migrations']]
    for file in files:
        if file.endswith('.py'):
            all_results.extend(check_file(os.path.join(root, file)))

# Sort by line count (descending)
all_results.sort(key=lambda x: x['lines'], reverse=True)

# Print results
for result in all_results:
    if result['lines'] > 25:
        status = "❌"
        msg = f"(>25 VIOLATION)"
    else:
        status = "⚠️ "
        msg = f"(>{result['limit']})"
    
    print(f"{status} {result['file']}:{result['line']} {result['name']}() - {result['lines']} lines {msg}")

# Summary
print(f"\n{'='*70}")
print(f"SUMMARY:")
violations = [r for r in all_results if r['lines'] > 25]
warnings = [r for r in all_results if r['lines'] <= 25]
print(f"❌ Violations (>25 lines): {len(violations)}")
print(f"⚠️  Warnings (15-25 lines): {len(warnings)}")
print(f"Total functions over limit: {len(all_results)}")