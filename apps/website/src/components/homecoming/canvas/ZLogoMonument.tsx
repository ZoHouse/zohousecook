// apps/website/src/components/homecoming/canvas/ZLogoMonument.tsx
import { useGLTF } from '@react-three/drei'
import { useRef } from 'react'
import { Group } from 'three'
import { useCeremonyInteraction } from '../state/useCeremonyInteraction'

// Dev uses a local asset under apps/website/public/homecoming-dev/.
// Prod uses cdn.zo.xyz once the CDN is populated.
const MONUMENT_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://cdn.zo.xyz/homecoming/models/z-monument.glb'
    : '/homecoming-dev/z-monument.glb'

useGLTF.preload(MONUMENT_URL)

/**
 * Renders the \z/ chrome-rock monument using whatever material / texture the
 * source asset ships with. Does NOT replace materials, so baked PBR maps,
 * shaders, and emissive channels from the DCC tool come through intact.
 *
 * Hover state is exposed via the interaction store for the pulse system to
 * pick up separately (if the source asset wants to participate in chrome
 * pulse, author an emissive channel in the glb and wire to uMaterialization
 * in a future pass; for now the native look is the truth).
 */
export function ZLogoMonument() {
  const groupRef = useRef<Group>(null!)
  const { scene } = useGLTF(MONUMENT_URL) as any
  const setHovered = useCeremonyInteraction((s) => s.setMonumentHovered)

  // Pin monument at world origin on the Mars surface (y=0). Scale chosen so
  // the model reads at ~7 units tall, matching the spec's y=0..+8 target.
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
