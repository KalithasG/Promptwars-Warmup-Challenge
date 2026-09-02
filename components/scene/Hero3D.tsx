"use client";

/**
 * Mounts the 3D hero only where it makes sense, and degrades quietly where it
 * doesn't: no WebGL, reduced-motion preference, or a small screen.
 *
 * The text over the canvas is real DOM, never 3D text — it has to be
 * selectable, translatable, and readable by a screen reader or a recruiter's
 * scraper, none of which can see into a canvas.
 */
import dynamic from "next/dynamic";
import { Component, useCallback, useSyncExternalStore, type ReactNode } from "react";

const DataConstellation = dynamic(() => import("./DataConstellation"), {
  ssr: false,
  loading: () => null,
});

class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("3D hero disabled:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// Probing WebGL builds a canvas, so cache it: the snapshot below is read on
// every render and must be cheap and stable.
let webglSupport: boolean | null = null;

function webglAvailable(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    webglSupport = Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

const neverChanges = () => () => {};

/**
 * Media queries read through useSyncExternalStore rather than an effect, so
 * the server snapshot is explicit and there's no setState-during-mount.
 */
function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false, // server: assume no preference, no canvas rendered anyway
  );
}

export default function Hero3D() {
  const hasWebgl = useSyncExternalStore(neverChanges, webglAvailable, () => false);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const smallScreen = useMediaQuery("(max-width: 768px)");

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      // A gradient stands in before (and instead of) the canvas, so the hero
      // never renders as a bare white box.
      style={{
        background:
          "radial-gradient(120% 90% at 72% 8%, rgba(11,11,11,0.07), transparent 58%)," +
          "radial-gradient(90% 80% at 15% 85%, rgba(11,11,11,0.05), transparent 62%)",
      }}
    >
      {/* Full-bleed texture rather than a feature: the graph reads behind the
          whole hero, dimmed enough that the type always wins. */}
      <div className="absolute inset-0">
        {hasWebgl && (
          <CanvasBoundary>
            <DataConstellation
              nodeCount={smallScreen ? 45 : 90}
              animate={!reducedMotion}
            />
          </CanvasBoundary>
        )}
      </div>

      {/* Type must win over decoration: an even veil, heavier on small screens
          where the copy spans the full width. */}
      <div className="absolute inset-0 md:hidden" style={{ background: "rgba(217,216,210,0.80)" }} />
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(217,216,210,0.94) 0%, rgba(217,216,210,0.80) 34%, rgba(217,216,210,0.25) 60%, rgba(217,216,210,0.05) 100%)",
        }}
      />
    </div>
  );
}
