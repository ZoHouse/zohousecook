import React from "react";
import { Canvas } from "@react-three/fiber";
import { CameraRig } from "./CameraRig";
import { SceneEnvironment } from "./SceneEnvironment";
import { ParticleField } from "./ParticleField";

interface Props { warmth: number; children?: React.ReactNode }

export function HomecomingCanvas({ warmth, children }: Props) {
  return (
    <div style={{ position: "sticky", top: 0, height: "100vh", zIndex: 1 }}>
      <Canvas
        dpr={[1, typeof window !== "undefined" && window.innerWidth <= 768 ? 1 : 1.5]}
        shadows={false}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 1.6, 6], fov: 40 }}
      >
        <CameraRig />
        <SceneEnvironment warmth={warmth} />
        <ParticleField density={warmth < 0.5 ? 1 : 0.4} />
        {children}
      </Canvas>
    </div>
  );
}
