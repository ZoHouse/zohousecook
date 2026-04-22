import React from "react";

export function ZoLogoMark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontFamily: "Akira, Unbounded, Rubik", fontWeight: 900, fontSize: 20 }}>\z/</span>
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>Zo World</div>
        <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Follow Your Heart
        </div>
      </div>
    </div>
  );
}
