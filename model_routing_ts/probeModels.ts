/**
 * Probe which models are actually CALLABLE on your current key.
 *
 * ListModels returns many models a free key cannot call: some 404 ("not
 * available to new users"), Pro models 429 (no free quota). This sends a tiny
 * real request to each and reports OK / the failure code — the ground truth.
 *
 *   npm run probe            # probe the default candidate set
 *   npm run probe -- --all   # probe every generateContent model
 *
 * Run this first thing at the venue, especially if you swap keys.
 */
import { GoogleGenAI } from "@google/genai";

import { BENCHMARK_MODELS } from "./src/config.ts";
import { loadApiKey } from "./src/env.ts";

async function listAllModels(client: GoogleGenAI): Promise<string[]> {
  const names: string[] = [];
  const pager = await client.models.list();
  for await (const m of pager) {
    if ((m.supportedActions ?? []).includes("generateContent")) {
      names.push((m.name ?? "").replace("models/", ""));
    }
  }
  return names;
}

async function main() {
  const all = process.argv.includes("--all");
  const client = new GoogleGenAI({ apiKey: loadApiKey() });

  const models = all ? await listAllModels(client) : BENCHMARK_MODELS;
  console.log(`Probing ${models.length} models with a tiny real request...\n`);

  const ok: string[] = [];
  const bad: string[] = [];
  for (const m of models) {
    try {
      await client.models.generateContent({ model: m, contents: "Say OK" });
      console.log(`  OK    ${m}`);
      ok.push(m);
    } catch (e) {
      const code = String((e as Error).message).split(".")[0].slice(0, 40);
      console.log(`  FAIL  ${m.padEnd(40)} -> ${code}`);
      bad.push(m);
    }
  }

  console.log(`\nCallable: ${ok.length}   Blocked: ${bad.length}`);
  if (ok.length) {
    console.log("Use these in src/config.ts tiers:");
    for (const m of ok) console.log(`  - ${m}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
