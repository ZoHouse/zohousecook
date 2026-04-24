// apps/website/src/lib/homecoming/endpoints.ts
import { zoPassportServer } from '../../../../../libs/auth/src/utils'

// Backend response shapes — kept local to this file since only the adapter
// (components/homecoming/data/adapt.ts) consumes the payload, and it owns
// a structural type for what it needs.
export interface HomecomingPayload {
  handle: string
  first_name: string | null
  avatar_image: string
  citizen_since: number
  starting_xp: number
  total_xp: number
  final_rank: { key: string; label: string; chip_color: string }
  destinations: { count: number; xp: number; caption: string }
  nights: { count: number; xp: number; caption: string }
  zostels: { count: number; xp: number; caption: string }
  tribe: { count: number; xp: number; caption: string }
  has_journey: boolean
}

export interface HomecomingCompleteResponse {
  homecoming_completed_at: string
  total_xp: number
  rank: string
}

/**
 * POST /api/v1/passport/homecoming/
 * Returns the full reveal payload (counts, XP, ranks, captions).
 * Server computes XP from Zostel aggregates × the XP table.
 */
export async function fetchHomecomingPayload(): Promise<HomecomingPayload> {
  const { data } = await zoPassportServer.post<HomecomingPayload>(
    '/api/v1/passport/homecoming/',
  )
  return data
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
