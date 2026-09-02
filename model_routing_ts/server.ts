/**
 * Backend API scaffold — Express + the latency router.
 *
 * Run it:
 *   cd model_routing_ts
 *   npm install
 *   npm start                 # http://localhost:3000
 *
 * Then:
 *   curl -X POST http://localhost:3000/generate \
 *        -H "content-type: application/json" \
 *        -d '{"input": "explain APIs in one line"}'
 *
 * You only edit buildPrompt() below. The whole routing + latency
 * fallback layer already works — don't touch src/ under time pressure.
 */
import express from "express";

import { GeminiRouter } from "./src/index.ts";

const app = express();
app.use(express.json());

// One router for the process. Set the persona/system prompt for your topic here.
const router = new GeminiRouter({ systemInstruction: "You are a helpful, concise assistant." });

function buildPrompt(userInput: string): string {
  // =====================================================================
  // TODO: put your TOPIC-SPECIFIC logic here.
  // Transform the raw request into the prompt you actually want to send —
  // add instructions, few-shot examples, retrieved context, formatting, etc.
  // Everything downstream (tier selection, latency fallback) is handled.
  // =====================================================================
  return userInput;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/generate", async (req, res) => {
  try {
    const { input = "", tier, forceModel } = req.body ?? {};
    const prompt = buildPrompt(input);
    const r = await router.generate(prompt, { tier, forceModel });
    res.json({
      output: r.text,
      modelUsed: r.modelUsed,
      tier: r.tier,
      latencyMs: r.latencyMs,
      fellBack: r.fellBack,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Portfolio Development API on http://localhost:${port}`);
});
