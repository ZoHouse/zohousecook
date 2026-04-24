// apps/website/src/components/homecoming/canvas/SceneEnvironment.tsx
import { useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useRef } from 'react'
import { Color, Fog } from 'three'
import type { DirectionalLight, AmbientLight } from 'three'
import { useCeremonyProgress } from '../state/useCeremonyProgress'
import { beatProgress, ZONES } from '../spine/zones'

// Desaturated Mars palette — subtle warm tint, not nuclear red.
const MARS_FOG = new Color('#3a2620')       // muted brown-gray, not saturated red
const CHAMBER_FOG = new Color('#d8cfc6')
const MARS_AMBIENT = new Color('#1a1410')   // near-black with faint warmth
const CHAMBER_AMBIENT = new Color('#1a1a1c')
const MARS_KEY = new Color('#d9bfa0')       // warm off-white, not orange
const CHAMBER_KEY = new Color('#f3e8dc')

const fogColor = new Color()
const ambient = new Color()
const keyColor = new Color()

export function SceneEnvironment() {
  const scene = useThree((s) => s.scene)
  const dirRef = useRef<DirectionalLight>(null!)
  const ambRef = useRef<AmbientLight>(null!)

  // Lazy-init fog so we can mutate .color per frame without recreating.
  // Far distance is 800 in Mars so the big terrain + skydome read cleanly;
  // chamber collapses to a tighter fog so the chamber feels enclosed.
  if (!scene.fog) scene.fog = new Fog(MARS_FOG.clone(), 60, 800)

  useFrame(() => {
    const t = useCeremonyProgress.getState().tLerp
    // Cross-fade from Mars to chamber across portalTraversal + chamberReveal.
    const mix = beatProgress(t, [ZONES.portalTraversal[0], ZONES.chamberReveal[1]])

    fogColor.copy(MARS_FOG).lerp(CHAMBER_FOG, mix)
    ambient.copy(MARS_AMBIENT).lerp(CHAMBER_AMBIENT, mix)
    keyColor.copy(MARS_KEY).lerp(CHAMBER_KEY, mix)

    ;(scene.fog as Fog).color.copy(fogColor)
    ;(scene.fog as Fog).near = 60 - mix * 50   // Mars 60 → Chamber 10
    ;(scene.fog as Fog).far = 800 - mix * 720  // Mars 800 → Chamber 80
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
