// apps/website/src/components/homecoming/spine/waypoints.ts
import type { Vector3Tuple } from 'three'

export type Waypoint = {
  u: number               // progress along the spine ∈ [0,1]
  pos: Vector3Tuple
  lookAt: Vector3Tuple
  note: string
}

export const WAYPOINTS: readonly Waypoint[] = [
  // Hero: idle front-on, monument centered.
  { u: 0.00, pos: [0,   2,  14],   lookAt: [0,   3,   0], note: 'hero idle' },
  // First scroll: camera pulls back before dropping. Still aimed at the monument.
  { u: 0.04, pos: [0,   3,  20],   lookAt: [0,   3,   0], note: 'zoom out begins' },
  { u: 0.08, pos: [0,   4,  28],   lookAt: [0,   3,   0], note: 'full zoom out, hero held' },
  // Begin tilt + descent. Smoke rises into frame as y crosses 0.
  { u: 0.12, pos: [0,   2,  22],   lookAt: [0,  -8,   0], note: 'tilt down, smoke rises' },
  { u: 0.16, pos: [0, -10,  14],   lookAt: [0, -15,   0], note: 'approach proof 1' },
  { u: 0.27, pos: [0, -28,  10],   lookAt: [0, -35,   0], note: 'approach proof 2' },
  { u: 0.39, pos: [0, -48,   9],   lookAt: [0, -55,   0], note: 'approach proof 3' },
  { u: 0.50, pos: [0, -68,   8],   lookAt: [0, -75,   0], note: 'approach proof 4' },
  { u: 0.56, pos: [0, -86,   6],   lookAt: [0, -95,   0], note: 'post-proof4 settle, begin pitch' },
  { u: 0.60, pos: [0, -98,   3],   lookAt: [0,-110,   0], note: 'tip to top-down' },
  { u: 0.62, pos: [0,-110,   0],   lookAt: [0,-160,   0], note: 'enter portal' },
  { u: 0.70, pos: [0,-135,   0],   lookAt: [0,-160,   0], note: 'through rings' },
  { u: 0.82, pos: [0,-150,   2],   lookAt: [0,-158,   0], note: 'ease off-axis, see Zobu' },
  { u: 1.00, pos: [0.5,-148, 3.5], lookAt: [0,-155,   0], note: 'chamber settle' },
]
