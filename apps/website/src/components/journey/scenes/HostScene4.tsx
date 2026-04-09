"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

// Scene 4: The Moment — energy erupts, music/cameras/laughter
export default function HostScene4() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 3500); return () => clearTimeout(t); }, [nextPhase]);

  const icons = ["🎸", "📸", "🎶", "😂", "🔥", "🎵", "✨", "🎤", "💃", "🥁"];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3 relative overflow-hidden">
      {/* Erupting icons from center */}
      {icons.map((icon, i) => {
        const angle = (i / icons.length) * Math.PI * 2;
        const dist = 120 + Math.random() * 100;
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-[40%] text-2xl"
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              opacity: [0, 1, 1, 0.5],
              scale: [0, 1.3, 1],
            }}
            transition={{ delay: 1.5 + i * 0.12, duration: 2, ease: "easeOut" }}
          >
            {icon}
          </motion.div>
        );
      })}

      {/* Central energy burst */}
      <motion.div
        className="w-32 h-32 rounded-full relative"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#29bb7f]/30 to-[#c9a84c]/20 blur-xl" />
        <motion.div
          className="absolute inset-0 rounded-full border border-[#29bb7f]/40"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span className="text-4xl" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
            🎸
          </motion.span>
        </div>
      </motion.div>

      {/* Stars/reviews floating up */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`star${i}`}
          className="absolute text-[#c9a84c] text-lg"
          style={{ left: `${35 + i * 8}%`, top: "55%" }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -80 - i * 20, opacity: [0, 1, 0] }}
          transition={{ delay: 2.5 + i * 0.15, duration: 1.5 }}
        >
          ⭐
        </motion.div>
      ))}

      <motion.div className="text-center relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">The night comes alive</p>
        <p className="text-white/40 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">Music, laughter, stories — you made this happen.</p>
      </motion.div>
    </div>
  );
}
