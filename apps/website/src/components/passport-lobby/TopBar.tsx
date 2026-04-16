import { XpPill } from './XpPill';
import { RankPill } from './RankPill';

export interface TopBarProps { xp: number; rank: number; avatarUrl?: string }

export function TopBar({ xp, rank, avatarUrl }: TopBarProps) {
  return (
    <header className="flex justify-between items-center px-5 pt-4 pb-3 relative z-10">
      <XpPill value={xp} />
      <RankPill rank={rank} avatarUrl={avatarUrl} />
    </header>
  );
}
