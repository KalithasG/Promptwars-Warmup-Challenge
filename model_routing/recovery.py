"""
Recovery Triage — the core GenAI feature of the platform.

Turns a free-text, low-cognitive-load description of someone's substance use
("I drink on weekends, vape every day, and sometimes use cocaine") into a
structured, personalized recovery profile: the substances involved, the primary
risk, secondary triggers, a relapse-risk level, an actionable recovery plan, and
a ready-to-read caregiver emergency script.

Everything here is designed for POLYSUBSTANCE use — the plan and script adapt to
the *combination* of substances, not a single canned template.

Design:
  * build_analysis_prompt() and parse_analysis() are PURE (unit-tested offline).
  * analyze() is the one function that performs a real Gemini call, via the
    existing latency-controlled GeminiRouter. No mock data, no hardcoding — the
    profile is generated live by the model on every request.
"""
from __future__ import annotations

import json
import re

from pydantic import BaseModel, Field, ValidationError, field_validator

from router import GeminiRouter

# --- System persona: a careful, non-judgmental recovery guide --------------
SYSTEM_INSTRUCTION = (
    "You are a compassionate, evidence-informed substance-use recovery guide. "
    "You support people with polysubstance use disorders and their caregivers. "
    "You are non-judgmental, never moralize, and you tailor guidance to the "
    "specific COMBINATION of substances described — accounting for dangerous "
    "interactions. You are a supportive tool, not a substitute for emergency "
    "medical care; when risk is high you say so plainly."
)

_RISK_LEVELS = {"low": "Low", "moderate": "Moderate", "high": "High"}


class RecoveryProfile(BaseModel):
    """The structured output shown in the UI and returned by the API."""

    substances: list[str] = Field(min_length=1)
    primary_risk: str
    secondary_triggers: list[str]
    relapse_risk: str
    recovery_plan: list[str] = Field(min_length=1)
    caregiver_script: str

    @field_validator("relapse_risk")
    @classmethod
    def _normalize_risk(cls, v: str) -> str:
        key = str(v).strip().lower()
        if key not in _RISK_LEVELS:
            raise ValueError(f"relapse_risk must be Low/Moderate/High, got {v!r}")
        return _RISK_LEVELS[key]


_SCHEMA_HINT = """\
Return ONLY a JSON object with EXACTLY these keys:
{
  "substances":          [list of substances you identified, capitalized],
  "primary_risk":        "the single substance posing the greatest risk",
  "secondary_triggers":  [list of situations/substances that trigger relapse],
  "relapse_risk":        "Low" | "Moderate" | "High",
  "recovery_plan":       [3-5 concrete, personalized action steps],
  "caregiver_script":    "a short script a caregiver can read aloud in a crisis"
}
Tailor everything to the SPECIFIC COMBINATION of substances. No prose outside the JSON."""


def build_analysis_prompt(user_input: str) -> str:
    """Deterministically assemble the analysis prompt (pure, testable)."""
    description = user_input.strip() or "(no description provided)"
    return (
        "A person described their substance use as follows:\n"
        f'"""{description}"""\n\n'
        "Analyze this for a polysubstance recovery plan.\n"
        f"{_SCHEMA_HINT}"
    )


def _extract_json(raw: str) -> str:
    """Pull the JSON object out of a model response.

    Handles clean JSON, ```json fenced blocks, and JSON embedded in prose by
    grabbing the outermost {...} span. Raises ValueError if none is found.
    """
    text = raw.strip()

    # Strip a ```json ... ``` (or plain ```) fence if present.
    fence = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()

    # If there's surrounding prose, isolate the outermost brace span.
    if not text.startswith("{"):
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("no JSON object found in model response")
        text = text[start : end + 1]
    return text


def parse_analysis(raw: str) -> RecoveryProfile:
    """Parse + validate a raw model response into a RecoveryProfile.

    Raises ValueError on malformed JSON or a schema mismatch, so callers can
    fail loudly rather than surface half-formed guidance.
    """
    payload = _extract_json(raw)
    try:
        data = json.loads(payload)
    except json.JSONDecodeError as e:
        raise ValueError(f"model did not return valid JSON: {e}") from e
    try:
        return RecoveryProfile.model_validate(data)
    except ValidationError as e:
        raise ValueError(f"model output failed schema validation: {e}") from e


# --- Live call (single shared router for the process) ----------------------
_router: GeminiRouter | None = None


def _get_router() -> GeminiRouter:
    global _router
    if _router is None:
        _router = GeminiRouter(system_instruction=SYSTEM_INSTRUCTION)
    return _router


def analyze(user_input: str, tier: str | None = None) -> RecoveryProfile:
    """Run the full feature: prompt -> live Gemini call -> validated profile."""
    prompt = build_analysis_prompt(user_input)
    result = _get_router().generate(
        prompt,
        tier=tier or "quality",
        gen_config={"response_mime_type": "application/json", "temperature": 0.4},
    )
    return parse_analysis(result.text)
