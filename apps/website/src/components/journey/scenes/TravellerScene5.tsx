"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useJourney } from "../JourneyContext";

// Scene 5: The Community — event tickets rain, you're in the inner circle
export default function TravellerScene5() {
  const { exitJourney } = useJourney();
  useEffect(() => { const t = setTimeout(exitJourney, 5000); return () => clearTimeout(t); }, [exitJourney]);

  const tickets = useMemo(() => [
    { event: "Sunset Jam", location: "Manali", color: "#29bb7f" },
    { event: "Full Moon Trek", location: "Kasol", color: "#b85dff" },
    { event: "Art Workshop", location: "Udaipur", color: "#f2860c" },
    { event: "Bonfire Night", location: "Goa", color: "#ff0d55" },
    { event: "Yoga Retreat", location: "Rishikesh", color: "#54b835" },
  ], []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-4 px-3 relative overflow-hidden">
      {/* Falling ticket confetti in background */}
      {Array.from({ length: 15 }, (_, i) => (
        <motion.div
          key={`tc${i}`}
          className="absolute w-3 h-2 rounded-sm"
          style={{ left: `${Math.random() * 100}%`, top: -10, backgroundColor: ["#f87b2f", "#29bb7f", "#b85dff", "#c9a84c"][i % 4] }}
          initial={{ y: -10, opacity: 0, rotate: 0 }}
          animate={{ y: 800, opacity: [0, 0.5, 0], rotate: 360 }}
          transition={{ delay: 0.5 + Math.random() * 2, duration: 3 + Math.random() * 2, repeat: Infinity }}
        />
      ))}

      {/* Event ticket cards — stacked/fanned */}
      <div className="relative w-[240px] md:w-[300px] h-[200px] md:h-[240px] mt-4">
        {tickets.map((ticket, i) => (
          <motion.div
            key={ticket.event}
            className="absolute left-1/2 rounded-xl overflow-hidden w-[200px] md:w-[260px]"
            style={{ zIndex: tickets.length - i }}
            initial={{ x: "-50%", y: 200, opacity: 0, rotate: (i - 2) * 5 }}
            animate={{
              x: "-50%",
              y: 20 + i * 18,
              opacity: 1,
              rotate: (i - 2) * 3,
            }}
            transition={{ delay: 0.3 + i * 0.25, duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-white/[0.06] backdrop-blur-sm border border-white/[0.1] rounded-xl" />
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: ticket.color }} />
            <div className="relative p-3 pl-4 flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-[family-name:var(--font-rubik)] font-medium">{ticket.event}</p>
                <p className="text-white/30 text-xs font-[family-name:var(--font-rubik)]">Zostel {ticket.location}</p>
              </div>
              <motion.div
                className="px-2 py-1 rounded-md text-xs font-[family-name:var(--font-rubik)]"
                style={{ backgroundColor: `${ticket.color}20`, color: ticket.color, border: `1px solid ${ticket.color}30` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 + i * 0.2 }}
              >
                FREE
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="relative px-6 py-3 rounded-full overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.5 }}
      >
        <div className="absolute inset-0 bg-white/[0.06] border border-[#f87b2f]/30 rounded-full" />
        <p className="relative text-white/80 text-sm font-[family-name:var(--font-rubik)]">
          🎫 <span className="text-[#f87b2f] font-medium">Unlimited</span> community event access
        </p>
      </motion.div>

      <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
        <p className="text-white/90 text-xl md:text-2xl font-[family-name:var(--font-syne)] font-semibold">You&apos;re in the inner circle</p>
        <p className="text-white/40 text-sm md:text-base font-[family-name:var(--font-rubik)] mt-2">Every event. Every city. Always invited.</p>
      </motion.div>

      <motion.button
        className="px-6 py-2 rounded-full border border-[#f87b2f]/30 text-[#f87b2f] text-sm font-[family-name:var(--font-rubik)]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}
        whileHover={{ scale: 1.05, borderColor: "#f87b2f" }}
        onClick={(e) => { e.stopPropagation(); exitJourney(); }}
      >
        Get your Passport →
      </motion.button>
    </div>
  );
}
