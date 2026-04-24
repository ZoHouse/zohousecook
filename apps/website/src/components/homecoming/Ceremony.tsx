// apps/website/src/components/homecoming/Ceremony.tsx
import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { SCROLL_SPACER_VH } from './constants'
import type { CeremonyData } from './types'
import { useDeviceTier } from './hooks/useDeviceTier'
import { useScrollListener } from './hooks/useScrollListener'
import { useIntroTimeline } from './hooks/useIntroTimeline'
import { useLoadTimeout } from './hooks/useLoadTimeout'
import { useLenisSmooth } from './hooks/useLenisSmooth'
import { CameraRig } from './canvas/CameraRig'
import { SceneEnvironment } from './canvas/SceneEnvironment'
import { MarsSurface } from './canvas/MarsSurface'
import { ZLogoMonument } from './canvas/ZLogoMonument'
import { LoadingGridline } from './canvas/LoadingGridline'
import { ProofStack } from './canvas/ProofStack'
import { PortalStoneRings } from './canvas/PortalStoneRings'
import { Chamber } from './canvas/Chamber'
import { ZobuParticleForm } from './canvas/ZobuParticleForm'
import { PostFX } from './canvas/PostFX'
import { TopLeftLogo } from './hud/TopLeftLogo'
import { BottomLeftSound } from './hud/BottomLeftSound'
import { ScrollHint } from './hud/ScrollHint'
import { CitizenshipCTA } from './hud/CitizenshipCTA'
import { CeremonyFallback } from './fallback/CeremonyFallback'
import { CeremonyErrorBoundary } from './fallback/CeremonyErrorBoundary'

/**
 * Feature detection for fallback. Runs on client only (component is mounted
 * via next/dynamic { ssr: false } in pages/homecoming/index.tsx).
 * Lazily initialized via useState so the value is stable across renders.
 */
function initialShouldFallback(): boolean {
  if (typeof window === 'undefined') return false
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  let noWebGL = false
  try {
    const c = document.createElement('canvas')
    noWebGL = !c.getContext('webgl2') && !c.getContext('webgl')
  } catch {
    noWebGL = true
  }
  return reducedMotion || noWebGL
}

type Props = { data: CeremonyData; replay: boolean }

export function Ceremony({ data, replay }: Props) {
  const spacerRef = useRef<HTMLDivElement>(null)
  const tier = useDeviceTier()
  const [featureFallback] = useState(initialShouldFallback)
  const loadTimedOut = useLoadTimeout(!featureFallback)
  const fallback = featureFallback || loadTimedOut

  // Hooks run unconditionally; effects no-op when fallback is active.
  useScrollListener(spacerRef, { enabled: !fallback })
  useIntroTimeline({ enabled: !fallback })
  useLenisSmooth({ enabled: !fallback })

  const maxDpr = useMemo(
    () =>
      Math.min(
        1.5,
        typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      ),
    [],
  )

  if (fallback) return <CeremonyFallback data={data} replay={replay} />

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <CeremonyErrorBoundary
          fallback={<CeremonyFallback data={data} replay={replay} />}
        >
          <Canvas
            camera={{ position: [0, 30, 0], fov: 45, near: 0.1, far: 2500 }}
            dpr={[1, maxDpr]}
            gl={{ antialias: tier >= 3, alpha: false }}
          >
            <color attach="background" args={['#1c0a04']} />
            <Suspense fallback={null}>
              <CameraRig />
              <SceneEnvironment />
              <MarsSurface tier={tier} />
              <ZLogoMonument />
              <ProofStack proofs={data.proofs} />
              <PortalStoneRings tier={tier} />
              <Chamber />
              <ZobuParticleForm modelUrl={data.zobu.modelUrl} tier={tier} />
              <LoadingGridline />
              <PostFX tier={tier} />
            </Suspense>
          </Canvas>
        </CeremonyErrorBoundary>
      </div>
      <div
        ref={spacerRef}
        style={{ height: `${SCROLL_SPACER_VH}vh`, pointerEvents: 'none' }}
      />
      <TopLeftLogo />
      <BottomLeftSound />
      <ScrollHint />
      <CitizenshipCTA handle={data.user.handle} replay={replay} />
      {/* SR-only narrative */}
      <section
        aria-label="Homecoming ceremony"
        style={{ position: 'absolute', left: -9999, width: 1, height: 1 }}
      >
        <h1>Homecoming</h1>
        <p>You have returned to the archive. Four proofs of your journey:</p>
        <ul>
          {data.proofs.map((p) => (
            <li key={p.id}>
              {p.count} {p.label}
            </li>
          ))}
        </ul>
        <p>The archive recognizes you. Become a citizen.</p>
      </section>
    </>
  )
}
