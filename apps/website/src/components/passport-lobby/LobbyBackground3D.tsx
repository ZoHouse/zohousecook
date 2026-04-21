import { useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
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

const CUBE_W = 14;
const CUBE_H = 7;
const CUBE_D = 10;
const FLOOR_Y = -CUBE_H / 2;

type OrbSpec = { position: [number, number, number]; size: number };

// Desktop: bursts at eye level, hugging the back + side walls.
const DESKTOP_ORBS: OrbSpec[] = [
  { position: [-4.2, -0.2, -4.9], size: 0.55 },
  { position: [4.2, -0.2, -4.9], size: 0.55 },
  { position: [0, 0.4, -4.95], size: 0.5 },
  { position: [-6.9, 0.3, -1.5], size: 0.4 },
  { position: [6.9, 0.3, -1.5], size: 0.4 },
];

// Mobile: bursts sit BEHIND the hero card (x≈0, y mid-upper where the card
// appears on screen, z deep). Reads as a glowing halo around the player
// rather than ambient floor light.
const MOBILE_ORBS: OrbSpec[] = [
  // Central burst directly behind the card — the main halo
  { position: [0, 0.8, -6.2], size: 0.75 },
  // Two flanking bursts to spread color + prism split
  { position: [-2.4, 0.6, -5.8], size: 0.5 },
  { position: [2.4, 0.6, -5.8], size: 0.5 },
  // Upper accent — hints of light cresting above the card
  { position: [0, 2.0, -5], size: 0.4 },
  // Subtle side-wall bounces
  { position: [-6.5, 0.4, -2.5], size: 0.35 },
  { position: [6.5, 0.4, -2.5], size: 0.35 },
];

function WireCube() {
  const edges = useMemo(() => {
    const box = new THREE.BoxGeometry(CUBE_W, CUBE_H, CUBE_D);
    const geom = new THREE.EdgesGeometry(box);
    box.dispose();
    return geom;
  }, []);
  return (
    <lineSegments geometry={edges}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.85} toneMapped={false} />
    </lineSegments>
  );
}

/**
 * A pure-white emissive orb. Combined with high Bloom + ChromaticAberration
 * it blooms into an iridescent rainbow halo — the prism-refraction look.
 */
function LightSource({ position, size = 0.45 }: { position: [number, number, number]; size?: number }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 24, 24]} />
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </mesh>
  );
}

function ReflectiveFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]}>
      <planeGeometry args={[CUBE_W, CUBE_D]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={55}
        roughness={0.75}
        depthScale={1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#050505"
        metalness={0.6}
        mirror={0.7}
      />
    </mesh>
  );
}

/**
 * Picks camera fov/position and orb layout from the current viewport aspect.
 * Lives inside <Canvas> so it can read the live R3F size + drive the default camera.
 */
function AspectAwareCamera({ onLayout }: { onLayout: (orbs: OrbSpec[]) => void }) {
  const { size, camera } = useThree();
  const aspect = size.width / Math.max(size.height, 1);

  useEffect(() => {
    let fov: number;
    let pos: [number, number, number];
    let orbs: OrbSpec[];

    if (aspect > 1.0) {
      // Landscape / desktop — original tuning
      fov = 58;
      pos = [0, 0, 4.8];
      orbs = DESKTOP_ORBS;
    } else if (aspect >= 0.5) {
      // Standard portrait (most phones) — wider fov + closer camera so the cube fills vertically
      fov = 72;
      pos = [0, 0.4, 3.8];
      orbs = MOBILE_ORBS;
    } else {
      // Very narrow portrait (small phones / split-screen)
      fov = 78;
      pos = [0, 0.5, 3.2];
      orbs = MOBILE_ORBS;
    }

    const persp = camera as THREE.PerspectiveCamera;
    persp.fov = fov;
    persp.position.set(pos[0], pos[1], pos[2]);
    persp.lookAt(0, 0, -1);
    persp.updateProjectionMatrix();
    onLayout(orbs);
  }, [aspect, camera, onLayout]);

  return null;
}

function Scene({ isLowEnd }: { isLowEnd: boolean }) {
  const [orbs, setOrbs] = useState<OrbSpec[]>(DESKTOP_ORBS);

  return (
    <>
      <AspectAwareCamera onLayout={setOrbs} />

      <ambientLight intensity={0.15} />

      <WireCube />
      <ReflectiveFloor />

      {/* Bright white lights — Bloom + ChromaticAberration turn these into
          iridescent prism-refraction halos. */}
      {orbs.map((orb, i) => (
        <LightSource key={i} position={orb.position} size={orb.size} />
      ))}

      {/* God-ray from above */}
      <spotLight
        position={[0, 3.2, -2]}
        intensity={10}
        angle={0.6}
        penumbra={0.9}
        color="#ffffff"
        distance={14}
      />

      <EffectComposer multisampling={isLowEnd ? 0 : 4}>
        <Bloom
          intensity={isLowEnd ? 1.5 : 5}
          luminanceThreshold={0.5}
          luminanceSmoothing={0.5}
          mipmapBlur={!isLowEnd}
        />
        <ChromaticAberration
          offset={isLowEnd ? new THREE.Vector2(0.006, 0.006) : new THREE.Vector2(0.015, 0.015)}
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
