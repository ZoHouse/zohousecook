"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useJourney } from "../JourneyContext";

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 500,
        y: -(Math.random() * 400 + 200),
        rotate: Math.random() * 720 - 360,
        color: ["#b85dff", "#f2860c", "#29bb7f", "#ff0d55", "#c9a84c", "#54b835"][i % 6],
        size: Math.random() * 6 + 4,
        delay: Math.random() * 0.5,
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 rounded-sm"
          style={{ width: p.size, height: p.size * 0.6, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0 }}
          animate={{ x: p.x, y: p.y, rotate: p.rotate, opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0.5] }}
          transition={{ delay: 1.8 + p.delay, duration: 2, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export default function JourneyScene4() {
  const { nextPhase } = useJourney();

  useEffect(() => {
    const timer = setTimeout(nextPhase, 4000);
    return () => clearTimeout(timer);
  }, [nextPhase]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3 relative">
      <Confetti />

      {/* Instagram Post Card */}
      <motion.div
        className="relative w-[240px] md:w-[300px] rounded-2xl overflow-hidden"
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <div className="absolute inset-0 bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-white/[0.12]" />

        <div className="relative p-4">
          {/* Post header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            <div>
              <p className="text-white text-xs font-medium font-[family-name:var(--font-rubik)]">your.username</p>
              <p className="text-white/40 text-[10px] font-[family-name:var(--font-rubik)]">Zostel Manali</p>
            </div>
          </div>

          {/* Post image placeholder */}
          <motion.div
            className="w-full h-[200px] rounded-xl bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-emerald-900/40 flex items-center justify-center relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <p className="text-white/20 text-4xl">🏔️</p>
            {/* Instagram tag overlay */}
            <motion.div
              className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white/80 font-[family-name:var(--font-rubik)]"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              @zostel
            </motion.div>
          </motion.div>

          {/* Engagement row */}
          <motion.div
            className="flex gap-4 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          </motion.div>

          {/* Collab sent */}
          <motion.div
            className="mt-3 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#54b835"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
            <span className="text-[#54b835] text-xs font-[family-name:var(--font-rubik)]">Collab sent to @zostel</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Quest Complete Badge */}
      <motion.div
        className="relative"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.8, type: "spring", stiffness: 200, damping: 12 }}
      >
        <div className="relative px-8 py-4 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-green-500/10 rounded-2xl" />

          <div className="relative flex items-center gap-4">
            {/* Checkmark */}
            <svg width="36" height="36" viewBox="0 0 36 36">
              <motion.circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="#54b835"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 2, duration: 0.6 }}
              />
              <motion.path
                d="M11 18l4 4 10-10"
                fill="none"
                stroke="#54b835"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 2.4, duration: 0.4 }}
              />
            </svg>

            <div>
              <p className="text-white text-base md:text-lg font-[family-name:var(--font-syne)] font-semibold">QUEST COMPLETE</p>
              <p className="text-[#54b835] text-sm font-[family-name:var(--font-rubik)]">+250 XP earned</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
