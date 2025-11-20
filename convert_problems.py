import re
import json

def parse_hyperlink(hyperlink_str):
    """Extract URL and problem ID from HYPERLINK formula"""
    match = re.search(r'https://codeforces\.com/contest/(\d+)/problem/([A-Z]\d*)', hyperlink_str)
    if match:
        contest_id, problem_letter = match.groups()
        problem_id = f"{contest_id}{problem_letter}"
        url = f"https://codeforces.com/contest/{contest_id}/problem/{problem_letter}"
        return url, problem_id
    return "", ""

def parse_csv_line(line):
    """Parse a single CSV line handling quoted fields"""
    # Remove trailing \r
    line = line.strip().rstrip('\r')
    
    # Split by comma, but respect quoted fields
    parts = []
    current = ""
    in_quotes = False
    
    i = 0
    while i < len(line):
        char = line[i]
        
        if char == '"':
            if i + 1 < len(line) and line[i + 1] == '"':
                # Double quote escape
                current += '"'
                i += 2
                continue
            else:
                in_quotes = not in_quotes
                i += 1
                continue
        
        if char == ',' and not in_quotes:
            parts.append(current)
            current = ""
            i += 1
            continue
        
        current += char
        i += 1
    
    parts.append(current)
    
    if len(parts) >= 6:
        name = parts[0]
        rating = parts[1]
        tags = parts[2]
        solve_count = parts[3]
        length = parts[4]
        hyperlink = parts[5]
        
        url, problem_id = parse_hyperlink(hyperlink)
        
        # Clean up tags
        if tags:
            tags_list = [tag.strip() for tag in tags.split(',')]
        else:
            tags_list = []
        
        return {
            'name': name,
            'rating': int(rating) if rating else 0,
            'tags': tags_list,
            'solveCount': int(solve_count) if solve_count else 0,
            'length': int(length) if length else 0,
            'link': url,
            'problemId': problem_id
        }
    
    return None

# Read the CSV file
with open('/Users/md.monowarjahansaif/Downloads/CP/Mock_P/cf-tracker/src/problems_raw.csv', 'r', encoding='utf-8') as f:
    lines = f.readlines()

problems = []
for line in lines:
    problem = parse_csv_line(line)
    if problem and problem['rating'] >= 1600 and problem['rating'] <= 3000:
        problems.append(problem)

# Sort by length (ascending)
problems.sort(key=lambda x: x['length'])

print(f"Total problems parsed: {len(problems)}")
print(f"Sorted by length (ascending)")

# Write JavaScript file
with open('/Users/md.monowarjahansaif/Downloads/CP/Mock_P/cf-tracker/src/problems.js', 'w', encoding='utf-8') as f:
    f.write('// Problem data extracted from Codeforces\n')
    f.write('export const problems = ')
    f.write(json.dumps(problems, indent=2))
    f.write(';\n')

print(f"Written {len(problems)} problems to problems.js")
