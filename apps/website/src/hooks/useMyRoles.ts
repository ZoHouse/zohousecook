import { useQuery } from 'react-query';

// Map API role slugs to display names for passport
const ROLE_DISPLAY: Record<string, string> = {
  'owner': 'Owner',
  'cas-admin': 'Admin',
  'zo-hq': 'HQ',
  'vibe-manager': 'Vibe Curator',
  'property-manager': 'Property Manager',
  'activity-manager': 'Activity Manager',
  'front-desk-manager': 'Front Desk',
  'housekeeping-admin': 'Housekeeping Lead',
  'housekeeping-staff': 'Housekeeping',
  'creator': 'Creator',
  'tribemaker': 'Tribemaker',
  'trip-captain': 'Trip Captain',
};

// Roles to show on passport (skip internal/system roles)
const PASSPORT_VISIBLE_ROLES = new Set([
  'owner', 'zo-hq', 'vibe-manager', 'property-manager',
  'activity-manager', 'front-desk-manager',
  'housekeeping-admin', 'housekeeping-staff',
  'creator', 'tribemaker', 'trip-captain',
]);

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zo-admin-token') || localStorage.getItem('zo-web-token') || null;
}

async function fetchMyRoles(): Promise<string[]> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

  // Forward device headers required by Zo API
  const deviceId = localStorage.getItem('zo-admin-device-id') || localStorage.getItem('zo-web-device-id') || '';
  const deviceSecret = localStorage.getItem('zo-admin-device-secret') || localStorage.getItem('zo-web-device-secret') || '';
  if (deviceId) headers['client-device-id'] = deviceId;
  if (deviceSecret) headers['client-device-secret'] = deviceSecret;
  if (process.env.APP_ID) headers['client-key'] = process.env.APP_ID;

  const res = await fetch('/api/my-roles', { headers });
  if (!res.ok) throw new Error('Failed to fetch roles');
  const data = await res.json();
  return data.roles || [];
}

export interface UserRoleInfo {
  /** Raw role slugs from API */
  slugs: string[];
  /** Display names for passport-visible roles */
  displayNames: string[];
  /** Check if user has a specific role */
  hasRole: (slug: string) => boolean;
}

export function useMyRoles(): { roles: UserRoleInfo | null; isLoading: boolean } {
  const { data: slugs, isLoading } = useQuery<string[]>(
    ['my-roles'],
    fetchMyRoles,
    {
      enabled: !!getToken(),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  if (!slugs) return { roles: null, isLoading };

  const displayNames = slugs
    .filter((s) => PASSPORT_VISIBLE_ROLES.has(s))
    .map((s) => ROLE_DISPLAY[s] || s);

  return {
    roles: {
      slugs,
      displayNames,
      hasRole: (slug: string) => slugs.includes(slug),
    },
    isLoading,
  };
}
