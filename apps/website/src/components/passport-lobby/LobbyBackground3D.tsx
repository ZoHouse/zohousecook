import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { MeshGradient } from '@paper-design/shaders-react';
import * as THREE from 'three';

const CA_OFFSET = new THREE.Vector2(0.015, 0.015);

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

function Scene() {
  return (
    <>
      <ambientLight intensity={0.15} />

      <WireCube />
      <ReflectiveFloor />

      {/* Bright white lights — Bloom + ChromaticAberration turn these into
          iridescent prism-refraction halos. */}
      <LightSource position={[-4.2, -0.2, -4.9]} size={0.55} />
      <LightSource position={[4.2, -0.2, -4.9]} size={0.55} />
      <LightSource position={[0, 0.4, -4.95]} size={0.5} />
      <LightSource position={[-6.9, 0.3, -1.5]} size={0.4} />
      <LightSource position={[6.9, 0.3, -1.5]} size={0.4} />

      {/* God-ray from above */}
      <spotLight
        position={[0, 3.2, -2]}
        intensity={10}
        angle={0.6}
        penumbra={0.9}
        color="#ffffff"
        distance={14}
      />

      <EffectComposer multisampling={4}>
        <Bloom
          intensity={5}
          luminanceThreshold={0.5}
          luminanceSmoothing={0.5}
          mipmapBlur
        />
        <ChromaticAberration offset={CA_OFFSET} radialModulation={false} modulationOffset={0} />
      </EffectComposer>
    </>
  );
}

export function LobbyBackground3D() {
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
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.75]}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
