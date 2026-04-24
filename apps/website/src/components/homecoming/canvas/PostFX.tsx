// apps/website/src/components/homecoming/canvas/PostFX.tsx
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { useMemo } from 'react'
import type { DeviceTier } from '../hooks/useDeviceTier'

export function PostFX({ tier }: { tier: DeviceTier }) {
  const caOffset = useMemo(() => new Vector2(0.0008, 0.0008), [])

  if (tier <= 1) return null

  const effects: JSX.Element[] = [
    <Bloom key="bloom" intensity={0.6} luminanceThreshold={0.6} luminanceSmoothing={0.2} mipmapBlur />,
  ]
  if (tier >= 3) {
    effects.push(
      <ChromaticAberration
        key="ca"
        blendFunction={BlendFunction.NORMAL}
        offset={caOffset}
        radialModulation={false}
        modulationOffset={0.15}
      />,
    )
  }
  effects.push(
    <Noise key="noise" opacity={0.04} premultiply blendFunction={BlendFunction.SCREEN} />,
  )
  if (tier >= 3) {
    effects.push(<Vignette key="vignette" eskil={false} offset={0.3} darkness={0.6} />)
  }

  return <EffectComposer multisampling={tier >= 3 ? 4 : 0}>{effects}</EffectComposer>
}
