"use client";

/**
 * The hero portrait. HIG asks for motion that is subtle and purposeful, so the
 * only movement is a few pixels of pointer parallax — enough to give the
 * cut-out a sense of depth against the ambient field, never enough to distract.
 */
import Image from "next/image";
import { useEffect, useRef } from "react";

export default function Portrait({
  src,
  alt,
  width,
  height,
  className = "",
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // A pointer is a mouse or a stylus; touch would fight the scroll.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * 2;
        const y = (event.clientY / window.innerHeight - 0.5) * 2;
        el.style.transform = `translate3d(${x * 9}px, ${y * 7}px, 0)`;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={wrap}
      className="will-change-transform"
      style={{ transition: "transform 400ms cubic-bezier(0.25,0.1,0.25,1)" }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={sizes}
        className={className}
      />
    </div>
  );
}
