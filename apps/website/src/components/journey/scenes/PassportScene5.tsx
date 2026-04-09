"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useJourney } from "../JourneyContext";

// Scene 5: CLAIM IT — The passport hovers, irresistible. Final CTA.
export default function PassportScene5() {
  const { exitJourney } = useJourney();
  useEffect(() => { const t = setTimeout(exitJourney, 8000); return () => clearTimeout(t); }, [exitJourney]);

  const savings = useMotionValue(0);
  const savingsDisplay = useTransform(savings, (v) => `₹${Math.round(v).toLocaleString("en-IN")}`);
  useEffect(() => { const c = animate(savings, 47500, { duration: 2.5, delay: 1.5, ease: [0.25, 0.4, 0.25, 1] }); return c.stop; }, [savings]);

  // Floating golden particles around the passport
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      angle: (i / 30) * Math.PI * 2,
      radius: 130 + Math.random() * 40,
      speed: 3 + Math.random() * 4,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 2,
    })), []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3 relative overflow-hidden">
      {/* Orbiting golden particles */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {particles.map((p) => (
          <motion.circle
            key={p.id}
            r={p.size}
            fill="#c9a84c"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ delay: p.delay, duration: p.speed, repeat: Infinity }}
          >
            <animateMotion
              dur={`${p.speed}s`}
              begin={`${p.delay}s`}
              repeatCount="indefinite"
              path={`M ${400 + Math.cos(p.angle) * p.radius} ${300 + Math.sin(p.angle) * p.radius} A ${p.radius} ${p.radius} 0 1 1 ${400 + Math.cos(p.angle + 0.01) * p.radius} ${300 + Math.sin(p.angle + 0.01) * p.radius}`}
            />
          </motion.circle>
        ))}
      </svg>

      {/* Central passport */}
      <motion.div
        className="relative w-[180px] md:w-[220px] h-[240px] md:h-[300px] rounded-2xl overflow-hidden"
        initial={{ scale: 0.5, opacity: 0, rotateY: -30 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
        style={{ perspective: 800 }}
      >
        {/* Passport body */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2d1054] to-[#1a0a2e] rounded-2xl" />

        {/* Gold border */}
        <motion.div
          className="absolute inset-[6px] rounded-xl border border-[#c9a84c]/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        />

        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{ background: "linear-gradient(105deg, transparent 40%, rgba(201,168,76,0.25) 50%, transparent 60%)", backgroundSize: "200% 100%" }}
          animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
          transition={{ duration: 2, delay: 1, repeat: Infinity, repeatDelay: 2 }}
        />

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center h-full gap-3 p-6">
          {/* Emblem */}
          <motion.div
            className="w-16 h-16 rounded-full border border-[#c9a84c]/50 flex items-center justify-center"
            animate={{ boxShadow: ["0 0 0 rgba(201,168,76,0)", "0 0 30px rgba(201,168,76,0.4)", "0 0 0 rgba(201,168,76,0)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-[#c9a84c] text-2xl font-bold font-[family-name:var(--font-syne)]">Z</span>
          </motion.div>

          <p className="text-[#c9a84c] text-xs tracking-[2px] font-[family-name:var(--font-rubik)]">ZO WORLD</p>
          <div className="w-10 h-px bg-[#c9a84c]/30" />
          <p className="text-[#c9a84c] text-base md:text-lg tracking-wider font-[family-name:var(--font-syne)] font-semibold">PASSPORT</p>

          <div className="flex gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-[#c9a84c]/50"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ delay: i * 0.1, duration: 1.5, repeat: Infinity }}
              />
            ))}
          </div>
        </div>

        {/* Glow behind */}
        <motion.div
          className="absolute inset-[-30%] -z-10 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(149,13,255,0.15), transparent 60%)" }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.div>

      {/* Stats */}
      <motion.div
        className="flex gap-8 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <div className="text-center">
          <motion.p className="text-[#c9a84c] text-2xl font-[family-name:var(--font-syne)] font-bold tabular-nums">
            <motion.span>{savingsDisplay}</motion.span>
          </motion.p>
          <p className="text-white/30 text-xs font-[family-name:var(--font-rubik)]">avg. savings/year</p>
        </div>
        <div className="w-px h-10 bg-white/10" />
        <div className="text-center">
          <p className="text-[#54b835] text-2xl font-[family-name:var(--font-syne)] font-bold">∞</p>
          <p className="text-white/30 text-xs font-[family-name:var(--font-rubik)]">earning potential</p>
        </div>
        <div className="w-px h-10 bg-white/10" />
        <div className="text-center">
          <p className="text-[#b85dff] text-2xl font-[family-name:var(--font-syne)] font-bold">50K+</p>
          <p className="text-white/30 text-xs font-[family-name:var(--font-rubik)]">community</p>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.button
        className="relative mt-8 px-12 py-4 rounded-2xl overflow-hidden group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={(e) => { e.stopPropagation(); exitJourney(); }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#c9a84c] to-[#e6c65c] rounded-2xl" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-2xl"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
        />
        {/* Pulse glow */}
        <motion.div
          className="absolute inset-[-4px] rounded-2xl border-2 border-[#c9a84c]"
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.02, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="relative text-black font-[family-name:var(--font-syne)] font-bold text-base md:text-lg tracking-wide">
          CLAIM YOUR PASSPORT
        </span>
      </motion.button>

      <motion.p
        className="text-white/20 text-xs font-[family-name:var(--font-rubik)] mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4 }}
      >
        Join 50,000+ citizens already inside.
      </motion.p>
    </div>
  );
}
