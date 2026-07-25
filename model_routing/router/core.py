"""
GeminiRouter — latency-controlled routing with timeout-based fallback.

Usage:
    from router import GeminiRouter
    r = GeminiRouter()
    out = r.generate("Summarize this in one line: ...")
    print(out.text, out.model_used, out.latency_ms)

How latency is controlled:
  1. classify() picks a tier (fast / balanced / quality) with no API call.
  2. The tier is an ordered chain of (model, timeout) attempts.
  3. Each attempt runs in a worker thread with a hard wall-clock timeout.
     If it's too slow or errors, we abandon it and drop to the next (faster)
     model in the chain. Total latency is therefore bounded by the chain.
"""
from __future__ import annotations

import os
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
from dataclasses import dataclass, field

from google import genai
from google.genai import types

from . import config
from .classifier import classify


def _find_dotenv() -> str | None:
    """Search upward from this file for a .env (project root may be N levels up).

    Robust to where the package lives — e.g. model_routing/router/core.py with
    .env at the repo root two levels above. Stops at the filesystem root.
    """
    d = os.path.dirname(os.path.abspath(__file__))
    while True:
        candidate = os.path.join(d, ".env")
        if os.path.exists(candidate):
            return candidate
        parent = os.path.dirname(d)
        if parent == d:
            return None
        d = parent


def _load_dotenv() -> None:
    """Load KEY=VALUE lines from the project .env into os.environ (no overwrite).

    Keeps a zero-dependency footprint — avoids needing python-dotenv. Existing
    environment variables always win over the file.
    """
    env_path = _find_dotenv()
    if not env_path:
        return
    for line in open(env_path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        os.environ.setdefault(key, val)


_load_dotenv()


@dataclass
class RouteResult:
    text: str
    model_used: str
    tier: str
    latency_ms: int
    fell_back: bool
    attempts: list[dict] = field(default_factory=list)  # trace of every try


def _load_api_key() -> str:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        # Fall back to a .env file somewhere up the tree (see _find_dotenv).
        env_path = _find_dotenv()
        if env_path:
            for line in open(env_path, encoding="utf-8"):
                line = line.strip()
                if line.startswith("GEMINI_API_KEY="):
                    key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not key:
        raise RuntimeError("GEMINI_API_KEY not set (env or .env file).")
    return key


def _build_http_options() -> types.HttpOptions | None:
    """
    Handle intercepted TLS (corporate proxy / antivirus MITM).

    If GEMINI_INSECURE_TLS=true, tell the underlying httpx client to skip
    certificate verification. This is the pragmatic escape hatch for machines
    whose HTTPS is being intercepted (you'll see 'CERTIFICATE_VERIFY_FAILED').
    Leave it unset on a clean network for full verification.
    """
    if os.environ.get("GEMINI_INSECURE_TLS", "").lower() in ("1", "true", "yes"):
        return types.HttpOptions(
            client_args={"verify": False},
            async_client_args={"verify": False},
        )
    return None


class GeminiRouter:
    def __init__(self, api_key: str | None = None, system_instruction: str | None = None):
        self._client = genai.Client(
            api_key=api_key or _load_api_key(),
            http_options=_build_http_options(),
        )
        self._system = system_instruction
        # One worker pool reused across calls; each attempt gets its own future.
        self._pool = ThreadPoolExecutor(max_workers=4)

    # -- low-level single-model call --------------------------------------
    def _call_model(self, model: str, prompt: str, gen_config: dict | None) -> str:
        cfg = types.GenerateContentConfig(
            system_instruction=self._system,
            **(gen_config or {}),
        )
        resp = self._client.models.generate_content(
            model=model, contents=prompt, config=cfg
        )
        return resp.text or ""

    # -- public entrypoint -------------------------------------------------
    def generate(
        self,
        prompt: str,
        tier: str | None = None,
        force_model: str | None = None,
        gen_config: dict | None = None,
    ) -> RouteResult:
        """
        Route `prompt` and return the first successful response within the
        latency budget. `tier` overrides the classifier; `force_model` bypasses
        routing entirely (single model, no fallback).
        """
        started = time.perf_counter()
        attempts: list[dict] = []

        if force_model:
            chain = [config.Attempt(force_model, timeout_s=30.0)]
            chosen_tier = "forced"
        else:
            chosen_tier = tier or classify(prompt)
            if chosen_tier not in config.TIERS:
                chosen_tier = config.DEFAULT_TIER
            chain = config.TIERS[chosen_tier].chain

        for i, attempt in enumerate(chain):
            a_start = time.perf_counter()
            future = self._pool.submit(self._call_model, attempt.model, prompt, gen_config)
            try:
                text = future.result(timeout=attempt.timeout_s)
                took_ms = int((time.perf_counter() - a_start) * 1000)
                attempts.append({"model": attempt.model, "status": "ok", "ms": took_ms})
                return RouteResult(
                    text=text,
                    model_used=attempt.model,
                    tier=chosen_tier,
                    latency_ms=int((time.perf_counter() - started) * 1000),
                    fell_back=(i > 0),
                    attempts=attempts,
                )
            except FutureTimeout:
                took_ms = int((time.perf_counter() - a_start) * 1000)
                attempts.append({"model": attempt.model, "status": "timeout", "ms": took_ms})
                # Don't wait on the abandoned request; move to the next model.
                continue
            except Exception as e:  # network / API / quota errors -> fall back
                took_ms = int((time.perf_counter() - a_start) * 1000)
                attempts.append(
                    {"model": attempt.model, "status": f"error: {type(e).__name__}", "ms": took_ms}
                )
                continue

        raise RuntimeError(
            f"All models in tier '{chosen_tier}' failed or timed out. Trace: {attempts}"
        )

    def close(self):
        self._pool.shutdown(wait=False)
