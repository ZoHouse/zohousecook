import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { BeatIndex } from "../../../lib/homecoming/beatTimeline";
import type { HomecomingPayload } from "../types";

interface Props {
  beat: BeatIndex;
  payload: HomecomingPayload;
  onCtaTap?: () => void;
}

export function BeatCopy({ beat, payload, onCtaTap }: Props) {
  const greeting = payload.first_name
    ? `${payload.first_name}, welcome back.`
    : "Welcome back.";
  const firstCut = !payload.has_journey ? "Welcome to Zo World." : greeting;

  return (
    <AnimatePresence mode="wait">
      {beat === 1 && (
        <motion.div
          key="b1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={centered}
        >
          <h1 style={headline}>{firstCut}</h1>
          <p style={subhead}>{payload.handle}</p>
          <button onClick={onCtaTap} style={cta}>Follow your heart →</button>
        </motion.div>
      )}
      {beat === 2 && (
        <motion.div key="b2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={centered}>
          <p style={softhead}>Your heart is being read…</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const centered: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%,-50%)",
  textAlign: "center",
  zIndex: 5,
  pointerEvents: "auto",
};

const headline: React.CSSProperties = {
  fontFamily: "Akira, Unbounded, Rubik",
  fontWeight: 900,
  fontSize: 54,
  margin: 0,
  letterSpacing: "-0.02em",
  lineHeight: 1.05,
  color: "#fff",
};
const subhead: React.CSSProperties = { opacity: 0.7, marginTop: 8, fontSize: 16 };
const softhead: React.CSSProperties = { fontFamily: "Rubik", fontSize: 18, opacity: 0.8 };
const cta: React.CSSProperties = {
  marginTop: 28,
  padding: "12px 22px",
  borderRadius: 100,
  border: "1px solid #FEDD1E",
  background: "transparent",
  color: "#FEDD1E",
  fontWeight: 700,
  cursor: "pointer",
};
