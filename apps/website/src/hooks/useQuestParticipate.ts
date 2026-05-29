import { useMutation, useQueryClient } from "react-query";
import { zoServer } from "../../../../libs/auth/src/utils";

/**
 * Drives POST /api/v1/passport/quests/<slug>/participation/. Creates a
 * QuestParticipation row for the calling user against the named quest.
 *
 * Server response (`participation, created = quest.participate(user)`) is
 * idempotent — calling twice on the same quest returns the existing row,
 * not an error. Backend gates: quest.status must be ACTIVE, and the
 * quest's starts_at/ends_at window must include now.
 *
 * Used by the lobby when the viewer taps a *recommended* quest (one with
 * no participation yet). After this resolves the quest will start showing
 * up in `/api/v1/passport/quests/` too — so we invalidate the cache to
 * keep useQuests fresh.
 */
export function useQuestParticipate() {
  const queryClient = useQueryClient();

  return useMutation(
    async (slug: string) => {
      const res = await zoServer.post(
        `/api/v1/passport/quests/${encodeURIComponent(slug)}/participation/`,
      );
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["passport", "quests"]);
      },
    },
  );
}
