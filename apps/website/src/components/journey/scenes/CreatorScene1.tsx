"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

export default function JourneyScene1() {
  const { nextPhase } = useJourney();

  useEffect(() => {
    const timer = setTimeout(nextPhase, 3500);
    return () => clearTimeout(timer);
  }, [nextPhase]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      {/* Passport Card */}
      <motion.div
        className="relative w-[200px] md:w-[280px] h-[260px] md:h-[360px] rounded-3xl overflow-hidden"
        initial={{ scale: 0.5, opacity: 0, rotateY: -30 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
        style={{ perspective: 800 }}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-white/[0.06] backdrop-blur-xl rounded-3xl border border-white/[0.12]" />

        {/* Gold shimmer sweep */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(201,168,76,0.3) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
        />

        {/* Gold border */}
        <motion.div
          className="absolute inset-[8px] rounded-2xl border border-[#c9a84c]/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        />

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center h-full gap-3 py-4 px-3 p-8">
          {/* Zo Emblem */}
          <motion.div
            className="w-24 h-24 rounded-full border-2 border-[#c9a84c]/60 flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 200 }}
          >
            <motion.div
              className="w-16 h-16 rounded-full border border-[#c9a84c]/40 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <span className="text-[#c9a84c] text-2xl md:text-3xl font-bold font-[family-name:var(--font-syne)]">Z</span>
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <p className="text-[#c9a84c] text-sm tracking-[2px] font-[family-name:var(--font-rubik)] font-medium mb-1">ZO WORLD</p>
            <div className="w-16 h-px bg-[#c9a84c]/40 mx-auto mb-3" />
            <p className="text-[#c9a84c] text-xl md:text-2xl tracking-wider font-[family-name:var(--font-syne)] font-semibold">PASSPORT</p>
          </motion.div>

          {/* Decorative dots */}
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.4 }}
          >
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]/50" />
            ))}
          </motion.div>
        </div>

        {/* Purple glow behind */}
        <div className="absolute inset-0 -z-10 bg-[#950dff]/20 blur-3xl rounded-full scale-75" />
      </motion.div>

      {/* Text */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">
          You&apos;re a Zo Citizen
        </p>
        <p className="text-white/50 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">
          Your passport unlocks a world of possibilities
        </p>
      </motion.div>
    </div>
  );
}
