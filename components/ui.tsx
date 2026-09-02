import type { ReactNode } from "react";

import { isTodo } from "@/lib/profile";

/**
 * Renders a profile value, or a visible marker when it is still a placeholder.
 * Gaps are shown rather than hidden so they cannot ship unnoticed.
 */
export function Field({ value, fallback }: { value?: string | null; fallback?: string }) {
  if (!value) return fallback ? <span className="text-label-3">{fallback}</span> : null;
  if (isTodo(value)) return <span className="placeholder">{value}</span>;
  return <>{value}</>;
}

/**
 * A content band. HIG asks for generous negative space and a clear hierarchy,
 * so every section leads with an eyebrow, a title, and optional standfirst.
 */
export function Section({
  id,
  eyebrow,
  title,
  standfirst,
  children,
  tone = "base",
}: {
  id: string;
  eyebrow: string;
  title: string;
  standfirst?: string;
  children: ReactNode;
  tone?: "base" | "grouped";
}) {
  return (
    <section
      id={id}
      className={tone === "grouped" ? "bg-grouped" : "bg-bg"}
    >
      <div className="mx-auto w-full max-w-5xl px-6 py-20 md:py-28">
        <p className="t-eyebrow">{eyebrow}</p>
        <h2 className="t-title mt-2">{title}</h2>
        {standfirst && (
          <p className="t-body-lg mt-4 max-w-2xl text-label-2">{standfirst}</p>
        )}
        <div className="mt-10 md:mt-14">{children}</div>
      </div>
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-6 md:p-8 ${className}`}>{children}</div>;
}

/** A capsule for a skill or a stack entry. */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-full bg-fill px-3 py-1.5 text-[0.9rem] text-label-2">{children}</li>
  );
}
