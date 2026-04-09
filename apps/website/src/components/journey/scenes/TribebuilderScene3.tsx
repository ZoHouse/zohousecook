"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

// Scene 3: The Dashboard — real-time tracking, clicks/signups/bookings ticking up
export default function TribebuilderScene3() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 4000); return () => clearTimeout(t); }, [nextPhase]);

  const clicks = useMotionValue(0);
  const signups = useMotionValue(0);
  const bookings = useMotionValue(0);
  const clicksDisplay = useTransform(clicks, (v) => Math.round(v).toLocaleString());
  const signupsDisplay = useTransform(signups, (v) => Math.round(v).toLocaleString());
  const bookingsDisplay = useTransform(bookings, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    const c1 = animate(clicks, 2847, { duration: 3, delay: 0.8, ease: [0.25, 0.4, 0.25, 1] });
    const c2 = animate(signups, 342, { duration: 3, delay: 1.2, ease: [0.25, 0.4, 0.25, 1] });
    const c3 = animate(bookings, 89, { duration: 3, delay: 1.6, ease: [0.25, 0.4, 0.25, 1] });
    return () => { c1.stop(); c2.stop(); c3.stop(); };
  }, [clicks, signups, bookings]);

  const stats = [
    { label: "Clicks", value: clicksDisplay, color: "#f2860c", icon: "👆" },
    { label: "Signups", value: signupsDisplay, color: "#ffa94d", icon: "✍️" },
    { label: "Bookings", value: bookingsDisplay, color: "#54b835", icon: "✅" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      {/* Dashboard card */}
      <motion.div
        className="relative w-full max-w-[300px] md:max-w-[420px] rounded-3xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-white/[0.1]" />

        <div className="relative p-8">
          {/* Header */}
          <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="w-2 h-2 rounded-full bg-[#54b835] animate-pulse" />
            <span className="text-white/40 text-xs font-mono tracking-wider">LIVE DASHBOARD</span>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.2, duration: 0.5 }}
              >
                <p className="text-2xl mb-1">{stat.icon}</p>
                <motion.p className="text-2xl font-[family-name:var(--font-syne)] font-bold tabular-nums" style={{ color: stat.color }}>
                  <motion.span>{stat.value}</motion.span>
                </motion.p>
                <p className="text-white/40 text-xs font-[family-name:var(--font-rubik)] mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Conversion funnel visualization */}
          <motion.div className="flex items-end gap-1 h-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
            {Array.from({ length: 20 }, (_, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{ backgroundColor: i < 14 ? "#f2860c" : i < 18 ? "#ffa94d" : "#54b835" }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(15, 100 - i * 4 + Math.random() * 15)}%` }}
                transition={{ delay: 1.8 + i * 0.05, duration: 0.4 }}
              />
            ))}
          </motion.div>
          <div className="flex justify-between mt-2">
            <span className="text-white/20 text-[9px] font-mono">CLICKS</span>
            <span className="text-white/20 text-[9px] font-mono">→ SIGNUPS → BOOKINGS</span>
          </div>
        </div>
      </motion.div>

      <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">Track every conversion</p>
        <p className="text-white/40 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">Real-time. Transparent. All yours.</p>
      </motion.div>
    </div>
  );
}
