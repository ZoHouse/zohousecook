"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

// Scene 3: CHOOSE YOUR POWER — all 5 roles displayed as power cards with benefits
export default function PassportScene3() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 5000); return () => clearTimeout(t); }, [nextPhase]);

  const roles = [
    { name: "Creator", color: "#b85dff", icon: "✦", power: "Earn per view", desc: "Turn travel stories into real income" },
    { name: "Tribebuilder", color: "#f2860c", icon: "◉", power: "10% commission", desc: "Share links. Drive bookings. Get paid." },
    { name: "Host", color: "#29bb7f", icon: "★", power: "Build legacy", desc: "Create experiences people never forget" },
    { name: "Traveller", color: "#f87b2f", icon: "◈", power: "30% off stays", desc: "Premium access across 65+ properties" },
    { name: "Nodebuilder", color: "#ff0d55", icon: "◆", power: "???", desc: "Something massive. Coming soon." },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3 relative overflow-hidden">
      <motion.p
        className="text-[#c9a84c] text-sm tracking-[4px] font-[family-name:var(--font-rubik)] font-medium mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        ONE PASSPORT. FIVE POWERS.
      </motion.p>

      {/* Role cards in a fan layout */}
      <div className="relative w-full max-w-[340px] md:max-w-[600px] h-[220px] md:h-[280px] flex items-center justify-center">
        {roles.map((role, i) => {
          const angle = (i - 2) * 8;
          const yOffset = Math.abs(i - 2) * 8;
          return (
            <motion.div
              key={role.name}
              className="absolute w-[150px] md:w-[180px] rounded-2xl overflow-hidden"
              style={{ transformOrigin: "bottom center", zIndex: 5 - Math.abs(i - 2) }}
              initial={{ opacity: 0, y: 100, rotate: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: yOffset, rotate: angle, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <div className="absolute inset-0 bg-white/[0.05] backdrop-blur-xl border rounded-2xl" style={{ borderColor: `${role.color}30` }} />
              <div className="absolute inset-0 rounded-2xl" style={{ background: `linear-gradient(to bottom, ${role.color}10, transparent)` }} />

              <div className="relative p-5 text-center">
                <motion.div
                  className="text-3xl mb-2"
                  style={{ color: role.color }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ delay: 1.5 + i * 0.2, duration: 2, repeat: Infinity }}
                >
                  {role.icon}
                </motion.div>
                <p className="text-white font-[family-name:var(--font-syne)] font-semibold text-base">{role.name}</p>
                <p className="font-[family-name:var(--font-rubik)] font-medium text-xs mt-1" style={{ color: role.color }}>{role.power}</p>
                <p className="text-white/40 text-[10px] font-[family-name:var(--font-rubik)] mt-2 leading-tight">{role.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* "You can be ALL of them" */}
      <motion.div
        className="text-center mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">
          You don&apos;t pick one.
        </p>
        <motion.p
          className="text-[#c9a84c] text-xl font-[family-name:var(--font-syne)] font-semibold mt-1"
          animate={{ textShadow: ["0 0 0 rgba(201,168,76,0)", "0 0 20px rgba(201,168,76,0.4)", "0 0 0 rgba(201,168,76,0)"] }}
          transition={{ delay: 2.5, duration: 2, repeat: Infinity }}
        >
          You become all of them.
        </motion.p>
      </motion.div>
    </div>
  );
}
