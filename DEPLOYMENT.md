# Deployment

**Live URL:** _paste here after the deploy below finishes_

## Host: Render (free tier)

Chosen because RecoveryAI is a FastAPI **backend + served frontend** — Render
builds it straight from this repo with zero extra config via `render.yaml`, and
the free tier is enough for a demo.

## One-click deploy

1. Make the GitHub repo **public** (Settings → General → Danger Zone → Change
   visibility). Render's blueprint flow needs to read the repo.
2. Open this link (you must be signed in to Render — free GitHub sign-in):

   https://render.com/deploy?repo=https://github.com/KalithasG/Promptwars-Warmup-Challenge

3. Render detects [`render.yaml`](render.yaml) and shows the `recoveryai` service.
   When prompted, paste your **`GEMINI_API_KEY`** (the only required env var —
   it is never committed).
4. Click **Apply / Deploy**. First build takes ~2–3 min. Render gives you a URL
   like `https://recoveryai.onrender.com`.
5. Verify the golden path on the live URL: open it, tap a couple of substance
   chips, click **Generate my recovery plan** → a real Gemini-generated profile
   appears. Health check: `GET /health` → `{"ok": true}`.

## Env vars

| Key              | Required | Notes                                        |
|------------------|----------|----------------------------------------------|
| `GEMINI_API_KEY` | yes      | From https://aistudio.google.com/apikey      |
| `PYTHON_VERSION` | set      | Pinned to 3.12.6 in `render.yaml`            |

## Alternative hosts (same repo)

- **Railway / Fly.io / Cloud Run** — use [`model_routing/Dockerfile`](model_routing/Dockerfile)
  (build context = `model_routing/`). Set `GEMINI_API_KEY` as a secret. The
  container reads `$PORT` from the host.

  ```bash
  cd model_routing
  docker build -t recoveryai .
  docker run -p 8000:8000 -e GEMINI_API_KEY=your-key recoveryai
  ```

## Cold starts & fallback

- Render's free tier **sleeps after ~15 min idle** — the first hit wakes it
  (~30s). Hit the URL once right before demoing so it's warm.
- **Fallback:** the app also runs locally — `cd model_routing && python -m uvicorn
  api:app --port 8000` — keep that ready in case venue wifi fails.
