import { useQuery } from 'react-query';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  handle: string | null;
  xp: number;
  rankTitle: string;
  city: string | null;
  nationality: string | null;
  stats: {
    nights: number;
    destinations: number;
    properties: number;
    tribe: number;
  };
  isYou?: boolean;
}

export interface SeasonInfo {
  id: string;
  name: string;
  start: string;
  end: string;
}

interface LeaderboardResponse {
  scope: string;
  time: string;
  season: SeasonInfo | null;
  count: number;
  leaderboard: LeaderboardEntry[];
  groups?: Record<string, number>;
}

export type LeaderboardScope = 'global' | 'city' | 'country';
export type LeaderboardTime = 'all-time' | 'season';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zo-admin-token') || localStorage.getItem('zo-web-token') || null;
}

async function fetchLeaderboard(scope: LeaderboardScope, filter?: string, time?: LeaderboardTime): Promise<LeaderboardResponse> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  let url = `/dashboard/api/leaderboard?scope=${scope}`;
  if (filter) url += `&filter=${encodeURIComponent(filter)}`;
  if (time && time !== 'all-time') url += `&time=${time}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export function useLeaderboard(scope: LeaderboardScope = 'global', filter?: string, time?: LeaderboardTime) {
  return useQuery<LeaderboardResponse>(
    ['leaderboard', scope, filter, time],
    () => fetchLeaderboard(scope, filter, time),
    {
      enabled: !!getToken(),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );
}
