// apps/website/src/components/homecoming/HomecomingStage.tsx
//
// DOM-first cinematic stage. The 3D canvas is intentionally minimal (only
// ambient fog + particles) — every beat's hero content is DOM, so layout is
// predictable at every viewport width and WebGL failure degrades gracefully.
//
// Beats:
//   0  cold open (logo breathing in void)
//   1  welcome back (hero line + handle + CTA)
//   2  "your heart is being read..." summoning
//   3  card 1 lands (Destinations)
//   4  card 2 lands (Nights)         + Nomad sigil
//   5  card 3 lands (Zostels)
//   6  card 4 lands (Tribe)          + Legendary transfiguration
//   7  passport card + "your journey has been of a legend" verdict

import React, { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollRail } from "./ScrollRail";
import { HomecomingNav } from "./nav/HomecomingNav";
import { AmbientBackdrop } from "./canvas/AmbientBackdrop";
import { PassportCardFace } from "./canvas/PassportCardFace";
import { FloatingXpPill } from "./overlay/FloatingXpPill";
import { StickyEnterButton } from "./overlay/StickyEnterButton";
import { useBeatProgress } from "./hooks/useBeatProgress";
import { useRankTransitions } from "./hooks/useRankTransitions";
import { useCompleteHomecoming } from "./hooks/useCompleteHomecoming";
import { rankBandsByKey } from "../../lib/homecoming/rankBands";
import { ReducedMotionStack } from "./fallback/ReducedMotionStack";
import type { HomecomingPayload, RankMeta } from "./types";

interface Props {
  payload: HomecomingPayload;
  replay: boolean;
}

interface Flyer {
  id: number;
  amount: number;
  rank?: RankMeta;
}

const CARD_LABELS = [
  "Destinations Unlocked",
  "Nights Stayed",
  "Zostels Unlocked",
  "Tribe Count",
];
const CARD_ACCENTS = ["#F1563F", "#A7D921", "#FEDD1E", "#FEDD1E"];

