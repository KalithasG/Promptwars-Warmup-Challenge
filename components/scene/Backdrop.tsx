"use client";

/**
 * Mounts the ambient field only where it makes sense, and degrades quietly
 * where it doesn't: no WebGL, reduced motion, or a small screen all fall back
 * to a static CSS wash. Nothing meaningful lives inside the canvas.
 */
import dynamic from "next/dynamic";
import { Component, useCallback, useSyncExternalStore, type ReactNode } from "react";

import { getTheme, subscribeTheme } from "@/lib/theme";

const AmbientField = dynamic(() => import("./AmbientField"), {
  ssr: false,
  loading: () => null,
});

class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("ambient field disabled:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

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
    () => false,
  );
}

const STATIC_WASH =
  "radial-gradient(55% 45% at 22% 26%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 70%)," +
  "radial-gradient(50% 45% at 80% 62%, color-mix(in oklab, var(--accent) 10%, transparent), transparent 70%)";

export default function Backdrop() {
  const hasWebgl = useSyncExternalStore(neverChanges, webglAvailable, () => false);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "light" as const);

  if (!hasWebgl || reducedMotion) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: STATIC_WASH }}
      />
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      <CanvasBoundary>
        <AmbientField tone={theme} />
      </CanvasBoundary>
    </div>
  );
}
