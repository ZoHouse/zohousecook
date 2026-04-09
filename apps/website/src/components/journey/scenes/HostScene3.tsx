"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useJourney } from "../JourneyContext";

// Scene 3: The Gathering — people converge as glowing dots
export default function HostScene3() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 4000); return () => clearTimeout(t); }, [nextPhase]);

  const people = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 100;
      return {
        id: i,
        startX: Math.cos(angle) * dist,
        startY: Math.sin(angle) * dist,
        endX: (Math.random() - 0.5) * 80,
        endY: (Math.random() - 0.5) * 60,
        delay: 0.5 + Math.random() * 1.5,
        size: 4 + Math.random() * 4,
        color: ["#29bb7f", "#54b835", "#c9a84c", "#b85dff"][i % 4],
      };
    }), []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      <div className="relative w-[300px] md:w-[400px] h-[240px] md:h-[300px]">
        <svg className="absolute inset-0 w-full h-full" viewBox="-200 -150 400 300">
          {/* Center beacon */}
          <motion.circle cx={0} cy={0} r={20} fill="#29bb7f" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.15, 0.1] }} transition={{ delay: 0.3, duration: 1 }} />
          {/* Pulse rings from center */}
          {[1, 2, 3].map((i) => (
            <motion.circle key={`p${i}`} cx={0} cy={0} fill="none" stroke="#29bb7f" strokeWidth={0.5}
              initial={{ r: 20, opacity: 0.3 }} animate={{ r: 20 + i * 40, opacity: 0 }} transition={{ delay: 0.5 + i * 0.3, duration: 1.5, repeat: 2 }} />
          ))}

          {/* People converging */}
          {people.map((p) => (
            <motion.g key={p.id}>
              <motion.circle
                cx={p.startX} cy={p.startY} r={p.size}
                fill={p.color}
                animate={{ cx: p.endX, cy: p.endY, opacity: [0, 0.8, 1] }}
                transition={{ delay: p.delay, duration: 1.5, ease: [0.25, 0.4, 0.25, 1] }}
              />
              {/* Trail line */}
              <motion.line
                x1={p.startX} y1={p.startY} x2={p.endX} y2={p.endY}
                stroke={p.color} strokeWidth={0.3}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.2, 0] }}
                transition={{ delay: p.delay, duration: 2 }}
              />
            </motion.g>
          ))}

          {/* Gathering glow grows */}
          <motion.circle cx={0} cy={0} fill="url(#gatherGlow)"
            initial={{ r: 0, opacity: 0 }}
            animate={{ r: 60, opacity: 0.5 }}
            transition={{ delay: 2.5, duration: 1.5 }}
          />

          {/* Attendee count */}
          <motion.text x={0} y={5} textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="var(--font-syne)"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>
            25
          </motion.text>
          <motion.text x={0} y={22} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="var(--font-rubik)"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.7 }}>
            people joined
          </motion.text>

          <defs>
            <radialGradient id="gatherGlow">
              <stop offset="0%" stopColor="#29bb7f" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#29bb7f" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }}>
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">They came.</p>
        <p className="text-white/40 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">Strangers becoming friends. Because you showed up.</p>
      </motion.div>
    </div>
  );
}
