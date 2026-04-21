import { rubikClassName } from '../utils/font';

export interface SeasonLevelBarProps {
  /** Current season level, 1-100. Defaults to 1 if profile hasn't loaded or
   *  backend doesn't yet expose season_level. */
  level?: number;
  /** XP accumulated within the current level. */
  xpInLevel?: number;
  /** Season key for the pill, e.g. "S1". Falls back to generic label. */
  seasonKey?: string;
  /** Optional level curve from /passport/season/current/. Index i holds the
   *  cumulative XP needed to reach level i+1. When absent, a simple default
   *  of 1000 XP per level is used so the bar demos correctly locally. */
  levelCurve?: number[];
  /** Optional rank title (e.g. "Wanderer") shown next to the level label. */
  rankTitle?: string | null;
}

const DEFAULT_XP_PER_LEVEL = 1000;

function xpForNextLevel(level: number, curve?: number[]): number {
  if (curve && curve.length > level) {
    return curve[level];
  }
  return DEFAULT_XP_PER_LEVEL;
}

/**
 * Season XP meter showing L1-L100 progression. Uses profile.season_level +
 * profile.season_xp, plus an optional level_curve from /passport/season/current/.
 * Renders a small filled bar with the level label, rank title, and a
 * "XP / XP-to-next" readout. Safe to render without any data (defaults to L1
 * with empty bar).
 */
export function SeasonLevelBar({
  level = 1,
  xpInLevel = 0,
  seasonKey,
  levelCurve,
  rankTitle,
}: SeasonLevelBarProps) {
  const target = xpForNextLevel(level, levelCurve);
  const clampedXp = Math.max(0, Math.min(xpInLevel, target));
  const pct = target > 0 ? (clampedXp / target) * 100 : 0;
  const label = seasonKey ? seasonKey.toUpperCase() : 'Season';

  return (
    <div
      className={`${rubikClassName} flex flex-col`}
      style={{
        gap: 6,
        padding: '10px 12px',
        borderRadius: 12,
        background: 'rgba(15, 8, 22, 0.72)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#FEDD1E',
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#FFFFFF',
            }}
          >
            Level {level}
          </span>
          {rankTitle && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              · {rankTitle}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.65)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {Math.round(clampedXp).toLocaleString()} / {Math.round(target).toLocaleString()} XP
        </span>
      </div>
      <div
        aria-hidden
        style={{
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #A7D921 0%, #FEDD1E 100%)',
            borderRadius: 2,
            transition: 'width 300ms ease',
          }}
        />
      </div>
    </div>
  );
}
