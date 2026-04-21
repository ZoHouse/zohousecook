import { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { MeshGradient } from '@paper-design/shaders-react';
import * as THREE from 'three';

// Obsidian (samurai-fx #09) — 8 near-blacks with thin light streaks. Liquid metal.
const ABYSS_COLORS = [
  '#000000',
  '#14151C',
  '#1E1B24',
  '#55535E',
  '#1D1D26',
  '#111117',
  '#0A0A0D',
  '#000000',
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

      <EffectComposer multisampling={isLowEnd ? 0 : 4}>
        <Bloom
          intensity={isLowEnd ? 1 : 2.5}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.5}
          mipmapBlur={!isLowEnd}
        />
        <ChromaticAberration
          offset={isLowEnd ? new THREE.Vector2(0.004, 0.004) : new THREE.Vector2(0.01, 0.01)}
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
      {/* Obsidian liquid-metal shader — slow breathing darkness behind the 3D scene */}
      <MeshGradient
        colors={ABYSS_COLORS}
        speed={0.8}
        scale={1.6}
        distortion={0}
        swirl={0.1}
        grainMixer={0.01}
        grainOverlay={0}
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
