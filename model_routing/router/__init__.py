"""Latency-controlled Gemini model router."""
from .core import GeminiRouter, RouteResult
from .classifier import classify
from . import config

__all__ = ["GeminiRouter", "RouteResult", "classify", "config"]
