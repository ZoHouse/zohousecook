import { rubikClassName } from '../utils/font';

export interface StreakPillProps {
  /** Current streak in days. Zero or undefined hides the pill. */
  current?: number;
  /** Freeze tokens available. Shown as a small tick next to the flame when > 0. */
  freezeTokens?: number;
  onClick?: () => void;
}

/**
 * Daily streak indicator for the lobby HUD. Flame emoji + day count,
 * sibling to RankPill in the TopBar. Hidden when current is 0 or undefined,
 * so prod (no streak in v1 profile) stays visually unchanged.
 */
export function StreakPill({ current, freezeTokens = 0, onClick }: StreakPillProps) {
  if (!current || current <= 0) return null;

  const interactive = !!onClick;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      aria-label={`${current}-day streak${freezeTokens > 0 ? `, ${freezeTokens} freeze available` : ''}`}
      className={`${rubikClassName} flex items-center ${interactive ? 'cursor-pointer active:scale-[0.97] transition-transform' : 'cursor-default'}`}
      style={{
        gap: 6,
        padding: '6px 10px',
        borderRadius: 999,
        background: 'linear-gradient(180deg, rgba(40,40,40,0.85) 0%, rgba(20,20,20,0.85) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: '#FFFFFF',
      }}
    >
      <span aria-hidden style={{ fontSize: 14, lineHeight: 1 }}>🔥</span>
      <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {current}
      </span>
      {freezeTokens > 0 && (
        <span
          aria-hidden
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: '#5ACBFF',
            marginLeft: 2,
          }}
          title={`${freezeTokens} freeze token${freezeTokens === 1 ? '' : 's'}`}
        >
          ❄ {freezeTokens}
        </span>
      )}
    </button>
  );
}
