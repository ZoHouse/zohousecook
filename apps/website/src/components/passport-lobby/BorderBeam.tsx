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
 * with matching border-radius. A conic gradient rotates around the
 * element, revealing a thin traveling light trail along the border.
 */
export function BorderBeam({
  radius = 20,
  duration = 6,
  borderWidth = 1.5,
  colorFrom = '#A7D921',
  colorTo = '#FF2F8E',
  trailDegrees = 80,
  className,
  style,
}: BorderBeamProps) {
  const trailStart = 0;
  const trailMid = trailDegrees / 2;
  const trailEnd = trailDegrees;

  return (
    <>
      <div
        aria-hidden
        className={`border-beam ${className ?? ''}`}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radius,
          padding: borderWidth,
          background: `conic-gradient(from 0deg, ${colorFrom} ${trailStart}deg, ${colorTo} ${trailMid}deg, transparent ${trailEnd}deg, transparent 360deg)`,
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          animation: `border-beam-rotate ${duration}s linear infinite`,
          pointerEvents: 'none',
          zIndex: 3,
          ...style,
        }}
      />
      <style jsx>{`
        @keyframes border-beam-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
