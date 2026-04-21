import { RankPill } from './RankPill';

export interface TopBarProps {
  xp: number;
  rank: number;
  avatarUrl?: string;
  onOpenSettings?: () => void;
}

export function TopBar({ xp, rank, avatarUrl, onOpenSettings }: TopBarProps) {
  return (
    <header
      className="flex justify-end items-center px-5 pt-4 pb-3 md:fixed md:top-6 md:right-6 md:px-0 md:py-0 md:z-[20]"
      style={{
        // Mobile: pad for notch / Dynamic Island so the rank pill clears the status bar in iOS standalone PWA mode.
        // Desktop overrides with md:pt-0 via absolute positioning (md:top-6), so the inline style is harmless there.
        paddingTop: 'max(16px, calc(env(safe-area-inset-top, 0px) + 8px))',
        paddingRight: 'max(20px, env(safe-area-inset-right, 20px))',
      }}
    >
      <RankPill rank={rank} xp={xp} avatarUrl={avatarUrl} onClick={onOpenSettings} />
    </header>
  );
}
