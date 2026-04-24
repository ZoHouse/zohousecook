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

import { sampleSpineAt } from '../../components/homecoming/spine/sampleSpine'

describe('sampleSpineAt (authored-u mapping)', () => {
  const { positionSpine, lookAtSpine } = buildSpine(WAYPOINTS)
  const out = new Vector3()

  it('sampling at authored u of waypoint i returns that waypoint position', () => {
    for (const w of WAYPOINTS) {
      sampleSpineAt(positionSpine, WAYPOINTS, w.u, out)
      expect(out.x).toBeCloseTo(w.pos[0], 2)
      expect(out.y).toBeCloseTo(w.pos[1], 2)
      expect(out.z).toBeCloseTo(w.pos[2], 2)
    }
  })

  it('interpolates smoothly between waypoints', () => {
    // halfway between waypoint[2] (u=0.15) and waypoint[3] (u=0.27) is u=0.21
    sampleSpineAt(positionSpine, WAYPOINTS, 0.21, out)
    expect(Number.isFinite(out.y)).toBe(true)
    expect(out.y).toBeLessThan(WAYPOINTS[2].pos[1])       // below proof 1 anchor
    expect(out.y).toBeGreaterThan(WAYPOINTS[3].pos[1])    // above proof 2 anchor
  })

  it('clamps out-of-range u', () => {
    sampleSpineAt(positionSpine, WAYPOINTS, -0.5, out)
    expect(out.y).toBeCloseTo(WAYPOINTS[0].pos[1], 2)
    sampleSpineAt(positionSpine, WAYPOINTS, 1.5, out)
    expect(out.y).toBeCloseTo(WAYPOINTS[WAYPOINTS.length - 1].pos[1], 2)
  })
})
