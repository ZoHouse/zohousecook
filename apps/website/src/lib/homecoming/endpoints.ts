// apps/website/src/lib/homecoming/endpoints.ts

// zoPassportServer is not re-exported via @zo/auth barrel (only contexts/hooks/components
// are re-exported). Use the relative path pattern established by useSeason.ts,
// useTodayQuests.ts, and usePassportProfile.ts.
import { zoPassportServer } from "../../../../../libs/auth/src/utils";
import type {
  HomecomingPayload,
  HomecomingCompleteResponse,
} from "../../components/homecoming/types";

/**
 * POST /api/v1/passport/homecoming/
 * Returns the full reveal payload (counts, XP, ranks, captions).
 * Server computes XP from Zostel aggregates × the XP table.
 */
export async function fetchHomecomingPayload(): Promise<HomecomingPayload> {
  const { data } = await zoPassportServer.post<HomecomingPayload>(
    "/api/v1/passport/homecoming/",
  );
  return data;
}

/**
 * POST /api/v1/passport/homecoming/complete/
 * Sets profile.homecoming_completed_at and writes the xp_events ledger
 * entry awarding total_xp. Idempotent server-side.
 */
export async function completeHomecoming(): Promise<HomecomingCompleteResponse> {
  const { data } = await zoPassportServer.post<HomecomingCompleteResponse>(
    "/api/v1/passport/homecoming/complete/",
  );
  return data;
}
