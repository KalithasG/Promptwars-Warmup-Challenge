"use client";

/**
 * The 3D hero: a slowly turning constellation of nodes wired into a graph,
 * with packets of light travelling the edges — a data pipeline, which is the
 * subject of the portfolio rather than a decorative spinning shape.
 *
 * Built from three primitives (points, lineSegments, points) instead of
 * instanced meshes: same look, a fraction of the draw calls, and it stays
 * smooth on a phone.
 */
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";

const NODE_COLOR = "#2b2b28"; // ink marks on the photograph's ground
const EDGE_COLOR = "#b4b3ac"; // barely-there wiring
const FLOW_COLOR = "#0b0b0b"; // the splatter black, moving

/** Deterministic PRNG so the layout is stable between renders. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A soft round sprite — raw gl points render as hard squares. */
function makeDotTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.9)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

interface Graph {
  nodes: Float32Array;
  edges: Float32Array;
  edgePairs: Array<[THREE.Vector3, THREE.Vector3]>;
}

function buildGraph(nodeCount: number, radius: number): Graph {
  const rand = mulberry32(20260902);
  const points: THREE.Vector3[] = [];

  // Spherical shell with jitter — an even spread, no clumping at the poles.
  for (let i = 0; i < nodeCount; i++) {
    const u = rand();
    const v = rand();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = radius * (0.55 + 0.45 * rand());
    points.push(
      new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.65, // flatten: reads as a plane of data
        r * Math.cos(phi),
      ),
    );
  }

  // Wire each node to its 2 nearest neighbours, de-duplicated.
  const seen = new Set<string>();
  const edgePairs: Array<[THREE.Vector3, THREE.Vector3]> = [];
  points.forEach((p, i) => {
    const near = points
      .map((q, j) => ({ j, d: p.distanceTo(q) }))
      .filter((e) => e.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const { j } of near) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edgePairs.push([points[i], points[j]]);
    }
  });

  const nodes = new Float32Array(points.length * 3);
  points.forEach((p, i) => p.toArray(nodes, i * 3));

  const edges = new Float32Array(edgePairs.length * 6);
  edgePairs.forEach(([a, b], i) => {
    a.toArray(edges, i * 6);
    b.toArray(edges, i * 6 + 3);
  });

  return { nodes, edges, edgePairs };
}

function Constellation({ nodeCount, animate }: { nodeCount: number; animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const flowRef = useRef<THREE.Points>(null);

  const { nodes, edges, edgePairs } = useMemo(
    () => buildGraph(nodeCount, 3.2),
    [nodeCount],
  );
  const dot = useMemo(() => makeDotTexture(), []);

  // Packet positions live in a plain buffer the geometry owns; their phase and
  // speed live in refs, because useFrame mutates them every tick and render
  // values must not be mutated after render.
  const packetPositions = useMemo(
    () => new Float32Array(edgePairs.length * 3),
    [edgePairs],
  );
  const offsets = useRef<Float32Array | null>(null);
  const speeds = useRef<Float32Array | null>(null);

  useEffect(() => {
    const rand = mulberry32(7);
    offsets.current = Float32Array.from({ length: edgePairs.length }, () => rand());
    speeds.current = Float32Array.from(
      { length: edgePairs.length },
      () => 0.12 + rand() * 0.25,
    );
  }, [edgePairs]);

  useFrame((state, delta) => {
    if (group.current) {
      // Always orient the scene; only keep spinning when motion is welcome.
      if (animate) group.current.rotation.y += delta * 0.055;
      const { x, y } = state.pointer;
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, y * 0.18, 0.05);
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, x * 0.18, 0.05);
    }

    const phase = offsets.current;
    const speed = speeds.current;
    if (!animate || !flowRef.current || !phase || !speed) return;

    const attr = flowRef.current.geometry.attributes.position;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < edgePairs.length; i++) {
      phase[i] = (phase[i] + delta * speed[i]) % 1;
      const [a, b] = edgePairs[i];
      const t = phase[i];
      arr[i * 3] = a.x + (b.x - a.x) * t;
      arr[i * 3 + 1] = a.y + (b.y - a.y) * t;
      arr[i * 3 + 2] = a.z + (b.z - a.z) * t;
    }
    attr.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={EDGE_COLOR} transparent opacity={0.9} />
      </lineSegments>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodes, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={NODE_COLOR}
          map={dot}
          size={0.2}
          sizeAttenuation
          transparent
          depthWrite={false}
          opacity={0.95}
        />
      </points>

      <points ref={flowRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[packetPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={FLOW_COLOR}
          map={dot}
          size={0.16}
          sizeAttenuation
          transparent
          depthWrite={false}
          opacity={0.95}
        />
      </points>
    </group>
  );
}

export default function DataConstellation({
  nodeCount = 90,
  animate = true,
}: {
  nodeCount?: number;
  animate?: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8.5], fov: 50 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      // Stop rendering entirely when motion is off: a still image costs nothing.
      frameloop={animate ? "always" : "demand"}
    >
      <ambientLight intensity={0.6} />
      <Constellation nodeCount={nodeCount} animate={animate} />
    </Canvas>
  );
}

export type { ThreeElements };
