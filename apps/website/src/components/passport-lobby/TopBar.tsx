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
      className="fixed top-0 right-0 z-[20] flex justify-end items-center gap-2 pl-5 pr-5 pt-4 pb-3 md:top-6 md:right-6 md:p-0"
      style={{
        // Mobile: pad for notch / Dynamic Island so the rank pill clears the status bar in iOS standalone PWA mode.
        // Desktop resets padding via md:p-0 because md:top-6 / md:right-6 handle positioning.
        paddingTop: 'max(16px, calc(env(safe-area-inset-top, 0px) + 8px))',
        paddingRight: 'max(20px, env(safe-area-inset-right, 20px))',
      }}
    >
      <StreakPill current={streakCurrent} freezeTokens={streakFreezeTokens} />
      <RankPill rank={rank} xp={xp} avatarUrl={avatarUrl} onClick={onOpenSettings} />
    </header>
  );
}
