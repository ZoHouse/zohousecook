// apps/website/src/components/homecoming/canvas/AmbientParticles.tsx
//
// Lightweight r3f particle field for atmospheric depth. Mounted via
// React.lazy in AmbientBackdrop so WebGL failure is caught silently.

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  warmth: number;
}

export default function AmbientParticles({ warmth }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        mixBlendMode: "screen",
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ position: [0, 0, 10], fov: 55 }}
      >
        <ParticleCloud count={220} warmth={warmth} />
      </Canvas>
    </div>
  );
}

function ParticleCloud({ count, warmth }: { count: number; warmth: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, material } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = -Math.random() * 20;
    }
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: "#B8C4CE",
      size: 0.05,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: geom, material: mat };
  }, [count]);

  useFrame((_, delta) => {
    const p = pointsRef.current;
    if (!p) return;
    const pos = (p.geometry.attributes.position as THREE.BufferAttribute)
      .array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] += delta * 0.08;
      if (pos[i * 3 + 0] > 11) pos[i * 3 + 0] = -11;
    }
    (p.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    // Colour warms slightly with warmth prop
    const col = new THREE.Color("#B8C4CE").lerp(new THREE.Color("#FEDD1E"), warmth);
    (p.material as THREE.PointsMaterial).color.copy(col);
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
