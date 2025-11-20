#!/usr/bin/env python3
"""
Simple wrapper to run Python scripts with the correct Python interpreter
Usage: python update_problems.py
"""
import subprocess
import sys
import os

# Get the Python path from conda
PYTHON_PATH = "/Users/md.monowarjahansaif/miniconda3/bin/python"

def main():
    print("Running convert_problems.py...")
    print("=" * 60)
    
    # Run the convert script
    result = subprocess.run(
        [PYTHON_PATH, "convert_problems.py"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )
    
    if result.returncode == 0:
        print("\n" + "=" * 60)
        print("✅ Success! Problems updated and sorted by length.")
        print("\nNext step: git push")
        print("  git add -A && git commit -m 'Update problems' && git push")
        print("=" * 60)
    else:
        print("\n❌ Error occurred while updating problems")
        sys.exit(1)

if __name__ == "__main__":
    main()
