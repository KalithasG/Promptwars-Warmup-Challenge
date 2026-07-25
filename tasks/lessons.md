# Lessons

## Gemini: ListModels lies about what you can call
The `/models` endpoint returns models the key **cannot** actually use.
- `gemini-2.5-*` → 404 "no longer available to new users"
- Pro models → 429 RESOURCE_EXHAUSTED (no free-tier quota)
**Rule:** always probe with a real 1-token request (`probe_models.py`) before
trusting a model name. Build tiers only from verified-callable models.

## Free-tier Gemini has no Pro quota
A "quality" tier can't rely on `*-pro-*` on a free key. Use the best available
**flash** model instead and document it. Add Pro back only with a billing key.

## Intercepted TLS on Windows dev machines
Local proxy/antivirus MITMs HTTPS → `CERTIFICATE_VERIFY_FAILED` /
"Basic Constraints of CA cert not marked critical". Give the app a
`GEMINI_INSECURE_TLS` escape hatch (httpx `verify=False`), default secure.

## Load the whole .env, not just the key
`_build_http_options()` read `os.environ` but the flag lived only in `.env`.
Loading the full `.env` into `os.environ` on import (no overwrite) fixed it.
Config flags and the key must come from the same place.
