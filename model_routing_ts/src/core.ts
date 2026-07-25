/**
 * GeminiRouter — latency-controlled routing with timeout-based fallback.
 *
 * Usage:
 *   import { GeminiRouter } from "./src/index.ts";
 *   const r = new GeminiRouter();
 *   const out = await r.generate("Summarize this in one line: ...");
 *   console.log(out.text, out.modelUsed, out.latencyMs);
 *
 * How latency is controlled:
 *   1. classify() picks a tier (fast / balanced / quality) with no API call.
 *   2. The tier is an ordered chain of { model, timeoutMs } attempts.
 *   3. Each attempt races against a hard wall-clock timeout. Too slow or errors
 *      -> abandon it and drop to the next (faster) model in the chain. Total
 *      latency is therefore bounded by the chain's timeouts.
 */
import { GoogleGenAI } from "@google/genai";

import { TIERS, DEFAULT_TIER, type Attempt } from "./config.ts";
import { classify } from "./classifier.ts";
import { loadApiKey, loadEnv } from "./env.ts";

export interface AttemptTrace {
  model: string;
  status: string; // "ok" | "timeout" | "error: <Name>"
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

export interface GenerateOptions {
  tier?: string; // override the classifier
  forceModel?: string; // bypass routing entirely (single model, no fallback)
  genConfig?: Record<string, unknown>; // e.g. { temperature: 0.2, maxOutputTokens: 512 }
}

class TimeoutError extends Error {}

/** Race a promise against a wall-clock timeout. Loser keeps running, unawaited. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError()), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}

export class GeminiRouter {
  private client: GoogleGenAI;
  private system?: string;

  constructor(opts: { apiKey?: string; systemInstruction?: string } = {}) {
    loadEnv(); // ensures TLS flag + .env are applied before the client is built
    this.client = new GoogleGenAI({ apiKey: opts.apiKey ?? loadApiKey() });
    this.system = opts.systemInstruction;
  }

  /** Low-level single-model call. */
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

  /**
   * Route `prompt` and return the first successful response within the latency
   * budget. `tier` overrides the classifier; `forceModel` bypasses routing.
   */
  async generate(prompt: string, opts: GenerateOptions = {}): Promise<RouteResult> {
    const started = performance.now();
    const attempts: AttemptTrace[] = [];

    let chosenTier: string;
    let chain: Attempt[];

    if (opts.forceModel) {
      chosenTier = "forced";
      chain = [{ model: opts.forceModel, timeoutMs: 30000 }];
    } else {
      chosenTier = opts.tier ?? classify(prompt);
      if (!(chosenTier in TIERS)) chosenTier = DEFAULT_TIER;
      chain = TIERS[chosenTier].chain;
    }

    for (let i = 0; i < chain.length; i++) {
      const attempt = chain[i];
      const aStart = performance.now();
      try {
        const text = await withTimeout(
          this.callModel(attempt.model, prompt, opts.genConfig),
          attempt.timeoutMs,
        );
        attempts.push({ model: attempt.model, status: "ok", ms: Math.round(performance.now() - aStart) });
        return {
          text,
          modelUsed: attempt.model,
          tier: chosenTier,
          latencyMs: Math.round(performance.now() - started),
          fellBack: i > 0,
          attempts,
        };
      } catch (e) {
        const ms = Math.round(performance.now() - aStart);
        const status =
          e instanceof TimeoutError ? "timeout" : `error: ${(e as Error).constructor.name}`;
        attempts.push({ model: attempt.model, status, ms });
        // Don't await the abandoned request; move to the next (faster) model.
      }
    }

    throw new Error(
      `All models in tier '${chosenTier}' failed or timed out. Trace: ${JSON.stringify(attempts)}`,
    );
  }
}
