import { useQuery } from "react-query";
import { useAuth } from "@zo/auth";
// zoPassportServer isn't re-exported via @zo/auth yet (only contexts/hooks/components
// are). Matches the pattern apps/pms uses for zostelServer - direct relative import
// from libs/auth/src/utils.
import { zoPassportServer } from "../../../../libs/auth/src/utils";

/**
 * Game of Life v2 profile extensions. Optional so consumers can safely read
 * on prod where the backend doesn't yet expose these fields. The mock returns
 * the full shape at /api/v1/profile/me/; Daya's staging and prod will add the
 * fields as they land.
 */
export interface PassportRoleV2 {
  key: string;
  name: string;
  category?: "progressive" | "identity" | string;
  assigned_at?: string | null;
}

export interface StreakV2 {
  type?: string;
  current: number;
  longest: number;
  freeze_tokens: number;
  last_active_at?: string | null;
}

export type BadgeLedger = Record<string, Record<string, unknown>>;

export interface PassportProfileV2 {
  id?: number | string;
  code?: string;
  nickname?: string | null;
  custom_nickname?: string | null;
  first_name?: string | null;
  full_name?: string | null;
  pfp_image?: string | null;
  avatar_image?: string | null;
  background_image?: string | null;
  cover_image?: string | null;
  place_name?: string | null;

  state?: "locked" | "unlocked_free" | "unlocked_pro";
  tier?: "free" | "pro";
  onboarding_completed?: boolean;
  passport_roles?: PassportRoleV2[];

  season_level?: number;
  season_xp?: number;
  lifetime_xp?: number;
  rank_title?: string | null;
  rank_global?: number | null;
  zo_cred?: number;
  badges?: BadgeLedger;
  streak?: StreakV2 | null;

  [key: string]: unknown;
}

/**
 * Fetches /api/v1/profile/me/ via zoPassportServer so v2 fields (season_level,
 * streak, tier, badges, passport_roles, etc.) flow in from the mock or Daya's
 * staging without touching the existing useProfile hook (which stays on the
 * real Zo API for auth + legacy shape).
 *
 * In prod where API_BASE_URL_PASSPORT is unset, this falls back to hitting
 * api.io.zo.xyz and returns the same v1 shape useProfile does - v2 fields are
 * simply undefined until Daya ships them.
 */
export function usePassportProfile() {
  const { isLoggedIn } = useAuth();

  const query = useQuery<PassportProfileV2>(
    ["passport", "profile", "me"],
    async () => {
      const res = await zoPassportServer.get<PassportProfileV2>(
        "/api/v1/profile/me/",
      );
      return res.data;
    },
    {
      enabled: isLoggedIn === true,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  );

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
