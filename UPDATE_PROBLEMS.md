# How to Update Problem Dataset

This guide explains how to update the Codeforces problem dataset with the latest problems.

## Quick Update (Automated)

Simply run the fetch script:

```bash
python fetch_problems.py
```

This will:
- Fetch all problems from Codeforces API
- Filter problems with ratings 1600-3000
- Update `src/problems.js` automatically
- Show statistics about the update

## Requirements

Make sure you have the `requests` library installed:

```bash
pip install requests
```

## What the Script Does

1. **Fetches** latest problems from `https://codeforces.com/api/problemset.problems`
2. **Filters** problems by rating (1600-3000)
3. **Includes** problem name, rating, tags, solve count, and link
4. **Sorts** problems by rating and solve count
5. **Updates** `src/problems.js` with the new data

## After Updating

1. Test your application locally to ensure everything works
2. Commit and push the changes:
   ```bash
   git add src/problems.js
   git commit -m "Update problems dataset"
   git push
   ```

## Frequency

Run this script whenever you want to:
- Add newly published Codeforces problems
- Update solve counts for existing problems
- Refresh the dataset

## Troubleshooting

**Issue**: Script fails with "No module named 'requests'"
**Solution**: Install requests with `pip install requests`

**Issue**: API timeout or connection error
**Solution**: Check your internet connection and try again

**Issue**: Empty problems list
**Solution**: Verify the Codeforces API is accessible at https://codeforces.com/api/problemset.problems
