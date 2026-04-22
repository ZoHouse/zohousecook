import React from "react";
import type { ObeliskKind } from "../types";

interface Props {
  kind: ObeliskKind;
  progress: number;
  color: string;
}

export function ObeliskGlyph({ kind, progress, color }: Props) {
  const opacity = Math.max(0, Math.min(1, progress));

  switch (kind) {
    case "destinations":
      return (
        <mesh position={[0, 2.6, 0.21]}>
          <ringGeometry args={[0.12, 0.14, 6]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
      );
    case "nights":
      return (
        <group position={[0, 2.6, 0.21]}>
          <mesh position={[-0.03, 0, 0]}>
            <circleGeometry args={[0.16, 32]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.02, 0, 0.001]}>
            <circleGeometry args={[0.15, 32]} />
            <meshBasicMaterial color={"#050708"} transparent opacity={opacity} />
          </mesh>
        </group>
      );
    case "zostels":
      return (
        <group position={[0, 2.6, 0.21]}>
          <mesh>
            <coneGeometry args={[0.16, 0.18, 3]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
          </mesh>
        </group>
      );
    case "tribe":
      return (
        <group position={[0, 2.6, 0.21]}>
          {[-0.5, 0.5, 1.5].map((r, i) => (
            <mesh key={i} rotation={[0, 0, (r * Math.PI) / 3]} position={[Math.sin(i) * 0.08, Math.cos(i) * 0.08, 0]}>
              <ringGeometry args={[0.09, 0.11, 32]} />
              <meshBasicMaterial color={color} transparent opacity={opacity} />
            </mesh>
          ))}
        </group>
      );
  }
}
