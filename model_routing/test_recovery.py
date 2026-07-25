"""
Unit tests for the Recovery Triage feature (pure logic — no network).

Run:  cd model_routing && python -m pytest test_recovery.py -v

These cover the two pure functions that turn a free-text description of
substance use into a structured, validated recovery profile:
  * build_analysis_prompt() — deterministic prompt construction
  * parse_analysis()        — robust JSON extraction + schema validation

The live Gemini call is exercised separately by test_smoke_live() which is
skipped unless RUN_LIVE=1 (so CI / offline runs stay fast and deterministic).
"""
from __future__ import annotations

import json
import os

import pytest

from recovery import build_analysis_prompt, parse_analysis, RecoveryProfile


# --- build_analysis_prompt -------------------------------------------------

def test_prompt_embeds_user_input():
    p = build_analysis_prompt("I drink on weekends and vape daily")
    assert "I drink on weekends and vape daily" in p


def test_prompt_requests_json_and_all_fields():
    p = build_analysis_prompt("alcohol and cocaine").lower()
    assert "json" in p
    for field in ("substances", "primary_risk", "secondary_triggers",
                  "relapse_risk", "recovery_plan", "caregiver_script"):
        assert field in p


def test_prompt_strips_and_survives_empty():
    # Empty input should still yield a usable prompt (validation happens upstream).
    assert isinstance(build_analysis_prompt("   "), str)


# --- parse_analysis: happy paths ------------------------------------------

_VALID = {
    "substances": ["Alcohol", "Nicotine", "Cocaine"],
    "primary_risk": "Alcohol",
    "secondary_triggers": ["Weekend social settings", "Stress"],
    "relapse_risk": "High",
    "recovery_plan": ["Set a weekend curfew", "Call a peer before drinking"],
    "caregiver_script": "Stay calm. Remind them why they started recovery.",
}


def test_parse_clean_json():
    profile = parse_analysis(json.dumps(_VALID))
    assert isinstance(profile, RecoveryProfile)
    assert profile.primary_risk == "Alcohol"
    assert profile.relapse_risk == "High"
    assert "Alcohol" in profile.substances
    assert len(profile.recovery_plan) == 2


def test_parse_strips_markdown_fences():
    fenced = "```json\n" + json.dumps(_VALID) + "\n```"
    profile = parse_analysis(fenced)
    assert profile.primary_risk == "Alcohol"


def test_parse_ignores_surrounding_prose():
    noisy = "Sure! Here is the analysis:\n" + json.dumps(_VALID) + "\nHope that helps."
    profile = parse_analysis(noisy)
    assert profile.relapse_risk == "High"


def test_parse_normalizes_relapse_risk():
    data = dict(_VALID, relapse_risk="high")
    assert parse_analysis(json.dumps(data)).relapse_risk == "High"


# --- parse_analysis: failure handling -------------------------------------

def test_parse_rejects_non_json():
    with pytest.raises(ValueError):
        parse_analysis("the model refused and wrote a paragraph instead")


def test_parse_rejects_missing_required_field():
    broken = dict(_VALID)
    del broken["primary_risk"]
    with pytest.raises(ValueError):
        parse_analysis(json.dumps(broken))


# --- live end-to-end (opt-in) ---------------------------------------------

@pytest.mark.skipif(os.environ.get("RUN_LIVE") != "1",
                    reason="set RUN_LIVE=1 to hit the real Gemini API")
def test_smoke_live():
    from recovery import analyze
    profile = analyze("I drink beer every weekend and vape nicotine daily")
    assert profile.substances
    assert profile.recovery_plan
    assert profile.relapse_risk in ("Low", "Moderate", "High")
