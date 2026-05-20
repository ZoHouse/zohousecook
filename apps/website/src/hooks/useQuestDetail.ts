import { AxiosError } from 'axios';
import { useQuery } from 'react-query';
import { useAuth } from '@zo/auth';
import { zoServer } from '../../../../libs/auth/src/utils';
import { type Quest } from '../data/quests';

export interface UseQuestDetailResult {
  quest: Quest | null;
  isLoading: boolean;
  isNotFound: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Reads a single quest by slug:
 *   GET /api/v1/passport/quests/<slug>/
 *
 * Returns the same shape as a list-item from useQuests today — the staging
 * serializer doesn't include extra fields on the detail endpoint. The hook
 * exists so shareable URLs (`/@handle/quests/<slug>`) can fetch directly
 * without forcing the user to land via the list page first.
 *
 * 404 + 5xx fall through to `quest: null` and `isNotFound: true` so the page
 * can render a not-found / empty state instead of throwing.
 */
export function useQuestDetail(slug: string | undefined | null): UseQuestDetailResult {
  const { isLoggedIn } = useAuth();

  const query = useQuery<Quest | null>(
    ['passport', 'quests', 'detail', slug ?? ''],
    async () => {
      if (!slug) return null;
      try {
        const res = await zoServer.get<Quest>(`/api/v1/passport/quests/${slug}/`);
        return res.data;
      } catch (e) {
        if (e instanceof AxiosError) {
          const s = e.response?.status ?? 0;
          if (s === 404 || (s >= 500 && s < 600)) return null;
        }
        throw e;
      }
    },
    {
      enabled: isLoggedIn === true && !!slug,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  return {
    quest: query.data ?? null,
    isLoading: query.isLoading,
    isNotFound: !query.isLoading && query.data === null && !!slug,
    error: query.error,
    refetch: query.refetch,
  };
}
