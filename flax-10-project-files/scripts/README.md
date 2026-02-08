# Code Quality Scripts

Check Band V requirements: **≤15 lines per function**, **≤1 nesting level**, **≤400 lines per file**

## Backend (Python)
```bash
cd scripts/python
python check_function_length.py
python check_nesting.py
python check_file_length.py
```

## Frontend (JavaScript)
```bash
cd scripts/javascript
node check_function_length.js
node check_nesting.js
node check_file_length.js

## What Each Script Checks

- `check_function_length` - Functions must be ≤15 lines (Band V) or ≤25 lines for testing 
- `check_nesting` - Nesting depth must be ≤1 level (Band V) 
- `check_file_length` - Files must be ≤400 lines

