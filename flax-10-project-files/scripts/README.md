# Code Quality Scripts

Check Band V requirements: 
- **Functions**: ≤20 lines
- **Test helpers**: ≤20 lines
- **Test functions**: ≤25 lines
- **Nesting**: ≤1 level 
- **Files**: ≤400 lines total

## Run Checks

From the `scripts/` directory:
```bash
# Check Python backend quality
python3 check_quality.py

# Check backend naming and docstring rules
python3 check_backend_conventions.py

# Check JavaScript frontend quality
node check_quality.js
```

## When to Run

- Before every commit
- During code reviews
- Before final submission

## What Gets Checked

- **Backend**: Python source under `backend/` excluding generated directories
- **Frontend**: JavaScript and CSS source under `frontend/`

---

**Fix all violations to achieve Band V (80-100%)!**
