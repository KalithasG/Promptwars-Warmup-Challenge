# Portfolio Development — Gemini Latency Router (TypeScript)

TypeScript mirror of the Python `model_routing/` package. Classifies each
prompt, routes it to the right speed/quality tier, and **auto-falls-back to a
faster model** if one is slow or errors — so end-to-end latency stays bounded.

Uses the `@google/genai` SDK. Reads the same `.env` (API key + TLS flag) from
the project root — the loader searches upward for it.

## Quick start

```bash
cd model_routing_ts
npm install
npm run probe      # confirm which models your key can call
npm run bench      # measure REAL latency per model on your network
npm run demo       # see routing + fallback in action
```

Runs on `tsx` (no build step). Node 18+.

## Backend API (scaffold)

`server.ts` is a ready Express server with a `/generate` endpoint already
calling the router. You edit **only** `buildPrompt()` — drop your project's
logic there; routing + latency fallback are done.

```bash
npm start                 # http://localhost:3000
curl -X POST http://localhost:3000/generate \
     -H "content-type: application/json" \
     -d '{"input": "your prompt", "tier": "fast"}'
# -> {"output":"...","modelUsed":"...","tier":"fast","latencyMs":...,"fellBack":false}
```

## Use it as a library

```ts
import { GeminiRouter } from "./src/index.ts";

const r = new GeminiRouter({ systemInstruction: "Be concise." });
const res = await r.generate("Summarize this in one line: ...");

console.log(res.text);       // the answer
console.log(res.modelUsed);  // which model actually answered
console.log(res.latencyMs);  // end-to-end latency
console.log(res.fellBack);   // true if a fallback was used
console.log(res.attempts);   // full trace of every model tried
```

Override routing when you know better:

```ts
r.generate(prompt, { tier: "fast" });                    // force a tier
r.generate(prompt, { forceModel: "gemini-3.6-flash" });  // skip routing
r.generate(prompt, { genConfig: { temperature: 0.2, maxOutputTokens: 512 } });
```

## How latency is controlled

1. **`src/classifier.ts`** picks a tier from the prompt with regex heuristics —
   *no extra API call*, because routing must not add latency.
2. Each tier (**`src/config.ts`**) is an ordered chain of `{ model, timeoutMs }`.
3. **`src/core.ts`** races each attempt against a hard timeout (`Promise.race`).
   Too slow or errors → abandon it, drop to the next (faster) model. Total
   latency is bounded by the chain's timeouts.

## This key's reality (checked 2026-07-24)

Free-tier key: `gemini-2.5-*` are 404 (retired for new users), Pro models are
429 (no free quota). The **`gemini-3.x` flash family works**, with
`gemini-3.6-flash` (Google's newest, faster than 3.5-flash) as the
balanced/quality primary. No Pro tier. Add Pro back with a billing key.

## TLS note (this machine)

HTTPS is intercepted by a local proxy/antivirus, so requests fail cert
verification. `.env` sets `GEMINI_INSECURE_TLS=true`; `src/env.ts` turns that
into `NODE_TLS_REJECT_UNAUTHORIZED=0`. Remove it on a clean network.

## Files (mirror of the Python package)

| TypeScript | Python equivalent | Purpose |
|------------|-------------------|---------|
| `src/config.ts` | `router/config.py` | Model tiers + latency timeouts |
| `src/classifier.ts` | `router/classifier.py` | Prompt → tier heuristics |
| `src/core.ts` | `router/core.py` | `GeminiRouter`: routing + timeout-fallback |
| `src/env.ts` | (in `core.py`) | `.env` upward search + TLS escape hatch |
| `probeModels.ts` | `probe_models.py` | Which models your key can call |
| `benchmark.ts` | `benchmark.py` | Real median/p95 latency per model |
| `demo.ts` | `demo.py` | End-to-end examples |
