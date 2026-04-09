"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

// Scene 2: The Invitation — event card materializes
export default function HostScene2() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 3500); return () => clearTimeout(t); }, [nextPhase]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      <motion.div
        className="relative w-[260px] md:w-[320px] rounded-2xl overflow-hidden"
        initial={{ scale: 0.5, opacity: 0, rotateY: -20 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-[#29bb7f]/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#29bb7f]/10 to-transparent rounded-2xl" />

        {/* Shimmer */}
        <motion.div className="absolute inset-0 rounded-2xl" style={{ background: "linear-gradient(105deg, transparent 40%, rgba(41,187,127,0.2) 50%, transparent 60%)", backgroundSize: "200% 100%" }}
          animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }} transition={{ duration: 1.5, delay: 0.5 }} />

        <div className="relative p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <p className="text-[#29bb7f] text-xs font-[family-name:var(--font-rubik)] tracking-[2px] mb-1">TONIGHT AT ZOSTEL MANALI</p>
          </motion.div>

          <motion.p className="text-white text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            Sunset Jam Session 🎸
          </motion.p>

          <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            <div className="flex items-center gap-2 text-white/50 text-sm font-[family-name:var(--font-rubik)]">
              <span>🕐</span><span>6:00 PM — 9:00 PM</span>
            </div>
            <div className="flex items-center gap-2 text-white/50 text-sm font-[family-name:var(--font-rubik)]">
              <span>📍</span><span>Rooftop Common Area</span>
            </div>
            <div className="flex items-center gap-2 text-white/50 text-sm font-[family-name:var(--font-rubik)]">
              <span>🎵</span><span>Bring your instrument or just vibes</span>
            </div>
          </motion.div>

          <motion.div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
            <div className="w-6 h-6 rounded-full bg-[#29bb7f]/30" />
            <span className="text-white/60 text-sm font-[family-name:var(--font-rubik)]">Hosted by <span className="text-[#29bb7f]">you</span></span>
          </motion.div>
        </div>
      </motion.div>

      <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">Create the invitation</p>
        <p className="text-white/40 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">Jam sessions, treks, workshops — you decide.</p>
      </motion.div>
    </div>
  );
}
