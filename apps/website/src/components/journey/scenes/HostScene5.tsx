"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

// Scene 5: The Legacy — reviews, reputation, "Best Night" badge
export default function HostScene5() {
  const { exitJourney } = useJourney();
  useEffect(() => { const t = setTimeout(exitJourney, 5000); return () => clearTimeout(t); }, [exitJourney]);

  const reviews = [
    { text: "Best night of my entire trip!", stars: 5, name: "Priya" },
    { text: "The jam session was incredible", stars: 5, name: "Marco" },
    { text: "Made friends for life here", stars: 5, name: "Aiko" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      {/* Reviews floating in */}
      <div className="relative w-[300px] md:w-[400px]">
        {reviews.map((review, i) => (
          <motion.div
            key={i}
            className="relative mb-3 rounded-xl overflow-hidden"
            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.5 + i * 0.4, duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.08]" />
            <div className="relative p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#29bb7f]/20 flex items-center justify-center text-xs text-[#29bb7f] font-bold shrink-0">
                {review.name[0]}
              </div>
              <div>
                <div className="flex gap-0.5 mb-1">
                  {[...Array(review.stars)].map((_, j) => (
                    <motion.span key={j} className="text-[#c9a84c] text-xs"
                      initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.4 + j * 0.05 }}>
                      ★
                    </motion.span>
                  ))}
                </div>
                <p className="text-white/70 text-sm font-[family-name:var(--font-rubik)]">&ldquo;{review.text}&rdquo;</p>
                <p className="text-white/30 text-xs font-[family-name:var(--font-rubik)] mt-1">— {review.name}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* BEST NIGHT badge */}
      <motion.div
        className="relative px-8 py-4 rounded-2xl overflow-hidden"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-white/[0.06] backdrop-blur-xl border border-[#c9a84c]/30 rounded-2xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#c9a84c]/10 to-[#29bb7f]/10 rounded-2xl" />
        <motion.div className="absolute inset-0 rounded-2xl" style={{ background: "linear-gradient(105deg, transparent 40%, rgba(201,168,76,0.2) 50%, transparent 60%)", backgroundSize: "200% 100%" }}
          animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} />
        <div className="relative text-center">
          <p className="text-[#c9a84c] text-xs tracking-[3px] font-[family-name:var(--font-rubik)] mb-1">ACHIEVEMENT UNLOCKED</p>
          <p className="text-white text-xl font-[family-name:var(--font-syne)] font-semibold">🏆 Best Night Ever</p>
          <p className="text-white/40 text-sm font-[family-name:var(--font-rubik)] mt-1">25 people. 5-star reviews. Legend status.</p>
        </div>
      </motion.div>

      <motion.button
        className="px-6 py-2 rounded-full border border-[#29bb7f]/30 text-[#29bb7f] text-sm font-[family-name:var(--font-rubik)]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }}
        whileHover={{ scale: 1.05, borderColor: "#29bb7f" }}
        onClick={(e) => { e.stopPropagation(); exitJourney(); }}
      >
        Host your next event →
      </motion.button>
    </div>
  );
}
