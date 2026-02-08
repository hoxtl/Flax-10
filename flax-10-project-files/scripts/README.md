# Code Quality Scripts

Check Band V requirements: 
- **Functions**: ≤15 lines (tests: ≤25 lines)
- **Nesting**: ≤1 level (tests: ≤2 levels)
- **Files**: ≤400 lines total

## Run Checks

From the `scripts/` directory:
```bash
# Check Python backend
python check_all.py

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
