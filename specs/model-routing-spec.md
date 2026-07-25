# Specification: Gemini Latency-Controlled Model Router

```yaml
version: 1.0.0
project: Promptwar
rigor_tier: Structured
target_platforms:
  python: ">=3.10"
  node: ">=18.0.0"
```

## 1. Executive Summary
The Gemini Latency-Controlled Model Router is a lightweight, zero-overhead routing framework designed for real-time hackathon applications (e.g. PromptWars Chennai). It classifies prompt intents using zero-latency regex heuristics, routes requests to configured latency/quality tiers, and enforces wall-clock timeouts with automatic fallbacks to faster models.

---

## 2. Technical Architecture & Data Schemas

### 2.1 Latency & Model Tiers

```yaml
tiers:
  fast:
    primary: "gemini-3.5-flash-lite"
    timeout_ms: 1500
    fallbacks:
      - model: "gemini-3.0-flash-lite"
        timeout_ms: 1000
  balanced:
    primary: "gemini-3.5-flash"
    timeout_ms: 3000
    fallbacks:
      - model: "gemini-3.5-flash-lite"
        timeout_ms: 1500
  quality:
    primary: "gemini-3.5-flash"
    timeout_ms: 7000
    fallbacks:
      - model: "gemini-3.5-flash-lite"
        timeout_ms: 2000
```

### 2.2 Routing Response Schema

```json
{
  "text": "Generated response string",
  "model_used": "gemini-3.5-flash-lite",
  "tier": "balanced",
  "latency_ms": 1120,
  "fell_back": true,
  "attempts": [
    {
      "model": "gemini-3.5-flash",
      "status": "TIMEOUT_EXCEEDED",
      "latency_ms": 3000
    },
    {
      "model": "gemini-3.5-flash-lite",
      "status": "SUCCESS",
      "latency_ms": 1120
    }
  ]
}
```

---

## 3. Intent Classification Rules (Zero-Latency Heuristics)

- **FAST Tier**: Matches prompts requesting short outputs, one-liners, lists, simple JSON extractions, or code snippets under 5 lines.
- **BALANCED Tier**: Default tier for general queries, multi-step explanations, medium code generation, and standard agent steps.
- **QUALITY Tier**: Matches complex analysis, multi-file refactoring, formal reports, complex reasoning, or explicit `--quality` overrides.

---

## 4. Operational Guardrails & Environment

1. **Security**: Never check in `.env` or hardcode `GEMINI_API_KEY`.
2. **TLS Proxy Handling**: `GEMINI_INSECURE_TLS=true` enables local development behind corporate/intercepting SSL proxies. Must be unset for clean production environments.
3. **Fallback Invariant**: Every request MUST either return a valid text completion or throw a structured `RoutingExecutionError` after exhausting all tier fallbacks. Silent failures or empty responses are strictly forbidden.

---

## 5. BDD Acceptable Scenarios

### Scenario 1: Primary Model Fast Response
- **Given**: A prompt classified under `fast` tier and a responsive Gemini API.
- **When**: `router.generate(prompt)` is called.
- **Then**: Returns result within 1.5s with `fell_back: false` and `model_used: gemini-3.5-flash-lite`.

### Scenario 2: Primary Timeout Triggers Fallback
- **Given**: Primary model in `balanced` tier hangs or exceeds 3000ms limit.
- **When**: `router.generate(prompt)` executes.
- **Then**: Cancels primary request thread, immediately dispatches to fallback model `gemini-3.5-flash-lite`, completes successfully, and sets `fell_back: true`.
