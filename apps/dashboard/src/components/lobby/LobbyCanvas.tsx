import React, { Suspense, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';

interface LobbyCanvasProps {
  children?: React.ReactNode;
}

function LockedCamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.rotation.set(0.289, -0.102, 0.030);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

export function LobbyCanvas({ children }: LobbyCanvasProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <Canvas
      camera={{
        position: isMobile ? [-0.80, 0.40, 8.5] : [-0.80, 0.27, 7.50],
        fov: isMobile ? 55 : 50,
      }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        {children}
        <LockedCamera />
      </Suspense>
    </Canvas>
  );
}
