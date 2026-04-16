import { RankPill } from './RankPill';

export interface TopBarProps {
  xp: number;
  rank: number;
  avatarUrl?: string;
  onOpenSettings?: () => void;
}

export function TopBar({ xp, rank, avatarUrl, onOpenSettings }: TopBarProps) {
  return (
    <header className="flex justify-end items-center px-5 pt-4 pb-3 relative z-10">
      <RankPill rank={rank} xp={xp} avatarUrl={avatarUrl} onClick={onOpenSettings} />
    </header>
  );
}
