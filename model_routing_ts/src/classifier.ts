/**
 * Zero-latency complexity classifier.
 *
 * Picks a tier from the prompt using cheap heuristics only — NO extra API call,
 * because calling a model just to route would add the very latency we're trying
 * to avoid. Good enough for a hackathon; tune the keyword lists as needed.
 *
 * Returns one of: "fast" | "balanced" | "quality".
 */

export type TierName = "fast" | "balanced" | "quality";

// Signals that a request needs real reasoning / long output -> quality tier.
const HEAVY =
  /\b(analy[sz]e|reason|prove|derive|explain why|step[- ]by[- ]step|architect|design (a|the|an)|trade[- ]?off|debug|refactor|optimi[sz]e|compare|evaluate|strateg|plan (a|the)|algorithm|complexit|root cause|why does|how would you)\b/i;

// Signals that a request is trivial -> fast tier.
const LIGHT =
  /\b(translate|summari[sz]e|tl;?dr|classif|categor|extract|rephrase|rewrite|fix grammar|yes or no|list \d|what is the|define|spell|format|convert)\b/i;

// Code fences / heavy structure usually mean a more capable model is worth it.
const CODE = /```|def |class |function |import |SELECT |CREATE TABLE/i;

export function classify(prompt: string): TierName {
  const text = prompt.trim();
  const words = text.split(/\s+/).length;

  const heavy = HEAVY.test(text);
  const light = LIGHT.test(text);
  const hasCode = CODE.test(text);

  // Explicit heavy intent, big code, or long prompts -> quality.
  if (heavy || (hasCode && words > 60) || words > 400) return "quality";

  // Short + light intent -> fast.
  if (light && words < 60 && !hasCode) return "fast";
  if (words < 20 && !hasCode) return "fast";

  // Everything in between -> balanced (the safe default).
  return "balanced";
}
