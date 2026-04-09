"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

export default function JourneyScene2() {
  const { nextPhase } = useJourney();

  useEffect(() => {
    const timer = setTimeout(nextPhase, 4000);
    return () => clearTimeout(timer);
  }, [nextPhase]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      {/* Globe Card */}
      <motion.div
        className="relative w-[300px] md:w-[400px] h-[300px] md:h-[400px] rounded-3xl overflow-hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
      >
        {/* Glass bg */}
        <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-white/[0.1]" />

        {/* Globe */}
        <div className="relative flex items-center justify-center h-full">
          {/* Globe circle */}
          <motion.div
            className="w-56 h-56 rounded-full border border-white/20 relative overflow-hidden"
            style={{ background: "radial-gradient(circle at 35% 35%, #1a3a5c, #0a1628)" }}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Grid lines - horizontal */}
            {[-30, 0, 30].map((y, i) => (
              <motion.div
                key={`h${i}`}
                className="absolute left-0 right-0 h-px bg-white/10"
                style={{ top: `${50 + y}%` }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
              />
            ))}
            {/* Grid lines - vertical (arcs approximated) */}
            {[-25, 0, 25].map((x, i) => (
              <motion.div
                key={`v${i}`}
                className="absolute top-0 bottom-0 w-px bg-white/10"
                style={{ left: `${50 + x}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
              />
            ))}

            {/* Animated travel path */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 224 224">
              <motion.path
                d="M 50 130 Q 80 70 112 90 Q 150 110 180 80"
                fill="none"
                stroke="#b85dff"
                strokeWidth="2"
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
              />
              {/* Traveler dot following the path */}
              <motion.circle
                r="5"
                fill="#b85dff"
                filter="url(#glow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <animateMotion
                  dur="2s"
                  begin="1.2s"
                  fill="freeze"
                  path="M 50 130 Q 80 70 112 90 Q 150 110 180 80"
                />
              </motion.circle>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>

            {/* Glow from globe */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          </motion.div>

          {/* Location Pin */}
          <motion.div
            className="absolute"
            style={{ top: "28%", right: "22%" }}
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2.5, duration: 0.5, type: "spring", stiffness: 300, damping: 15 }}
          >
            <div className="flex flex-col items-center">
              <div className="bg-[#b85dff] rounded-full w-6 h-6 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <motion.div
                className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white mt-1 whitespace-nowrap border border-white/10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.8, duration: 0.3 }}
              >
                Zostel Manali
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Text */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">
          Travel to a Zostel property
        </p>
        <p className="text-white/50 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">
          Pick your destination. Your quest awaits.
        </p>
      </motion.div>
    </div>
  );
}
