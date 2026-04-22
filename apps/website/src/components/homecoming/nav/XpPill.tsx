import React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface Props {
  xp: number;
  chipColor: string;
}

export function XpPill({ xp, chipColor }: Props) {
  const mv = useMotionValue(xp);
  const display = useTransform(mv, (v) => Math.round(v).toLocaleString());

  React.useEffect(() => {
    const controls = animate(mv, xp, { duration: 0.3, ease: "linear" });
    return () => controls.stop();
  }, [xp, mv]);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: 100,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${chipColor}`,
        color: chipColor,
        fontWeight: 700,
        fontSize: 13,
        fontFamily: "Rubik, sans-serif",
        boxShadow: `0 0 18px ${chipColor}22`,
        transition: "border-color 400ms, color 400ms, box-shadow 400ms",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 3, background: chipColor }} />
      <motion.span>{display}</motion.span>
      <span style={{ opacity: 0.6 }}>XP</span>
    </div>
  );
}
