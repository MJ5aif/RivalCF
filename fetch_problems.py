import requests
import json
import os

def fetch_codeforces_problems():
    """Fetch all problems from Codeforces API"""
    print("Fetching problems from Codeforces API...")
    url = "https://codeforces.com/api/problemset.problems"
    
    try:
        response = requests.get(url, timeout=30)
        data = response.json()
        
        if data['status'] != 'OK':
            print("Error: API returned non-OK status")
            return []
        
        problems = []
        problem_stats = {}
        
        # Create a mapping of problem ID to statistics
        for stat in data['result']['problemStatistics']:
            problem_id = str(stat['contestId']) + stat['index']
            problem_stats[problem_id] = stat
        
        # Process each problem
        for problem in data['result']['problems']:
            # Skip problems without rating
            if 'rating' not in problem:
                continue
            
            rating = problem['rating']
            
            # Filter for ratings between 1600 and 3000
            if rating < 1600 or rating > 3000:
                continue
            
            contest_id = problem['contestId']
            index = problem['index']
            problem_id = str(contest_id) + index
            stats = problem_stats.get(problem_id, {})
            
            # Calculate problem length (you can adjust this heuristic)
            length = len(problem.get('name', '')) * 10  # Simple heuristic
            
            problems.append({
                'name': problem['name'],
                'rating': rating,
                'tags': problem.get('tags', []),
                'solveCount': stats.get('solvedCount', 0),
                'length': length,
                'link': f"https://codeforces.com/contest/{contest_id}/problem/{index}",
                'problemId': problem_id
            })
        
        # Sort by length ascending
        problems.sort(key=lambda x: x['length'])
        
        print(f"Successfully fetched {len(problems)} problems (rating 1600-3000)")
        return problems
        
    except requests.RequestException as e:
        print(f"Error fetching data: {e}")
        return []
    except Exception as e:
        print(f"Unexpected error: {e}")
        return []

def save_problems(problems):
    """Save problems to problems.js file"""
    output_path = 'src/problems.js'
    
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('// Problem data extracted from Codeforces API\n')
            f.write(f'// Last updated: {__import__("datetime").datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')
            f.write('// Total problems: ' + str(len(problems)) + '\n')
            f.write('export const problems = ')
            f.write(json.dumps(problems, indent=2, ensure_ascii=False))
            f.write(';\n')
        
        print(f"Successfully written {len(problems)} problems to {output_path}")
        return True
        
    except Exception as e:
        print(f"Error writing file: {e}")
        return False

def main():
    print("=" * 60)
    print("Codeforces Problem Fetcher")
    print("=" * 60)
    
    # Fetch problems
    problems = fetch_codeforces_problems()
    
    if not problems:
        print("No problems fetched. Exiting.")
        return
    
    # Show statistics
    print("\nStatistics:")
    print(f"  Total problems: {len(problems)}")
    
    rating_counts = {}
    for problem in problems:
        rating = problem['rating']
        rating_counts[rating] = rating_counts.get(rating, 0) + 1
    
    print("\n  By rating:")
    for rating in sorted(rating_counts.keys()):
        print(f"    {rating}: {rating_counts[rating]} problems")
    
    # Save to file
    print("\n" + "=" * 60)
    if save_problems(problems):
        print("\n✅ Update complete! Your problem dataset is now up to date.")
        print("\nNext steps:")
        print("  1. Test the application locally")
        print("  2. Commit and push changes: git add -A && git commit -m 'Update problems dataset' && git push")
    else:
        print("\n❌ Failed to save problems.")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
