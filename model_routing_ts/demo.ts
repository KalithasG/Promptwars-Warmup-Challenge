/**
 * Quick demo of the latency-controlled router.
 *
 *   npm run demo
 *
 * Shows the classifier picking a tier per prompt, the model actually used, and
 * end-to-end latency including any fallback.
 */
import { GeminiRouter, classify } from "./src/index.ts";

const PROMPTS = [
  "What is the capital of France?", // -> fast
  "Summarize the plot of Romeo and Juliet in one line.", // -> fast/balanced
  "Write a TypeScript function to merge two sorted arrays.", // -> balanced
  "Analyze the trade-offs between REST and GraphQL for a real-time chat app and recommend one with reasoning.", // -> quality
];

async function main() {
  const r = new GeminiRouter({ systemInstruction: "Be concise and correct." });
  for (const p of PROMPTS) {
    const tier = classify(p);
    console.log(`\n[${tier.toUpperCase().padEnd(8)}] ${p.slice(0, 60)}...`);
    const res = await r.generate(p);
    const flag = res.fellBack ? " (fell back)" : "";
    console.log(`  model=${res.modelUsed}  ${res.latencyMs}ms${flag}`);
    console.log(`  trace=${JSON.stringify(res.attempts)}`);
    console.log(`  -> ${res.text.trim().slice(0, 160)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
