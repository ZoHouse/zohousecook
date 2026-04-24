// apps/website/src/__tests__/homecoming/schema.test.ts
import { CeremonyDataSchema } from '../../components/homecoming/types'

describe('CeremonyDataSchema', () => {
  const valid = {
    user: { id: 'u', handle: 'samurai', displayName: 'Samurai' },
    proofs: [
      { id: 'destinations', label: 'Destinations', count: 47 },
      { id: 'nights',       label: 'Nights',       count: 112 },
      { id: 'zostels',      label: 'Zostels',      count: 23 },
      { id: 'tribe',        label: 'Tribe',        count: 184 },
    ],
    zobu: { modelUrl: 'https://cdn.zo.xyz/zobu/generic-v1.glb' },
  }

  it('accepts a valid ceremony data object', () => {
    expect(() => CeremonyDataSchema.parse(valid)).not.toThrow()
  })

  it('rejects when proofs.length !== 4', () => {
    const bad = { ...valid, proofs: valid.proofs.slice(0, 3) }
    expect(() => CeremonyDataSchema.parse(bad)).toThrow()
  })

  it('rejects an unknown proof id', () => {
    const bad = { ...valid, proofs: [{ ...valid.proofs[0], id: 'snacks' }, ...valid.proofs.slice(1)] }
    expect(() => CeremonyDataSchema.parse(bad)).toThrow()
  })

  it('rejects duplicate proof ids (two destinations)', () => {
    const bad = {
      ...valid,
      proofs: [valid.proofs[0], valid.proofs[0], valid.proofs[2], valid.proofs[3]],
    }
    expect(() => CeremonyDataSchema.parse(bad)).toThrow(/exactly one of each/i)
  })

  it('rejects missing category (no tribe)', () => {
    const bad = {
      ...valid,
      proofs: [valid.proofs[0], valid.proofs[1], valid.proofs[2], { ...valid.proofs[0] }],
    }
    expect(() => CeremonyDataSchema.parse(bad)).toThrow(/exactly one of each/i)
  })
})
