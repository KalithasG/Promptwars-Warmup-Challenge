#!/usr/bin/env python3
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR / "model_routing"))

try:
    from router.classifier import classify
except ImportError as e:
    print(f"❌ Failed to import classifier: {e}")
    sys.exit(1)

def test_classifier_heuristics():
    test_cases = [
        ("TL;DR this passage", "fast"),
        ("Define relativity in one line", "fast"),
        ("Explain quantum mechanics step-by-step", "quality"),
        ("What is the weather like today?", "fast"),
        ("Analyze the trade-offs between Redis and PostgreSQL for caching", "quality"),
    ]
    
    passed = 0
    for prompt, expected in test_cases:
        res = classify(prompt)
        if res == expected:
            passed += 1
            print(f"  [PASS] '{prompt}' -> {res}")
        else:
            print(f"  [FAIL] '{prompt}' -> Got '{res}', Expected '{expected}'")
            
    print(f"\nClassifier Evals: {passed}/{len(test_cases)} passed.")
    return passed == len(test_cases)

def main():
    print("--- Running Promptwar Routing Evals ---")
    ok = test_classifier_heuristics()
    if ok:
        print("✅ Evals suite completed successfully.")
        sys.exit(0)
    else:
        print("❌ Evals suite failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
