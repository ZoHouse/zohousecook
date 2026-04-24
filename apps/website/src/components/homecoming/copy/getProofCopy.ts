// apps/website/src/components/homecoming/copy/getProofCopy.ts
import type { ProofData } from '../types'

const ZERO_STATE_COPY: Record<ProofData['id'], string> = {
  destinations: 'Your first one awaits',
  nights:       'The archive is listening',
  zostels:      '108+ waypoints ready',
  tribe:        'You are the first signal',
}

export function getProofCopy(proof: ProofData): string {
  if (proof.count === 0) return `${proof.label} · ${ZERO_STATE_COPY[proof.id]}`
  return `${proof.label} · ${proof.count}`
}
