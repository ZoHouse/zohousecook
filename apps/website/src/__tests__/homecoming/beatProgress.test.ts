// apps/website/src/__tests__/homecoming/beatProgress.test.ts
import { beatProgress, ZONES } from '../../components/homecoming/spine/zones'

describe('beatProgress', () => {
  it('returns 0 before the zone', () => {
    expect(beatProgress(0.00, ZONES.proof1)).toBe(0)
    expect(beatProgress(0.09, ZONES.proof1)).toBe(0)
  })
  it('returns 1 after the zone', () => {
    expect(beatProgress(0.90, ZONES.proof1)).toBe(1)
  })
  it('interpolates 0 → 1 across the zone', () => {
    const [a, b] = ZONES.proof1
    const mid = (a + b) / 2
    expect(beatProgress(a, ZONES.proof1)).toBe(0)
    expect(beatProgress(mid, ZONES.proof1)).toBeCloseTo(0.5, 5)
    expect(beatProgress(b, ZONES.proof1)).toBe(1)
  })
  it('handles exact zone boundaries', () => {
    expect(beatProgress(0.10, ZONES.proof1)).toBe(0)
    expect(beatProgress(0.22, ZONES.proof1)).toBe(1)
  })
  it('ZONES contract: all zones are well-ordered and within [0,1]', () => {
    Object.values(ZONES).forEach(([a, b]) => {
      expect(a).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThanOrEqual(1)
      expect(b).toBeGreaterThan(a)
    })
  })
})
