import React, { useMemo } from 'react';
import { Float, Environment } from '@react-three/drei';
import { EffectComposer, Vignette } from '@react-three/postprocessing';
import { PedestalMesh } from './PedestalMesh';
import { AvatarSlot } from './AvatarSlot';
import type { PedestalSlot } from '../../hooks/usePedestalSlots';

interface PedestalSceneProps {
  slots: PedestalSlot[];
  speakingMap?: Record<string, boolean>;
}

function FloatingParticles() {
  const count = 50;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = Math.random() * 5 + 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, []);

  return (
    <Float speed={0.5} rotationIntensity={0} floatIntensity={0.5}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#CFFF50"
          transparent
          opacity={0.4}
          sizeAttenuation
        />
      </points>
    </Float>
  );
}

// GLB models mapped to each slot for now
const SLOT_MODELS = [
  '/dashboard/models/zobu9.glb',   // Slot 0: YOU
  '/dashboard/models/zobu4.glb',   // Slot 1
  '/dashboard/models/zobu5.glb',   // Slot 2
  '/dashboard/models/zobu6.glb',   // Slot 3
  '/dashboard/models/zobu8.glb',   // Slot 4
];

export function PedestalScene({ slots, speakingMap = {} }: PedestalSceneProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[3, 5, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* Fill light from front-left */}
      <pointLight position={[-3, 3, 5]} intensity={0.8} color="#ffffff" />
      {/* Fill light from front-right */}
      <pointLight position={[3, 3, 5]} intensity={0.8} color="#ffffff" />
      {/* Rim light from behind */}
      <pointLight position={[0, 3, -3]} intensity={0.5} color="#ffffff" />

      {/* Environment — visible as background */}
      <Environment preset="sunset" background />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#050508" metalness={0.9} roughness={0.4} />
      </mesh>

      {/* Individual pedestals + avatar slots */}
      {slots.map((slot, i) => (
        <group key={i}>
          {/* Each slot gets its own pedestal */}
          <PedestalMesh
            position={slot.position}
            radius={slot.isSelf ? 0.5 : 0.4}
            isSelf={slot.isSelf}
          />
          <AvatarSlot
            position={slot.position}
            scale={slot.scale}
            modelUrl={SLOT_MODELS[i]}
            avatarUrl={slot.member?.avatar_url}
            nickname={slot.member?.nickname}
            isSelf={slot.isSelf}
            speaking={slot.member ? speakingMap[slot.member.code] || false : false}
            isEmpty={slot.isEmpty}
          />
        </group>
      ))}

      {/* Atmosphere — subtle fog to fade distant ground */}
      <fog attach="fog" args={['#0a0a15', 12, 25]} />

      {/* Post-processing */}
      <EffectComposer>
        <Vignette eskil={false} offset={0.3} darkness={0.8} />
      </EffectComposer>
    </>
  );
}
