import React, { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';

interface AvatarSlotProps {
  position: [number, number, number];
  scale?: number;
  modelUrl?: string;
  avatarUrl?: string;
  nickname?: string;
  isSelf?: boolean;
  speaking?: boolean;
  isEmpty?: boolean;
}

function ZobuModel({ url, scale = 1 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url);
  // Models are 1 unit tall (Y: -0.5 to 0.5), scale to ~1.8 units tall
  const s = scale * 1.8;
  return (
    <primitive
      object={scene.clone()}
      scale={[s, s, s]}
      position={[0, 0.9, 0]}
      rotation={[0, -Math.PI / 2, 0]}
    />
  );
}

export function AvatarSlot({
  position,
  scale = 1,
  modelUrl,
  avatarUrl,
  nickname,
  isSelf = false,
  speaking = false,
  isEmpty = false,
}: AvatarSlotProps) {
  const slotPosition: [number, number, number] = [
    position[0],
    position[1] + 0.12,
    position[2],
  ];

  return (
    <group position={slotPosition} scale={[scale, scale, scale]}>
      {modelUrl && (
        <Suspense fallback={null}>
          <ZobuModel url={modelUrl} scale={scale} />
        </Suspense>
      )}
    </group>
  );
}