export function HomecomingStage({ payload, replay }: Props) {
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

  const stats = useMemo(
    () => [payload.destinations, payload.nights, payload.zostels, payload.tribe],
    [payload],
  );

  const rankMap = useMemo(() => {
    const map: Record<string, RankMeta | undefined | null> = {};
    stats.forEach((s) => {
      if (s.rank_jump_to) map[s.rank_jump_to.key] = s.rank_jump_to;
    });
    map[payload.final_rank.key] = payload.final_rank;
    return map;
  }, [payload, stats]);

  const onDismissFlyer = useCallback(
    (id: number) => setFlyers((prev) => prev.filter((f) => f.id !== id)),
    [],
  );

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
  payload,
  flyers,
  setFlyers,
  rankMap,
  onTap,
  onDismissFlyer,
  firing,
}: StageInnerProps) {
  const { beatIndex, beatProgress, xp, activeRankKey } = useBeatProgress(payload);
  const stats = [payload.destinations, payload.nights, payload.zostels, payload.tribe];

  const activeRankMeta =
    rankBandsByKey[activeRankKey as keyof typeof rankBandsByKey];
  const activeRank: RankMeta | null = activeRankMeta
    ? {
        key: activeRankKey as RankMeta["key"],
        label: activeRankMeta.label,
        chip_color: activeRankMeta.chip_color,
      }
    : null;

  useRankTransitions(activeRankKey, rankMap, (meta: RankMeta) => {
    const idx = stats.findIndex((s) => s.rank_jump_to?.key === meta.key);
    const amount = idx >= 0 ? stats[idx].xp : 0;
    setFlyers((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), amount, rank: meta },
    ]);
  });

  const warmth = beatIndex >= 6 ? 1 : beatIndex >= 4 ? 0.4 : 0;
  const chipColor = activeRank?.chip_color ?? "#F1563F";

  const navXp = beatIndex >= 2 ? xp : 0;
  const navRank = beatIndex >= 4 ? activeRank : null;

  const beat7Visible = beatIndex === 7;
  const showSticky = beat7Visible && beatProgress > 0.5;

  // How many cards should be visible right now?
  // Beat 3 → 1 card; Beat 4 → 2; Beat 5 → 3; Beat 6 → 4; Beat 7 → still 4 (but collapses as passport rises).
  const visibleCardCount =
    beatIndex < 3 ? 0 : beatIndex === 7 ? 0 : Math.min(4, beatIndex - 2);

  return (
    <>
      <HomecomingNav
        xp={navXp}
        rank={navRank}
        progressPct={(beatIndex + beatProgress) / 8}
        chipColor={chipColor}
      />

      {/* Sticky stage: one 100vh viewport that holds every beat.
          The 800vh scroll rail behind drives beat transitions. */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <AmbientBackdrop warmth={warmth} />

        {/* BEAT 0/1 — Cold open + welcome */}
        <AnimatePresence mode="wait">
          {(beatIndex === 0 || beatIndex === 1) && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
              style={centered}
            >
              {beatIndex === 0 ? (
                <motion.div
                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    fontFamily: "Akira, Unbounded, Rubik, sans-serif",
                    fontWeight: 900,
                    fontSize: 96,
                    letterSpacing: "-0.05em",
                    color: "#EDE3C0",
                  }}
                >
                  \z/
                </motion.div>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.36em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: 24,
                    }}
                  >
                    Homecoming
                  </div>
                  <h1
                    style={{
                      fontFamily: "Akira, Unbounded, Rubik, sans-serif",
                      fontWeight: 900,
                      fontSize: "clamp(40px, 7vw, 88px)",
                      margin: 0,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.02,
                      color: "#fff",
                    }}
                  >
                    {payload.first_name
                      ? `${payload.first_name},`
                      : "Welcome"}
                    <br />
                    {payload.first_name ? "welcome back." : "home."}
                  </h1>
                  <div
                    style={{
                      marginTop: 18,
                      fontSize: 14,
                      opacity: 0.6,
                      fontFamily: "Rubik, sans-serif",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {payload.handle}
                  </div>
                  <div
                    style={{
                      marginTop: 56,
                      fontSize: 11,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      opacity: 0.45,
                    }}
                  >
                    ↓ Scroll to follow your heart
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* BEAT 2 — Summoning */}
        <AnimatePresence>
          {beatIndex === 2 && (
            <motion.div
              key="summoning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={centered}
            >
              <motion.div
                animate={{ opacity: [0.35, 0.75, 0.35] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  fontFamily: "Rubik, sans-serif",
                  fontWeight: 300,
                  fontSize: "clamp(22px, 3vw, 34px)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#fff",
                }}
              >
                Your heart is being read
              </motion.div>
              <div
                style={{
                  marginTop: 36,
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      background: "#F1563F",
                      display: "inline-block",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BEATS 3–6 — Card deck */}
        <AnimatePresence>
          {beatIndex >= 3 && beatIndex < 7 && (
            <motion.div
              key="cards-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                ...centered,
                width: "100%",
                padding: "0 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 40,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.36em",
                  textTransform: "uppercase",
                  opacity: 0.5,
                  color: "#fff",
                }}
              >
                Your Zostel Journey
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  alignItems: "stretch",
                  gap: 16,
                  maxWidth: 1100,
                  width: "100%",
                }}
              >
                {stats.map((s, i) => {
                  const isVisible = i < visibleCardCount;
                  const isRevealing =
                    i === visibleCardCount - 1 && beatIndex === 3 + i;
                  return (
                    <StatCard
                      key={i}
                      label={CARD_LABELS[i]}
                      stat={s}
                      accent={CARD_ACCENTS[i]}
                      visible={isVisible}
                      revealProgress={isRevealing ? beatProgress : isVisible ? 1 : 0}
                      dormant={!payload.has_journey}
                    />
                  );
                })}
              </div>

              {payload.has_journey && (
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.45,
                    fontFamily: "Rubik, sans-serif",
                    letterSpacing: "0.04em",
                  }}
                >
                  ✨ {stats[Math.max(0, visibleCardCount - 1)]?.caption}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* BEAT 7 — Passport verdict */}
        <AnimatePresence>
          {beat7Visible && (
            <motion.div
              key="verdict"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
              style={{
                ...centered,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 32,
                width: "100%",
                padding: "0 24px",
              }}
            >
              <h2
                style={{
                  fontFamily: "Akira, Unbounded, Rubik, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(28px, 4.2vw, 52px)",
                  margin: 0,
                  textAlign: "center",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  color: "#fff",
                  textShadow: payload.has_journey
                    ? "0 0 40px rgba(254,221,30,0.35)"
                    : "none",
                }}
              >
                {payload.has_journey
                  ? "Your journey has been of a legend."
                  : "Your journey begins here."}
              </h2>

              <motion.button
                onClick={onTap}
                disabled={firing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: firing ? "default" : "pointer",
                  pointerEvents: "auto",
                }}
                aria-label="Take your passport"
              >
                <PassportCardFace payload={payload} />
              </motion.button>

              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  opacity: 0.5,
                  color: "#fff",
                }}
              >
                {firing ? "Entering Zo World…" : "Tap to take your passport"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FloatingXpPill flyers={flyers} onDone={onDismissFlyer} />
      <StickyEnterButton visible={showSticky && !firing} onEnter={onTap} />
    </>
  );
}

