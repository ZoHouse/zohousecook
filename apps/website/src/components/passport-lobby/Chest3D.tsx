import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
// KayKit Dungeon Remastered chest (CC0) — see assets/3d/CREDITS.md. Imported
// through webpack (asset/resource) so it's fingerprinted into the bundle;
// public/ 404s in this monorepo's prod build.
import CHEST_URL from '../../assets/3d/chest_gold.glb';

useGLTF.preload(CHEST_URL as string);

export interface Chest3DProps {
  /** Square canvas edge in px. */
  size?: number;
  onClick?: () => void;
}

// The chest model + its "straining to open" loot-box animation. The GLB has no
// baked clip, but the lid (`chest_gold_lid`) is a separate node, so we drive an
// anticipation rattle procedurally: a calm float, punctuated every ~2.6s by a
// burst where the whole chest jitters and the lid strains up then snaps shut —
// the universal "tap me, I'm about to pop" game-loot cue.
function ChestModel() {
  const { scene } = useGLTF(CHEST_URL as string);
  const root = useMemo(() => scene.clone(true), [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Object3D | null>(null);

  // Center the model at the origin and scale its largest dimension to ~2 units
  // so framing is independent of the GLB's authored transform.
  const { fitScale, center } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const c = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(c);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return { fitScale: 2 / maxDim, center: c };
  }, [root]);

  useLayoutEffect(() => {
    root.traverse((o) => {
      if (o.name === 'chest_gold_lid') lidRef.current = o;
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [root]);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.getElapsedTime();

    // Anticipation envelope: a half-sine burst at the start of each cycle.
    const cycle = t % 2.6;
    const burst = cycle < 0.85 ? Math.sin((cycle / 0.85) * Math.PI) : 0;

    // Calm float + a small hop on the burst.
    g.position.y = Math.sin(t * 1.4) * 0.03 + burst * 0.07;
    // Fast side-to-side jitter, scaled by the burst envelope.
    g.rotation.z = Math.sin(t * 40) * 0.06 * burst;
    g.rotation.y = Math.sin(t * 0.5) * 0.12; // slow showcase turn

    // Lid strains up during the burst, with its own micro-rattle, then settles.
    if (lidRef.current) {
      lidRef.current.rotation.x = -(burst * 0.32) - Math.sin(t * 44) * 0.05 * burst;
    }
  });

  return (
    <group ref={groupRef} scale={fitScale} position={[0, -0.15, 0]}>
      <group position={[-center.x, -center.y, -center.z]}>
        <primitive object={root} />
      </group>
    </group>
  );
}

/**
 * 3D treasure chest for the loot-box modal — mirrors the lobby's 3D-on-a-
 * pedestal hero treatment (transparent canvas, soft studio lighting), but the
 * model rattles like a game loot item begging to be opened.
 */
export function Chest3D({ size = 260, onClick }: Chest3DProps) {
  return (
    <div
      style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <Canvas
        camera={{ position: [2.4, 1.7, 3.2], fov: 30 }}
        dpr={[1, 2]}
        gl={{
          alpha: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 6, 5]} intensity={1.1} />
        <directionalLight position={[-3, 2, -2]} intensity={0.3} />
        {/* Warm key glow so the gold reads rich, not flat. */}
        <pointLight position={[0, 1.5, 2.5]} intensity={0.6} color="#FFD37A" />
        <Suspense fallback={null}>
          <ChestModel />
          <Environment preset="apartment" />
        </Suspense>
      </Canvas>
    </div>
  );
}
