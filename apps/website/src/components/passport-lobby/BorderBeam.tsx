import type { CSSProperties } from 'react';

export interface BorderBeamProps {
  /** Border radius in px — must match the parent container. */
  radius?: number;
  /** Seconds for one full rotation. Lower = faster. */
  duration?: number;
  /** Width of the visible beam ring in px. */
  borderWidth?: number;
  /** Beam head color (start of trail). */
  colorFrom?: string;
  /** Beam tail color (end of trail). */
  colorTo?: string;
  /** Length of the visible trail in degrees (0–360). */
  trailDegrees?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Animated border beam — place INSIDE a `position: relative` container
 * with matching border-radius. Uses @property to animate the conic
 * gradient angle without transforming the element, so the mask stays
 * aligned with the border ring.
 *
 * Android-safety: older Android Chrome / WebView lacks mask-composite
 * support. Without it, the conic gradient is unmasked and fills the
 * inset area as a solid coloured slice — Erum saw this as a "broken
 * icon" at the top-left of the hero card. The CSS below uses an
 * `@supports` gate so unsupported browsers fall back to a plain static
 * gradient border with no mask + no animation.
 */
export function BorderBeam({
  radius = 20,
  duration = 6,
  borderWidth = 1.5,
  colorFrom = '#A7D921',
  colorTo = '#FF2F8E',
  trailDegrees = 90,
  className,
  style,
}: BorderBeamProps) {
  const trailMid = trailDegrees / 2;

  return (
    <>
      <div
        aria-hidden
        className={`border-beam ${className ?? ''}`}
        style={
          {
            position: 'absolute',
            inset: 0,
            borderRadius: radius,
            pointerEvents: 'none',
            zIndex: 3,
            ...style,
          } as CSSProperties
        }
      />
      <style jsx>{`
        /* Fallback path — browsers without mask-composite support get a
           static gradient border ring. No animation, no Houdini. */
        .border-beam {
          border: ${borderWidth}px solid ${colorFrom};
        }

        /* Houdini-capable path — animated conic-gradient masked to the
           border ring. Triggers on every modern Chrome/Safari/Firefox
           desktop + iOS Safari + Android Chrome 91+. */
        @supports ((mask-composite: exclude) or (-webkit-mask-composite: xor)) {
          .border-beam {
            border: 0;
            padding: ${borderWidth}px;
            background: conic-gradient(
              from var(--border-beam-angle, 0deg),
              ${colorFrom} 0deg,
              ${colorTo} ${trailMid}deg,
              transparent ${trailDegrees}deg,
              transparent 360deg
            );
            -webkit-mask:
              linear-gradient(#000 0 0) content-box,
              linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            animation: border-beam-spin ${duration}s linear infinite;
          }
        }
      `}</style>
      <style jsx global>{`
        @property --border-beam-angle {
          syntax: '<angle>';
          inherits: false;
          initial-value: 0deg;
        }
        @keyframes border-beam-spin {
          from {
            --border-beam-angle: 0deg;
          }
          to {
            --border-beam-angle: 360deg;
          }
        }
      `}</style>
    </>
  );
}
