// apps/website/src/components/homecoming/canvas/AmbientBackdrop.tsx
//
// Atmospheric backdrop for the ceremony. CSS-only gradients do the heavy
// lifting (reliable at every viewport + degrades to solid if gradients fail).
// If WebGL is available we layer an R3F particle field on top for life.
// WebGL failure silently falls back to the CSS-only backdrop.

import React, { useEffect, useState } from "react";

interface Props {
  warmth: number; // 0 cold, 1 gold
}

function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      (canvas as HTMLCanvasElement).getContext("experimental-webgl");
    return !!ctx;
  } catch {
    return false;
  }
}

export function AmbientBackdrop({ warmth }: Props) {
  const [webgl, setWebgl] = useState<boolean>(false);

  useEffect(() => {
    setWebgl(isWebGLAvailable());
  }, []);

  // Interpolated atmospheric colour: cold blue-grey → warm gold
  const coldA = "rgba(40, 56, 72, 0.65)";
  const coldB = "rgba(5, 8, 14, 1)";
  const warmA = "rgba(120, 86, 30, 0.55)";
  const warmB = "rgba(10, 8, 5, 1)";
  const topTint = warmth > 0 ? mixRgba(coldA, warmA, warmth) : coldA;
  const bottomTint = warmth > 0 ? mixRgba(coldB, warmB, warmth) : coldB;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        background: `
          radial-gradient(ellipse at 50% 30%, ${topTint} 0%, rgba(0,0,0,0) 60%),
          radial-gradient(ellipse at 50% 85%, rgba(241, 86, 63, 0.18) 0%, rgba(0,0,0,0) 55%),
          linear-gradient(180deg, #060912 0%, ${bottomTint} 100%)
        `,
        overflow: "hidden",
      }}
    >
      {/* CSS ceremonial floor — a faint horizon glow, not a hard line */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "30%",
          transform: "translateX(-50%)",
          width: "120vw",
          height: 2,
          background:
            "linear-gradient(90deg, transparent, rgba(241,86,63,0.35), rgba(254,221,30," +
            (0.2 + warmth * 0.5) +
            "), rgba(241,86,63,0.35), transparent)",
          filter: `blur(${1 + warmth * 2}px)`,
          opacity: 0.6 + warmth * 0.3,
          transition: "opacity 800ms, filter 800ms",
        }}
      />

      {/* Star-field / motes — pure CSS so we never depend on WebGL */}
      <CSSParticles count={60} warmth={warmth} />

      {/* Grain overlay for texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.06,
          mixBlendMode: "overlay",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
        }}
      />

      {webgl && <R3FMotesLazy warmth={warmth} />}
    </div>
  );
}

/** Pure-CSS drifting particles, keyed by index for stable layout. */
function CSSParticles({ count, warmth }: { count: number; warmth: number }) {
  // Stable pseudo-random scatter via index hash — no rAF, GPU does the animation.
  const motes = React.useMemo(() => {
    const arr: Array<{ x: number; y: number; s: number; d: number; o: number }> = [];
    for (let i = 0; i < count; i++) {
      const seed = (i * 9301 + 49297) % 233280;
      const x = (seed % 100) / 100;
      const y = ((seed * 7) % 100) / 100;
      const s = 1 + ((seed * 13) % 20) / 10; // size 1-3 px
      const d = 12 + ((seed * 17) % 24); // drift duration 12-36s
      const o = 0.25 + ((seed * 3) % 60) / 100; // opacity 0.25-0.85
      arr.push({ x, y, s, d, o });
    }
    return arr;
  }, [count]);

  const color = warmth > 0.5 ? "#FEDD1E" : "#B8C4CE";

  return (
    <>
      {motes.map((m, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${m.x * 100}%`,
            top: `${m.y * 100}%`,
            width: m.s,
            height: m.s,
            borderRadius: 3,
            background: color,
            opacity: m.o,
            boxShadow: `0 0 ${m.s * 3}px ${color}`,
            animation: `hc-drift-${i % 4} ${m.d}s linear infinite`,
            transition: "background 800ms",
          }}
        />
      ))}
      <style>{`
        @keyframes hc-drift-0 { 0% { transform: translate(0,0); } 100% { transform: translate(30vw, -10vh); } }
        @keyframes hc-drift-1 { 0% { transform: translate(0,0); } 100% { transform: translate(-20vw, 8vh); } }
        @keyframes hc-drift-2 { 0% { transform: translate(0,0); } 100% { transform: translate(18vw, 14vh); } }
        @keyframes hc-drift-3 { 0% { transform: translate(0,0); } 100% { transform: translate(-25vw, -6vh); } }
      `}</style>
    </>
  );
}

/** R3F motes rendered lazily so WebGL failure doesn't nuke the page. */
const LazyParticles = React.lazy(() => import("./AmbientParticles"));

function R3FMotesLazy({ warmth }: { warmth: number }) {
  return (
    <React.Suspense fallback={null}>
      <ErrorBoundary>
        <LazyParticles warmth={warmth} />
      </ErrorBoundary>
    </React.Suspense>
  );
}

function mixRgba(a: string, b: string, t: number): string {
  const parse = (s: string) =>
    s
      .replace(/rgba?\(/, "")
      .replace(/\)/, "")
      .split(",")
      .map((n) => parseFloat(n.trim()));
  const [ar, ag, ab, aa = 1] = parse(a);
  const [br, bg, bb, ba = 1] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  const al = aa + (ba - aa) * t;
  return `rgba(${r}, ${g}, ${bl}, ${al})`;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    // swallow; ambient extras are non-essential
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
