// apps/website/src/components/homecoming/canvas/ZLogoMonument.tsx
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import { Group, MeshPhysicalMaterial, MathUtils } from 'three'
import { createChromeStoneMaterial, applyChromeStonePulse } from '../materials/ChromeStoneMaterial'
import { useCeremonyProgress } from '../state/useCeremonyProgress'
import { useCeremonyInteraction } from '../state/useCeremonyInteraction'
import {
  CHROME_STONE_PULSE_BASELINE,
  CHROME_STONE_PULSE_AMPLITUDE,
  CHROME_STONE_PULSE_FREQ_HZ,
  CHROME_STONE_PULSE_FREQ_HZ_HOVERED,
} from '../constants'

// Dev uses a local asset under apps/website/public/homecoming-dev/.
// Prod uses cdn.zo.xyz once the CDN is populated.
const MONUMENT_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://cdn.zo.xyz/homecoming/models/z-monument.glb'
    : '/homecoming-dev/z-monument.glb'

useGLTF.preload(MONUMENT_URL)

export function ZLogoMonument() {
  const groupRef = useRef<Group>(null!)
  const { scene } = useGLTF(MONUMENT_URL) as any
  const setHovered = useCeremonyInteraction((s) => s.setMonumentHovered)
  const hoverBoostRef = useRef(0)

  // Wrap each child (pillar) mesh's material with a shared ChromeStoneMaterial.
  // The glb audit (Pre-plan blocker) ensures pillars are separable.
  const materials = useMemo(() => {
    const mats: MeshPhysicalMaterial[] = []
    scene.traverse((obj: any) => {
      if (obj.isMesh) {
        const phase = mats.length * 2.1
        const mat = createChromeStoneMaterial({
          pulseBaseline: CHROME_STONE_PULSE_BASELINE,
          pulseAmplitude: CHROME_STONE_PULSE_AMPLITUDE,
          pulsePhase: phase,
        })
        obj.material = mat
        mats.push(mat)
      }
    })
    return mats
  }, [scene])

  useFrame((_, delta) => {
    const t = performance.now() / 1000
    const hovered = useCeremonyInteraction.getState().monumentHovered
    const uMat = useCeremonyProgress.getState().uMaterialization

    // Damped hover boost
    hoverBoostRef.current = MathUtils.damp(hoverBoostRef.current, hovered ? 1 : 0, 6, delta)
    const boost = hoverBoostRef.current
    const freq = CHROME_STONE_PULSE_FREQ_HZ + (CHROME_STONE_PULSE_FREQ_HZ_HOVERED - CHROME_STONE_PULSE_FREQ_HZ) * boost

    materials.forEach((m) => {
      const phase = m.userData.pulsePhase ?? 0
      const osc = 0.5 + 0.5 * Math.sin(2 * Math.PI * freq * t + phase)
      m.userData.pulseHoverBoost = osc * boost * 0.5
      m.userData.pulseProximity = osc * 0.5  // baseline breath
      m.userData.uMaterialization = uMat
      applyChromeStonePulse(m)
    })
  })

  // Pin monument at world origin sitting on the Mars surface (y=0).
  // Scale chosen so the model reads at ~7 units tall, matching the spec's
  // y=0..+8 target. Production will replace this with the real chrome \z/
  // model; in dev the Z_rock_Model.obj has its own origin baked in, so we
  // re-anchor here rather than relying on the GLB's local transform.
  return (
    <group
      ref={groupRef}
      position={[0, 0, 0]}
      scale={[1.6, 1.6, 1.6]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false) }}
    >
      <primitive object={scene} position={[0, 0, 0]} />
    </group>
  )
}
