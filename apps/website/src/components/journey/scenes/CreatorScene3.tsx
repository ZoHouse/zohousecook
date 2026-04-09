"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

export default function JourneyScene3() {
  const { nextPhase } = useJourney();

  useEffect(() => {
    const timer = setTimeout(nextPhase, 3500);
    return () => clearTimeout(timer);
  }, [nextPhase]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      {/* Phone */}
      <motion.div
        className="relative w-[200px] md:w-[240px] h-[380px] md:h-[480px] rounded-[40px] overflow-hidden"
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
      >
        {/* Phone body */}
        <div className="absolute inset-0 bg-white/[0.06] backdrop-blur-xl rounded-[40px] border border-white/[0.15]" />

        {/* Notch */}
        <motion.div
          className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-black/60 rounded-full z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        />

        {/* Screen content */}
        <div className="relative flex flex-col items-center h-full pt-12 px-4">
          {/* Camera viewfinder */}
          <motion.div
            className="w-full flex-1 rounded-2xl bg-black/40 relative overflow-hidden mt-2 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {/* Viewfinder grid */}
            <div className="absolute inset-4 grid grid-cols-3 grid-rows-3">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={`vl${i}`}
                  className="absolute top-0 bottom-0 w-px bg-white/15"
                  style={{ left: `${(i + 1) * 25}%` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.7 + i * 0.05, duration: 0.3 }}
                />
              ))}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={`hl${i}`}
                  className="absolute left-0 right-0 h-px bg-white/15"
                  style={{ top: `${(i + 1) * 25}%` }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.75 + i * 0.05, duration: 0.3 }}
                />
              ))}
            </div>

            {/* Landscape preview */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 via-emerald-900/20 to-stone-900/30" />

            {/* REC indicator */}
            <motion.div
              className="absolute top-3 left-3 flex items-center gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-red-400 text-[10px] font-mono font-medium">REC 00:12</span>
            </motion.div>

            {/* Focus square */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16"
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: [0, 1, 1, 0] }}
              transition={{ delay: 1.2, duration: 1.5 }}
            >
              <div className="w-full h-full border border-yellow-400/70 rounded-sm" />
            </motion.div>

            {/* Flash burst */}
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0.8, 0] }}
              transition={{ delay: 2, duration: 0.5, times: [0, 0.2, 0.3, 1] }}
            />
          </motion.div>

          {/* Record button */}
          <motion.div
            className="absolute bottom-6 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
          >
            <motion.div
              className="w-14 h-14 rounded-full border-4 border-white/40 flex items-center justify-center"
              animate={{ borderColor: ["rgba(255,255,255,0.4)", "rgba(239,68,68,0.6)", "rgba(255,255,255,0.4)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-10 h-10 rounded-full bg-red-500"
                animate={{ scale: [1, 0.85, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Reel thumbnail pops in after flash */}
      <motion.div
        className="absolute right-[calc(50%-220px)] top-[calc(50%+60px)] w-[100px] h-[130px] rounded-xl overflow-hidden"
        initial={{ scale: 0, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 5 }}
        transition={{ delay: 2.3, duration: 0.5, type: "spring", stiffness: 200 }}
      >
        <div className="absolute inset-0 bg-white/[0.08] backdrop-blur-sm border border-white/[0.15] rounded-xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-pink-500/10" />
        <div className="relative flex flex-col items-center justify-center h-full">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.6, type: "spring" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity={0.8}>
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.div>
          <p className="text-white/60 text-[9px] mt-1 font-[family-name:var(--font-rubik)]">Reel ready</p>
        </div>
      </motion.div>

      {/* Text */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">
          Capture the moment
        </p>
        <p className="text-white/50 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">
          Create a reel or carousel at the property
        </p>
      </motion.div>
    </div>
  );
}
