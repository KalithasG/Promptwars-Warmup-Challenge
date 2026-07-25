"""
Backend API scaffold — FastAPI + the latency router.

Run it:
    cd model_routing
    pip install -r requirements.txt
    uvicorn api:app --reload --port 8000

Then:
    curl -X POST http://localhost:8000/generate \
         -H "content-type: application/json" \
         -d '{"input": "explain APIs in one line"}'

TOMORROW: you only edit build_prompt() below. The whole routing + latency
fallback layer already works — don't touch router/ under time pressure.
"""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from router import GeminiRouter
from recovery import RecoveryProfile, analyze

app = FastAPI(title="RecoveryAI — Polysubstance Recovery Triage", version="1.0.0")

# One router for the process. Set the persona/system prompt for your topic here.
router = GeminiRouter(system_instruction="You are a helpful, concise assistant.")

_STATIC = Path(__file__).parent / "static"


class GenerateRequest(BaseModel):
    input: str
    tier: str | None = None          # optional override: fast | balanced | quality
    force_model: str | None = None   # optional: bypass routing entirely


class GenerateResponse(BaseModel):
    output: str
    model_used: str
    tier: str
    latency_ms: int
    fell_back: bool


def build_prompt(user_input: str) -> str:
    # =====================================================================
    # TODO (hackathon): put your TOPIC-SPECIFIC logic here.
    # Transform the raw request into the prompt you actually want to send —
    # add instructions, few-shot examples, retrieved context, formatting, etc.
    # Everything downstream (tier selection, latency fallback) is handled.
    # =====================================================================
    return user_input


class AnalyzeRequest(BaseModel):
    input: str


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/analyze", response_model=RecoveryProfile)
def analyze_route(req: AnalyzeRequest):
    """Core feature: free-text substance description -> live, structured plan."""
    text = req.input.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Describe your substance use first.")
    try:
        return analyze(text)
    except ValueError as e:
        # The model returned something unparseable — surface it, don't fake output.
        raise HTTPException(status_code=502, detail=f"AI response error: {e}") from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/")
def index():
    return FileResponse(_STATIC / "index.html")


# Serve the frontend (mounted last so API routes above take precedence).
if _STATIC.is_dir():
    app.mount("/static", StaticFiles(directory=_STATIC), name="static")


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    prompt = build_prompt(req.input)
    res = router.generate(prompt, tier=req.tier, force_model=req.force_model)
    return GenerateResponse(
        output=res.text,
        model_used=res.model_used,
        tier=res.tier,
        latency_ms=res.latency_ms,
        fell_back=res.fell_back,
    )
