// apps/website/src/__tests__/homecoming/getProofCopy.test.ts
import { getProofCopy } from '../../components/homecoming/copy/getProofCopy'
import type { ProofData } from '../../components/homecoming/types'

describe('getProofCopy', () => {
  it('returns "Label · <count>" for populated proofs', () => {
    const p: ProofData = { id: 'destinations', label: 'Destinations', count: 47 }
    expect(getProofCopy(p)).toBe('Destinations · 47')
  })

  it('returns zero-state copy for count=0 destinations', () => {
    const p: ProofData = { id: 'destinations', label: 'Destinations', count: 0 }
    expect(getProofCopy(p)).toBe('Destinations · Your first one awaits')
  })

  it('returns zero-state copy for count=0 nights', () => {
    const p: ProofData = { id: 'nights', label: 'Nights', count: 0 }
    expect(getProofCopy(p)).toBe('Nights · The archive is listening')
  })

  it('returns zero-state copy for count=0 zostels', () => {
    const p: ProofData = { id: 'zostels', label: 'Zostels', count: 0 }
    expect(getProofCopy(p)).toBe('Zostels · 108+ waypoints ready')
  })

  it('returns zero-state copy for count=0 tribe', () => {
    const p: ProofData = { id: 'tribe', label: 'Tribe', count: 0 }
    expect(getProofCopy(p)).toBe('Tribe · You are the first signal')
  })
})
