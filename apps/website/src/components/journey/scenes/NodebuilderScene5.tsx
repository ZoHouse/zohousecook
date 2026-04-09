"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJourney } from "../JourneyContext";

export default function NodebuilderScene5() {
  const { exitJourney } = useJourney();
  useEffect(() => { const t = setTimeout(exitJourney, 5500); return () => clearTimeout(t); }, [exitJourney]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3">
      {/* The pitch */}
      <motion.div
        className="text-center max-w-[480px] space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.p
          className="text-5xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          🤫
        </motion.p>

        <motion.p
          className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Here&apos;s what we can tell you...
        </motion.p>

        <motion.div
          className="relative rounded-2xl overflow-hidden p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-xl border border-[#ff0d55]/20 rounded-2xl" />
          <div className="relative space-y-3">
            <p className="text-white/70 text-sm md:text-base font-[family-name:var(--font-rubik)] leading-relaxed">
              Got a terrace? A cafe? A studio? A farmhouse?
            </p>
            <p className="text-[#ff0d55] text-base md:text-lg font-[family-name:var(--font-rubik)] font-medium">
              You&apos;ll be able to open it up for the Zo community.
            </p>
            <p className="text-white/50 text-sm font-[family-name:var(--font-rubik)]">
              Events. Meetups. Co-working. Hosted by the community, for the community.
            </p>
          </div>
        </motion.div>

        <motion.p
          className="text-white/30 text-sm font-[family-name:var(--font-rubik)] italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          That&apos;s all you get for now. No spoilers. 😏
        </motion.p>
      </motion.div>

      {/* CTA — get the passport */}
      <motion.button
        className="relative px-8 py-3 rounded-xl overflow-hidden group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={(e) => { e.stopPropagation(); exitJourney(); }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff0d55] to-[#ff6b8a] rounded-xl" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
        <span className="relative text-white font-[family-name:var(--font-rubik)] font-medium">
          Get the Passport &amp; you&apos;ll know soon 🔥
        </span>
      </motion.button>
    </div>
  );
}
