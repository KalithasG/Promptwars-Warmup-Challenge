# Portfolio Development — Gemini Latency Router

A latency-controlled model router for the Gemini API. Classifies each prompt,
routes it to the right speed/quality tier, and **auto-falls-back to a faster
model** if one is slow or errors — so end-to-end latency stays bounded.

A reusable launch pad — drop `router/` into whatever you build.

## Layout

All routing source lives in this `model_routing/` directory. The `.env` (API
key + TLS flag) stays at the project root one level up — the router searches
upward for it automatically, so scripts work from here.

## Quick start

```bash
cd model_routing
pip install -r requirements.txt
python probe_models.py      # confirm which models your key can call
python benchmark.py         # measure REAL latency per model on your network
python demo.py              # see routing + fallback in action
```

## Backend API (scaffold)

`api.py` is a ready FastAPI server with a `/generate` endpoint already calling
the router. You edit **only** `build_prompt()` — drop your project's logic
there; routing + latency fallback are done.

```bash
uvicorn api:app --reload --port 8000
curl -X POST http://localhost:8000/generate \
     -H "content-type: application/json" \
     -d '{"input": "your prompt", "tier": "fast"}'
# -> {"output":"...","model_used":"...","tier":"fast","latency_ms":...,"fell_back":false}
```

## Use it as a library

```python
from router import GeminiRouter

r = GeminiRouter(system_instruction="Be concise.")
res = r.generate("Summarize this in one line: ...")

print(res.text)         # the answer
print(res.model_used)   # which model actually answered
print(res.latency_ms)   # end-to-end latency
print(res.fell_back)    # True if a fallback was used
print(res.attempts)     # full trace of every model tried
```

Override routing when you know better:

```python
r.generate(prompt, tier="fast")             # force a tier: fast|balanced|quality
r.generate(prompt, force_model="gemini-3.5-flash")   # skip routing entirely
r.generate(prompt, gen_config={"temperature": 0.2, "max_output_tokens": 512})
```

## How latency is controlled

1. **`classifier.py`** picks a tier from the prompt using cheap regex heuristics
   — *no extra API call*, because routing must not add latency.
2. Each tier (**`config.py`**) is an ordered chain of `(model, timeout)`.
3. **`core.py`** runs each attempt in a worker thread with a hard wall-clock
   timeout. Too slow or errors → abandon it, drop to the next (faster) model.
   Total latency is bounded by the chain's timeouts.

## This key's reality (checked 2026-07-24)

It's a **free-tier key**:

| Models | Status | In use? |
|--------|--------|---------|
| `gemini-2.5-*` | 404 — retired for new users | ❌ |
| `gemini-*-pro-*` | 429 — no free Pro quota | ❌ |
| `gemini-3.x` **flash / flash-lite** | ✅ works | ✅ all tiers |

So the "quality" tier uses the best available **flash** model, not Pro. If you
get a billing-enabled key, run `probe_models.py --all`, then add Pro back to the
QUALITY chain in `config.py`.

## TLS note (this machine)

HTTPS is being intercepted by a local proxy/antivirus, so requests fail cert
verification. `.env` sets `GEMINI_INSECURE_TLS=true` as the escape hatch. On a
clean network, remove that line for full TLS verification.

## Files

| File | Purpose |
|------|---------|
| `router/config.py` | Model tiers + latency timeouts (edit after benchmarking) |
| `router/classifier.py` | Prompt → tier heuristics |
| `router/core.py` | `GeminiRouter`: routing + timeout-fallback + `.env`/TLS |
| `probe_models.py` | Which models your key can actually call |
| `benchmark.py` | Real median/p95 latency per model |
| `demo.py` | End-to-end examples |
