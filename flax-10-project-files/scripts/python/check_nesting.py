import ast
import sys
import os

def get_nesting_level(node, level=0):
    """Get the maximum nesting level in a node."""
    max_level = level
    
    for child in ast.iter_child_nodes(node):
        if isinstance(child, (ast.If, ast.For, ast.While, ast.With, ast.Try)):
            child_level = get_nesting_level(child, level + 1)
            max_level = max(max_level, child_level)
        else:
            child_level = get_nesting_level(child, level)
            max_level = max(max_level, child_level)
    
    return max_level

def check_file(filepath):
    """Check nesting levels in a Python file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read(), filepath)
    except (SyntaxError, UnicodeDecodeError):
        return
    
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            nesting = get_nesting_level(node)
            
            # Check if it's a test file
            is_test = '/tests/' in filepath
            
            if nesting > 2:
                print(f"❌ {filepath}:{node.lineno} {node.name}() - {nesting} levels (Band III or lower)")
            elif nesting == 2:
                if is_test:
                    print(f"✅ {filepath}:{node.lineno} {node.name}() - {nesting} levels (OK for tests)")
                else:
                    print(f"⚠️  {filepath}:{node.lineno} {node.name}() - {nesting} levels (Band IV - review recommended)")
            elif nesting == 1:
                # Only show if verbose
                pass

def main():
    # Find all Python files except migrations and __pycache__
    for root, dirs, files in os.walk('../../backend/studyFlax'):  # Updated path
        # Skip these directories
        dirs[:] = [d for d in dirs if d not in ['__pycache__', 'migrations']]
        
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                check_file(filepath)

if __name__ == '__main__':
    main()