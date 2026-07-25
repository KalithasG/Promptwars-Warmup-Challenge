#!/usr/bin/env python3
import os
import sys
import re
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent

def check_env_file():
    env_path = ROOT_DIR / ".env"
    if not env_path.exists():
        print("❌ ERROR: .env file missing at project root.")
        return False
    
    content = env_path.read_text(encoding="utf-8")
    if "GEMINI_API_KEY" not in content or "GEMINI_API_KEY=" in content and not re.search(r"GEMINI_API_KEY=\s*\S+", content):
        print("⚠️ WARNING: GEMINI_API_KEY is missing or empty in .env!")
        return False

    print("✅ .env file and GEMINI_API_KEY present.")
    return True

def scan_codebase_for_hardcoded_keys():
    key_pattern = re.compile(r'AIzaSy[A-Za-z0-9_-]{33}')
    found_secrets = False
    
    for ext in ['*.py', '*.ts', '*.json', '*.md']:
        for path in ROOT_DIR.rglob(ext):
            if '.gemini' in path.parts or 'node_modules' in path.parts or 'venv' in path.parts:
                continue
            try:
                text = path.read_text(encoding='utf-8', errors='ignore')
                matches = key_pattern.findall(text)
                if matches:
                    print(f"❌ SECURITY RISK: Potential hardcoded API key found in {path.relative_to(ROOT_DIR)}")
                    found_secrets = True
            except Exception as e:
                pass
                
    if not found_secrets:
        print("✅ Secret scan clean: No hardcoded API keys detected.")
    return not found_secrets

def main():
    print("--- Running Promptwar Security & Env Checks ---")
    env_ok = check_env_file()
    secrets_ok = scan_codebase_for_hardcoded_keys()
    
    if env_ok and secrets_ok:
        print("🚀 All harness checks passed successfully!")
        sys.exit(0)
    else:
        print("❌ Harness checks failed.")
        sys.exit(1)

if __name__ == '__main__':
    main()
