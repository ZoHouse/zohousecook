// apps/website/src/components/homecoming/spine/sampleSpine.ts
import type { CatmullRomCurve3, Vector3 } from 'three'
import type { Waypoint } from './waypoints'

/**
 * Maps authored `u` (as declared on Waypoint) to the curve's own parameter
 * (which runs evenly across control points: waypoint i is at i/(n-1)), then
 * samples the curve at that position via `getPoint` (NOT `getPointAt` — we
 * want the curve parameter, not arc-length, so authored timing is preserved).
 *
 * Writes into `out` to avoid allocating. Clamps authoredU to [0, 1].
 */
export function sampleSpineAt(
  curve: CatmullRomCurve3,
  waypoints: readonly Waypoint[],
  authoredU: number,
  out: Vector3,
): Vector3 {
  const n = waypoints.length
  if (n === 0) return out
  if (authoredU <= waypoints[0].u) return curve.getPoint(0, out)
  if (authoredU >= waypoints[n - 1].u) return curve.getPoint(1, out)

  // Find the segment [i, i+1] where waypoints[i].u <= authoredU < waypoints[i+1].u
  for (let i = 0; i < n - 1; i++) {
    const a = waypoints[i].u
    const b = waypoints[i + 1].u
    if (authoredU <= b) {
      const segProgress = (authoredU - a) / (b - a)
      // Curve parameter at waypoint i is i / (n - 1); each segment is that wide.
      const curveT = (i + segProgress) / (n - 1)
      return curve.getPoint(curveT, out)
    }
  }
  return curve.getPoint(1, out)
}
