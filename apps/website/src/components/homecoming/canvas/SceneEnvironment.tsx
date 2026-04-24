// apps/website/src/components/homecoming/canvas/SceneEnvironment.tsx
import { useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useRef } from 'react'
import { Color, Fog } from 'three'
import type { DirectionalLight, AmbientLight } from 'three'
import { useCeremonyProgress } from '../state/useCeremonyProgress'
import { beatProgress, ZONES } from '../spine/zones'

// Mars twilight palette — dark sky with heavy pale dust fog.
const MARS_FOG = new Color('#c9c1b8')       // light warm gray, reads as misty atmosphere
const CHAMBER_FOG = new Color('#d8cfc6')
const MARS_AMBIENT = new Color('#1a1410')   // near-black with faint warmth
const CHAMBER_AMBIENT = new Color('#1a1a1c')
const MARS_KEY = new Color('#e8ddd0')       // cool-warm off-white key
const CHAMBER_KEY = new Color('#f3e8dc')

const fogColor = new Color()
const ambient = new Color()
const keyColor = new Color()

export function SceneEnvironment() {
  const scene = useThree((s) => s.scene)
  const dirRef = useRef<DirectionalLight>(null!)
  const ambRef = useRef<AmbientLight>(null!)

  // Lazy-init fog so we can mutate .color per frame without recreating.
  // Thick Mars fog — close near distance so even the near-camera meshes
  // pick up atmospheric wash; cap far at 280 so the horizon dissolves into
  // fog rather than a hard skydome line.
  if (!scene.fog) scene.fog = new Fog(MARS_FOG.clone(), 12, 280)

  useFrame(() => {
    const t = useCeremonyProgress.getState().tLerp
    // Cross-fade from Mars to chamber across portalTraversal + chamberReveal.
    const mix = beatProgress(t, [ZONES.portalTraversal[0], ZONES.chamberReveal[1]])

    fogColor.copy(MARS_FOG).lerp(CHAMBER_FOG, mix)
    ambient.copy(MARS_AMBIENT).lerp(CHAMBER_AMBIENT, mix)
    keyColor.copy(MARS_KEY).lerp(CHAMBER_KEY, mix)

    ;(scene.fog as Fog).color.copy(fogColor)
    ;(scene.fog as Fog).near = 12 - mix * 2    // Mars 12 → Chamber 10
    ;(scene.fog as Fog).far = 280 - mix * 200  // Mars 280 → Chamber 80
    if (ambRef.current) ambRef.current.color.copy(ambient)
    if (dirRef.current) dirRef.current.color.copy(keyColor)
  })

  // Skip the HDRI in dev until cdn.zo.xyz is populated. Drei's <Environment>
  // treats a 404 as a suspense throw, which the canvas error boundary catches
  // and swaps to CeremonyFallback — so the 3D walkthrough never renders.
  const hasCdn = process.env.NODE_ENV === 'production'

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.4} color={MARS_AMBIENT} />
      <directionalLight ref={dirRef} intensity={1.2} color={MARS_KEY} position={[12, 20, 8]} castShadow={false} />
      {hasCdn && (
        <Environment files="https://cdn.zo.xyz/homecoming/hdri/mars-warm-2k.hdr" background={false} />
      )}
    </>
  )
}
