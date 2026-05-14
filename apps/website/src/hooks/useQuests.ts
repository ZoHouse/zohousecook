import { AxiosError } from 'axios';
import { useQuery } from 'react-query';
import { useAuth } from '@zo/auth';
// zoServer lives in libs/auth/src/utils.ts — same relative import the rest of
// the passport hooks use (see useTodayQuests, usePassportProfile, useSeason).
import { zoServer } from '../../../../libs/auth/src/utils';
import {
  MOCK_QUESTS_RESPONSE,
  type Quest,
  type QuestsListResponse,
} from '../data/mock-quests';

// While the staging quest endpoint hasn't shipped to prod, return the mock.
// Flip to false (or read an env flag) once /api/v1/passport/quests/ is live.
const USE_MOCK = true;

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
 * Relationship to useTodayQuests:
 *   - useTodayQuests reads /api/v1/passport/quests/today/ — the "live for me
 *     right now" slice (Daya's Game-of-Life v2 bundle).
 *   - useQuests reads the broader assigned set, including future/past windows.
 *   - Both are part of the same quest system. The dock can merge or filter.
 */
export function useQuests(): UseQuestsResult {
  const { isLoggedIn } = useAuth();

  const query = useQuery<QuestsListResponse | null>(
    ['passport', 'quests', 'all'],
    async () => {
      if (USE_MOCK) return MOCK_QUESTS_RESPONSE;
      try {
        const res = await zoServer.get<QuestsListResponse>(
          '/api/v1/passport/quests/',
        );
        return res.data;
      } catch (e) {
        // Mirror useTodayQuests: pre-launch the endpoint 404s — keep the
        // console clean and let the UI render an empty state.
        if (e instanceof AxiosError && e.response?.status === 404) return null;
        throw e;
      }
    },
    {
      // In mock mode we don't need auth — keeps the dock usable while
      // designing. Once USE_MOCK flips, gate on isLoggedIn.
      enabled: USE_MOCK ? true : isLoggedIn === true,
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
