"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

export default function NodebuilderScene1() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 3500); return () => clearTimeout(t); }, [nextPhase]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      {/* Giant eye peeking through keyhole */}
      <motion.div className="relative" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
        {/* Keyhole shape */}
        <motion.div
          className="w-40 h-56 relative flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="w-28 h-28 rounded-full border-2 border-white/20 flex items-center justify-center overflow-hidden"
            initial={{ borderColor: "rgba(255,255,255,0.1)" }}
            animate={{ borderColor: ["rgba(255,255,255,0.1)", "rgba(255,13,85,0.4)", "rgba(255,255,255,0.1)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {/* Eye looking around */}
            <motion.span
              className="text-5xl"
              animate={{ x: [0, 8, -8, 5, 0], y: [0, -3, 2, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              👀
            </motion.span>
          </motion.div>
          <div className="w-12 h-20 bg-white/5 rounded-b-lg border-x-2 border-b-2 border-white/20 -mt-1" />
        </motion.div>
      </motion.div>

      <motion.div
        className="text-center max-w-[400px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <p className="text-white/90 text-2xl md:text-3xl font-[family-name:var(--font-syne)] font-semibold mb-3">
          Whoa whoa whoa...
        </p>
        <p className="text-white/50 text-base md:text-lg font-[family-name:var(--font-rubik)]">
          You really clicked that, huh?
        </p>
      </motion.div>
    </div>
  );
}
