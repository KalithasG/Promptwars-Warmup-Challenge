"""
Probe which models are actually CALLABLE on your current key.

ListModels (the /models endpoint) returns many models a free key cannot call:
some 404 ("not available to new users"), Pro models 429 (no free quota). This
sends a tiny real request to each and reports OK / the failure code — the
ground truth for what you can use.

    python probe_models.py                 # probe the default candidate set
    python probe_models.py --all           # probe every generateContent model

Run this first thing at the venue, especially if you swap to a new key.
"""
from __future__ import annotations

import argparse

from router.core import GeminiRouter, _load_api_key, _build_http_options
from router import config
from google import genai


def list_all_models(client) -> list[str]:
    names = []
    for m in client.models.list():
        if "generateContent" in (m.supported_actions or []):
            names.append(m.name.replace("models/", ""))
    return names


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true", help="probe every generateContent model")
    args = ap.parse_args()

    r = GeminiRouter()
    client = genai.Client(api_key=_load_api_key(), http_options=_build_http_options())

    models = list_all_models(client) if args.all else config.BENCHMARK_MODELS
    print(f"Probing {len(models)} models with a tiny real request...\n")

    ok, bad = [], []
    for m in models:
        try:
            r._call_model(m, "Say OK", None)
            print(f"  OK    {m}")
            ok.append(m)
        except Exception as e:
            code = str(e).split(".")[0][:40]
            print(f"  FAIL  {m:40} -> {code}")
            bad.append(m)

    print(f"\nCallable: {len(ok)}   Blocked: {len(bad)}")
    if ok:
        print("Use these in router/config.py tiers:")
        for m in ok:
            print(f"  - {m}")


if __name__ == "__main__":
    main()
