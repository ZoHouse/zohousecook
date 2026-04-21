export type PassportState = "locked" | "unlocked_free" | "unlocked_pro";
export type PassportTier = "free" | "pro";

export interface PassportRole {
  key: string;
  label: string;
  tier?: "progressive" | "identity";
}

export interface Badge {
  key: string;
  label: string;
  earned_at?: string | null;
  icon_url?: string | null;
}

export interface Streak {
  current: number;
  longest: number;
  freeze_tokens: number;
  last_active_date: string | null;
}

export interface PassportSeason {
  key: string;
  name: string;
  narrative?: string;
  start_at: string;
  end_at: string;
  pass_available_at?: string | null;
  pass_closes_at?: string | null;
  pass_price_paise?: number | null;
  status: "draft" | "live" | "closed" | "archived";
}

export interface PassportQuest {
  user_quest_id: string;
  quest_id: string;
  name: string;
  description: string;
  cover_image: string | null;
  type: "reel" | "photo" | "moment" | "submission" | string;
  status: "live" | "submitted" | "verified" | "rejected" | "expired";
  xp_reward: number;
  expires_at: string;
  submitted_at?: string | null;
  box_opened_at?: string | null;
  reward_won?: Record<string, unknown> | null;
  submission_data?: Record<string, unknown> | null;
}

export interface PassportProfile {
  id?: number | string;
  code?: string;
  custom_nickname?: string | null;
  nickname?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  pfp_image?: string | null;
  avatar_image?: string | null;
  background_image?: string | null;
  cover_image?: string | null;
  place_name?: string | null;
  country?: { code?: string; name?: string } | null;
  membership?: string | null;

  state?: PassportState;
  tier?: PassportTier;
  onboarding_completed?: boolean;
  passport_roles?: PassportRole[];

  season_level?: number;
  season_xp?: number;
  lifetime_xp?: number;
  rank_title?: string | null;
  rank_global?: number | null;
  zo_cred?: number;
  badges?: Badge[];
  streak?: Streak | null;

  [key: string]: unknown;
}
