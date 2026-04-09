"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

// Scene 4: The Access — doors open to common areas + co-working
export default function TravellerScene4() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 3500); return () => clearTimeout(t); }, [nextPhase]);

  const spaces = [
    { name: "Common Area", icon: "🛋️", desc: "Chill, work, connect" },
    { name: "Co-working Space", icon: "💻", desc: "High-speed WiFi + desks" },
    { name: "Rooftop Lounge", icon: "🌅", desc: "Sunset views daily" },
    { name: "Community Kitchen", icon: "🍳", desc: "Cook & share meals" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-2">
      {/* Doors opening animation */}
      <div className="relative w-[220px] md:w-[340px] h-[120px] md:h-[160px] flex items-center justify-center flex-shrink-0">
        {/* Left door */}
        <motion.div
          className="absolute left-[40px] md:left-[70px] top-0 w-[80px] md:w-[100px] h-full rounded-l-xl overflow-hidden origin-left"
          style={{ background: "linear-gradient(to right, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", borderLeft: "1px solid rgba(255,255,255,0.1)", borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: -70 }}
          transition={{ delay: 0.8, duration: 1, ease: "easeInOut" }}
        />
        {/* Right door */}
        <motion.div
          className="absolute right-[40px] md:right-[70px] top-0 w-[80px] md:w-[100px] h-full rounded-r-xl overflow-hidden origin-right"
          style={{ background: "linear-gradient(to left, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", borderRight: "1px solid rgba(255,255,255,0.1)", borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 70 }}
          transition={{ delay: 0.8, duration: 1, ease: "easeInOut" }}
        />
        {/* Light pouring out */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <motion.div
            className="w-20 h-40 bg-gradient-to-b from-[#f87b2f]/20 to-transparent blur-xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        {/* ACCESS GRANTED */}
        <motion.p
          className="absolute text-[#f87b2f] text-xs font-mono tracking-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          ACCESS GRANTED
        </motion.p>
      </div>

      {/* Space cards */}
      <div className="grid grid-cols-2 gap-3 w-[250px] md:w-[340px]">
        {spaces.map((space, i) => (
          <motion.div
            key={space.name}
            className="relative rounded-xl overflow-hidden p-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 + i * 0.15, duration: 0.4 }}
          >
            <div className="absolute inset-0 bg-white/[0.04] border border-white/[0.08] rounded-xl" />
            <div className="relative text-center">
              <span className="text-xl">{space.icon}</span>
              <p className="text-white/70 text-sm font-[family-name:var(--font-rubik)] mt-1">{space.name}</p>
              <p className="text-white/30 text-[10px] font-[family-name:var(--font-rubik)]">{space.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">Doors open for you</p>
        <p className="text-white/40 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">Common areas, co-working, and more — included.</p>
      </motion.div>
    </div>
  );
}
