# Code Quality Scripts

Check Band V requirements: 
- **Functions**: ≤15 lines (tests: ≤25 lines)
- **Nesting**: ≤1 level 
- **Files**: ≤400 lines total

## Run Checks

From the `scripts/` directory:
```bash
# Check Python backend
python check_all.py

# Check backend naming and docstring rules
python check_backend_conventions.py

# Check JavaScript frontend
node check_all.js
```

## When to Run

- Before every commit
- During code reviews
- Before final submission

## What Gets Checked

- **Backend**: `backend/studyFlax/*.py`
- **Frontend**: `frontend/src/*.{js,jsx}`

---

**Fix all violations to achieve Band V (80-100%)!**
