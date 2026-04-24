// apps/website/src/lib/homecoming/endpoints.ts
import { zoPassportServer } from '../../../../../libs/auth/src/utils'

// NOTE: The reveal payload POST (`/api/v1/passport/homecoming/`) is done
// directly inside getServerSideProps in pages/homecoming/index.tsx, because
// SSR needs to forward the request cookie via a cookie-bearing authConfig.
// A client helper here would not receive those cookies, so we only keep the
// `complete` helper (which is called client-side after auth is established).

export interface HomecomingCompleteResponse {
  homecoming_completed_at: string
  total_xp: number
  rank: string
}

/**
 * POST /api/v1/passport/homecoming/complete/
 * Sets profile.homecoming_completed_at and writes the xp_events ledger
 * entry awarding total_xp. Idempotent server-side.
 */
export async function completeHomecoming(): Promise<HomecomingCompleteResponse> {
  const { data } = await zoPassportServer.post<HomecomingCompleteResponse>(
    '/api/v1/passport/homecoming/complete/',
  )
  return data
}
