import { useMemo } from "react";
import { useScrollProgress } from "../ScrollRail";
import { getBeatState } from "../../../lib/homecoming/beatTimeline";
import type { HomecomingPayload } from "../types";

interface BeatState {
  beatIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  beatProgress: number;
  xp: number;
  activeRankKey: string;
}

export function useBeatProgress(payload: HomecomingPayload): BeatState {
  const { progress } = useScrollProgress();

  return useMemo(() => {
    const { beatIndex, beatProgress } = getBeatState(progress);

    const stats = [payload.destinations, payload.nights, payload.zostels, payload.tribe];
    let xp = payload.starting_xp;
    let activeRankKey = "citizen_day_1";

    for (let i = 0; i < 4; i++) {
      const obeliskBeat = 3 + i;
      if (beatIndex > obeliskBeat) {
        xp += stats[i].xp;
        if (stats[i].rank_jump_to) activeRankKey = stats[i].rank_jump_to!.key;
      } else if (beatIndex === obeliskBeat) {
        xp += stats[i].xp * beatProgress;
        if (stats[i].rank_jump_to && beatProgress > 0.6) {
          activeRankKey = stats[i].rank_jump_to!.key;
        }
        break;
      }
    }

    if (beatIndex === 7) {
      activeRankKey = payload.final_rank.key;
    }

    return { beatIndex: beatIndex as BeatState["beatIndex"], beatProgress, xp, activeRankKey };
  }, [progress, payload]);
}
