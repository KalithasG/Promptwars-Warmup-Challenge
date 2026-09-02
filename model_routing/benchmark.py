"""
Measure REAL latency of each candidate model on your key + network.

Run this BEFORE you start building — the numbers here
decide which models belong in each tier in router/config.py. Latency varies
by network, region, and model load, so trust measured numbers over labels.

    python benchmark.py            # default prompt, 3 runs each
    python benchmark.py -n 5       # 5 runs each

Reports median / p95 latency and tokens/sec per model.
"""
from __future__ import annotations

import argparse
import statistics
import time

from router.core import GeminiRouter, _load_api_key, _build_http_options
from router import config
from google import genai
from google.genai import types

PROMPT = "In exactly two sentences, explain what an API is to a beginner."


def bench_model(client, model: str, runs: int) -> dict:
    lats, ok = [], 0
    out_chars = 0
    for _ in range(runs):
        t0 = time.perf_counter()
        try:
            resp = client.models.generate_content(model=model, contents=PROMPT)
            lats.append((time.perf_counter() - t0) * 1000)
            out_chars += len(resp.text or "")
            ok += 1
        except Exception as e:
            print(f"    ! {model}: {type(e).__name__}: {str(e)[:80]}")
    if not lats:
        return {"model": model, "ok": 0}
    return {
        "model": model,
        "ok": ok,
        "median_ms": int(statistics.median(lats)),
        "p95_ms": int(max(lats)) if len(lats) < 3 else int(sorted(lats)[int(len(lats) * 0.95)]),
        "avg_chars": out_chars // ok,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-n", "--runs", type=int, default=3)
    args = ap.parse_args()

    client = genai.Client(api_key=_load_api_key(), http_options=_build_http_options())

    print(f"Benchmarking {len(config.BENCHMARK_MODELS)} models, {args.runs} runs each...\n")
    rows = []
    for m in config.BENCHMARK_MODELS:
        print(f"  -> {m}")
        rows.append(bench_model(client, m, args.runs))

    rows = [r for r in rows if r.get("ok")]
    rows.sort(key=lambda r: r["median_ms"])

    print("\n" + "=" * 68)
    print(f"{'MODEL':<32} {'MEDIAN':>9} {'P95':>9} {'OUT/chars':>10}")
    print("-" * 68)
    for r in rows:
        print(f"{r['model']:<32} {r['median_ms']:>7}ms {r['p95_ms']:>7}ms {r['avg_chars']:>10}")
    print("=" * 68)
    if rows:
        print(f"\nFastest: {rows[0]['model']} ({rows[0]['median_ms']}ms median)")
        print("Put the fastest reliable models first in router/config.py tiers.")


if __name__ == "__main__":
    main()
