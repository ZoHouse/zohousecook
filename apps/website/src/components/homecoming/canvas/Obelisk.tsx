import React from "react";
import { Text } from "@react-three/drei";
import { ObeliskGlyph } from "./ObeliskGlyph";
import { OBELISK_WORLD_POSITIONS } from "../../../lib/homecoming/obeliskPositions";
import type { ObeliskKind, ObeliskStat } from "../types";

interface Props {
  index: 0 | 1 | 2 | 3;
  kind: ObeliskKind;
  stat: ObeliskStat;
  beatProgress: number;
  active: boolean;
  dormant: boolean;
  color: string;
  caption?: React.ReactNode;
}

export function Obelisk({ index, kind, stat, beatProgress, active, dormant, color, caption }: Props) {
  const rise = active ? Math.min(1, beatProgress * 2) : 0;
  const y = -3 + rise * 3;
  const height = 4;

  const numeralT = Math.max(0, (beatProgress - 0.2) / 0.8);
  const numeral = dormant ? 0 : Math.round(stat.count * Math.min(1, numeralT));

  const [worldX, , worldZ] = OBELISK_WORLD_POSITIONS[index];

  return (
    <group position={[worldX, y + height / 2, worldZ]}>
      <mesh>
        <boxGeometry args={[0.42, height, 0.42]} />
        <meshStandardMaterial color={"#0a0a0a"} roughness={0.6} metalness={0.5} />
      </mesh>

      {!dormant && (
        <ObeliskGlyph kind={kind} progress={Math.max(0, (beatProgress - 0.1) / 0.4)} color={color} />
      )}

      {!dormant && (
        <Text
          position={[0, 2.0, 0.22]}
          fontSize={0.6}
          color={"#FFFFFF"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0}
        >
          {numeral.toString()}
        </Text>
      )}

      {caption}
    </group>
  );
}
