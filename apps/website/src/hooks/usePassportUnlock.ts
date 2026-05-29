import { useEffect } from "react";
import { useAuth } from "@zo/auth";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { zoServer } from "../../../../libs/auth/src/utils";

export interface PassportUnlockState {
  passport_unlocked_at: string | null;
}

// Drives POST /api/v1/passport/unlocks/ on first lobby mount. The backend
// `quests/recommendations/` endpoint 400s with "Passport not unlocked" until
// this is set, so every owner needs the activation timestamp before any
// recommendations render. POST is idempotent server-side (first call sets the
// timestamp, subsequent calls return the existing one), and we self-fire only
// when GET confirms the field is null.
export function usePassportUnlock() {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["passport", "unlocks"];

  // Endpoint may not be deployed on every environment yet — 404 falls back to
  // `null`, which short-circuits the auto-unlock effect below (no point POSTing
  // if the route doesn't exist).
  const statusQuery = useQuery<PassportUnlockState | null>(
    queryKey,
    async () => {
      try {
        const res = await zoServer.get("/api/v1/passport/unlocks/");
        return res.data as PassportUnlockState;
      } catch (e) {
        if ((e as { response?: { status?: number } })?.response?.status === 404)
          return null;
        throw e;
      }
    },
    {
      enabled: isLoggedIn === true,
      staleTime: 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  const unlockMutation = useMutation<PassportUnlockState, unknown, void>(
    async () => {
      const res = await zoServer.post("/api/v1/passport/unlocks/");
      return res.data as PassportUnlockState;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(queryKey, data);
      },
    },
  );

  useEffect(() => {
    if (isLoggedIn !== true) return;
    if (!statusQuery.data) return;
    if (statusQuery.data.passport_unlocked_at) return;
    if (unlockMutation.isLoading || unlockMutation.isSuccess) return;
    unlockMutation.mutate();
  }, [isLoggedIn, statusQuery.data, unlockMutation]);

  return {
    unlockedAt: statusQuery.data?.passport_unlocked_at ?? null,
    isLoading: statusQuery.isLoading,
    isUnlocking: unlockMutation.isLoading,
  };
}
