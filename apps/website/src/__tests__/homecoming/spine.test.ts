// apps/website/src/__tests__/homecoming/spine.test.ts
import { Vector3 } from 'three'
import { buildSpine } from '../../components/homecoming/spine/buildSpine'
import { WAYPOINTS } from '../../components/homecoming/spine/waypoints'

describe('buildSpine', () => {
  const spine = buildSpine(WAYPOINTS)

  it('exposes positionSpine and lookAtSpine curves', () => {
    expect(spine.positionSpine).toBeDefined()
    expect(spine.lookAtSpine).toBeDefined()
  })

  it('getPointAt(0) matches the first waypoint', () => {
    const p = spine.positionSpine.getPointAt(0, new Vector3())
    expect(p.x).toBeCloseTo(0, 3)
    expect(p.y).toBeCloseTo(2, 3)
    expect(p.z).toBeCloseTo(14, 3)
  })

  it('getPointAt(1) matches the last waypoint', () => {
    const p = spine.positionSpine.getPointAt(1, new Vector3())
    expect(p.x).toBeCloseTo(0.5, 3)
    expect(p.y).toBeCloseTo(-148, 3)
    expect(p.z).toBeCloseTo(3.5, 3)
  })

  it('getPointAt(0.5) returns a finite Vector3', () => {
    const p = spine.positionSpine.getPointAt(0.5, new Vector3())
    expect(Number.isFinite(p.x)).toBe(true)
    expect(Number.isFinite(p.y)).toBe(true)
    expect(Number.isFinite(p.z)).toBe(true)
  })

  it('y coordinate is monotonically decreasing (never overshoots up)', () => {
    let prevY = Infinity
    for (let u = 0; u <= 1; u += 0.05) {
      const p = spine.positionSpine.getPointAt(u, new Vector3())
      expect(p.y).toBeLessThanOrEqual(prevY + 1e-3)
      prevY = p.y
    }
  })
})
