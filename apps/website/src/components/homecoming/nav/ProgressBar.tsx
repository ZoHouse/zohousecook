import React from "react";

interface Props {
  pct: number;
  chipColor: string;
}

export function ProgressBar({ pct, chipColor }: Props) {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div style={{ height: 2, width: "100%", background: "rgba(255,255,255,0.06)", position: "relative" }}>
      <div
        style={{
          height: "100%",
          width: `${clamped * 100}%`,
          background: chipColor,
          boxShadow: `0 0 12px ${chipColor}`,
          transition: "background 400ms, box-shadow 400ms",
        }}
      />
    </div>
  );
}
