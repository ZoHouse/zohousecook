// apps/website/src/components/homecoming/data/demo.ts
import type { CeremonyData } from '../types'

// Dev uses a local asset under apps/website/public/homecoming-dev/.
// Prod points at the per-user baked Zobu; generic fallback lives on cdn.zo.xyz.
const ZOBU_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://cdn.zo.xyz/zobu/generic-v1.glb'
    : '/homecoming-dev/zobu-rigged.glb'

export const DEMO_CEREMONY: CeremonyData = {
  user: { id: 'demo', handle: 'samurai', displayName: 'Samurai' },
  proofs: [
    { id: 'destinations', label: 'Destinations', count: 47 },
    { id: 'nights',       label: 'Nights',       count: 112 },
    { id: 'zostels',      label: 'Zostels',      count: 23 },
    { id: 'tribe',        label: 'Tribe',        count: 184 },
  ],
  zobu: { modelUrl: ZOBU_URL },
}

// Zero-state variant for preview — flip in getServerSideProps via ?zero=1.
export const ZERO_STATE_CEREMONY: CeremonyData = {
  user: { id: 'new', handle: 'newcitizen', displayName: 'New Citizen' },
  proofs: [
    { id: 'destinations', label: 'Destinations', count: 0 },
    { id: 'nights',       label: 'Nights',       count: 0 },
    { id: 'zostels',      label: 'Zostels',      count: 0 },
    { id: 'tribe',        label: 'Tribe',        count: 0 },
  ],
  zobu: { modelUrl: ZOBU_URL },
}
