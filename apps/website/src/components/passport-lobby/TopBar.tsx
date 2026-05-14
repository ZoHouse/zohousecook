import { RankPill } from './RankPill';
import { StreakPill } from './StreakPill';
import { NavMenuPill } from './NavMenuPill';

export interface TopBarProps {
  xp: number;
  rank: number;
  avatarUrl?: string;
  onOpenSettings?: () => void;
  /** Current daily streak. Passed through to StreakPill, which hides itself
   *  when zero or undefined, so prod (no v2 streak yet) is visually unchanged. */
  streakCurrent?: number;
  streakFreezeTokens?: number;
  /** User's @handle — drives sub-page routes (/@handle/quests, etc.) inside the nav menu */
  handle?: string;
  /** Opens the global map modal — wired into the nav menu's "Map" row */
  onOpenMap?: () => void;
  /** Hide the right-side nav-menu pill (e.g. public profile view, where citizen nav is irrelevant) */
  showNavMenu?: boolean;
}

export function TopBar({
  xp,
  rank,
  avatarUrl,
  onOpenSettings,
  streakCurrent,
  streakFreezeTokens,
  handle,
  onOpenMap,
  showNavMenu = true,
}: TopBarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-[20] flex justify-between items-center gap-2 px-5 pt-4 pb-3 md:top-6 md:left-6 md:right-6 md:p-0"
      style={{
        // Mobile: pad for notch / Dynamic Island so pills clear the status bar in iOS standalone PWA mode.
        // Desktop resets padding via md:p-0 because md:top-6 / md:left-6 / md:right-6 handle positioning.
        paddingTop: 'max(16px, calc(env(safe-area-inset-top, 0px) + 8px))',
        paddingLeft: 'max(20px, env(safe-area-inset-left, 20px))',
        paddingRight: 'max(20px, env(safe-area-inset-right, 20px))',
      }}
    >
      <div className="flex items-center gap-2">
        <RankPill rank={rank} xp={xp} avatarUrl={avatarUrl} onClick={onOpenSettings} />
        <StreakPill current={streakCurrent} freezeTokens={streakFreezeTokens} />
      </div>

      {showNavMenu && <NavMenuPill handle={handle} onOpenMap={onOpenMap} />}
    </header>
  );
}
