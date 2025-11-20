# Problem Update Scripts

This folder contains experimental scripts for fetching problem data from Codeforces.

## Scripts

### `fetch_problems_selenium.py`
Attempts to use Selenium with Chrome to scrape problem statement lengths.
- **Status**: Requires Chrome installation
- **Issue**: Chrome not available on this system

### `fetch_problems_safari.py`
Attempts to use Selenium with Safari to scrape problem statement lengths.
- **Status**: Safari WebDriver crashes after first request
- **Issue**: Invalid session errors after initial load

## Why These Don't Work

Codeforces implements anti-bot measures:
1. Returns 403 (Forbidden) for automated requests
2. Detects and blocks web scraping attempts
3. Safari WebDriver has session stability issues

## Current Solution

The working solution uses `convert_problems.py` in the root directory, which:
- Reads from `src/problems_raw.csv` (contains real problem statement lengths)
- Generates `src/problems.js` with accurate data
- Sorts problems by length (ascending)

**To update problems, run from project root:**
```bash
python update_problems.py
```

This uses the CSV data which already has accurate problem statement lengths (not divisible by 10).
