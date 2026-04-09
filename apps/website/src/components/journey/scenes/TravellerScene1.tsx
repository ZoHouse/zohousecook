"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

// Scene 1: The Passport Key — passport glows and turns like a key
export default function TravellerScene1() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 3500); return () => clearTimeout(t); }, [nextPhase]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      <motion.div className="relative" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
        {/* Keyhole light burst */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] md:w-[300px] h-[240px] md:h-[300px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 w-px origin-bottom"
              style={{ height: 0, transform: `rotate(${deg}deg)`, background: "linear-gradient(to top, #f87b2f, transparent)" }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 120, opacity: [0, 0.4, 0] }}
              transition={{ delay: 1.8 + i * 0.05, duration: 1 }}
            />
          ))}
        </motion.div>

        {/* Passport card */}
        <motion.div
          className="relative w-[140px] md:w-[180px] h-[180px] md:h-[240px] rounded-2xl overflow-hidden"
          animate={{ rotateY: [0, 15, -5, 0] }}
          transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
          style={{ perspective: 600 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#2d1054] to-[#1a0a2e] rounded-2xl border border-[#c9a84c]/30" />
          <div className="relative flex flex-col items-center justify-center h-full gap-3">
            <motion.div className="w-16 h-16 rounded-full border border-[#c9a84c]/50 flex items-center justify-center"
              animate={{ boxShadow: ["0 0 0 rgba(201,168,76,0)", "0 0 30px rgba(201,168,76,0.4)", "0 0 0 rgba(201,168,76,0)"] }}
              transition={{ delay: 1.5, duration: 2, repeat: Infinity }}>
              <span className="text-[#c9a84c] text-2xl font-bold font-[family-name:var(--font-syne)]">Z</span>
            </motion.div>
            <p className="text-[#c9a84c] text-xs tracking-[2px] font-[family-name:var(--font-rubik)]">PASSPORT</p>
            <motion.div className="w-8 h-px bg-[#c9a84c]/40" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1 }} />
            <p className="text-[#c9a84c]/60 text-[10px] tracking-wider font-[family-name:var(--font-rubik)]">PRO ACCESS</p>
          </div>
        </motion.div>

      </motion.div>

      {/* UNLOCKED text */}
      <motion.div
        className="text-center mt-2"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.2 }}
      >
        <span className="text-[#f87b2f] text-xs font-mono tracking-[4px]">UNLOCKED</span>
      </motion.div>

      <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">Your key to everything</p>
        <p className="text-white/40 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">Pro access activated. The world opens up.</p>
      </motion.div>
    </div>
  );
}
