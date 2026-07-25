# PromptWars Chennai — Prep Todo

## Pre-event (tonight)
- [x] Add Gemini API key to `.env`
- [x] Enumerate models available to the key (ListModels)
- [x] Discover which models are actually CALLABLE (probe) — key is free-tier
- [x] Build latency-controlled model router (`router/`)
- [x] Handle intercepted-TLS on this machine (`GEMINI_INSECURE_TLS`)
- [x] Verify routing + fallback end-to-end (`demo.py` passes)
- [ ] Pack: laptop + charger, extension box, Govt photo ID, invite QR (offline)

## At the venue (25 Jul, before building)
- [ ] Re-run `python probe_models.py` on venue network / current key
- [ ] Run `python benchmark.py` — record real median latency per model
- [ ] Update `router/config.py` tiers with the fastest reliable models
- [ ] If venue network is clean, remove `GEMINI_INSECURE_TLS` from `.env`
- [ ] If you get a paid/billing key, add Pro back to the QUALITY tier

## Review
- Router works on free-tier key using gemini-3.x flash family.
- Fallback verified live: balanced request hit a ServerError on flash and
  auto-dropped to flash-lite, still returning a correct answer.
- Measured latency (this network): fast ~1s, quality ~11s.
