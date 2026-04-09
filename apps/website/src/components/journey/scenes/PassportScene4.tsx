"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

// Scene 4: THE CONTRAST — Without vs With passport. Pure FOMO.
export default function PassportScene4() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 5500); return () => clearTimeout(t); }, [nextPhase]);

  const comparisons = [
    { without: "Full price stays", with: "30% off everything", icon: "💰" },
    { without: "Book 1 month ahead", with: "Book 6 months ahead", icon: "📅" },
    { without: "No common area access", with: "Unlimited access", icon: "🛋️" },
    { without: "No events", with: "Free community events", icon: "🎫" },
    { without: "Zero earnings", with: "Earn real money", icon: "📈" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3 relative overflow-hidden">
      {/* Headers */}
      <div className="flex w-full max-w-[340px] md:max-w-[600px] justify-between mb-6">
        <motion.div className="text-center w-[200px] md:w-[260px]" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <p className="text-white/30 text-xs tracking-[3px] font-[family-name:var(--font-rubik)]">WITHOUT PASSPORT</p>
        </motion.div>
        <motion.div className="text-center w-[200px] md:w-[260px]" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <p className="text-[#c9a84c] text-xs tracking-[3px] font-[family-name:var(--font-rubik)]">WITH PASSPORT</p>
        </motion.div>
      </div>

      {/* Comparison rows */}
      <div className="flex flex-col gap-3 w-full max-w-[340px] md:max-w-[600px]">
        {comparisons.map((comp, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.25, duration: 0.5 }}
          >
            {/* Without */}
            <motion.div
              className="flex-1 p-3 rounded-xl relative overflow-hidden"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: [0.8, 0.3] }}
              transition={{ delay: 1.5 + i * 0.2, duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-white/[0.02] border border-white/[0.05] rounded-xl" />
              <div className="relative flex items-center gap-3">
                <span className="text-lg grayscale opacity-30">{comp.icon}</span>
                <span className="text-white/30 text-sm font-[family-name:var(--font-rubik)] line-through">{comp.without}</span>
              </div>
              {/* Red X */}
              <motion.div
                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500/60 text-xs font-bold"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 + i * 0.2, duration: 0.3 }}
              >
                ✕
              </motion.div>
            </motion.div>

            {/* VS divider */}
            <motion.div
              className="w-px h-8 bg-gradient-to-b from-transparent via-[#c9a84c]/30 to-transparent shrink-0"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.8 + i * 0.15 }}
            />

            {/* With */}
            <motion.div
              className="flex-1 p-3 rounded-xl relative overflow-hidden"
              initial={{ borderColor: "rgba(255,255,255,0.05)" }}
              animate={{ borderColor: "rgba(201,168,76,0.3)" }}
              transition={{ delay: 2 + i * 0.2, duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-white/[0.03] border border-[#c9a84c]/20 rounded-xl" />
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ background: "linear-gradient(to right, rgba(201,168,76,0.05), transparent)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 + i * 0.2 }}
              />
              <div className="relative flex items-center gap-3">
                <motion.span
                  className="text-lg"
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ delay: 2.2 + i * 0.2, duration: 0.4 }}
                >
                  {comp.icon}
                </motion.span>
                <span className="text-white/80 text-sm font-[family-name:var(--font-rubik)] font-medium">{comp.with}</span>
              </div>
              {/* Gold check */}
              <motion.div
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c9a84c] text-xs font-bold"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2 + i * 0.2, duration: 0.3 }}
              >
                ✓
              </motion.div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <motion.p
        className="text-white/50 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5 }}
      >
        The difference is <motion.span className="text-[#c9a84c] font-medium" animate={{ textShadow: ["0 0 0 transparent", "0 0 10px rgba(201,168,76,0.5)", "0 0 0 transparent"] }} transition={{ duration: 2, repeat: Infinity }}>one passport</motion.span>.
      </motion.p>
    </div>
  );
}
