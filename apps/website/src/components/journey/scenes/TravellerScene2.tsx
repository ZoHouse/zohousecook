"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

// Scene 2: The Discount — prices crack/shatter, revealing savings
export default function TravellerScene2() {
  const { nextPhase } = useJourney();
  useEffect(() => { const t = setTimeout(nextPhase, 3500); return () => clearTimeout(t); }, [nextPhase]);

  const prices = [
    { original: "₹1,200", discounted: "₹840", place: "Zostel Manali", save: "30% off" },
    { original: "₹1,500", discounted: "₹1,050", place: "Zo House Delhi", save: "30% off" },
    { original: "₹900", discounted: "₹630", place: "Zostel Goa", save: "30% off" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      {prices.map((price, i) => (
        <motion.div
          key={i}
          className="relative w-[240px] md:w-[320px] rounded-xl overflow-hidden"
          initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.3, duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.08]" />
          <div className="relative p-4 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-[family-name:var(--font-rubik)]">{price.place}</p>
              <div className="flex items-center gap-3 mt-1">
                {/* Original price — slashes through */}
                <motion.span
                  className="text-white/30 text-base md:text-lg font-[family-name:var(--font-rubik)] relative"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ delay: 1 + i * 0.3 }}
                >
                  {price.original}
                  <motion.div
                    className="absolute top-1/2 left-0 right-0 h-[2px] bg-red-500/60"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1 + i * 0.3, duration: 0.3 }}
                    style={{ transformOrigin: "left" }}
                  />
                </motion.span>
                {/* New price */}
                <motion.span
                  className="text-[#f87b2f] text-xl font-[family-name:var(--font-syne)] font-bold"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.3 + i * 0.3, duration: 0.4 }}
                >
                  {price.discounted}
                </motion.span>
              </div>
            </div>
            <motion.div
              className="px-3 py-1 rounded-full bg-[#f87b2f]/15 border border-[#f87b2f]/30"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 + i * 0.3, duration: 0.3 }}
            >
              <span className="text-[#f87b2f] text-xs font-[family-name:var(--font-rubik)] font-medium">{price.save}</span>
            </motion.div>
          </div>
        </motion.div>
      ))}

      <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">Prices unlock for you</p>
        <p className="text-white/40 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">Discounted stays across 65+ properties.</p>
      </motion.div>
    </div>
  );
}
