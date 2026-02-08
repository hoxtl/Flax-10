import os

def count_file_lines(filepath):
    """Count non-empty, non-comment lines in a Python file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except:
        return 0
    
    # Count all lines (including comments, docstrings, everything)
    total_lines = len(lines)
    
    # Optional: Count only non-empty lines
    non_empty = len([l for l in lines if l.strip()])
    
    return total_lines, non_empty

def check_file_length(filepath, limit=400):
    """Check if a file exceeds the line limit."""
    total, non_empty = count_file_lines(filepath)
    
    if total > limit:
        return {
            'file': filepath,
            'total_lines': total,
            'non_empty_lines': non_empty,
            'limit': limit,
            'violation': True
        }
    elif total > limit * 0.9:  # Warning at 90% (360 lines)
        return {
            'file': filepath,
            'total_lines': total,
            'non_empty_lines': non_empty,
            'limit': limit,
            'violation': False
        }
    
    return None

def main():
    # Configure these
    TARGET_DIR = 'recipes'  # Change to your directory
    LINE_LIMIT = 400
    
    results = []
    warnings = []
    
    # Walk through directory
    for root, dirs, files in os.walk(TARGET_DIR):
        # Skip these directories
        dirs[:] = [d for d in dirs if d not in ['__pycache__', 'migrations', 'node_modules', 'venv']]
        
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                result = check_file_length(filepath, LINE_LIMIT)
                
                if result:
                    if result['violation']:
                        results.append(result)
                    else:
                        warnings.append(result)
    
    # Sort by line count (descending)
    results.sort(key=lambda x: x['total_lines'], reverse=True)
    warnings.sort(key=lambda x: x['total_lines'], reverse=True)
    
    # Print violations
    if results:
        print("❌ VIOLATIONS (>{} lines):".format(LINE_LIMIT))
        print("="*70)
        for r in results:
            print(f"❌ {r['file']}")
            print(f"   Total: {r['total_lines']} lines (non-empty: {r['non_empty_lines']})")
            print(f"   Exceeds limit by: {r['total_lines'] - LINE_LIMIT} lines")
            print()
    
    # Print warnings
    if warnings:
        print("\n⚠️  WARNINGS (>360 lines, approaching limit):")
        print("="*70)
        for w in warnings:
            print(f"⚠️  {w['file']}")
            print(f"   Total: {w['total_lines']} lines (non-empty: {w['non_empty_lines']})")
            print(f"   {LINE_LIMIT - w['total_lines']} lines remaining before limit")
            print()
    
    # Summary
    print("\n" + "="*70)
    print("SUMMARY:")
    print(f"❌ Files over {LINE_LIMIT} lines: {len(results)}")
    print(f"⚠️  Files approaching limit (>{LINE_LIMIT * 0.9} lines): {len(warnings)}")
    
    if results:
        print("\n⚠️  ACTION REQUIRED: Refactor files exceeding {LINE_LIMIT} lines!")
        return 1
    elif warnings:
        print("\n⚠️  Warning: Some files are approaching the limit.")
        return 0
    else:
        print("\n✅ All files are within the {LINE_LIMIT} line limit!")
        return 0

if __name__ == '__main__':
    exit(main())