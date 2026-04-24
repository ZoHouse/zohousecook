// apps/website/src/components/homecoming/canvas/PortalStoneRings.tsx
import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, MathUtils, Vector3 } from 'three'
import { createChromeStoneMaterial, applyChromeStonePulse } from '../materials/ChromeStoneMaterial'
import { readBeatProgress } from '../hooks/useBeatProgress'
import { ZONES } from '../spine/zones'
import type { DeviceTier } from '../hooks/useDeviceTier'

const FRAGMENTS_PER_RING: Record<DeviceTier, number> = { 0: 8, 1: 8, 2: 10, 3: 12 }

type RingCfg = { radius: number; y: number; thickness: number }
const RINGS: RingCfg[] = [
  { radius: 6.5, y: -108, thickness: 0.6 },
  { radius: 5.0, y: -111, thickness: 0.55 },
  { radius: 3.7, y: -114, thickness: 0.5 },
  { radius: 2.5, y: -117, thickness: 0.45 },
]

// Hoist module-scope temp to avoid per-frame allocation (spec §6).
const PORTAL_CENTER = new Vector3(0, -112, 0)

export function PortalStoneRings({ tier }: { tier: DeviceTier }) {
  const groupRef = useRef<Group>(null!)
  const material = useMemo(() => createChromeStoneMaterial({ pulsePhase: 1.5 }), [])
  const camera = useThree((s) => s.camera)
  const fragCount = FRAGMENTS_PER_RING[tier]

  useFrame(() => {
    const dist = camera.position.distanceTo(PORTAL_CENTER)
    const proximity = MathUtils.clamp(1 - dist / 30, 0, 1)
    material.userData.pulseProximity = proximity
    material.userData.uMaterialization = 1
    applyChromeStonePulse(material)
    if (groupRef.current) groupRef.current.visible = true
  })

  return (
    <group ref={groupRef}>
      {RINGS.map((ring, i) => (
        <group key={i} position={[0, ring.y, 0]}>
          {Array.from({ length: fragCount }).map((_, k) => {
            const theta = (k / fragCount) * Math.PI * 2
            const arc = (Math.PI * 2) / fragCount * 0.82  // visible seam
            return (
              <mesh
                key={k}
                rotation={[0, theta, 0]}
                material={material}
              >
                <torusGeometry args={[ring.radius, ring.thickness, 8, 16, arc]} />
              </mesh>
            )
          })}
        </group>
      ))}
      {/* Bright core disc — drives bloom during traversal */}
      <mesh position={[0, -118, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 48]} />
        <meshBasicMaterial color="#fff6e0" toneMapped={false} />
      </mesh>
    </group>
  )
}
