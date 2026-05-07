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
  season?: { key: string; name: string };
  date?: string;
  quests: TodayQuest[];
}

// Shape returned by GET /api/v1/passport/quests/ (Daya's deployed CAS-backed
// endpoint). Display fields (category/status/visibility) come back as
// title-case strings, not integer enum keys.
interface DeployedQuestParticipation {
  id: string;
  status: "Assigned" | "Submitted" | "Qualified" | "Disqualified";
  proof_url: string;
  booking_ref_id: string | null;
  is_paid_subscriber: boolean;
  qualified_at: string | null;
  disqualification_reason: string;
  claims: unknown[];
}

interface DeployedQuestReward {
  id: string;
  category: "Bed Drop" | "Bounty" | "Content Monetization" | "XP" | string;
  credit_amount: number;
  xp_amount: number;
  description: string;
  rule?: unknown;
}

interface DeployedQuest {
  pid: string;
  slug: string;
  category: "Creator" | "Tripper" | "Tribemaker" | string;
  status: "Live" | "Closed" | "Results Declared" | "Expired" | string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  result_declares_at: string | null;
  claim_expires_at: string | null;
  rewards: DeployedQuestReward[];
  participations: DeployedQuestParticipation[];
}

interface DeployedQuestsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DeployedQuest[];
}

function mapReward(r?: DeployedQuestReward): QuestReward | undefined {
  if (!r) return undefined;
  if (r.category === "XP" || r.xp_amount > 0) {
    return { type: "xp", amount: r.xp_amount };
  }
  if (r.category === "Bed Drop") {
    return { type: "bed_drop" };
  }
  return { type: "credit", amount: r.credit_amount };
}

function mapStatus(quest: DeployedQuest): QuestStatus {
  if (quest.status === "Expired") return "expired";
  const p = quest.participations?.[0];
  if (!p) return "live";
  switch (p.status) {
    case "Submitted":
      return "submitted";
    case "Qualified":
      return "verified";
    case "Disqualified":
      return "rejected";
    case "Assigned":
    default:
      return "live";
  }
}

function transform(deployed: DeployedQuest): TodayQuest {
  const p = deployed.participations?.[0];
  return {
    user_quest_id: p?.id ?? deployed.pid,
    quest_id: deployed.pid,
    name: deployed.title,
    description: deployed.description,
    cover_image: null,
    role_names: [deployed.category],
    cadence: "daily",
    live_at: deployed.starts_at,
    expires_at: deployed.ends_at,
    submission_deadline_at: deployed.claim_expires_at ?? deployed.ends_at,
    status: mapStatus(deployed),
    reward_pool: { reward: mapReward(deployed.rewards?.[0]) },
    submitted_at: p?.status === "Submitted" ? null : null,
  };
}

export function useTodayQuests() {
  const { isLoggedIn } = useAuth();

  const query = useQuery<TodayQuestsResponse>(
    ["passport", "quests", "today"],
    async () => {
      const res = await zoServer.get<DeployedQuestsListResponse>(
        "/api/v1/passport/quests/",
      );
      return { quests: (res.data.results ?? []).map(transform) };
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
