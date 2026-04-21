import { useQuery } from "react-query";
import { zoPassportServer } from "../../../../libs/auth/src/utils";

export interface PassportSeason {
  key: string;
  name: string;
  status: "draft" | "live" | "closed" | "archived";
  narrative?: string;
  message?: string;
  start_at?: string;
  end_at?: string;
  pass_available_at?: string | null;
  pass_closes_at?: string | null;
  pass_price_paise?: number | null;
  level_curve?: number[];
  [key: string]: unknown;
}

/**
 * Public endpoint — no auth needed, safe to call on any page. Use for season
 * meta (name, narrative, status, level_curve). User-specific progress lives
 * on profile (season_level, season_xp) via usePassportProfile.
 */
export function useSeason() {
  const query = useQuery<PassportSeason>(
    ["passport", "season", "current"],
    async () => {
      const res = await zoPassportServer.get<PassportSeason>(
        "/api/v1/passport/season/current/",
      );
      return res.data;
    },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  );

  return {
    season: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
