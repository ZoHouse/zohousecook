import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import type { CSSProperties } from 'react';
import { Warp } from '@paper-design/shaders-react';
import type { ProUpsellFeature } from '../pro';
import { rubikClassName } from '../utils/font';
import tripperIcon from '../../assets/passport-lobby/cards/tripper-icon.svg';
import creatorIcon from '../../assets/passport-lobby/cards/creator-icon.svg';
import tribeBuilderIcon from '../../assets/passport-lobby/cards/tribe-builder-icon.svg';

export interface PassesDockProps { onUpsell: (feature: ProUpsellFeature) => void }

interface TierTile {
  feature: ProUpsellFeature | null; // null = disabled (Coming Soon)
  label: string;
  icon: StaticImageData;
  level?: number;
  xpText?: string;
  comingSoonText?: string;
  cardBg: string; // fallback during shader mount
  shaderColors: string[]; // samurai-fx Liquid Gradient palette for this tier
  shaderPositions: number; // seed (0-100) that rotates spot placement per card
  glowBg: string;
  glowBlur: number;
  labelFill: string;
  levelFill?: string;
  barFill?: string;
  barPct?: number;
}

const TILES: TierTile[] = [
  {
    feature: 'tripper-tier',
    label: 'Tripper',
    icon: tripperIcon,
    level: 6,
    xpText: '1200/2300 XP',
    cardBg: 'linear-gradient(180deg, #0D4DFF 0%, #01184B 100%)',
    shaderColors: ['#2F6BE8', '#5A9BFF'],
    shaderPositions: 42,
    glowBg: 'linear-gradient(180deg, rgba(71,148,255,1) 18%, rgba(201,219,255,0.6) 71%)',
    glowBlur: 96,
    labelFill: '#05143a',
    levelFill: '#05143a',
    barFill: 'linear-gradient(-31deg, #D1E2FF 0%, #81B0F7 30%, #307FF5 100%)',
    barPct: 26,
  },
  {
    feature: 'creator-tier',
    label: 'Creator',
    icon: creatorIcon,
    level: 1,
    xpText: 'LV 0 • XP 0',
    cardBg: 'linear-gradient(180deg, #33005B 0%, #10001D 100%)',
    shaderColors: ['#8A26C2', '#C26BE8'],
    shaderPositions: 67,
    glowBg: 'linear-gradient(180deg, rgba(149,13,255,1) 18%, rgba(212,156,255,0.3) 53%)',
    glowBlur: 160,
    labelFill: '#1a0033',
    levelFill: '#1a0033',
    barFill: 'linear-gradient(-31deg, #EED1FF 0%, #D481F7 30%, #B330F5 100%)',
    barPct: 26,
  },
  {
    feature: 'tribe-builder-tier',
    label: 'Tribe Builder',
    icon: tribeBuilderIcon,
    level: 2,
    xpText: '1200/2300 XP',
    cardBg: 'linear-gradient(180deg, #FF0DC2 0%, #4B0137 100%)',
    shaderColors: ['#E61AA3', '#FF66C4'],
    shaderPositions: 23,
    glowBg: 'linear-gradient(180deg, rgba(255,71,215,1) 18%, rgba(255,201,246,0.6) 71%)',
    glowBlur: 96,
    labelFill: '#2b001f',
    levelFill: '#2b001f',
    barFill: 'linear-gradient(-31deg, #FFD1FD 0%, #F381F7 30%, #F530EB 100%)',
    barPct: 26,
  },
];

const CARD_SHADOW = '0 4px 4px rgba(0,0,0,0.25), inset 0 2px 8px rgba(255,255,255,0.25)';

// 3D-embossed dark text on colored surface: white top-edge highlight (catches
// the "light from above"), plus a subtle dark inner shadow for depth.
const EMBOSS_LABEL = 'drop-shadow(0 1px 0 rgba(255,255,255,0.55)) drop-shadow(0 -1px 0 rgba(255,255,255,0.25))';
const EMBOSS_LEVEL = 'drop-shadow(0 2px 0 rgba(255,255,255,0.6)) drop-shadow(0 -1px 0 rgba(255,255,255,0.2)) drop-shadow(0 3px 6px rgba(0,0,0,0.25))';
const EMBOSS_META = 'drop-shadow(0 1px 0 rgba(255,255,255,0.45))';

function gradientText(fill: string): CSSProperties {
  if (!fill.startsWith('linear-gradient') && !fill.startsWith('radial-gradient')) {
    return { color: fill };
  }
  return {
    backgroundImage: fill,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent',
  };
}