// IMPORTANT: do NOT use transform-based centering here — framer-motion's
// animate={{ y, scale }} rewrites the element's transform and stomps
// translate(-50%,-50%). Use inset:0 + inner flex-center so motion is free
// to add its own transforms without breaking layout.
const centered: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  zIndex: 5,
  padding: "0 32px",
  pointerEvents: "none",
};

interface StatCardProps {
  label: string;
  stat: { count: number; xp: number; caption: string };
  accent: string;
  visible: boolean;
  revealProgress: number;
  dormant: boolean;
}

function StatCard({
  label,
  stat,
  accent,
  visible,
  revealProgress,
  dormant,
}: StatCardProps) {
  // Numeric count-up driven by reveal progress.
  const countUp = dormant ? 0 : Math.round(stat.count * Math.min(1, revealProgress * 1.2));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={
        visible
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 40, scale: 0.92 }
      }
      transition={{
        type: "spring",
        stiffness: 140,
        damping: 18,
        mass: 0.9,
      }}
      style={{
        flex: "1 1 180px",
        minWidth: 180,
        maxWidth: 240,
        aspectRatio: "3 / 4",
        padding: "22px 18px 20px",
        borderRadius: 18,
        background:
          "linear-gradient(165deg, rgba(26,28,32,0.92) 0%, rgba(10,12,14,0.98) 100%)",
        border: `1px solid ${dormant ? "rgba(255,255,255,0.06)" : accent + "44"}`,
        color: "#fff",
        fontFamily: "Rubik, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: dormant
          ? "0 8px 32px rgba(0,0,0,0.4)"
          : `0 8px 40px rgba(0,0,0,0.5), 0 0 48px ${accent}22 inset`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          opacity: 0.65,
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontFamily: "Akira, Unbounded, Rubik, sans-serif",
          fontWeight: 900,
          fontSize: "clamp(48px, 5vw, 78px)",
          lineHeight: 1,
          letterSpacing: "-0.03em",
          textAlign: "center",
          color: dormant ? "rgba(255,255,255,0.3)" : "#fff",
        }}
      >
        {countUp}
      </div>

      {!dormant && (
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 100,
            background: "rgba(0,0,0,0.4)",
            border: `1px solid ${accent}`,
            color: accent,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.04em",
          }}
        >
          +{stat.xp.toLocaleString()} XP
        </div>
      )}
      {dormant && (
        <div
          style={{
            fontSize: 10,
            opacity: 0.5,
            textAlign: "center",
            letterSpacing: "0.04em",
          }}
        >
          Coming soon
        </div>
      )}
    </motion.div>
  );
}
