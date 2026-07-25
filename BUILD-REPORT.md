# BUILD REPORT — RecoveryAI (Polysubstance Recovery Triage)

**Challenge:** PromptWars — GenAI Recovery & Prevention Platform
**Rigor level:** Structured (hackathon) — lean scaffold, TDD on the core logic, real AI call.

## The feature (one, end-to-end)

**AI Recovery Triage.** A person describes their substance use in plain language —
or taps zero-typing chips — and a live Gemini model returns a structured,
validated recovery profile tailored to their *combination* of substances:

- substances identified
- primary risk + secondary triggers
- relapse-risk level (Low / Moderate / High)
- a personalized 3–5 step recovery plan
- a caregiver emergency script to read aloud in a crisis

This maps directly onto the challenge's required capabilities (zero-typing
interventions, personalized emergency scripts, contextual safety tools) and the
planned polysubstance angle.

## What runs

- `POST /analyze` — real Gemini call via the existing latency-routed `GeminiRouter`
  (`response_mime_type=application/json`, quality tier). No mock data, no hardcoded
  output — every response is generated live.
- `GET /` — striking, accessible single-page frontend (`static/index.html`).
- Verified live: opioids+benzodiazepines → correctly flagged **High** risk with
  opioids as primary; alcohol+nicotine+cocaine → flagged cocaethylene danger.

## Run command

```bash
cd model_routing
pip install -r requirements.txt
python -m uvicorn api:app --port 8000
# open http://localhost:8000
```

## Tests (TDD)

`model_routing/test_recovery.py` — 9 pure unit tests (prompt construction, robust
JSON extraction incl. markdown-fence / prose stripping, schema validation, risk
normalization, failure handling) + 1 opt-in live smoke test.

```bash
cd model_routing && python -m pytest test_recovery.py -q          # 9 passed, 1 skipped
cd model_routing && RUN_LIVE=1 python -m pytest test_recovery.py -q # +1 live passed
```

## Aesthetic direction

Calm clinical-editorial: deep ink background, warm paper card, serif display type
(system serif stack — no webfonts, fully offline), teal + amber accents.
**Memorable element:** color-coded relapse-risk badge + numbered plan and an
amber-bordered "read this aloud" caregiver script. Accessible: labeled controls,
`aria-pressed` chips, `aria-live` results, focus outlines, reduced-motion support.

## GenAI disclosure

Google **Gemini** (3.x flash family, via `google-genai` SDK) generates the entire
recovery profile at `POST /analyze`. Nothing on the results screen is hardcoded.

## Files added

- `model_routing/recovery.py` — feature logic (pure functions + `analyze()` live call)
- `model_routing/test_recovery.py` — unit + live tests
- `model_routing/static/index.html` — frontend
- `model_routing/api.py` — added `/analyze` route + static serving

## Known gaps (out of scope for this single feature)

- No persistence / accounts (stateless by design).
- Educational-content + coping-exercise steps are described in the plan text, not
  yet separate interactive modules.
