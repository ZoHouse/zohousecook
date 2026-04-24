// apps/website/src/components/homecoming/data/demo.ts
import type { CeremonyData } from '../types'

export const DEMO_CEREMONY: CeremonyData = {
  user: { id: 'demo', handle: 'samurai', displayName: 'Samurai' },
  proofs: [
    { id: 'destinations', label: 'Destinations', count: 47 },
    { id: 'nights',       label: 'Nights',       count: 112 },
    { id: 'zostels',      label: 'Zostels',      count: 23 },
    { id: 'tribe',        label: 'Tribe',        count: 184 },
  ],
  zobu: { modelUrl: 'https://cdn.zo.xyz/zobu/generic-v1.glb' },
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
  zobu: { modelUrl: 'https://cdn.zo.xyz/zobu/generic-v1.glb' },
}
