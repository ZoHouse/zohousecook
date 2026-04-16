import { RankPill } from './RankPill';

export interface TopBarProps {
  xp: number;
  rank: number;
  avatarUrl?: string;
  onOpenSettings?: () => void;
}

export function TopBar({ xp, rank, avatarUrl, onOpenSettings }: TopBarProps) {
  return (
    <header className="flex justify-end items-center px-5 pt-4 pb-3 md:fixed md:top-6 md:right-6 md:px-0 md:py-0 md:z-[20]">
      <RankPill rank={rank} xp={xp} avatarUrl={avatarUrl} onClick={onOpenSettings} />
    </header>
  );
}
