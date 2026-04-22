import { useEffect, useRef } from "react";
import type { RankMeta } from "../types";

export function useRankTransitions(
  activeRankKey: string,
  rankMap: Record<string, RankMeta | undefined | null>,
  onJump: (meta: RankMeta) => void,
) {
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (last.current === null) {
      last.current = activeRankKey;
      return;
    }
    if (activeRankKey !== last.current) {
      const meta = rankMap[activeRankKey];
      if (meta) onJump(meta);
      last.current = activeRankKey;
    }
  }, [activeRankKey, rankMap, onJump]);
}
