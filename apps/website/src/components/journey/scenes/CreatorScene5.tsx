"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useJourney } from "../JourneyContext";

function MoneyRain() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 35 }, (_, i) => ({
        id: i,
        startX: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        size: Math.random() * 8 + 12,
        rotate: Math.random() * 40 - 20,
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute text-green-400/80 font-bold font-mono select-none"
          style={{ left: `${p.startX}%`, fontSize: p.size, top: -30 }}
          initial={{ y: -40, opacity: 0, rotate: p.rotate }}
          animate={{ y: "110vh", opacity: [0, 1, 1, 0.5], rotate: p.rotate + 180 }}
          transition={{ delay: 0.5 + p.delay, duration: p.duration, ease: "linear", repeat: Infinity, repeatDelay: p.delay }}
        >
          ₹
        </motion.div>
      ))}
    </div>
  );
}

function EarningsCounter() {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => `₹${Math.round(v).toLocaleString("en-IN")}`);

  useEffect(() => {
    const controls = animate(count, 12450, {
      duration: 2.5,
      delay: 1,
      ease: [0.25, 0.4, 0.25, 1],
    });
    return controls.stop;
  }, [count]);

  return (
    <motion.p className="text-[#54b835] text-5xl font-[family-name:var(--font-syne)] font-bold tabular-nums">
      <motion.span>{rounded}</motion.span>
    </motion.p>
  );
}

export default function JourneyScene5() {
  const { exitJourney } = useJourney();

  useEffect(() => {
    const timer = setTimeout(exitJourney, 6000);
    return () => clearTimeout(timer);
  }, [exitJourney]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3 relative">
      <MoneyRain />

      {/* Earnings Card */}
      <motion.div
        className="relative w-[250px] md:w-[340px] rounded-3xl overflow-hidden"
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <div className="absolute inset-0 bg-white/[0.06] backdrop-blur-xl rounded-3xl border border-white/[0.12]" />
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent rounded-3xl" />

        <div className="relative p-8 flex flex-col items-center gap-6">
          {/* Header */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-white/50 text-sm font-[family-name:var(--font-rubik)] tracking-wider">YOUR EARNINGS</p>
          </motion.div>

          {/* Counter */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <EarningsCounter />
          </motion.div>

          {/* Ticker arrow */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#54b835">
                <path d="M7 14l5-5 5 5H7z" />
              </svg>
            </motion.div>
            <span className="text-[#54b835] text-sm font-[family-name:var(--font-rubik)] font-medium">+₹2,450 today</span>
          </motion.div>

          {/* Earnings bar chart */}
          <motion.div
            className="flex items-end gap-2 h-16 w-full px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            {[30, 45, 35, 60, 50, 75, 90].map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{ backgroundColor: i === 6 ? "#54b835" : "rgba(84, 184, 53, 0.25)" }}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 1.8 + i * 0.08, duration: 0.5, ease: "easeOut" }}
              />
            ))}
          </motion.div>

          {/* Days labels */}
          <div className="flex gap-2 w-full px-4 -mt-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className="flex-1 text-center text-[9px] text-white/30 font-[family-name:var(--font-rubik)]">{d}</span>
            ))}
          </div>

          {/* Withdraw CTA */}
          <motion.button
            className="relative w-full py-3 rounded-xl overflow-hidden group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => { e.stopPropagation(); exitJourney(); }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#54b835] to-[#29bb7f] rounded-xl" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            <span className="relative text-white font-[family-name:var(--font-rubik)] font-medium">
              Start Earning →
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* Bottom text */}
      <motion.p
        className="text-white/30 text-sm font-[family-name:var(--font-rubik)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
      >
        Withdraw directly to your bank account
      </motion.p>
    </div>
  );
}
