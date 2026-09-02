/**
 * HIG: follow the system appearance by default, and let the person override it.
 *
 * State lives on <html data-theme>, not in React, so the script in the document
 * head can apply a stored choice before first paint. No attribute at all means
 * "follow the system", which the CSS handles via prefers-color-scheme.
 */
export type Theme = "light" | "dark";

export const THEME_KEY = "portfolio-theme";

/** The explicit choice, if one was made. */
export function getStoredTheme(): Theme | null {
  if (typeof document === "undefined") return null;
  const v = document.documentElement.dataset.theme;
  return v === "dark" || v === "light" ? v : null;
}

/** What the visitor is actually looking at right now. */
export function getTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Blocked storage: the choice still applies for this visit.
  }
}

/** Fires on an explicit change and on a system change while following it. */
export function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    mq.removeEventListener("change", onChange);
  };
}
