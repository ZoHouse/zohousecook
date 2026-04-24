// apps/website/src/components/homecoming/canvas/Proof.tsx
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, CanvasTexture, MathUtils } from 'three'
import type { ProofData } from '../types'
import type { Zone } from '../spine/zones'
import { readBeatProgress } from '../hooks/useBeatProgress'
import { getProofCopy } from '../copy/getProofCopy'
import { createChromeStoneMaterial, applyChromeStonePulse } from '../materials/ChromeStoneMaterial'
import { useCeremonyProgress } from '../state/useCeremonyProgress'

function drawCardTexture(text: string): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 640
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#1c1008'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.fillStyle = '#ffd9a8'
  ctx.font = '600 96px "Space Grotesk", system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText(text, c.width / 2, c.height / 2)
  // Subtle border
  ctx.strokeStyle = '#8a6a5a'
  ctx.lineWidth = 6
  ctx.strokeRect(12, 12, c.width - 24, c.height - 24)
  const tex = new CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

export function Proof({
  data,
  zone,
  anchorY,
}: {
  data: ProofData
  zone: Zone
  anchorY: number
}) {
  const groupRef = useRef<Group>(null!)
  const material = useMemo(() => createChromeStoneMaterial(), [])
  const faceTexture = useMemo(() => drawCardTexture(getProofCopy(data)), [data])

  useFrame(() => {
    const u = readBeatProgress(zone)

    // Local envelope (spec §4 <Proof>):
    //   u < 0.25  → rise + fade in  from anchorY - 6
    //   0.25-0.75 → hold, slight drift
    //   u > 0.75  → rise out + fade
    let yOffset = -6
    let opacity = 0
    if (u <= 0) {
      yOffset = -6
      opacity = 0
    } else if (u < 0.25) {
      const n = u / 0.25
      yOffset = MathUtils.lerp(-6, 0, n)
      opacity = n
    } else if (u < 0.75) {
      yOffset = 0
      opacity = 1
    } else if (u < 1) {
      const n = (u - 0.75) / 0.25
      yOffset = MathUtils.lerp(0, 6, n)
      opacity = 1 - n
    } else {
      yOffset = 6
      opacity = 0
    }

    if (groupRef.current) {
      groupRef.current.position.y = anchorY + yOffset
      groupRef.current.visible = opacity > 0.01
      groupRef.current.rotation.y = 0.08 * Math.sin(performance.now() / 2000)
      // cascade opacity to material channels
      groupRef.current.traverse((obj: any) => {
        if (obj.isMesh && obj.material) {
          obj.material.transparent = true
          obj.material.opacity = opacity
        }
      })
    }

    // Breathe the chrome-stone frame with the monument/portal pulse language.
    material.userData.uMaterialization = useCeremonyProgress.getState().uMaterialization
    material.userData.pulseProximity = 0.35  // constant mid-strength baseline for proofs
    applyChromeStonePulse(material)
  })

  // Dispose the CanvasTexture when the data changes or the component unmounts
  // — otherwise the underlying <canvas> and GPU texture leak.
  useEffect(() => () => { faceTexture.dispose() }, [faceTexture])

  return (
    <group ref={groupRef} position={[0, anchorY - 6, 0]}>
      {/* Chrome-stone frame (placeholder geometry — real proof-frame.glb lands in Task 4.2) */}
      <mesh material={material}>
        <boxGeometry args={[2.2, 1.4, 0.2]} />
      </mesh>
      {/* Front face with the canvas texture */}
      <mesh position={[0, 0, 0.11]}>
        <planeGeometry args={[2.0, 1.25]} />
        <meshBasicMaterial map={faceTexture} toneMapped={false} />
      </mesh>
    </group>
  )
}
