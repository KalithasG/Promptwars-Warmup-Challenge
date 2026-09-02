"use client";

/**
 * A restrained depth layer behind the hero: a few very large, very soft forms
 * drifting slowly at low opacity.
 *
 * HIG deference — this must read as atmosphere, never as decoration competing
 * with the portrait or the type. Sprites only: no lights, no shadows, no post
 * processing, so it stays smooth on a phone.
 */
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A wide, gentle falloff — a hard-edged circle would read as a shape. */
function makeSoftTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.85)");
  g.addColorStop(0.45, "rgba(255,255,255,0.28)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

interface Blob {
  base: [number, number, number];
  scale: number;
  amp: [number, number];
  speed: number;
  phase: number;
  color: string;
}

function Blobs({ tone, opacity }: { tone: "light" | "dark"; opacity: number }) {
  const tex = useMemo(() => makeSoftTexture(), []);
  const sprites = useRef<Array<THREE.Sprite | null>>([]);

  const blobs = useMemo<Blob[]>(() => {
    const rand = mulberry32(20260902);
    const palette =
      tone === "dark"
        ? ["#2997ff", "#5e5ce6", "#64d2ff", "#ffffff"]
        : ["#0071e3", "#7d8cff", "#b7d5ff", "#cfd4da"];
    return Array.from({ length: 5 }, (_, i) => ({
      base: [(rand() - 0.5) * 11, (rand() - 0.5) * 6.5, -3 - rand() * 3],
      scale: 6 + rand() * 6,
      amp: [0.7 + rand() * 1.5, 0.4 + rand() * 0.9],
      speed: 0.035 + rand() * 0.06,
      phase: rand() * Math.PI * 2,
      color: palette[i % palette.length],
    }));
  }, [tone]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const sprite = sprites.current[i];
      if (!sprite) continue;
      sprite.position.set(
        b.base[0] + Math.sin(t * b.speed + b.phase) * b.amp[0],
        b.base[1] + Math.cos(t * b.speed * 0.8 + b.phase) * b.amp[1],
        b.base[2],
      );
      sprite.scale.setScalar(b.scale * (1 + Math.sin(t * b.speed * 1.4 + b.phase) * 0.06));
    }
  });

  return (
    <>
      {blobs.map((b, i) => (
        <sprite
          key={i}
          ref={(el) => {
            sprites.current[i] = el;
          }}
          scale={b.scale}
        >
          <spriteMaterial
            map={tex}
            color={b.color}
            transparent
            opacity={opacity}
            depthWrite={false}
          />
        </sprite>
      ))}
    </>
  );
}

export default function AmbientField({ tone = "light" }: { tone?: "light" | "dark" }) {
  // The same wash reads far stronger on black, so the two need different values.
  const opacity = tone === "dark" ? 0.22 : 0.14;

  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <Blobs tone={tone} opacity={opacity} />
    </Canvas>
  );
}
