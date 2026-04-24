// apps/website/src/components/homecoming/data/adapt.ts
import type { CeremonyData } from '../types'

// Subset of the backend shape we actually consume. Full shape lives in the
// backend's passport serializer; we only care about handle + 4 counts.
type BackendHomecomingPayload = {
  handle: string
  first_name: string | null
  avatar_image: string
  destinations: { count: number }
  nights: { count: number }
  zostels: { count: number }
  tribe: { count: number }
  has_journey?: boolean
}

type ProfileMe = {
  id?: string
  handle: string
  first_name: string | null
  avatar_image: string
}

export function adaptHomecomingPayload(
  payload: BackendHomecomingPayload,
  profile: ProfileMe,
): CeremonyData {
  return {
    user: {
      id: profile.id ?? profile.handle,
      handle: profile.handle,
      displayName: profile.first_name ?? profile.handle,
    },
    proofs: [
      {
        id: 'destinations',
        label: 'Destinations',
        count: payload.destinations.count,
      },
      { id: 'nights', label: 'Nights', count: payload.nights.count },
      { id: 'zostels', label: 'Zostels', count: payload.zostels.count },
      { id: 'tribe', label: 'Tribe', count: payload.tribe.count },
    ],
    zobu: {
      // Per-user baked Zobu; generic fallback if 404 is handled by ZobuParticleForm.
      modelUrl: `https://cdn.zo.xyz/zobu/${profile.handle}.glb`,
    },
  }
}
