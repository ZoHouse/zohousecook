"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

// Scene 1: The Space — an empty common area waiting, drawn as wireframe outline
export default function HostScene1() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 3500); return () => clearTimeout(t); }, [nextPhase]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      <motion.div className="relative w-[300px] md:w-[400px] h-[220px] md:h-[280px] rounded-3xl overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/[0.08]" />

        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 280">
          {/* Room wireframe — walls */}
          <motion.path d="M 50 200 L 50 80 L 200 40 L 350 80 L 350 200" fill="none" stroke="#29bb7f" strokeWidth="1" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.5 }} transition={{ duration: 1.5 }} />
          {/* Floor */}
          <motion.path d="M 50 200 L 200 240 L 350 200" fill="none" stroke="#29bb7f" strokeWidth="0.5" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.3 }} transition={{ delay: 0.5, duration: 1 }} />
          {/* Table */}
          <motion.ellipse cx={200} cy={180} rx={60} ry={15} fill="none" stroke="#29bb7f" strokeWidth="0.8" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.4 }} transition={{ delay: 1, duration: 0.8 }} />
          {/* Chairs — simple circles */}
          {[[150, 195], [250, 195], [170, 165], [230, 165], [200, 205]].map(([cx, cy], i) => (
            <motion.circle key={i} cx={cx} cy={cy} r={8} fill="none" stroke="#29bb7f" strokeWidth="0.5"
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.3 }} transition={{ delay: 1.5 + i * 0.1 }} />
          ))}
          {/* Fairy lights string */}
          <motion.path d="M 60 85 Q 130 70 200 85 Q 270 100 340 85" fill="none" stroke="#c9a84c" strokeWidth="0.5" strokeDasharray="2 8"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 2, duration: 1 }} />
          {/* Lights */}
          {[90, 140, 200, 260, 320].map((x, i) => (
            <motion.circle key={`l${i}`} cx={x} cy={82 + Math.sin(i) * 5} r={2} fill="#c9a84c"
              initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0.4, 0.8] }} transition={{ delay: 2.5 + i * 0.1, duration: 2, repeat: Infinity }} />
          ))}
        </svg>
      </motion.div>

      <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">An empty space, waiting</p>
        <p className="text-white/40 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">Every great night starts with someone who shows up first.</p>
      </motion.div>
    </div>
  );
}
