import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RankMeta } from "../types";

interface Props { rank: RankMeta | null }

export function RankPill({ rank }: Props) {
  if (!rank || rank.key === "citizen_day_1") return null;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={rank.key}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.35 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          borderRadius: 100,
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${rank.chip_color}`,
          color: rank.chip_color,
          fontWeight: 700,
          fontSize: 13,
          fontFamily: "Rubik, sans-serif",
          boxShadow: `0 0 24px ${rank.chip_color}44`,
        }}
      >
        {rank.label}
      </motion.div>
    </AnimatePresence>
  );
}
