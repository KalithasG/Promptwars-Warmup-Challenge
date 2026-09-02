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
    <div className="card p-6 md:p-8">
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
          className="flex-1 rounded-xl border border-separator bg-bg px-4 py-3 text-label outline-none placeholder:text-label-3"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="btn btn-filled disabled:opacity-40"
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
            className="rounded-full bg-fill px-3 py-1.5 text-[0.875rem] text-label-2 transition-colors hover:text-label"
          >
            {s}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="mt-5">
        {error && (
          <p className="rounded-xl border border-separator bg-fill p-4 text-[0.9375rem] text-label-2">
            {error}
          </p>
        )}
        {answer && (
          <div className="rounded-xl bg-fill p-5">
            <p className="whitespace-pre-wrap leading-relaxed">{answer.answer}</p>
            <p className="t-caption mt-4">
              {answer.modelUsed} · {answer.latencyMs}ms
              {answer.fellBack && " · fell back"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
