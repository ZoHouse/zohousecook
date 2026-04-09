"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useJourney } from "../JourneyContext";

// Scene 1: THE AWAKENING — darkness, heartbeat, golden emblem materializes from scattered particles
export default function PassportScene1() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 5000); return () => clearTimeout(t); }, [nextPhase]);

  // Particles that form the Z emblem
  const emblemParticles = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => {
      const angle = (i / 80) * Math.PI * 2;
      const isInner = i < 40;
      const r = isInner ? 60 : 80;
      return {
        id: i,
        finalX: Math.cos(angle) * r,
        finalY: Math.sin(angle) * r,
        startX: (Math.random() - 0.5) * 1000,
        startY: (Math.random() - 0.5) * 800,
        delay: 1.5 + Math.random() * 1,
        size: isInner ? 2 : 2.5,
      };
    }), []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3 relative overflow-hidden">
      {/* Heartbeat pulse — screen flash */}
      <motion.div
        className="absolute inset-0 bg-[#c9a84c]"
        animate={{ opacity: [0, 0, 0.03, 0, 0, 0.02, 0] }}
        transition={{ duration: 2, times: [0, 0.3, 0.35, 0.4, 0.65, 0.7, 0.75] }}
      />

      {/* Heartbeat sound-wave line */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 700">
        <motion.path
          d="M 0 350 L 250 350 L 290 320 L 310 380 L 340 280 L 360 420 L 380 310 L 410 350 L 800 350"
          fill="none"
          stroke="#c9a84c"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [0, 0.4, 0.4, 0] }}
          transition={{ duration: 2, times: [0, 0.6, 0.8, 1] }}
        />
      </svg>

      {/* Central emblem area */}
      <div className="relative w-[130px] md:w-[180px] h-[160px] md:h-[180px]">
        <svg className="absolute inset-0 w-full h-full" viewBox="-100 -100 200 200">
          {/* Particles converging into emblem circles */}
          {emblemParticles.map((p) => (
            <motion.circle
              key={p.id}
              r={p.size}
              fill="#c9a84c"
              initial={{ cx: p.startX, cy: p.startY, opacity: 0 }}
              animate={{
                cx: [p.startX, p.finalX],
                cy: [p.startY, p.finalY],
                opacity: [0, 0.9],
              }}
              transition={{ delay: p.delay, duration: 1.2, ease: [0.25, 0.4, 0.25, 1] }}
            />
          ))}

          {/* Outer ring drawing */}
          <motion.circle
            cx={0} cy={0} r={80}
            fill="none" stroke="#c9a84c" strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ delay: 2.5, duration: 1 }}
          />

          {/* Inner ring */}
          <motion.circle
            cx={0} cy={0} r={55}
            fill="none" stroke="#c9a84c" strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ delay: 2.8, duration: 0.8 }}
          />

          {/* Z letter center */}
          <motion.text
            x={0} y={12}
            textAnchor="middle"
            fill="#c9a84c"
            fontSize="50"
            fontWeight="bold"
            fontFamily="var(--font-syne)"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 3, duration: 0.6 }}
          >
            Z
          </motion.text>
        </svg>

        {/* Radial glow behind emblem */}
        <motion.div
          className="absolute inset-[-50%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.2), transparent 60%)" }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.5, duration: 1.5 }}
        />
      </div>

      {/* Text reveal */}
      <motion.div className="text-center mt-12 relative z-10">
        <motion.p
          className="text-[#c9a84c] text-sm tracking-[6px] font-[family-name:var(--font-rubik)] font-medium"
          initial={{ opacity: 0, letterSpacing: "12px" }}
          animate={{ opacity: 1, letterSpacing: "6px" }}
          transition={{ delay: 3.2, duration: 1 }}
        >
          YOU HAVE BEEN CHOSEN
        </motion.p>
        <motion.p
          className="text-white/30 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.8 }}
        >
          The passport has been waiting for you.
        </motion.p>
      </motion.div>
    </div>
  );
}
