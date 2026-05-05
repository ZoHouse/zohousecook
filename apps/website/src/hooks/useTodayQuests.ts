import { AxiosError } from "axios";
import { useQuery } from "react-query";
import { useAuth } from "@zo/auth";
// zoServer lives in libs/auth/src/utils.ts alongside zoServer and
// zostelServer. It isn't re-exported via @zo/auth yet, so import via the
// same relative path usePassportProfile / useSeason use.
import { zoServer } from "../../../../libs/auth/src/utils";

export type QuestStatus =
  | "live"
  | "submitted"
  | "verified"
  | "rejected"
  | "expired"
  | "post_due"
  | "locked";

export interface QuestReward {
  type: "xp" | "bed_drop" | "discount" | "credit" | string;
  amount?: number;
  [key: string]: unknown;
}

export interface TodayQuest {
  user_quest_id: string;
  quest_id: string;
  name: string;
  description: string;
  cover_image: string | null;
  role_ids?: string[];
  role_names?: string[];
  culture_id?: string | null;
  journey_role?: "main" | "side" | string;
  cadence?: "daily" | "weekly" | string;
  rarity?: "common" | "rare" | "legendary" | string;
  difficulty?: "easy" | "medium" | "hard" | string;
  qualifying_actions?: string[];
  verification_method?: string;
  reward_pool?: {
    draw_method?: string;
    reward?: QuestReward;
  };
  live_at?: string;
  submission_deadline_at?: string;
  expires_at?: string;
  status: QuestStatus;
  tier_access?: "free_min" | "pro_only" | string;
  submitted_at?: string | null;
  submission_data?: Record<string, unknown> | null;
}

export interface TodayQuestsResponse {
  season: { key: string; name: string };
  date: string;
  quests: TodayQuest[];
}

export function useTodayQuests() {
  const { isLoggedIn } = useAuth();

  // Quests endpoint is part of Daya's Game-of-Life v2 bundle. Until ship,
  // 404 is the steady state — swallow + don't retry to keep console clean.
  const query = useQuery<TodayQuestsResponse | null>(
    ["passport", "quests", "today"],
    async () => {
      try {
        const res = await zoServer.get<TodayQuestsResponse>(
          "/api/v1/passport/quests/today/",
        );
        return res.data;
      } catch (e) {
        if (e instanceof AxiosError && e.response?.status === 404) return null;
        throw e;
      }
    },
    {
      enabled: isLoggedIn === true,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  return {
    season: query.data?.season,
    date: query.data?.date,
    quests: query.data?.quests ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
