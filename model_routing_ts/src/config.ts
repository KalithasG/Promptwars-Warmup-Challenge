/**
 * Model routing configuration for latency control.
 *
 * Tiers are ordered fallback CHAINS. The router tries the first model; if it
 * exceeds `timeoutMs` (or errors), it drops to the next model in the chain.
 * Fallbacks always move toward *faster* models so total latency stays bounded
 * even when a bigger model is slow or overloaded.
 *
 * IMPORTANT — models below were VERIFIED callable on this key on 2026-07-24:
 *   - gemini-2.5-* return 404 ("no longer available to new users").
 *   - Pro models return 429 RESOURCE_EXHAUSTED (free tier has no Pro quota).
 *   - The gemini-3.x FLASH family works and is what every tier uses.
 *   - gemini-3.6-flash (Google's latest) is the balanced/quality primary —
 *     newer and faster than 3.5-flash in benchmarks.
 * If you switch to a billing-enabled key, run `probeModels.ts` and add Pro back
 * to the QUALITY tier.
 */

export interface Attempt {
  model: string;
  /** Hard wall-clock cap for this attempt (ms). Exceed it -> next model. */
  timeoutMs: number;
}

export interface Tier {
  name: string;
  /** Ordered fallback chain: primary first, faster/safer models after. */
  chain: Attempt[];
}

export const FAST: Tier = {
  name: "fast",
  chain: [
    { model: "gemini-3.5-flash-lite", timeoutMs: 6000 },
    { model: "gemini-flash-lite-latest", timeoutMs: 6000 },
    { model: "gemini-3.1-flash-lite", timeoutMs: 6000 },
  ],
};

export const BALANCED: Tier = {
  name: "balanced",
  chain: [
    { model: "gemini-3.6-flash", timeoutMs: 12000 }, // newest, faster than 3.5
    { model: "gemini-3.5-flash", timeoutMs: 12000 },
    { model: "gemini-3.5-flash-lite", timeoutMs: 6000 }, // faster fallback
  ],
};

// No Pro on this key (429), so "quality" = newest available flash, then downshift.
export const QUALITY: Tier = {
  name: "quality",
  chain: [
    { model: "gemini-3.6-flash", timeoutMs: 15000 }, // newest 3.6 (Google's latest)
    { model: "gemini-flash-latest", timeoutMs: 15000 },
    { model: "gemini-3.5-flash", timeoutMs: 12000 },
    { model: "gemini-3.5-flash-lite", timeoutMs: 6000 },
  ],
};

export const TIERS: Record<string, Tier> = {
  fast: FAST,
  balanced: BALANCED,
  quality: QUALITY,
};

export const DEFAULT_TIER = "balanced";

/** Candidate models compared in benchmark.ts (only ones callable on this key). */
export const BENCHMARK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3-flash-preview",
  "gemini-flash-latest",
];
