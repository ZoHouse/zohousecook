import { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { MeshGradient } from '@paper-design/shaders-react';
import * as THREE from 'three';

// Samurai FX #09 — Obsidian params, re-palette'd as liquid CHROME.
// Metallic needs sharp highlight-to-shadow stratification — that's the optical
// cue your brain reads as "polished metal" vs "flat silver paint". Palette
// cycles: pure highlight → light steel → mid steel → DEEP cool shadow → mid
// steel → light → highlight. Slight cool undertone (blue-gray, not warm).
const CHROME_COLORS = [
  '#FFFFFF',
  '#DDE3EC',
  '#9AA5B3',
  '#3F4652',
  '#1E232B',
  '#6B7480',
  '#C0C7D1',
  '#FFFFFF',
];

/** Aspect-aware camera framing. No scene geometry yet; kept for future additions. */
function AspectAwareCamera() {
  const { size, camera } = useThree();
  const aspect = size.width / Math.max(size.height, 1);

  useEffect(() => {
    let fov: number;
    let pos: [number, number, number];

    if (aspect > 1.0) {
      fov = 58;
      pos = [0, 0, 4.8];
    } else if (aspect >= 0.5) {
      fov = 72;
      pos = [0, 0.4, 3.8];
    } else {
      fov = 78;
      pos = [0, 0.5, 3.2];
    }

    const persp = camera as THREE.PerspectiveCamera;
    persp.fov = fov;
    persp.position.set(pos[0], pos[1], pos[2]);
    persp.lookAt(0, 0, -1);
    persp.updateProjectionMatrix();
  }, [aspect, camera]);

  return null;
}

function Scene({ isLowEnd }: { isLowEnd: boolean }) {
  return (
    <>
      <AspectAwareCamera />

      <ambientLight intensity={0.4} />

      {/* Chrome has deep shadows now, so highlights have room to pop without
          blowing out. Bloom kicks only on the brightest highlight streaks. */}
      <EffectComposer multisampling={isLowEnd ? 0 : 4}>
        <Bloom
          intensity={isLowEnd ? 0.4 : 0.7}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.35}
          mipmapBlur={!isLowEnd}
        />
        <ChromaticAberration
          offset={isLowEnd ? new THREE.Vector2(0.003, 0.003) : new THREE.Vector2(0.005, 0.005)}
          radialModulation={false}
          modulationOffset={0}
        />
      </EffectComposer>
    </>
  );
}

/**
 * Low-end heuristic: dial down Bloom + ChromaticAberration on weak devices
 * so we stay at 60fps. Browser-only — component is ssr:false via dynamic import.
 */
function detectLowEnd(): boolean {
  if (typeof window === 'undefined') return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (cores < 4) return true;
  if (/Android/i.test(navigator.userAgent)) return true;
  if (window.matchMedia?.('(max-width: 480px) and (max-resolution: 2dppx)').matches) return true;
  return false;
}

export function LobbyBackground3D() {
  const isLowEnd = useMemo(detectLowEnd, []);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Obsidian params + chrome palette = liquid chrome. Swirl bumped
          slightly for more reflection flow; grain mix bumped for metal tooth. */}
      <MeshGradient
        colors={CHROME_COLORS}
        speed={0.83}
        scale={0.4}
        distortion={0}
        swirl={0.25}
        grainMixer={0.04}
        grainOverlay={0.02}
        fit="cover"
        style={{ position: 'absolute', inset: 0 }}
      />
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 58 }}
        gl={{ antialias: !isLowEnd, alpha: true, powerPreference: 'high-performance' }}
        dpr={isLowEnd ? [1, 1.25] : [1, 1.75]}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene isLowEnd={isLowEnd} />
      </Canvas>
    </div>
  );
}
