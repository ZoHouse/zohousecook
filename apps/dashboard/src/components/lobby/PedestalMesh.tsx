import React, { useRef } from 'react';
import { Mesh } from 'three';

interface PedestalMeshProps {
  radius?: number;
  height?: number;
  position?: [number, number, number];
  isSelf?: boolean;
}

export function PedestalMesh({
  radius = 0.6,
  height = 0.12,
  position = [0, 0, 0],
  isSelf = false,
}: PedestalMeshProps) {
  const meshRef = useRef<Mesh>(null);

  return (
    <group position={position}>
      {/* Main platform */}
      <mesh ref={meshRef} position={[0, height / 2, 0]} receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.08, height, 48]} />
        <meshStandardMaterial
          color={isSelf ? '#0f0f1a' : '#0a0a12'}
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* Top surface */}
      <mesh position={[0, height + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial
          color="#0a0a12"
          metalness={0.9}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}
