import { RankPill } from './RankPill';
import { StreakPill } from './StreakPill';

export interface TopBarProps {
  xp: number;
  rank: number;
  avatarUrl?: string;
  onOpenSettings?: () => void;
  /** Current daily streak. Passed through to StreakPill, which hides itself
   *  when zero or undefined, so prod (no v2 streak yet) is visually unchanged. */
  streakCurrent?: number;
  streakFreezeTokens?: number;
}

export function TopBar({
  xp,
  rank,
  avatarUrl,
  onOpenSettings,
  streakCurrent,
  streakFreezeTokens,
}: TopBarProps) {
  return (
    <header
      className="flex justify-end items-center gap-2 px-5 pt-4 pb-3 md:fixed md:top-6 md:right-6 md:px-0 md:py-0 md:z-[20]"
      style={{
        // Mobile: pad for notch / Dynamic Island so the rank pill clears the status bar in iOS standalone PWA mode.
        // Desktop overrides with md:pt-0 via absolute positioning (md:top-6), so the inline style is harmless there.
        paddingTop: 'max(16px, calc(env(safe-area-inset-top, 0px) + 8px))',
        paddingRight: 'max(20px, env(safe-area-inset-right, 20px))',
      }}
    >
      <StreakPill current={streakCurrent} freezeTokens={streakFreezeTokens} />
      <RankPill rank={rank} xp={xp} avatarUrl={avatarUrl} onClick={onOpenSettings} />
    </header>
  );
}
