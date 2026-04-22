// apps/website/src/components/homecoming/HomecomingStage.tsx

import React, { useCallback, useMemo, useState } from "react";
import { ScrollRail } from "./ScrollRail";
import { HomecomingNav } from "./nav/HomecomingNav";
import { HomecomingCanvas } from "./canvas/HomecomingCanvas";
import { Obelisk } from "./canvas/Obelisk";
import { LightRibbon } from "./canvas/LightRibbon";
import { PassportCardMesh } from "./canvas/PassportCardMesh";
import { BeatCopy } from "./overlay/BeatCopy";
import { ObeliskCaption } from "./overlay/ObeliskCaption";
import { FloatingXpPill } from "./overlay/FloatingXpPill";
import { TakePassportHint } from "./overlay/TakePassportHint";
import { StickyEnterButton } from "./overlay/StickyEnterButton";
import { useBeatProgress } from "./hooks/useBeatProgress";
import { useRankTransitions } from "./hooks/useRankTransitions";
import { useCompleteHomecoming } from "./hooks/useCompleteHomecoming";
import { rankBandsByKey } from "../../lib/homecoming/rankBands";
import { OBELISK_WORLD_POSITIONS } from "../../lib/homecoming/obeliskPositions";
import type { HomecomingPayload, RankMeta, ObeliskKind } from "./types";
import { ReducedMotionStack } from "./fallback/ReducedMotionStack";

interface Props { payload: HomecomingPayload; replay: boolean }

interface Flyer { id: number; amount: number; rank?: RankMeta }

const KINDS: ObeliskKind[] = ["destinations", "nights", "zostels", "tribe"];
const CAPTION_LABELS = ["Destinations Unlocked", "Nights Stayed", "Zostels Unlocked", "Tribe Count"];
const RIBBON_COLORS = ["#F1563F", "#A7D921", "#FEDD1E", "#FEDD1E"];

export function HomecomingStage({ payload, replay }: Props) {
  // All hooks first — rules of hooks
  const [reducedMotion, setReducedMotion] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const { complete, firing } = useCompleteHomecoming({ replay });

  const stats = [payload.destinations, payload.nights, payload.zostels, payload.tribe];

  // Map rank_key → RankMeta from this payload's own data + final_rank
  const rankMap = useMemo(() => {
    const map: Record<string, RankMeta | undefined | null> = {};
    stats.forEach((s) => { if (s.rank_jump_to) map[s.rank_jump_to.key] = s.rank_jump_to; });
    map[payload.final_rank.key] = payload.final_rank;
    return map;
  }, [payload]);

  const onDismissFlyer = useCallback(
    (id: number) => setFlyers((prev) => prev.filter((f) => f.id !== id)),
    [],
  );

  // Then the reduced-motion guard — after all hooks
  if (reducedMotion) {
    return <ReducedMotionStack payload={payload} onTap={complete} />;
  }

  return (
    <ScrollRail>
      <StageInner
        payload={payload}
        flyers={flyers}
        setFlyers={setFlyers}
        rankMap={rankMap}
        onTap={complete}
        onDismissFlyer={onDismissFlyer}
        firing={firing}
      />
    </ScrollRail>
  );
}

interface StageInnerProps {
  payload: HomecomingPayload;
  flyers: Flyer[];
  setFlyers: React.Dispatch<React.SetStateAction<Flyer[]>>;
  rankMap: Record<string, RankMeta | undefined | null>;
  onTap: () => void;
  onDismissFlyer: (id: number) => void;
  firing: boolean;
}

function StageInner({
  payload, flyers, setFlyers, rankMap, onTap, onDismissFlyer, firing,
}: StageInnerProps) {
  const { beatIndex, beatProgress, xp, activeRankKey } = useBeatProgress(payload);
  const stats = [payload.destinations, payload.nights, payload.zostels, payload.tribe];

  const activeRankMeta = rankBandsByKey[activeRankKey as keyof typeof rankBandsByKey];
  const activeRank: RankMeta | null = activeRankMeta
    ? { key: activeRankKey as RankMeta["key"], label: activeRankMeta.label, chip_color: activeRankMeta.chip_color }
    : null;

  // Fire a flyer on rank transitions
  useRankTransitions(activeRankKey, rankMap, (meta: RankMeta) => {
    const idx = stats.findIndex((s) => s.rank_jump_to?.key === meta.key);
    const amount = idx >= 0 ? stats[idx].xp : 0;
    setFlyers((prev) => [...prev, { id: Date.now() + Math.random(), amount, rank: meta }]);
  });

  const warmth = beatIndex >= 6 ? 1 : beatIndex >= 4 ? 0.4 : 0;
  const chipColor = activeRank?.chip_color ?? "#F1563F";

  // Spec Beat 2 has no XP number on the pill; XP starts visible at Beat 3 (index 2).
  const navXp = beatIndex >= 2 ? xp : 0;
  // Rank pill only appears after the first rank-jump beat (Beat 5 = index 4).
  const navRank = beatIndex >= 4 ? activeRank : null;

  const beat7Visible = beatIndex === 7;
  const showSticky = beat7Visible && beatProgress > 0.5;

  return (
    <>
      <HomecomingNav
        xp={navXp}
        rank={navRank}
        progressPct={(beatIndex + beatProgress) / 8}
        chipColor={chipColor}
      />

      <HomecomingCanvas warmth={warmth}>
        {stats.map((stat, i) => {
          const active = beatIndex >= 3 + i;
          const thisBeatProgress = beatIndex === 3 + i ? beatProgress : active ? 1 : 0;
          const captionProgress = beatIndex === 3 + i ? beatProgress : beatIndex > 3 + i ? 1 : 0;
          return (
            <React.Fragment key={i}>
              <Obelisk
                index={i as 0 | 1 | 2 | 3}
                kind={KINDS[i]}
                stat={stat}
                beatProgress={thisBeatProgress}
                active={active}
                dormant={!payload.has_journey}
                color={RIBBON_COLORS[i]}
                caption={
                  <ObeliskCaption
                    label={CAPTION_LABELS[i]}
                    stat={stat}
                    progress={captionProgress}
                    dormant={!payload.has_journey}
                  />
                }
              />
              <LightRibbon
                from={OBELISK_WORLD_POSITIONS[i]}
                progress={thisBeatProgress}
                color={RIBBON_COLORS[i]}
              />
            </React.Fragment>
          );
        })}
        <PassportCardMesh payload={payload} visible={beat7Visible} onTap={onTap} />
      </HomecomingCanvas>

      <div style={{ position: "sticky", top: 0, height: "100vh", pointerEvents: "none", zIndex: 10 }}>
        <BeatCopy beat={beatIndex} payload={payload} />
        <TakePassportHint visible={beat7Visible} hasJourney={payload.has_journey} />
      </div>

      <FloatingXpPill flyers={flyers} onDone={onDismissFlyer} />
      <StickyEnterButton visible={showSticky && !firing} onEnter={onTap} />
    </>
  );
}
