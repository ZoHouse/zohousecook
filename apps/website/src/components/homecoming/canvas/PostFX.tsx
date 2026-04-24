// apps/website/src/components/homecoming/canvas/PostFX.tsx
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { useMemo } from 'react'
import type { DeviceTier } from '../hooks/useDeviceTier'

export function PostFX({ tier }: { tier: DeviceTier }) {
  if (tier <= 1) return null

  const caOffset = useMemo(() => new Vector2(0.0008, 0.0008), [])

  return (
    <EffectComposer multisampling={tier >= 3 ? 4 : 0}>
      <Bloom intensity={0.6} luminanceThreshold={0.6} luminanceSmoothing={0.2} mipmapBlur />
      {tier >= 3 ? (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={caOffset}
          radialModulation={false}
          modulationOffset={0.15}
        />
      ) : <></>}
      <Noise opacity={0.04} premultiply blendFunction={BlendFunction.SCREEN} />
      {tier >= 3 ? <Vignette eskil={false} offset={0.3} darkness={0.6} /> : <></>}
    </EffectComposer>
  )
}
