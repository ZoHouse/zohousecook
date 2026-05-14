import { useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { MeshGradient } from '@paper-design/shaders-react';
import { BorderBeam } from './BorderBeam';
import { rubikClassName, syneClassName } from '../utils/font';

export interface BagHeroProps {
  /** Total earned stamps across all layers — rendered as a small counter. */
  earnedCount?: number;
  onClick?: () => void;
  onShare?: () => void;
}

// Same hologram palette as CitizenCard so the bag belongs in the same room.
const HOLOGRAM_COLORS = ['#0051FF', '#4DFF00', '#FFE500', '#FF6F00', '#0051FF'];

const GRADIENT_BAG_BG = 'linear-gradient(180deg, #292929 0%, #000000 100%)';
const CARD_RADIUS = 20;
const MAX_TILT = 10;
const HOVER_LIFT = 8;

/**
 * Placeholder bag hero — sits on the lobby pedestal in place of CitizenCard.
 * Same 200px footprint + hologram shader + border beam as the citizen card so
 * the badges page reads as the same room as the lobby. Final bag art (canvas
 * duffel / leather satchel / sticker album) replaces the central SVG later.
 */
export function BagHero({ earnedCount, onClick, onShare }: BagHeroProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState<{
    rx: number;
    ry: number;
    glowX: number;
    glowY: number;
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
    const dx = (x - centerX) / centerX;
    const dy = (y - centerY) / centerY;
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

  const interactive = !!onClick;

  return (
    <div style={{ perspective: 900 }}>
      <div
        ref={cardRef}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => {
          if (!interactive) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`text-left relative ${rubikClassName} ${interactive ? 'cursor-pointer' : ''}`}
        style={{
          width: 200,
          background: GRADIENT_BAG_BG,
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
        {/* Hologram shader — same foil as the citizen card */}
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

        {/* Cursor-reactive sheen streak */}
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

        <BorderBeam
          radius={CARD_RADIUS}
          duration={6}
          borderWidth={1.5}
          colorFrom="#A7D921"
          colorTo="#FF2F8E"
          trailDegrees={90}
        />

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

        {onShare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            aria-label="Share badges"
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

        {/* Bag art — placeholder SVG. Replace later with final bag illustration. */}
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
            background:
              'radial-gradient(circle at 50% 35%, #3A2A1C 0%, #1A0F08 70%, #0A0604 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Stamp bag (placeholder)"
        >
          {/* Stylised duffel — strap, body, side pockets. Single-color line art
              tinted with a soft amber glow so it reads from across the page. */}
          <svg
            width="128"
            height="128"
            viewBox="0 0 128 128"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
            style={{ filter: 'drop-shadow(0 6px 14px rgba(255,170,80,0.35))' }}
          >
            {/* Strap */}
            <path
              d="M30 38 C 40 22, 88 22, 98 38"
              stroke="#E0B07A"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            {/* Body */}
            <rect
              x="18"
              y="38"
              width="92"
              height="60"
              rx="14"
              fill="#C28148"
              stroke="#F2C58A"
              strokeWidth="2.5"
            />
            {/* Mid-seam */}
            <line
              x1="22"
              y1="68"
              x2="106"
              y2="68"
              stroke="#8E5A2F"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Side pocket left */}
            <path
              d="M28 50 v 36 a 4 4 0 0 0 4 4 h 14 a 4 4 0 0 0 4 -4 v -36 z"
              fill="#A86A38"
              stroke="#F2C58A"
              strokeWidth="2"
            />
            {/* Side pocket right */}
            <path
              d="M78 50 v 36 a 4 4 0 0 0 4 4 h 14 a 4 4 0 0 0 4 -4 v -36 z"
              fill="#A86A38"
              stroke="#F2C58A"
              strokeWidth="2"
            />
            {/* Zip pull */}
            <circle cx="64" cy="68" r="3" fill="#F2C58A" />
            {/* Tag */}
            <path
              d="M58 96 l 12 0 l -2 8 l -8 0 z"
              fill="#F2C58A"
              opacity="0.85"
            />
          </svg>
        </div>

        {/* Label — Syne 700, matches CitizenCard typography */}
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
          My Bag
        </div>
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
          {typeof earnedCount === 'number' && earnedCount > 0
            ? `${earnedCount} stamp${earnedCount === 1 ? '' : 's'} collected`
            : 'Your stamps live here'}
        </div>
      </div>
    </div>
  );
}
