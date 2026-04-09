"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useJourney } from "../JourneyContext";

// Scene 2: YOUR UNIVERSE — map of 65+ locations explodes outward as a constellation network
export default function PassportScene2() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 5000); return () => clearTimeout(t); }, [nextPhase]);

  const locations = useMemo(() => [
    { name: "Manali", x: 280, y: 140, size: 8, featured: true },
    { name: "Goa", x: 180, y: 380, size: 7, featured: true },
    { name: "Delhi", x: 310, y: 200, size: 6, featured: true },
    { name: "Rishikesh", x: 290, y: 170, size: 5, featured: false },
    { name: "Udaipur", x: 230, y: 260, size: 6, featured: true },
    { name: "Varanasi", x: 370, y: 230, size: 5, featured: false },
    { name: "Jaipur", x: 260, y: 230, size: 5, featured: false },
    { name: "Mumbai", x: 200, y: 330, size: 5, featured: false },
    { name: "Kochi", x: 220, y: 430, size: 4, featured: false },
    { name: "Leh", x: 300, y: 100, size: 5, featured: false },
    { name: "Kasol", x: 275, y: 150, size: 4, featured: false },
    { name: "Coorg", x: 210, y: 400, size: 4, featured: false },
    { name: "Pondicherry", x: 260, y: 410, size: 4, featured: false },
    { name: "Shimla", x: 280, y: 155, size: 4, featured: false },
    { name: "Kodaikanal", x: 235, y: 420, size: 3, featured: false },
    { name: "Pushkar", x: 250, y: 250, size: 3, featured: false },
    { name: "Alleppey", x: 215, y: 440, size: 3, featured: false },
    { name: "Jodhpur", x: 230, y: 240, size: 3, featured: false },
  ], []);

  // Connections between nearby locations
  const connections = useMemo(() => {
    const conns: [number, number][] = [];
    for (let i = 0; i < locations.length; i++) {
      for (let j = i + 1; j < locations.length; j++) {
        const dx = locations[i].x - locations[j].x;
        const dy = locations[i].y - locations[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) conns.push([i, j]);
      }
    }
    return conns;
  }, [locations]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3 relative overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 700">
        {/* India outline — simplified abstract shape */}
        <motion.path
          d="M 250 100 Q 320 80 350 110 L 380 130 Q 400 180 390 230 Q 400 260 380 300 Q 370 340 350 370 L 300 420 Q 260 460 240 450 L 220 430 Q 200 400 190 370 Q 180 330 190 290 Q 200 240 220 200 Q 240 150 250 100 Z"
          fill="none"
          stroke="#c9a84c"
          strokeWidth="0.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.15 }}
          transition={{ delay: 0.3, duration: 2 }}
        />

        {/* Network connections */}
        {connections.map(([a, b], i) => (
          <motion.line
            key={`c${i}`}
            x1={locations[a].x} y1={locations[a].y}
            x2={locations[b].x} y2={locations[b].y}
            stroke="#c9a84c"
            strokeWidth="0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ delay: 1.5 + i * 0.05, duration: 0.5 }}
          />
        ))}

        {/* Location nodes */}
        {locations.map((loc, i) => (
          <motion.g key={i}>
            {/* Pulse ring for featured */}
            {loc.featured && (
              <motion.circle
                cx={loc.x} cy={loc.y} r={loc.size + 6}
                fill="none" stroke="#c9a84c" strokeWidth="0.5"
                animate={{ r: [loc.size + 6, loc.size + 15, loc.size + 6], opacity: [0.3, 0, 0.3] }}
                transition={{ delay: 2 + i * 0.1, duration: 2, repeat: Infinity }}
              />
            )}
            {/* Node */}
            <motion.circle
              cx={loc.x} cy={loc.y} r={loc.size}
              fill={loc.featured ? "#c9a84c" : "#c9a84c"}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: loc.featured ? 0.9 : 0.4 }}
              transition={{ delay: 1 + i * 0.08, duration: 0.4 }}
            />
            {/* Label for featured */}
            {loc.featured && (
              <motion.text
                x={loc.x} y={loc.y + loc.size + 14}
                textAnchor="middle" fill="white" fontSize="9"
                fontFamily="var(--font-rubik)" opacity={0.6}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1.5 + i * 0.1 }}
              >
                {loc.name}
              </motion.text>
            )}
          </motion.g>
        ))}

        {/* Counter */}
        <motion.text
          x={600} y={200}
          fill="#c9a84c" fontSize="48" fontWeight="bold"
          fontFamily="var(--font-syne)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
        >
          65+
        </motion.text>
        <motion.text
          x={600} y={225}
          fill="rgba(255,255,255,0.4)" fontSize="12"
          fontFamily="var(--font-rubik)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.7 }}
        >
          properties unlocked
        </motion.text>
      </svg>

      <motion.div
        className="absolute bottom-20 text-center z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">
          Your entire universe. Unlocked.
        </p>
        <p className="text-white/30 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">
          Every golden node is a home waiting for you.
        </p>
      </motion.div>
    </div>
  );
}
