// apps/website/src/components/homecoming/canvas/CameraRig.tsx
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Vector3, MathUtils } from 'three'
import { useCeremonyProgress } from '../state/useCeremonyProgress'
import { WAYPOINTS } from '../spine/waypoints'
import { buildSpine } from '../spine/buildSpine'
import { sampleSpineAt } from '../spine/sampleSpine'
import { DAMPING_LAMBDA } from '../constants'
import { readDebugParams } from '../hooks/useDeviceTier'

const tmpPos = new Vector3()
const tmpLook = new Vector3()

export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const { positionSpine, lookAtSpine } = useMemo(() => buildSpine(WAYPOINTS), [])
  const debugTRef = useRef<number | null>(null)

  // Honor ?t=<value> for isolated beat review
  useEffect(() => {
    const { t } = readDebugParams()
    debugTRef.current = t
  }, [])

  useFrame((_, delta) => {
    const state = useCeremonyProgress.getState()
    const target = debugTRef.current !== null ? debugTRef.current : (state.introDone ? state.t : 0)
    const tLerp = MathUtils.damp(state.tLerp, target, DAMPING_LAMBDA, delta)
    state.setTLerp(tLerp)

    // Sample with authored-u mapping so zones align with waypoint timing.
    sampleSpineAt(positionSpine, WAYPOINTS, tLerp, tmpPos)
    sampleSpineAt(lookAtSpine, WAYPOINTS, tLerp, tmpLook)
    camera.position.copy(tmpPos)
    camera.lookAt(tmpLook)
  })

  return null
}