function TierCard({ tile, onUpsell }: { tile: TierTile; onUpsell: PassesDockProps['onUpsell'] }) {
  const disabled = !tile.feature;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : () => onUpsell(tile.feature as ProUpsellFeature)}
      aria-label={disabled ? `${tile.label} — Coming Soon` : `${tile.label} tier`}
      className={`relative overflow-hidden text-left flex flex-col gap-6 w-full md:w-[185px] p-4 ${
        disabled ? 'cursor-default' : 'transition-all hover:-translate-y-0.5 active:scale-95'
      }`}
      style={{
        background: tile.cardBg,
        borderRadius: 16,
        boxShadow: CARD_SHADOW,
        isolation: 'isolate',
      }}
    >
      <Warp
        colors={tile.shaderColors}
        shape="stripes"
        shapeScale={0.35}
        distortion={0.38}
        swirl={0.1}
        swirlIterations={3}
        proportion={0.55}
        softness={0.6}
        speed={0.3}
        scale={0.9}
        rotation={-77}
        fit="cover"
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />

      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: -24,
          top: -34,
          width: 128,
          height: 128,
          background: tile.glowBg,
          filter: `blur(${tile.glowBlur}px)`,
          zIndex: 1,
        }}
      />

      <div className="relative z-[2]" style={{ width: 48, height: 48 }}>
        <Image src={tile.icon} alt="" width={48} height={48} style={{ width: 48, height: 48 }} />
      </div>

      <div className="relative z-[2] flex flex-col gap-2">
        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                lineHeight: '1.185em',
                letterSpacing: '0.02em',
                filter: EMBOSS_LABEL,
                ...gradientText(tile.labelFill),
              }}
            >
              {tile.label}
            </span>
            {tile.level !== undefined && tile.levelFill && (
              <div className="flex items-baseline gap-1" style={{ filter: EMBOSS_LEVEL }}>
                <span
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    lineHeight: '1.375em',
                    ...gradientText(tile.levelFill),
                  }}
                >
                  {tile.level}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: '1.185em',
                    ...gradientText(tile.levelFill),
                  }}
                >
                  LV
                </span>
              </div>
            )}
          </div>
          {(tile.xpText || tile.comingSoonText) && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                lineHeight: '1.5em',
                letterSpacing: '0.04em',
                color: tile.labelFill,
                opacity: 0.85,
                textAlign: 'right',
                whiteSpace: 'nowrap',
                filter: EMBOSS_META,
              }}
            >
              {tile.xpText ?? tile.comingSoonText}
            </span>
          )}
        </div>
        {tile.barFill && tile.barPct !== undefined && (
          <div
            style={{
              height: 8,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 100,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${tile.barPct}%`,
                background: tile.barFill,
                borderRadius: 100,
              }}
            />
          </div>
        )}
      </div>
    </button>
  );
}

function MobileTierButton({ tile, onUpsell }: { tile: TierTile; onUpsell: PassesDockProps['onUpsell'] }) {
  const disabled = !tile.feature;
  const accent = tile.shaderColors[1] ?? tile.shaderColors[0];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : () => onUpsell(tile.feature as ProUpsellFeature)}
      aria-label={disabled ? `${tile.label} — Coming Soon` : `${tile.label} tier`}
      className="flex-1 flex flex-col items-center gap-1 py-3.5 px-2 transition-all active:scale-95 disabled:opacity-50"
      style={{
        background: tile.cardBg,
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: `0 4px 14px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.28)`,
      }}
    >
      <Image src={tile.icon} alt="" width={40} height={40} style={{ width: 40, height: 40, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.02em',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {tile.label}
      </span>
      {tile.level !== undefined && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.04em',
            textShadow: '0 1px 2px rgba(0,0,0,0.55)',
          }}
        >
          LV {tile.level}
        </span>
      )}
    </button>
  );
}

function MobileTierNav({ onUpsell }: PassesDockProps) {
  return (
    <nav
      aria-label="Tier progression"
      className={`${rubikClassName} fixed bottom-0 left-0 right-0 z-[15] md:hidden`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className="mb-3 flex items-center justify-between gap-2.5 p-2.5"
        style={{
          background: '#0d0d10',
          borderRadius: 26,
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 10px 32px rgba(0,0,0,0.75)',
          // Landscape notched phones: keep the dock clear of the left/right safe-area insets (min 12px to match mx-3).
          marginLeft: 'max(12px, env(safe-area-inset-left, 12px))',
          marginRight: 'max(12px, env(safe-area-inset-right, 12px))',
        }}
      >
        {TILES.map((tile) => (
          <MobileTierButton key={tile.label} tile={tile} onUpsell={onUpsell} />
        ))}
      </div>
    </nav>
  );
}

export function PassesDock({ onUpsell }: PassesDockProps) {
  return (
    <>
      {/* Mobile: floating bottom nav with 3 tier buttons */}
      <MobileTierNav onUpsell={onUpsell} />

      {/* Desktop: full tier cards, centered at bottom */}
      <div
        className={`${rubikClassName} hidden md:fixed md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:px-0 md:py-0 md:z-[15] md:block`}
      >
        <div className="flex flex-row gap-[21px]">
          {TILES.map((tile) => (
            <TierCard key={tile.label} tile={tile} onUpsell={onUpsell} />
          ))}
        </div>
      </div>
    </>
  );
}
