import { AxiosError } from "axios";
import { useQuery } from "react-query";
import { useAuth } from "@zo/auth";
import { zoServer } from "../../../../libs/auth/src/utils";
import { type Quest, type QuestsListResponse } from "../data/quests";

export interface UseQuestRecommendationsResult {
  quests: Quest[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Reads the recommender's output:
 *   GET /api/v1/passport/quests/recommendations/
 *
 * Distinct from `useQuests` (which reads /quests/, scoped to existing
 * QuestParticipations). The recommender runs `Quest.recommendations.for_user`
 * — checks last_known_coordinates → home_coordinates, then surfaces stay,
 * trip, POI quests near the viewer. Returned quests have empty
 * `participations[]` until the viewer explicitly participates.
 *
 * Backend gates on `passport_unlocked_at` (400 "Passport not unlocked" if
 * the unlock hook hasn't fired) and caches per-user in Redis for 6 hours,
 * so this hook can refetch aggressively without backend load.
 */
export function useQuestRecommendations(): UseQuestRecommendationsResult {
  const { isLoggedIn } = useAuth();

  const query = useQuery<QuestsListResponse | null>(
    ["passport", "quests", "recommendations"],
    async () => {
      try {
        const res = await zoServer.get<QuestsListResponse>(
          "/api/v1/passport/quests/recommendations/",
        );
        return res.data;
      } catch (e) {
        // 400 = passport not unlocked yet (usePassportUnlock hasn't fired
        // or hasn't propagated). 404/5xx = endpoint not deployed yet.
        // In all cases degrade to empty list rather than throwing — the
        // lobby still renders the participated list and the empty state.
        if (e instanceof AxiosError) {
          const s = e.response?.status ?? 0;
          if (s === 400 || s === 404 || (s >= 500 && s < 600)) return null;
        }
        throw e;
      }
    },
    {
      enabled: isLoggedIn === true,
      // Backend caches 6h server-side. Frontend mirrors that so we don't
      // re-hit on every focus / tab switch.
      staleTime: 6 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  return {
    quests: query.data?.results ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
