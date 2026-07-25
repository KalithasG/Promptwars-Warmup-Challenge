# RecoveryAI — Polysubstance Recovery Triage

A GenAI-powered recovery & prevention tool for people navigating **polysubstance
use disorders** and their caregivers. Built for the PromptWars (Google for
Developers × H2S) challenge.

Describe your substance use in plain words — or tap zero-typing chips — and a
**live Google Gemini model** returns a structured, personalized recovery profile
tailored to your *combination* of substances:

- Substances identified
- Primary risk + secondary triggers
- Relapse-risk level (Low / Moderate / High)
- A personalized 3–5 step recovery plan
- A caregiver emergency script to read aloud in a crisis

> This is a supportive tool, **not** a substitute for emergency medical care.

## GenAI disclosure

Google **Gemini** (3.x flash family, via the `google-genai` SDK) generates the
entire recovery profile on every request at `POST /analyze`. Nothing on the
results screen is hardcoded or mocked — malformed model output returns a `502`
rather than a fabricated plan. The app runs on a latency-controlled router
(`model_routing/router/`) that picks a tier and falls back to faster models on
timeout so responses stay bounded.

## Run locally

```bash
cd model_routing
pip install -r requirements.txt

# Add your key (never commit the real .env):
cp ../.env.example ../.env    # then edit ../.env and set GEMINI_API_KEY

python -m uvicorn api:app --port 8000
# open http://localhost:8000
```

Get a free Gemini API key at https://aistudio.google.com/apikey.

## Test

```bash
cd model_routing
python -m pytest test_recovery.py -q            # pure unit tests (offline)
RUN_LIVE=1 python -m pytest test_recovery.py -q # + live Gemini smoke test
```

## Project layout

```
model_routing/
  api.py              FastAPI app — POST /analyze + serves the frontend
  recovery.py         Core feature: prompt build, JSON parse/validate, live call
  test_recovery.py    TDD unit tests + opt-in live smoke test
  static/index.html   Accessible single-page frontend
  router/             Latency-controlled Gemini router (tiers + timeout fallback)
BUILD-REPORT.md       What was built, how it was verified
```

## Tech

Python · FastAPI · Google Gemini (`google-genai`) · Pydantic · vanilla HTML/CSS/JS
(no build step, no webfonts — works offline once the API key is set).
