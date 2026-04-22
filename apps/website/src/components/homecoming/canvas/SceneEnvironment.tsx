import React, { useMemo } from "react";
import * as THREE from "three";

interface Props { warmth: number }

export function SceneEnvironment({ warmth }: Props) {
  const fogColor = useMemo(() => {
    const cold = new THREE.Color("#B8C4CE");
    const warm = new THREE.Color("#FEDD1E");
    return cold.clone().lerp(warm, warmth);
  }, [warmth]);

  const ambientColor = useMemo(() => {
    const cold = new THREE.Color("#7C8B99");
    const warm = new THREE.Color("#FFBF60");
    return cold.clone().lerp(warm, warmth);
  }, [warmth]);

  return (
    <>
      <color attach="background" args={["#050708"]} />
      <fog attach="fog" args={[fogColor, 3, 22]} />
      <ambientLight color={ambientColor} intensity={0.3} />
      <directionalLight position={[0, 8, -4]} intensity={0.7} color={"#EDE3C0"} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow={false}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={"#0a0c10"} roughness={0.4} metalness={0.3} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[2.8, 3.0, 64]} />
        <meshBasicMaterial color={"#F1563F"} transparent opacity={0.3 + warmth * 0.5} />
      </mesh>
    </>
  );
}
