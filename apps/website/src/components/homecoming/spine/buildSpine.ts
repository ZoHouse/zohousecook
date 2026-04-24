// apps/website/src/components/homecoming/spine/buildSpine.ts
import { CatmullRomCurve3, Vector3 } from 'three'
import type { Waypoint } from './waypoints'

export type Spine = {
  positionSpine: CatmullRomCurve3
  lookAtSpine: CatmullRomCurve3
}

export function buildSpine(waypoints: readonly Waypoint[]): Spine {
  const positionPoints = waypoints.map(w => new Vector3(...w.pos))
  const lookAtPoints = waypoints.map(w => new Vector3(...w.lookAt))
  const positionSpine = new CatmullRomCurve3(positionPoints, false, 'catmullrom', 0.3)
  const lookAtSpine = new CatmullRomCurve3(lookAtPoints, false, 'catmullrom', 0.3)
  return { positionSpine, lookAtSpine }
}
