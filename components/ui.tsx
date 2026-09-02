import type { ReactNode } from "react";

import { isTodo } from "@/lib/profile";

/**
 * Renders a profile value, or a loud marker when it's still a placeholder.
 * Gaps are shown rather than hidden so they're impossible to ship unnoticed.
 */
export function Field({
  value,
  fallback,
}: {
  value: string | undefined | null;
  fallback?: string;
}) {
  if (!value) return fallback ? <span className="text-muted">{fallback}</span> : null;
  if (isTodo(value)) return <span className="placeholder">{value}</span>;
  return <>{value}</>;
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`label ${className}`}>{children}</span>;
}

/**
 * A section whose heading pins to the viewport while its content scrolls past
 * — the behaviour from the reference, done with sticky positioning rather than
 * a scroll library, so it costs nothing and degrades on old browsers.
 */
export function Section({
  id,
  index,
  title,
  kicker,
  children,
}: {
  id: string;
  index: string;
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="border-t border-rule">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-16 md:py-28">
        <div className="md:sticky md:top-24 md:self-start">
          <Label>
            {index} <span className="text-rule">/</span> 07
          </Label>
          <h2 className="mt-4 text-3xl leading-none tracking-tight md:text-4xl">{title}</h2>
          {kicker && <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{kicker}</p>}
          <div className="mt-6 h-px w-12 bg-accent" />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border border-rule bg-surface/60 p-6 md:p-8 ${className}`}>{children}</div>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <li className="border border-rule px-2.5 py-1 font-mono text-xs tracking-wide text-ink-soft">
      {children}
    </li>
  );
}
