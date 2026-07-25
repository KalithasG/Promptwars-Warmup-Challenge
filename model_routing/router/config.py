"""
Model routing configuration for latency control.

Tiers are ordered fallback CHAINS. The router tries the first model; if it
exceeds `timeout_s` (or errors), it drops to the next model in the chain.
Fallbacks always move toward *faster* models so total latency stays bounded
even when a bigger model is slow or overloaded.

IMPORTANT — models below were VERIFIED callable on this key on 2026-07-24:
  * The gemini-2.5-* models return 404 ("no longer available to new users").
  * The Pro models (gemini-pro-latest, gemini-3-pro-preview) return 429
    RESOURCE_EXHAUSTED — the free tier has no Pro quota. So NO Pro tier here.
  * The gemini-3.x FLASH family works and is what every tier uses.
If you switch to a paid/billing-enabled key at the venue, re-run
`python probe_models.py` and add Pro back into the QUALITY tier.
"""
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Attempt:
    model: str
    # Hard wall-clock cap for this attempt. If exceeded, move to next model.
    timeout_s: float


@dataclass(frozen=True)
class Tier:
    name: str
    chain: list[Attempt] = field(default_factory=list)


# --- Model tiers (all verified callable on the current free-tier key) ------

FAST = Tier(
    name="fast",
    chain=[
        Attempt("gemini-3.5-flash-lite", timeout_s=6.0),
        Attempt("gemini-flash-lite-latest", timeout_s=6.0),
        Attempt("gemini-3.1-flash-lite", timeout_s=6.0),
    ],
)

BALANCED = Tier(
    name="balanced",
    chain=[
        Attempt("gemini-3.6-flash", timeout_s=12.0),      # newest, faster than 3.5
        Attempt("gemini-3.5-flash", timeout_s=12.0),
        Attempt("gemini-3.5-flash-lite", timeout_s=6.0),  # faster fallback
    ],
)

# No Pro on this key (429), so "quality" = newest available flash, then downshift.
QUALITY = Tier(
    name="quality",
    chain=[
        Attempt("gemini-3.6-flash", timeout_s=15.0),      # newest 3.6 (Google's latest)
        Attempt("gemini-flash-latest", timeout_s=15.0),
        Attempt("gemini-3.5-flash", timeout_s=12.0),
        Attempt("gemini-3.5-flash-lite", timeout_s=6.0),
    ],
)

TIERS = {t.name: t for t in (FAST, BALANCED, QUALITY)}
DEFAULT_TIER = "balanced"

# Candidate models compared in benchmark.py (only ones callable on this key).
BENCHMARK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.6-flash",         # newest (launched recently), faster than 3.5-flash
    "gemini-3-flash-preview",
    "gemini-flash-latest",
]
