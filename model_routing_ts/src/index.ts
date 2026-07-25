/** Latency-controlled Gemini model router (TypeScript). */
export { GeminiRouter } from "./core.ts";
export type { RouteResult, AttemptTrace, GenerateOptions } from "./core.ts";
export { classify } from "./classifier.ts";
export type { TierName } from "./classifier.ts";
export * as config from "./config.ts";
export { loadEnv, loadApiKey } from "./env.ts";
