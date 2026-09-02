"use client";

/**
 * "Ask about me" — the answer to the brief's real requirement: a visitor
 * should be able to *fetch* information through the link, not just scroll it.
 *
 * Every answer is grounded server-side in profile.json, and the model is told
 * to say "not listed" rather than invent. The trace line under each answer
 * (model + latency) is deliberate: it shows a recruiter the routing work is
 * real, not a chatbot sticker.
 */
import { useState } from "react";

interface Answer {
  answer: string;
  modelUsed: string;
  latencyMs: number;
  fellBack: boolean;
}

const SUGGESTIONS = [
  "What does he do at TCS?",
  "Is he certified on Databricks?",
  "What role is he looking for next?",
];

export default function AskMe() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setAnswer(data as Answer);
      }
    } catch {
      setError("Couldn't reach the assistant. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-rule bg-surface/50 p-6 md:p-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <label htmlFor="ask" className="sr-only">
          Ask a question about me
        </label>
        <input
          id="ask"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={500}
          placeholder="Ask anything — experience, stack, availability…"
          className="flex-1 border border-rule bg-page px-4 py-3 text-ink placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="bg-ink px-6 py-3 font-medium text-page transition-colors hover:bg-ink-soft disabled:opacity-40 disabled:hover:bg-ink"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQuestion(s);
              void ask(s);
            }}
            className="border border-rule px-3 py-1.5 font-mono text-xs tracking-wide text-muted transition-colors hover:border-accent/60 hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="mt-5">
        {error && (
          <p className="border border-accent/40 bg-accent/10 p-4 text-sm text-accent-soft">
            {error}
          </p>
        )}
        {answer && (
          <div className="border border-rule bg-page p-5">
            <p className="whitespace-pre-wrap leading-relaxed">{answer.answer}</p>
            <p className="mt-4 font-mono text-xs tracking-wider text-muted">
              {answer.modelUsed} · {answer.latencyMs}ms
              {answer.fellBack && " · fell back"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
