/**
 * GeminiRouter — latency-controlled routing with timeout-based fallback.
 *
 * Self-contained port of model_routing_ts/src for the Next.js runtime: same
 * tiers, same chains, same bounded-latency guarantee, but it reads the API key
 * from process.env instead of walking the filesystem for a .env file.
 *
 * How latency is controlled:
 *   1. classify() picks a tier with no API call.
 *   2. The tier is an ordered chain of { model, timeoutMs } attempts.
 *   3. Each attempt races a hard wall-clock timeout. Too slow or errors ->
 *      abandon it and drop to the next (faster) model. Total latency is
 *      therefore bounded by the chain.
 */
import { GoogleGenAI } from "@google/genai";

import { classify, type TierName } from "./classify";

export interface Attempt {
  model: string;
  timeoutMs: number;
}

export interface Tier {
  name: string;
  chain: Attempt[];
}

// Verified callable on a free-tier key: the gemini-3.x flash family. Pro models
// return 429 (no free quota) and gemini-2.5-* are retired for new users, so no
// Pro tier here — "quality" is the newest flash, then downshifts.
export const TIERS: Record<TierName, Tier> = {
  fast: {
    name: "fast",
    chain: [
      { model: "gemini-3.5-flash-lite", timeoutMs: 6000 },
      { model: "gemini-flash-lite-latest", timeoutMs: 6000 },
    ],
  },
  balanced: {
    name: "balanced",
    chain: [
      { model: "gemini-3.6-flash", timeoutMs: 12000 },
      { model: "gemini-3.5-flash", timeoutMs: 12000 },
      { model: "gemini-3.5-flash-lite", timeoutMs: 6000 },
    ],
  },
  quality: {
    name: "quality",
    chain: [
      { model: "gemini-3.6-flash", timeoutMs: 15000 },
      { model: "gemini-flash-latest", timeoutMs: 15000 },
      { model: "gemini-3.5-flash", timeoutMs: 12000 },
      { model: "gemini-3.5-flash-lite", timeoutMs: 6000 },
    ],
  },
};

export const DEFAULT_TIER: TierName = "balanced";

export interface AttemptTrace {
  model: string;
  status: string;
  ms: number;
}

export interface RouteResult {
  text: string;
  modelUsed: string;
  tier: string;
  latencyMs: number;
  fellBack: boolean;
  attempts: AttemptTrace[];
}

class TimeoutError extends Error {}

/** Race a promise against a wall-clock timeout. The loser keeps running, unawaited. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError()), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}

export function hasApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export class GeminiRouter {
  private client: GoogleGenAI;
  private system?: string;

  constructor(opts: { apiKey?: string; systemInstruction?: string } = {}) {
    const apiKey = opts.apiKey ?? process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
    this.client = new GoogleGenAI({ apiKey });
    this.system = opts.systemInstruction;
  }

  private async callModel(
    model: string,
    prompt: string,
    genConfig?: Record<string, unknown>,
  ): Promise<string> {
    const resp = await this.client.models.generateContent({
      model,
      contents: prompt,
      config: {
        ...(this.system ? { systemInstruction: this.system } : {}),
        ...(genConfig ?? {}),
      },
    });
    return resp.text ?? "";
  }

  async generate(
    prompt: string,
    opts: { tier?: TierName; genConfig?: Record<string, unknown> } = {},
  ): Promise<RouteResult> {
    const started = Date.now();
    const attempts: AttemptTrace[] = [];

    const tier: TierName = opts.tier ?? classify(prompt);
    const chain = (TIERS[tier] ?? TIERS[DEFAULT_TIER]).chain;

    for (let i = 0; i < chain.length; i++) {
      const attempt = chain[i];
      const aStart = Date.now();
      try {
        const text = await withTimeout(
          this.callModel(attempt.model, prompt, opts.genConfig),
          attempt.timeoutMs,
        );
        attempts.push({ model: attempt.model, status: "ok", ms: Date.now() - aStart });
        return {
          text,
          modelUsed: attempt.model,
          tier,
          latencyMs: Date.now() - started,
          fellBack: i > 0,
          attempts,
        };
      } catch (e) {
        attempts.push({
          model: attempt.model,
          status: e instanceof TimeoutError ? "timeout" : `error: ${(e as Error).name}`,
          ms: Date.now() - aStart,
        });
      }
    }

    throw new Error(
      `All models in tier '${tier}' failed or timed out. Trace: ${JSON.stringify(attempts)}`,
    );
  }
}
