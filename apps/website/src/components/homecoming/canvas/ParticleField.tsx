import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props { density: number; count?: number }

export function ParticleField({ density, count = 400 }: Props) {
  const activeCount = Math.max(0, Math.floor(count * density));
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(activeCount * 3);
    for (let i = 0; i < activeCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = -Math.random() * 20;
    }
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [activeCount]);

  const mat = useMemo(
    () => new THREE.PointsMaterial({ color: "#B8C4CE", size: 0.04, transparent: true, opacity: 0.65 }),
    []
  );

  const pointsRef = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    const p = pointsRef.current;
    if (!p) return;
    const pos = (p.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < activeCount; i++) {
      pos[i * 3 + 0] += delta * 0.12;
      if (pos[i * 3 + 0] > 10) pos[i * 3 + 0] = -10;
    }
    (p.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  if (activeCount === 0) return null;
  return <points ref={pointsRef} geometry={geom} material={mat} />;
}
