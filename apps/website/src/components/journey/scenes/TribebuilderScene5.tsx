"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

// Scene 5: The Earnings — cumulative commission + bank withdrawal
export default function TribebuilderScene5() {
  const { exitJourney } = useJourney();
  useEffect(() => { const t = setTimeout(exitJourney, 5500); return () => clearTimeout(t); }, [exitJourney]);

  const total = useMotionValue(0);
  const display = useTransform(total, (v) => `₹${Math.round(v).toLocaleString("en-IN")}`);
  useEffect(() => { const c = animate(total, 34200, { duration: 2.5, delay: 0.8, ease: [0.25, 0.4, 0.25, 1] }); return c.stop; }, [total]);

  const bookings = [
    { place: "Zostel Manali", amount: "₹450", time: "2h ago" },
    { place: "Zostel Goa", amount: "₹680", time: "5h ago" },
    { place: "Zo House Delhi", amount: "₹1,200", time: "1d ago" },
    { place: "Zostel Udaipur", amount: "₹520", time: "2d ago" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      {/* Total earnings */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
        <p className="text-white/30 text-sm font-[family-name:var(--font-rubik)] tracking-[2px] text-center mb-2">TOTAL COMMISSION</p>
        <motion.p className="text-[#f2860c] text-5xl font-[family-name:var(--font-syne)] font-bold text-center tabular-nums">
          <motion.span>{display}</motion.span>
        </motion.p>
        <motion.div className="flex items-center justify-center gap-2 mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
          <span className="text-[#54b835] text-sm font-[family-name:var(--font-rubik)]">▲ ₹3,400 this week</span>
        </motion.div>
      </motion.div>

      {/* Recent commissions feed */}
      <motion.div className="w-[250px] md:w-[340px] rounded-2xl overflow-hidden relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
        <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.08]" />
        <div className="relative p-4">
          <p className="text-white/30 text-xs font-[family-name:var(--font-rubik)] tracking-wider mb-3">RECENT COMMISSIONS</p>
          {bookings.map((b, i) => (
            <motion.div
              key={i}
              className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2 + i * 0.2 }}
            >
              <div>
                <p className="text-white/70 text-sm font-[family-name:var(--font-rubik)]">{b.place}</p>
                <p className="text-white/30 text-xs font-[family-name:var(--font-rubik)]">{b.time}</p>
              </div>
              <span className="text-[#f2860c] font-[family-name:var(--font-rubik)] font-medium">{b.amount}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Withdraw CTA */}
      <motion.button
        className="relative px-8 py-3 rounded-xl overflow-hidden group"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => { e.stopPropagation(); exitJourney(); }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#f2860c] to-[#ffa94d] rounded-xl" />
        <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} />
        <span className="relative text-white font-[family-name:var(--font-rubik)] font-medium">Withdraw to Bank →</span>
      </motion.button>
    </div>
  );
}
