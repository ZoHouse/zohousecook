import { useQuery } from 'react-query';

export interface WhereaboutsData {
  place_name: string;
  place_ref_id: string;
  location: { lat: number; long: number };
  created_at?: string;
  updated_at?: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zo-admin-token') || localStorage.getItem('zo-web-token') || null;
}

async function fetchMyWhereabouts(): Promise<WhereaboutsData | null> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

  const deviceId = localStorage.getItem('zo-admin-device-id') || localStorage.getItem('zo-web-device-id') || '';
  const deviceSecret = localStorage.getItem('zo-admin-device-secret') || localStorage.getItem('zo-web-device-secret') || '';
  if (deviceId) headers['client-device-id'] = deviceId;
  if (deviceSecret) headers['client-device-secret'] = deviceSecret;
  if (process.env.APP_ID) headers['client-key'] = process.env.APP_ID;

  const res = await fetch('/api/whereabouts', { headers });
  if (!res.ok) throw new Error('Failed to fetch whereabouts');
  return res.json();
}

export function useWhereabouts(): { whereabouts: WhereaboutsData | null; isLoading: boolean } {
  const { data, isLoading } = useQuery<WhereaboutsData | null>(
    ['my-whereabouts'],
    fetchMyWhereabouts,
    {
      enabled: !!getToken(),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  return { whereabouts: data ?? null, isLoading };
}
