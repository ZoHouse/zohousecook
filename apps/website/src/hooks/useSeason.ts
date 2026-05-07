import { AxiosError } from "axios";
import { useQuery } from "react-query";
import { zoServer } from "../../../../libs/auth/src/utils";

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
 *
 * Backend status: endpoint is part of Daya's Game-of-Life v2 bundle (handover
 * targeted ~2026-05-05). Until it ships, the request 404s — we swallow that
 * silently and return null so the UI shows the no-season fallback instead of
 * spamming the console with retry errors.
 */
export function useSeason() {
  const query = useQuery<PassportSeason | null>(
    ["passport", "season", "current"],
    async () => {
      try {
        const res = await zoServer.get<PassportSeason>(
          "/api/v1/passport/season/current/",
        );
        return res.data;
      } catch (e) {
        if (e instanceof AxiosError && e.response?.status === 404) return null;
        throw e;
      }
    },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false, // never retry — 404 is the steady state until backend ships
    },
  );

  return {
    season: query.data ?? undefined,
    isLoading: query.isLoading,
    error: query.error,
  };
}
