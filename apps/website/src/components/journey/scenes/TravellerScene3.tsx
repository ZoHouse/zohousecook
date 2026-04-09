"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

// Scene 3: The Future — calendar unlocks, book 6 months ahead
export default function TravellerScene3() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 3500); return () => clearTimeout(t); }, [nextPhase]);

  const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      <motion.div className="relative w-[300px] md:w-[400px] rounded-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
        <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.08]" />
        <div className="relative p-6">
          <motion.p className="text-white/40 text-xs font-mono tracking-[2px] mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            BOOK 6 MONTHS IN ADVANCE
          </motion.p>

          {/* Calendar months */}
          <div className="grid grid-cols-3 gap-3">
            {months.map((month, i) => (
              <motion.div
                key={month}
                className="relative rounded-xl overflow-hidden p-3 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.15, duration: 0.4 }}
              >
                <div className="absolute inset-0 bg-white/[0.03] border border-white/[0.06] rounded-xl" />
                {/* Lock → unlock animation */}
                <motion.div className="relative">
                  <motion.span
                    className="text-white/20 text-base md:text-lg block"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 1 + i * 0.15, duration: 0.3 }}
                  >
                    🔒
                  </motion.span>
                  <motion.span
                    className="text-[#f87b2f] text-base md:text-lg absolute inset-0"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 + i * 0.15, duration: 0.3 }}
                  >
                    🔓
                  </motion.span>
                </motion.div>
                <p className="text-white/70 text-sm font-[family-name:var(--font-rubik)] relative mt-1">{month}</p>
                <motion.div
                  className="mt-1 text-[#54b835] text-[10px] font-[family-name:var(--font-rubik)] relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 + i * 0.15 }}
                >
                  Available
                </motion.div>
              </motion.div>
            ))}
          </div>

          <motion.p className="text-white/30 text-xs text-center mt-4 font-[family-name:var(--font-rubik)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>
            Others can only book 1 month ahead
          </motion.p>
        </div>
      </motion.div>

      <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">The future is yours</p>
        <p className="text-white/40 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">Plan trips 6 months ahead. Lock in the best dates.</p>
      </motion.div>
    </div>
  );
}
