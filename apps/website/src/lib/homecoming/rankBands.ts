// apps/website/src/lib/homecoming/rankBands.ts

import type { RankKey } from "../../components/homecoming/types";

// Display metadata ONLY. Backend owns the real thresholds; frontend never
// computes rank from XP. We use this for fallback styling if the payload
// omits chip_color for some reason. ObeliskStat.rank_jump_to is authoritative
// at the point of a rank transition.
export const rankBandsByKey: Record<RankKey, { label: string; chip_color: string }> = {
  citizen_day_1: { label: "Day 1",      chip_color: "#CFFF50" },
  wanderer:      { label: "Wanderer",   chip_color: "#A7D921" },
  nomad:         { label: "Nomad",      chip_color: "#89B020" },
  pathfinder:    { label: "Pathfinder", chip_color: "#DCFF80" },
  explorer:      { label: "Explorer",   chip_color: "#FEDD1E" },
  legendary:     { label: "Legendary",  chip_color: "#FEDD1E" },
};
