import React from "react";

interface Props { onSkip?: () => void }

export function MenuDots({ onSkip }: Props) {
  return (
    <button
      aria-label="Menu"
      onClick={onSkip}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: 3,
        width: 24,
        height: 24,
        padding: 2,
      }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <span key={i} style={{ width: 6, height: 6, background: "rgba(255,255,255,0.85)", borderRadius: 3 }} />
      ))}
    </button>
  );
}
