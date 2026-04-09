"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

export default function NodebuilderScene2() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 4000); return () => clearTimeout(t); }, [nextPhase]);

  const words = "Come on bro!!! Have some patience...".split(" ");

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 py-4 px-3">
      {/* Hand doing the "calm down" gesture */}
      <motion.div
        className="text-7xl"
        animate={{ rotate: [0, -10, 10, -5, 0], y: [0, -5, 5, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        🤌
      </motion.div>

      <div className="text-center max-w-[500px]">
        <p className="text-2xl md:text-3xl font-[family-name:var(--font-syne)] font-semibold leading-relaxed">
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.3em]"
              style={{ color: word.includes("!!!") ? "#ff0d55" : "rgba(255,255,255,0.9)" }}
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.4 }}
            >
              {word}
            </motion.span>
          ))}
        </p>

        <motion.p
          className="text-white/40 text-base md:text-lg font-[family-name:var(--font-rubik)] mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          Good things take time, you know?
        </motion.p>
      </div>
    </div>
  );
}
