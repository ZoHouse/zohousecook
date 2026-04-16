import { XpPill } from './XpPill';
import { RankPill } from './RankPill';

export interface TopBarProps { xp: number; rank: number; avatarUrl?: string }

export function TopBar({ xp, rank, avatarUrl }: TopBarProps) {
  return (
    <header className="flex justify-between items-center px-4 pt-4 pb-2 relative z-10">
      <XpPill value={xp} />
      <RankPill rank={rank} avatarUrl={avatarUrl} />
    </header>
  );
}
