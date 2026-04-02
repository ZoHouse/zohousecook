import { useQuery } from 'react-query';
import { useLeaderboard } from './useLeaderboard';
import { useProfile } from '@zo/auth';

export interface MyXpData {
  xp: number;
  rank: number | null;
  rankTitle: string;
  city: string | null;
  createdAt: string | null;
  tribeMembers?: string[];
  stats: {
    nights: number;
    destinations: number;
    properties: number;
    tribe: number;
  };
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zo-admin-token') || localStorage.getItem('zo-web-token') || null;
}

/**
 * Returns the current user's XP, rank, rank title, and travel stats.
 * Fetches from /api/my-stats using phone/nickname from profile.
 */
export function useMyXp() {
  const { profile, isLoading: profileLoading } = useProfile();

  // Build a stable lookup key from profile
  const phone = profile?.mobile_number || '';
  const nickname = profile?.nickname || profile?.custom_nickname || '';
  const userId = profile?.code || '';
  const lookupKey = userId || phone || nickname;

  const { data: stats, isLoading: statsLoading } = useQuery<MyXpData>(
    ['my-stats', lookupKey],
    async () => {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      if (phone) params.set('phone', phone);
      if (nickname) params.set('nickname', nickname);

      const res = await fetch(`/dashboard/api/my-stats?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    {
      enabled: !!getToken() && !!lookupKey,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Also check leaderboard for rank position
  const { data: leaderboard } = useLeaderboard('global');

  let myXp: MyXpData | null = stats || null;

  // If we found ourselves in the leaderboard, use that rank
  if (myXp && leaderboard?.leaderboard && userId) {
    const entry = leaderboard.leaderboard.find((e) => e.userId === userId);
    if (entry) {
      myXp = { ...myXp, rank: entry.rank };
    }
  }

  return { myXp, isLoading: profileLoading || statsLoading };
}
