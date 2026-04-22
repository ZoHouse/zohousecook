import React from "react";
import { ZoLogoMark } from "./ZoLogoMark";
import { XpPill } from "./XpPill";
import { RankPill } from "./RankPill";
import { ProgressBar } from "./ProgressBar";
import { MenuDots } from "./MenuDots";
import type { RankMeta } from "../types";

interface Props {
  xp: number;
  rank: RankMeta | null;
  progressPct: number;
  chipColor: string;
}

export function HomecomingNav({ xp, rank, progressPct, chipColor }: Props) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(5,7,8,0.4)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px" }}>
        <ZoLogoMark />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <XpPill xp={xp} chipColor={chipColor} />
          <RankPill rank={rank} />
        </div>
        <MenuDots />
      </div>
      <ProgressBar pct={progressPct} chipColor={chipColor} />
    </header>
  );
}
