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

You only edit build_prompt() below. The whole routing + latency fallback layer
already works — don't touch router/ under time pressure.
"""
from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

from router import GeminiRouter

app = FastAPI(title="Gemini Latency Router", version="1.0.0")

# One router for the process. Set the persona/system prompt for your topic here.
router = GeminiRouter(system_instruction="You are a helpful, concise assistant.")


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
    # TODO: put your TOPIC-SPECIFIC logic here.
    # Transform the raw request into the prompt you actually want to send —
    # add instructions, few-shot examples, retrieved context, formatting, etc.
    # Everything downstream (tier selection, latency fallback) is handled.
    # =====================================================================
    return user_input


@app.get("/health")
def health():
    return {"ok": True}


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
