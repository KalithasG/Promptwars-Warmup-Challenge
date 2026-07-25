"""
Quick demo of the latency-controlled router.

    python demo.py

Shows the classifier picking a tier per prompt, the model actually used, and
end-to-end latency including any fallback.
"""
from router import GeminiRouter, classify

PROMPTS = [
    "What is the capital of France?",                       # -> fast
    "Summarize the plot of Romeo and Juliet in one line.",  # -> fast/balanced
    "Write a Python function to merge two sorted lists.",    # -> balanced
    "Analyze the trade-offs between REST and GraphQL for a "
    "real-time chat app and recommend one with reasoning.",  # -> quality
]


def main():
    r = GeminiRouter(system_instruction="Be concise and correct.")
    for p in PROMPTS:
        tier = classify(p)
        print(f"\n[{tier.upper():8}] {p[:60]}...")
        res = r.generate(p)
        flag = " (fell back)" if res.fell_back else ""
        print(f"  model={res.model_used}  {res.latency_ms}ms{flag}")
        print(f"  trace={res.attempts}")
        print(f"  -> {res.text.strip()[:160]}")
    r.close()


if __name__ == "__main__":
    main()
