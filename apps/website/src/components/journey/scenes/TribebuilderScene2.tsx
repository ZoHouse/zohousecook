"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useJourney } from "../JourneyContext";

// Scene 2: The Ripple — network graph grows from a single click
export default function TribebuilderScene2() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 4000); return () => clearTimeout(t); }, [nextPhase]);

  const nodes = useMemo(() => [
    { x: 0, y: 0, size: 12, color: "#f2860c", delay: 0.5, label: "You" },
    { x: -80, y: -60, size: 8, color: "#f2860c", delay: 1, label: "" },
    { x: 60, y: -80, size: 8, color: "#f2860c", delay: 1.2, label: "" },
    { x: 90, y: 30, size: 8, color: "#f2860c", delay: 1.1, label: "" },
    { x: -60, y: 70, size: 7, color: "#f2860c", delay: 1.3, label: "" },
    { x: -150, y: -30, size: 6, color: "#ffa94d", delay: 1.8, label: "" },
    { x: -120, y: -120, size: 6, color: "#ffa94d", delay: 1.9, label: "" },
    { x: 130, y: -50, size: 6, color: "#ffa94d", delay: 2, label: "" },
    { x: 150, y: 80, size: 6, color: "#ffa94d", delay: 2.1, label: "" },
    { x: 50, y: 120, size: 5, color: "#ffa94d", delay: 2.2, label: "" },
    { x: -100, y: 130, size: 5, color: "#ffa94d", delay: 2.3, label: "" },
    { x: -200, y: -80, size: 4, color: "#ffd8a8", delay: 2.6, label: "" },
    { x: 200, y: -100, size: 4, color: "#ffd8a8", delay: 2.7, label: "" },
    { x: 200, y: 50, size: 4, color: "#ffd8a8", delay: 2.8, label: "" },
    { x: -180, y: 80, size: 4, color: "#ffd8a8", delay: 2.9, label: "" },
  ], []);

  const edges = useMemo(() => [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 5], [1, 6], [2, 7], [3, 8], [4, 9], [4, 10],
    [5, 11], [7, 12], [8, 13], [10, 14],
  ], []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      <motion.div className="relative w-full max-w-[320px] md:max-w-[500px] h-[360px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="-250 -170 500 340">
          {/* Edges */}
          {edges.map(([from, to], i) => (
            <motion.line
              key={`e${i}`}
              x1={nodes[from].x} y1={nodes[from].y}
              x2={nodes[to].x} y2={nodes[to].y}
              stroke="#f2860c"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ delay: Math.max(nodes[from].delay, nodes[to].delay), duration: 0.5 }}
            />
          ))}

          {/* Ripple rings from center */}
          {[1, 2, 3].map((ring) => (
            <motion.circle
              key={`r${ring}`}
              cx={0} cy={0}
              fill="none" stroke="#f2860c" strokeWidth="0.5"
              initial={{ r: 0, opacity: 0.4 }}
              animate={{ r: ring * 80, opacity: 0 }}
              transition={{ delay: 0.5 + ring * 0.5, duration: 1.5 }}
            />
          ))}

          {/* Nodes */}
          {nodes.map((n, i) => (
            <motion.g key={i}>
              <motion.circle
                cx={n.x} cy={n.y} r={n.size}
                fill={n.color}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.9 }}
                transition={{ delay: n.delay, duration: 0.4 }}
              />
              <motion.circle
                cx={n.x} cy={n.y} r={n.size + 4}
                fill="none" stroke={n.color} strokeWidth="0.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.4, 0] }}
                transition={{ delay: n.delay + 0.2, duration: 1.5, repeat: Infinity }}
              />
              {n.label && (
                <motion.text x={n.x} y={n.y + n.size + 14} textAnchor="middle" fill="white" fontSize="10" fontFamily="var(--font-rubik)"
                  initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: n.delay + 0.3 }}>
                  {n.label}
                </motion.text>
              )}
            </motion.g>
          ))}
        </svg>
      </motion.div>

      <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">Watch the network grow</p>
        <p className="text-white/40 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">Every share creates a ripple. Every ripple finds a traveller.</p>
      </motion.div>
    </div>
  );
}
