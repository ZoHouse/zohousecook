import { useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { MeshGradient } from '@paper-design/shaders-react';
import { Avatar2D } from './Avatar2D';
import { BorderBeam } from './BorderBeam';
import { rubikClassName, syneClassName } from '../utils/font';

// Samurai FX #01 — Hologram. Holographic foil, premium but playful.
// Framer "Liquid Gradient" params mapped to paper-shaders' MeshGradient.
const HOLOGRAM_COLORS = ['#0051FF', '#4DFF00', '#FFE500', '#FF6F00', '#0051FF'];

export interface CitizenCardProps {
  handle: string;
  displayName: string;
  avatarUrl?: string;
  /** Kept in the interface for future binding; not rendered in the current card. */
  xpTotal?: number;
  /** Kept in the interface for future binding; not rendered in the current card. */
  rankTitle?: string;
  onUpsell: () => void;
  onShare?: () => void;
}

const GRADIENT_PRIVATE_CARD = 'linear-gradient(180deg, #292929 0%, #000000 100%)';
const CARD_RADIUS = 20;
const MAX_TILT = 10; // degrees
const HOVER_LIFT = 8; // translateZ

export function CitizenCard({ handle, displayName, avatarUrl, onUpsell, onShare }: CitizenCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState<{
    rx: number;
    ry: number;
    glowX: number;
    glowY: number;
    /** -1 → 1 horizontal, used to angle the sheen streak */
    nx: number;
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
    });
  };

  const handleMouseLeave = () => setTilt(null);

  const transform = tilt
    ? `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(${HOVER_LIFT}px)`
    : 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)';

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
        {/* Hologram shader background — holographic foil */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: CARD_RADIUS,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <MeshGradient
            colors={HOLOGRAM_COLORS}
            speed={0.6}
            scale={1.4}
            distortion={0.6}
            swirl={0.55}
            grainMixer={0.05}
            grainOverlay={0.08}
            fit="cover"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Cursor-reactive glossy sheen streak */}
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
            mixBlendMode: 'overlay',
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

        {/* Share button — top-right corner. Visible chrome 30×30; transparent hit area padded to 44×44. */}
        {onShare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            aria-label="Share profile"
            className="absolute z-10 flex items-center justify-center active:scale-90 transition-transform"
            style={{
              top: 6,
              right: 6,
              width: 44,
              height: 44,
              background: 'transparent',
              border: 'none',
              padding: 0,
              transform: 'translateZ(30px)',
            }}
          >
            <span
              aria-hidden
              className="flex items-center justify-center transition-colors hover:bg-white/20"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Classic "share" icon — three nodes (top-right, bottom-right, left) connected by two lines */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </span>
          </button>
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
            color: '#0A0A0A',
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
            fontWeight: 500,
            color: 'rgba(0,0,0,0.7)',
            letterSpacing: '0.01em',
            position: 'relative',
            zIndex: 4,
            transform: 'translateZ(10px)',
            whiteSpace: 'nowrap',
          }}
        >
          Citizen of Zo World
        </div>
      </div>
    </div>
  );
}
