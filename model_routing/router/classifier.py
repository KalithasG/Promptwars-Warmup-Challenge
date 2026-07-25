"""
Zero-latency complexity classifier.

Picks a tier from the prompt using cheap heuristics only — NO extra API call,
because calling a model just to route would add the very latency we're trying
to avoid. Good enough for a hackathon; tune the keyword lists as needed.

Returns one of: "fast" | "balanced" | "quality".
"""
from __future__ import annotations
import re

# Signals that a request needs real reasoning / long output -> quality tier.
_HEAVY = re.compile(
    r"\b(analy[sz]e|reason|prove|derive|explain why|step[- ]by[- ]step|"
    r"architect|design (a|the|an)|trade[- ]?off|debug|refactor|optimi[sz]e|"
    r"compare|evaluate|strateg|plan (a|the)|algorithm|complexit|"
    r"root cause|why does|how would you)\b",
    re.IGNORECASE,
)

# Signals that a request is trivial -> fast tier.
_LIGHT = re.compile(
    r"\b(translate|summari[sz]e|tl;?dr|classif|categor|extract|"
    r"rephrase|rewrite|fix grammar|yes or no|list \d|what is the|"
    r"define|spell|format|convert)\b",
    re.IGNORECASE,
)

# Code fences / heavy structure usually mean a more capable model is worth it.
_CODE = re.compile(r"```|def |class |function |import |SELECT |CREATE TABLE", re.IGNORECASE)


def classify(prompt: str) -> str:
    """Heuristically map a prompt to a routing tier."""
    text = prompt.strip()
    words = len(text.split())

    heavy = bool(_HEAVY.search(text))
    light = bool(_LIGHT.search(text))
    has_code = bool(_CODE.search(text))

    # Explicit heavy intent, big code, or long prompts -> quality.
    if heavy or (has_code and words > 60) or words > 400:
        return "quality"

    # Short + light intent -> fast.
    if light and words < 60 and not has_code:
        return "fast"
    if words < 20 and not has_code:
        return "fast"

    # Everything in between -> balanced (the safe default).
    return "balanced"
