import React from "react";
import type { HomecomingPayload } from "../types";

interface Props { payload: HomecomingPayload }

export function PassportCardFace({ payload }: Props) {
  return (
    <div
      style={{
        width: 320,
        padding: 18,
        borderRadius: 16,
        background: "linear-gradient(160deg, #1a1a1a, #0a0a0a)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#fff",
        fontFamily: "Rubik, sans-serif",
        boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <img src={payload.avatar_image} alt="" style={{ width: 72, height: 72, borderRadius: 12, background: "#222" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontFamily: "Akira, Unbounded, Rubik", fontWeight: 900, fontSize: 22 }}>{payload.handle}</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>Citizen of Zo World</div>
        </div>
        <div style={{
          marginLeft: "auto",
          width: 56, height: 56,
          borderRadius: "50%",
          background: "#E03A2F",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontSize: 9,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.1,
        }}>
          SINCE<br/>{payload.citizen_since}
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          padding: "4px 10px",
          borderRadius: 100,
          background: payload.final_rank.chip_color,
          color: "#111",
          fontSize: 12,
          fontWeight: 800,
        }}>
          {payload.final_rank.label}
        </div>
        <div style={{ fontWeight: 700 }}>{payload.total_xp.toLocaleString()} XP</div>
      </div>

      <div style={{ marginTop: 10, height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 1 }}>
        <div style={{ width: "70%", height: "100%", background: payload.final_rank.chip_color }} />
      </div>

      <a
        href="/leaderboard"
        onClick={(e) => e.preventDefault()}
        style={{ marginTop: 10, display: "inline-block", color: "#CFFF50", fontSize: 12, fontWeight: 700 }}
      >
        Leaderboard →
      </a>
    </div>
  );
}
