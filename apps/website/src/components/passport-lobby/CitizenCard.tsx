import { useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Avatar2D } from './Avatar2D';
import { BorderBeam } from './BorderBeam';
import { rubikClassName, syneClassName } from '../utils/font';

export interface CitizenCardProps {
  handle: string;
  displayName: string;
  avatarUrl?: string;
  /** Kept in the interface for future binding; not rendered in the current card. */
  xpTotal?: number;
  /** Kept in the interface for future binding; not rendered in the current card. */
  rankTitle?: string;
  onUpsell: () => void;
}

const GRADIENT_PRIVATE_CARD = 'linear-gradient(180deg, #292929 0%, #000000 100%)';
const CARD_RADIUS = 20;
const MAX_TILT = 10; // degrees
const HOVER_LIFT = 8; // translateZ

export function CitizenCard({ displayName, avatarUrl, onUpsell }: CitizenCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState<{
    rx: number;
    ry: number;
    glowX: number;
    glowY: number;
    /** -1 → 1 across the card, used to shift the holographic hue */
    nx: number;
    ny: number;
  } | null>(null);

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dx = (x - centerX) / centerX; // -1 → 1
    const dy = (y - centerY) / centerY; // -1 → 1
    setTilt({
      rx: -dy * MAX_TILT,
      ry: dx * MAX_TILT,
      glowX: (x / rect.width) * 100,
      glowY: (y / rect.height) * 100,
      nx: dx,
      ny: dy,
    });
  };

  const handleMouseLeave = () => setTilt(null);

  const transform = tilt
    ? `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(${HOVER_LIFT}px)`
    : 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)';

  // Holographic hue shift — angle of iridescent conic gradient follows cursor
  const holoAngle = tilt ? 180 + tilt.nx * 180 : 0;
  const holoShift = tilt ? 50 + tilt.ny * 50 : 50;

  return (
    <div style={{ perspective: 900 }}>
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        onClick={onUpsell}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onUpsell();
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`text-left cursor-pointer relative ${rubikClassName}`}
        style={{
          width: 200,
          background: GRADIENT_PRIVATE_CARD,
          borderRadius: CARD_RADIUS,
          padding: 12,
          boxShadow: tilt
            ? '0 24px 48px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0px 1.93px 7.71px rgba(255,255,255,0.25)'
            : '0px 4px 4px rgba(0,0,0,0.25), inset 0px 1.93px 7.71px rgba(255,255,255,0.25)',
          transform,
          transformStyle: 'preserve-3d',
          transition: tilt
            ? 'transform 80ms ease-out, box-shadow 200ms ease-out'
            : 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 380ms ease-out',
          willChange: 'transform',
          overflow: 'hidden',
        }}
      >
        {/* Holographic iridescent base layer — always on, subtle */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: CARD_RADIUS,
            background:
              'conic-gradient(from 180deg at 50% 50%, #FF2F8E 0deg, #A7D921 60deg, #2C67F6 140deg, #BA2553 220deg, #FEDD1E 300deg, #FF2F8E 360deg)',
            opacity: 0.08,
            mixBlendMode: 'color-dodge',
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'opacity 300ms ease-out',
          }}
        />

        {/* Iridescent hue layer that shifts with cursor */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: CARD_RADIUS,
            background: `conic-gradient(from ${holoAngle}deg at ${50 + (tilt?.nx ?? 0) * 30}% ${holoShift}%, rgba(255,47,142,0.35) 0deg, rgba(167,217,33,0.3) 90deg, rgba(44,103,246,0.35) 180deg, rgba(186,37,83,0.3) 270deg, rgba(255,47,142,0.35) 360deg)`,
            opacity: tilt ? 0.55 : 0,
            mixBlendMode: 'color-dodge',
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'opacity 200ms ease-out',
            filter: 'blur(6px)',
          }}
        />

        {/* Glossy sheen streak — diagonal shine that sweeps across */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: CARD_RADIUS,
            background: `linear-gradient(${115 + (tilt?.nx ?? 0) * 30}deg, transparent 20%, rgba(255,255,255,${tilt ? 0.14 : 0.06}) 50%, transparent 80%)`,
            pointerEvents: 'none',
            zIndex: 2,
            transition: 'background 200ms ease-out',
          }}
        />

        {/* Border beam on top of all shine effects */}
        <BorderBeam
          radius={CARD_RADIUS}
          duration={6}
          borderWidth={1.5}
          colorFrom="#A7D921"
          colorTo="#FF2F8E"
          trailDegrees={90}
        />

        {/* Cursor-tracking spotlight */}
        {tilt && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: CARD_RADIUS,
              background: `radial-gradient(180px circle at ${tilt.glowX}% ${tilt.glowY}%, rgba(255,255,255,0.18), transparent 55%)`,
              pointerEvents: 'none',
              zIndex: 2,
              mixBlendMode: 'overlay',
            }}
          />
        )}

        {/* Avatar portrait */}
        <div
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 10,
            width: 176,
            height: 176,
            position: 'relative',
            zIndex: 4,
            transform: 'translateZ(22px)',
          }}
        >
          <Avatar2D avatarUrl={avatarUrl} displayName={displayName} />
        </div>

        {/* Name — Syne 700, 24px */}
        <div
          className={syneClassName}
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: '1.2em',
            marginBottom: 2,
            position: 'relative',
            zIndex: 4,
            transform: 'translateZ(14px)',
          }}
        >
          {displayName}
        </div>
        {/* Subtitle */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: '0.01em',
            position: 'relative',
            zIndex: 4,
            transform: 'translateZ(10px)',
          }}
        >
          Citizen of Zo World
        </div>
      </div>
    </div>
  );
}
