"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

// Scene 1: Your Link — a glowing URL beacon pulses to life
export default function TribebuilderScene1() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 3500); return () => clearTimeout(t); }, [nextPhase]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      {/* Beacon glow */}
      <motion.div
        className="relative"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Pulsing rings */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-[#f2860c]"
            style={{ margin: -i * 30 }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
          />
        ))}

        {/* Link card */}
        <motion.div
          className="relative px-8 py-5 rounded-2xl overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: "auto" }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-white/[0.06] backdrop-blur-xl border border-white/[0.12] rounded-2xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f2860c]/10 to-transparent rounded-2xl" />

          <motion.div
            className="relative flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="w-8 h-8 rounded-lg bg-[#f2860c]/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f2860c" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div>
              <p className="text-white/40 text-xs font-[family-name:var(--font-rubik)]">Your unique link</p>
              <motion.p
                className="text-[#f2860c] text-base md:text-lg font-mono font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
              >
                zo.xyz/c/you
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Share icons flying out */}
      <div className="relative h-16 w-64">
        {["WhatsApp", "Instagram", "Twitter", "Email"].map((platform, i) => (
          <motion.div
            key={platform}
            className="absolute left-1/2 top-1/2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/60 text-xs font-[family-name:var(--font-rubik)]"
            initial={{ x: "-50%", y: "-50%", opacity: 0, scale: 0 }}
            animate={{
              x: `${(i - 1.5) * 70 - 20}%`,
              y: "-50%",
              opacity: 1,
              scale: 1,
            }}
            transition={{ delay: 2 + i * 0.15, duration: 0.5, ease: "easeOut" }}
          >
            {platform}
          </motion.div>
        ))}
      </div>

      <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">One link. Infinite reach.</p>
        <p className="text-white/40 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">Share it everywhere. The ripple begins.</p>
      </motion.div>
    </div>
  );
}
