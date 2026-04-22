import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";

interface Props {
  from: [number, number, number];
  progress: number;
  color: string;
}

export function LightRibbon({ from, progress, color }: Props) {
  const { camera } = useThree();
  const lineRef = useRef<any>(null);
  const pointsRef = useRef<THREE.Vector3[]>([]);

  useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) arr.push(new THREE.Vector3());
    pointsRef.current = arr;
  }, []);

  useFrame(() => {
    if (progress <= 0.3 || progress >= 1.0) return;
    const target = camera.position;
    const arr = pointsRef.current;
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      arr[i].set(
        THREE.MathUtils.lerp(from[0], target.x, t),
        THREE.MathUtils.lerp(from[1], target.y, t) + Math.sin(t * Math.PI) * 1.2,
        THREE.MathUtils.lerp(from[2], target.z, t),
      );
    }
    if (lineRef.current && lineRef.current.geometry) {
      lineRef.current.geometry.setFromPoints(arr);
      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const opacity = (progress > 0.3 && progress < 1.0)
    ? Math.sin((progress - 0.3) / 0.7 * Math.PI)
    : 0;

  return (
    <Line ref={lineRef} points={pointsRef.current} color={color} lineWidth={2} transparent opacity={opacity} />
  );
}
