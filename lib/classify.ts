/**
 * Zero-latency complexity classifier — ported from the model_routing_ts
 * scaffold. Picks a tier from the prompt with cheap heuristics only; calling a
 * model just to route would add the very latency we're trying to avoid.
 */
const HEAVY =
  /\b(analy[sz]e|reason|prove|derive|explain why|step[- ]by[- ]step|architect|design (a|the|an)|trade[- ]?off|debug|refactor|optimi[sz]e|compare|evaluate|strateg|plan (a|the)|algorithm|complexit|root cause|why does|how would)\b/i;

const LIGHT =
  /\b(translate|summari[sz]e|tl;?dr|classif|categor|extract|rephrase|rewrite|fix grammar|yes or no|list \d|what is the|define|spell|format|convert)\b/i;

const CODE = /```|def |class |function |import |SELECT |CREATE TABLE/i;

export type TierName = "fast" | "balanced" | "quality";

export function classify(prompt: string): TierName {
  const text = prompt.trim();
  const words = text.split(/\s+/).length;

  const heavy = HEAVY.test(text);
  const light = LIGHT.test(text);
  const code = CODE.test(text);

  if (heavy || code || words > 120) return "quality";
  if (light && words < 40) return "fast";
  if (words < 15) return "fast";
  return "balanced";
}
