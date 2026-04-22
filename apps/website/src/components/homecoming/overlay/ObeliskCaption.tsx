import React from "react";
import { Html } from "@react-three/drei";
import type { ObeliskStat } from "../types";

interface Props {
  label: string;
  stat: ObeliskStat;
  progress: number;
  dormant: boolean;
}

export function ObeliskCaption({ label, stat, progress, dormant }: Props) {
  const opacity = dormant ? 0.35 : Math.max(0, Math.min(1, (progress - 0.2) / 0.4));
  return (
    <Html
      position={[0, -2.4, 0]}
      center
      distanceFactor={10}
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{
          textAlign: "center",
          opacity,
          transition: "opacity 300ms",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{
          fontFamily: "Rubik, sans-serif",
          fontWeight: 600,
          fontSize: 14,
          color: "rgba(255,255,255,0.9)",
          marginBottom: 4,
        }}>
          {label}
        </div>
        <div style={{ fontSize: 11, opacity: 0.65, color: "#fff" }}>✨ {stat.caption}</div>
      </div>
    </Html>
  );
}
