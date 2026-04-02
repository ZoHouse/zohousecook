import { useLeaderboard } from './useLeaderboard';
import { useProfile } from '@zo/auth';

export interface MyXpData {
  xp: number;
  rank: number;
  rankTitle: string;
  stats: {
    nights: number;
    destinations: number;
    properties: number;
    tribe: number;
  };
}

/**
 * Returns the current user's XP, rank, rank title, and travel stats.
 * Piggybacks on the global leaderboard query (cached 5 min).
 */
export function useMyXp() {
  const { data, isLoading } = useLeaderboard('global');
  const { profile } = useProfile();

  const userId = profile?.code;
  const entry = userId ? data?.leaderboard?.find((e) => e.userId === userId) : null;

  const myXp: MyXpData | null = entry
    ? {
        xp: entry.xp,
        rank: entry.rank,
        rankTitle: entry.rankTitle,
        stats: entry.stats,
      }
    : null;

  return { myXp, isLoading };
}
