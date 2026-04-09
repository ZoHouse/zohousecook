"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

// Scene 4: The Booking — confirmation card + commission earned
export default function TribebuilderScene4() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 3500); return () => clearTimeout(t); }, [nextPhase]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      {/* Booking confirmation card */}
      <motion.div
        className="relative w-[240px] md:w-[320px] rounded-2xl overflow-hidden"
        initial={{ y: 40, opacity: 0, rotateX: 10 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="absolute inset-0 bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-white/[0.12]" />
        <div className="relative p-6">
          <motion.div className="flex items-center gap-2 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#54b835"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
            <span className="text-[#54b835] text-sm font-[family-name:var(--font-rubik)] font-medium">Booking Confirmed</span>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <p className="text-white text-base md:text-lg font-[family-name:var(--font-syne)] font-semibold">Zostel Manali</p>
            <p className="text-white/40 text-sm font-[family-name:var(--font-rubik)]">4-bed mixed dorm &bull; 3 nights</p>
            <p className="text-white/40 text-sm font-[family-name:var(--font-rubik)]">Booked via your link</p>
          </motion.div>

          <motion.div
            className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <span className="text-white/40 text-sm font-[family-name:var(--font-rubik)]">Booking value</span>
            <span className="text-white text-base md:text-lg font-[family-name:var(--font-rubik)] font-medium">₹4,500</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Commission earned card — slides in from below */}
      <motion.div
        className="relative w-[240px] md:w-[320px] rounded-2xl overflow-hidden"
        initial={{ y: 60, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-[#f2860c]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f2860c]/10 to-transparent rounded-2xl" />

        <div className="relative p-6 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs font-[family-name:var(--font-rubik)] tracking-wider">YOUR COMMISSION</p>
            <motion.p
              className="text-[#f2860c] text-2xl md:text-3xl font-[family-name:var(--font-syne)] font-bold mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              ₹450
            </motion.p>
          </div>
          <motion.div
            className="w-12 h-12 rounded-full bg-[#f2860c]/20 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.2, duration: 0.4 }}
          >
            <motion.span
              className="text-2xl"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              💰
            </motion.span>
          </motion.div>
        </div>
      </motion.div>

      <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">Earn on every booking</p>
        <p className="text-white/40 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">10% commission. Straight to your wallet.</p>
      </motion.div>
    </div>
  );
}
