import requests
import json
import os
import time
from bs4 import BeautifulSoup
import concurrent.futures
from threading import Lock

# Global variables for progress tracking
processed_count = 0
total_count = 0
lock = Lock()

def get_problem_statement_length(contest_id, index):
    """Fetch the actual problem statement length from the problem page"""
    try:
        url = f"https://codeforces.com/contest/{contest_id}/problem/{index}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find the problem statement div
            problem_statement = soup.find('div', class_='problem-statement')
            
            if problem_statement:
                # Get text content and calculate length
                text = problem_statement.get_text(strip=True)
                return len(text)
        
        return 0
    except Exception as e:
        return 0

def fetch_problem_with_length(problem_data):
    """Fetch a single problem with its statement length"""
    global processed_count
    
    problem, stats = problem_data
    contest_id = problem['contestId']
    index = problem['index']
    problem_id = str(contest_id) + index
    stat = stats.get(problem_id, {})
    
    # Get actual problem statement length
    length = get_problem_statement_length(contest_id, index)
    
    with lock:
        global processed_count
        processed_count += 1
        if processed_count % 100 == 0:
            print(f"  Processed {processed_count}/{total_count} problems...")
    
    # Small delay to avoid rate limiting
    time.sleep(0.1)
    
    return {
        'name': problem['name'],
        'rating': problem['rating'],
        'tags': problem.get('tags', []),
        'solveCount': stat.get('solvedCount', 0),
        'length': length,
        'link': f"https://codeforces.com/contest/{contest_id}/problem/{index}",
        'problemId': problem_id
    }

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
        
        # Filter problems first
        filtered_problems = []
        for problem in data['result']['problems']:
            # Skip problems without rating
            if 'rating' not in problem:
                continue
            
            rating = problem['rating']
            
            # Filter for ratings between 1600 and 3000
            if rating < 1600 or rating > 3000:
                continue
            
            filtered_problems.append(problem)
        
        global total_count, processed_count
        total_count = len(filtered_problems)
        processed_count = 0
        
        print(f"Fetching problem statement lengths for {total_count} problems...")
        print("This may take a while (approximately 10-15 minutes)...")
        
        # Prepare data for parallel processing
        problem_data_list = [(p, problem_stats) for p in filtered_problems]
        
        # Use ThreadPoolExecutor for parallel fetching
        problems = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            problems = list(executor.map(fetch_problem_with_length, problem_data_list))
        
        # Remove problems with length 0 (failed to fetch)
        problems = [p for p in problems if p['length'] > 0]
        
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
