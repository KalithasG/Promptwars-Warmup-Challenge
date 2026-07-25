/**
 * Measure REAL latency of each candidate model on your key + network.
 *
 * Run this at the venue BEFORE building — the numbers decide which models
 * belong in each tier in src/config.ts. Latency varies by network, region, and
 * model load, so trust measured numbers over labels.
 *
 *   npm run bench            # default prompt, 3 runs each
 *   npm run bench -- -n 5    # 5 runs each
 */
import { GoogleGenAI } from "@google/genai";

import { BENCHMARK_MODELS } from "./src/config.ts";
import { loadApiKey } from "./src/env.ts";

const PROMPT = "In exactly two sentences, explain what an API is to a beginner.";

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

async function benchModel(client: GoogleGenAI, model: string, runs: number) {
  const lats: number[] = [];
  let outChars = 0;
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    try {
      const resp = await client.models.generateContent({ model, contents: PROMPT });
      lats.push(performance.now() - t0);
      outChars += (resp.text ?? "").length;
    } catch (e) {
      console.log(`    ! ${model}: ${String((e as Error).message).slice(0, 80)}`);
    }
  }
  if (!lats.length) return null;
  const sorted = [...lats].sort((a, b) => a - b);
  return {
    model,
    medianMs: Math.round(median(lats)),
    p95Ms: Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]),
    avgChars: Math.round(outChars / lats.length),
  };
}

async function main() {
  const nIdx = process.argv.indexOf("-n");
  const runs = nIdx >= 0 ? parseInt(process.argv[nIdx + 1], 10) : 3;

  const client = new GoogleGenAI({ apiKey: loadApiKey() });
  console.log(`Benchmarking ${BENCHMARK_MODELS.length} models, ${runs} runs each...\n`);

  const rows = [];
  for (const m of BENCHMARK_MODELS) {
    console.log(`  -> ${m}`);
    const r = await benchModel(client, m, runs);
    if (r) rows.push(r);
  }
  rows.sort((a, b) => a.medianMs - b.medianMs);

  console.log("\n" + "=".repeat(64));
  console.log(`${"MODEL".padEnd(32)} ${"MEDIAN".padStart(9)} ${"P95".padStart(9)} ${"OUT".padStart(7)}`);
  console.log("-".repeat(64));
  for (const r of rows) {
    console.log(
      `${r.model.padEnd(32)} ${(r.medianMs + "ms").padStart(9)} ${(r.p95Ms + "ms").padStart(9)} ${String(r.avgChars).padStart(7)}`,
    );
  }
  console.log("=".repeat(64));
  if (rows.length) {
    console.log(`\nFastest: ${rows[0].model} (${rows[0].medianMs}ms median)`);
    console.log("Put the fastest reliable models first in src/config.ts tiers.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
