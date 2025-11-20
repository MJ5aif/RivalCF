import requests
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

def fetch_codeforces_problems():
    """Fetch all problems from Codeforces API"""
    print("Fetching problems from Codeforces API...")
    url = "https://codeforces.com/api/problemset.problems"
    
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
    for problem in data['result']['problems']:
        if 'rating' not in problem:
            continue
        
        rating = problem['rating']
        if rating < 1600 or rating > 3000:
            continue
        
        contest_id = problem['contestId']
        index = problem['index']
        problem_id = str(contest_id) + index
        stats = problem_stats.get(problem_id, {})
        
        problems.append({
            'name': problem['name'],
            'rating': rating,
            'tags': problem.get('tags', []),
            'solveCount': stats.get('solvedCount', 0),
            'contestId': contest_id,
            'index': index,
            'link': f"https://codeforces.com/contest/{contest_id}/problem/{index}",
            'problemId': problem_id,
            'length': 0  # Will be filled later
        })
    
    print(f"Found {len(problems)} problems (rating 1600-3000)")
    return problems

def fetch_lengths_with_selenium(problems):
    """Fetch problem lengths using Selenium"""
    print("\nSetting up Chrome browser...")
    
    # Setup Chrome options
    chrome_options = Options()
    chrome_options.add_argument('--headless')  # Run in background
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Setup ChromeDriver with webdriver-manager
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    print(f"Fetching lengths for {len(problems)} problems...")
    print("This will take approximately 20-30 minutes...\n")
    
    successful = 0
    failed = 0
    
    for i, problem in enumerate(problems):
        try:
            url = f"https://codeforces.com/contest/{problem['contestId']}/problem/{problem['index']}"
            driver.get(url)
            
            # Wait for problem statement to load
            time.sleep(0.5)  # Small delay to let page load
            
            # Find problem statement
            try:
                problem_statement = driver.find_element(By.CLASS_NAME, 'problem-statement')
                text = problem_statement.text
                problem['length'] = len(text)
                successful += 1
            except:
                # Try alternative selector
                try:
                    problem_statement = driver.find_element(By.CLASS_NAME, 'problemindexholder')
                    text = problem_statement.text
                    problem['length'] = len(text)
                    successful += 1
                except:
                    problem['length'] = 0
                    failed += 1
            
            # Progress update
            if (i + 1) % 100 == 0:
                print(f"  Processed {i + 1}/{len(problems)} problems (Success: {successful}, Failed: {failed})")
        
        except Exception as e:
            problem['length'] = 0
            failed += 1
    
    driver.quit()
    
    print(f"\n✅ Fetching complete!")
    print(f"  Successful: {successful}")
    print(f"  Failed: {failed}")
    
    # Remove problems with no length
    problems = [p for p in problems if p['length'] > 0]
    
    # Remove contestId and index (not needed in final output)
    for p in problems:
        del p['contestId']
        del p['index']
    
    return problems

def save_problems(problems):
    """Save problems to problems.js file"""
    # Sort by length
    problems.sort(key=lambda x: x['length'])
    
    output_path = 'src/problems.js'
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('// Problem data extracted from Codeforces\n')
        f.write(f'// Last updated: {__import__("datetime").datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')
        f.write('// Total problems: ' + str(len(problems)) + '\n')
        f.write('export const problems = ')
        f.write(json.dumps(problems, indent=2, ensure_ascii=False))
        f.write(';\n')
    
    print(f"\n✅ Successfully written {len(problems)} problems to {output_path}")
    print(f"   Problems sorted by length (ascending)")

def main():
    print("=" * 60)
    print("Codeforces Problem Fetcher (Selenium)")
    print("=" * 60)
    
    # Fetch problems from API
    problems = fetch_codeforces_problems()
    
    if not problems:
        print("No problems fetched. Exiting.")
        return
    
    # Fetch lengths using Selenium
    problems = fetch_lengths_with_selenium(problems)
    
    # Save to file
    save_problems(problems)
    
    print("\n" + "=" * 60)
    print("✅ Update complete!")
    print("\nNext steps:")
    print("  git add -A && git commit -m 'Update problems with actual lengths' && git push")
    print("=" * 60)

if __name__ == "__main__":
    main()
