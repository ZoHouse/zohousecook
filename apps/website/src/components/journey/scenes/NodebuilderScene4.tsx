"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

export default function NodebuilderScene4() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 4000); return () => clearTimeout(t); }, [nextPhase]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      {/* Loading bar that's "almost there" but never completes */}
      <motion.div className="w-[240px] md:w-[300px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <div className="flex justify-between mb-2">
          <span className="text-white/40 text-xs font-mono">BUILDING SOMETHING EPIC</span>
          <motion.span
            className="text-[#ff0d55] text-xs font-mono"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            99.7%
          </motion.span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #ff0d55, #ff6b8a)" }}
            initial={{ width: "0%" }}
            animate={{ width: ["0%", "85%", "92%", "97%", "99%", "99.3%", "99.5%", "99.7%"] }}
            transition={{ duration: 3, ease: "easeOut" }}
          />
        </div>
        <motion.p
          className="text-white/20 text-[10px] font-mono mt-2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
        >
          ...aaaaany moment now
        </motion.p>
      </motion.div>

      {/* Funny hints */}
      <motion.div className="text-center max-w-[400px] space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
        <p className="text-white/70 text-xl font-[family-name:var(--font-syne)] font-semibold">
          COMING SOON
        </p>
        <motion.p
          className="text-6xl"
          animate={{ rotate: [0, 10, -10, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 2 }}
        >
          🫣
        </motion.p>
        <p className="text-white/40 text-sm md:text-base font-[family-name:var(--font-rubik)]">
          We&apos;re literally putting the finishing touches on this. Not even kidding.
        </p>
      </motion.div>
    </div>
  );
}
