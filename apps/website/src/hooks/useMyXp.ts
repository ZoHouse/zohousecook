import { useQuery } from 'react-query';
import { useLeaderboard } from './useLeaderboard';
import { useProfile, useAuth } from '@zo/auth';

export interface MyXpData {
  xp: number;
  rank: number | null;
  rankTitle: string;
  city: string | null;
  createdAt: string | null;
  tribeMembers?: string[];
  destinationNames?: string[];
  zostelNames?: string[];
  tripDestinations?: string[];
  stats: {
    nights: number;
    destinations: number;
    properties: number;
    tribe: number;
    trips: number;
    tripNights: number;
  };
}

function getZoToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zo-admin-token') || localStorage.getItem('zo-web-token') || null;
}

function getDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zo-admin-device-id') || localStorage.getItem('zo-web-device-id') || null;
}

function getDeviceSecret(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zo-admin-device-secret') || localStorage.getItem('zo-web-device-secret') || null;
}

function getZostelToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zostel-token') || null;
}

function getZostelUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    // Try user object first
    const raw = localStorage.getItem('zostel-user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.user_id) return parsed.user_id;
    }
    // Decode user_id from JWT payload (the user object doesn't have it)
    const token = localStorage.getItem('zostel-token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload?.user_id) return payload.user_id;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns the current user's XP, rank, rank title, and travel stats.
 * Sends both Zo and Zostel tokens so the API can fetch from both services.
 */
export function useMyXp() {
  const { profile, isLoading: profileLoading } = useProfile();
  const { user } = useAuth();

  const userId = profile?.code || user?.id || '';
  const lookupKey = userId || profile?.mobile_number || user?.mobile_number || '';

  const { data: stats, isLoading: statsLoading } = useQuery<MyXpData>(
    ['my-stats', lookupKey],
    async () => {
      const zoToken = getZoToken();
      if (!zoToken) throw new Error('Not authenticated');

      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);

      const headers: Record<string, string> = {
        Authorization: `Bearer ${zoToken}`,
      };

      // Pass device credentials for Zo profile API
      const deviceId = getDeviceId();
      const deviceSecret = getDeviceSecret();
      if (deviceId) headers['client-device-id'] = deviceId;
      if (deviceSecret) headers['client-device-secret'] = deviceSecret;

      // Pass Zostel credentials for stay data
      const zostelToken = getZostelToken();
      const zostelUserId = getZostelUserId();
      if (zostelToken) headers['x-zostel-token'] = zostelToken;
      if (zostelUserId) headers['x-zostel-user-id'] = zostelUserId;

      const res = await fetch(`/api/my-stats?${params.toString()}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    {
      enabled: !!getZoToken() && !!lookupKey,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Check leaderboard for rank position
  const { data: leaderboard } = useLeaderboard('global');

  let myXp: MyXpData | null = stats || null;

  if (myXp && leaderboard?.leaderboard && userId) {
    const entry = leaderboard.leaderboard.find((e) => e.userId === userId);
    if (entry) {
      myXp = { ...myXp, rank: entry.rank };
    }
  }

  return { myXp, isLoading: profileLoading || statsLoading };
}
