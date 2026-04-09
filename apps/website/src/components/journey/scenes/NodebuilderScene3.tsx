"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

export default function NodebuilderScene3() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 4500); return () => clearTimeout(t); }, [nextPhase]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      {/* Curtain being held shut */}
      <div className="relative w-[240px] md:w-[300px] h-[200px]">
        {/* Left curtain */}
        <motion.div
          className="absolute left-0 top-0 w-[48%] h-full rounded-l-2xl overflow-hidden origin-left"
          style={{ background: "linear-gradient(to right, #ff0d55/20, #ff0d55/5)", borderLeft: "2px solid rgba(255,13,85,0.3)" }}
          animate={{ skewY: [0, -1, 0, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        {/* Right curtain */}
        <motion.div
          className="absolute right-0 top-0 w-[48%] h-full rounded-r-2xl overflow-hidden origin-right"
          style={{ background: "linear-gradient(to left, #ff0d55/20, #ff0d55/5)", borderRight: "2px solid rgba(255,13,85,0.3)" }}
          animate={{ skewY: [0, 1, 0, -1, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        {/* Peek of light between curtains */}
        <motion.div
          className="absolute left-1/2 top-0 -translate-x-1/2 w-2 h-full"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(255,13,85,0.3), transparent)" }}
          animate={{ opacity: [0.3, 0.8, 0.3], width: [2, 6, 2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Question marks peeking out */}
        {["❓", "✨", "🔥"].map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 text-2xl"
            style={{ top: `${20 + i * 30}%` }}
            initial={{ x: "-50%", opacity: 0 }}
            animate={{ x: "-50%", opacity: [0, 0.6, 0] }}
            transition={{ delay: 1 + i * 0.5, duration: 2, repeat: Infinity }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      <motion.div
        className="text-center max-w-[450px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold mb-3">
          There&apos;s a sexiness in the foreplay...
        </p>
        <motion.p
          className="text-[#ff0d55] text-base md:text-lg font-[family-name:var(--font-rubik)] italic"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Something big is being cooked behind these curtains
        </motion.p>
      </motion.div>
    </div>
  );
}
