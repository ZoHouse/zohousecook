import { AxiosError } from 'axios';
import { useQuery } from 'react-query';
import { useAuth } from '@zo/auth';
// zoServer lives in libs/auth/src/utils.ts — same relative import the rest of
// the passport hooks use (see usePassportProfile, useSeason).
import { zoServer } from '../../../../libs/auth/src/utils';
import {
  type Quest,
  type QuestsListResponse,
} from '../data/quests';

export interface UseQuestsResult {
  quests: Quest[];
  count: number;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Reads the user-facing combined quest view:
 *   GET /api/v1/passport/quests/
 * which returns quest templates plus the viewer's nested participations[].
 *
 * This is the only quest read-hook. The TreasureChestCard's "today's loot"
 * slice is derived from this list on the caller side (e.g. top N by ends_at);
 * there is no separate `/today/` endpoint on the backend.
 */
export function useQuests(): UseQuestsResult {
  const { isLoggedIn } = useAuth();

  const query = useQuery<QuestsListResponse | null>(
    ['passport', 'quests', 'all'],
    async () => {
      try {
        const res = await zoServer.get<QuestsListResponse>(
          '/api/v1/passport/quests/',
        );
        return res.data;
      } catch (e) {
        // Tolerate both pre-launch 404 (route not mounted) and prod 500
        // (Daya's CAS endpoint currently crashes on main). UI renders the
        // empty state in both cases instead of throwing.
        if (e instanceof AxiosError) {
          const s = e.response?.status ?? 0;
          if (s === 404 || (s >= 500 && s < 600)) return null;
        }
        throw e;
      }
    },
    {
      // Only fetch when authed — the user-facing endpoint requires bearer +
      // device creds and filters to the caller's assigned participations.
      enabled: isLoggedIn === true,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  return {
    quests: query.data?.results ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
