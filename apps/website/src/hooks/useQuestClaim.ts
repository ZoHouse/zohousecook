import { useMutation, useQueryClient } from "react-query";
import { zoServer } from "../../../../libs/auth/src/utils";

export interface QuestClaimInput {
  reward: string;
}

// Drives POST /api/v1/passport/quests/<slug>/claims/. The server gates on
// participation.status == RESULTS_DECLARED + an open claim_expires_at window,
// and looks up the matching PENDING QuestRewardClaim by (participation,
// reward_id). 404s on already-claimed or wrong-status rewards.
export function useQuestClaim(slug: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation(async (input: QuestClaimInput) => {
    if (!slug) throw new Error("Quest slug missing");
    const res = await zoServer.post(
      `/api/v1/passport/quests/${encodeURIComponent(slug)}/claims/`,
      { reward: input.reward },
    );
    return res.data;
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries(["passport", "quests"]);
    },
  });
}
