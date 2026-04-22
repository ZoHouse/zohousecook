import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RankMeta } from "../types";

interface Flyer {
  id: number;
  amount: number;
  rank?: RankMeta;
}

interface Props {
  flyers: Flyer[];
  onDone: (id: number) => void;
}

export function FloatingXpPill({ flyers, onDone }: Props) {
  return (
    <AnimatePresence>
      {flyers.map((f) => (
        <motion.div
          key={f.id}
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ duration: 0.6 }}
          onAnimationComplete={() => setTimeout(() => onDone(f.id), 1200)}
          style={{
            position: "fixed",
            top: "30%",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 18px",
            borderRadius: 100,
            background: "rgba(0,0,0,0.55)",
            border: `1px solid ${f.rank?.chip_color ?? "#FEDD1E"}`,
            color: f.rank?.chip_color ?? "#FEDD1E",
            fontWeight: 800,
            fontSize: 15,
            zIndex: 40,
            boxShadow: `0 0 24px ${(f.rank?.chip_color ?? "#FEDD1E")}55`,
          }}
        >
          +{f.amount.toLocaleString()} XP
          {f.rank && <> · Rank jump to <span style={{ textTransform: "uppercase" }}>{f.rank.label}</span></>}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
