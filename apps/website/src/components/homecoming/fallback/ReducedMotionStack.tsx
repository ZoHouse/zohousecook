import React from "react";
import { motion } from "framer-motion";
import type { HomecomingPayload } from "../types";

interface Props { payload: HomecomingPayload; onTap: () => void }

export function ReducedMotionStack({ payload, onTap }: Props) {
  const stats = [payload.destinations, payload.nights, payload.zostels, payload.tribe];
  const labels = ["Destinations Unlocked", "Nights Stayed", "Zostels Unlocked", "Tribe Count"];
  return (
    <main style={{ background: "#050708", color: "#fff", minHeight: "100vh" }}>
      <section style={{ padding: 32, textAlign: "center" }}>
        <h1 style={{ fontSize: 40, fontFamily: "Akira, Unbounded, Rubik", fontWeight: 900 }}>
          {payload.first_name ? `${payload.first_name}, welcome back.` : "Welcome back."}
        </h1>
        <p style={{ opacity: 0.7 }}>{payload.handle}</p>
      </section>
      <section style={{ padding: 32, textAlign: "center" }}>
        <h2 style={{ fontSize: 22, marginBottom: 24, opacity: 0.8 }}>Your Zostel Journey</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, maxWidth: 520, margin: "0 auto" }}>
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              style={{ padding: 20, borderRadius: 12, background: "#101214", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div style={{ fontSize: 12, opacity: 0.7 }}>{labels[i]}</div>
              <div style={{ fontSize: 40, fontWeight: 900, fontFamily: "Akira, Unbounded, Rubik" }}>{s.count}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>+{s.xp.toLocaleString()} XP</div>
            </motion.div>
          ))}
        </div>
      </section>
      <section style={{ padding: 32, textAlign: "center" }}>
        <h2 style={{ fontFamily: "Akira, Unbounded, Rubik", fontWeight: 900, fontSize: 28 }}>
          {payload.has_journey ? "Your journey has been of a legend." : "Your journey begins here."}
        </h2>
        <button
          onClick={onTap}
          style={{
            marginTop: 22, padding: "14px 28px", borderRadius: 100,
            background: "#FEDD1E", color: "#111", fontWeight: 800, border: "none", cursor: "pointer",
          }}
        >
          Take your passport →
        </button>
      </section>
    </main>
  );
}
