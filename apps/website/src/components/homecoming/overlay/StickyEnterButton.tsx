import React from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Props { visible: boolean; onEnter: () => void }

export function StickyEnterButton({ visible, onEnter }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          onClick={onEnter}
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            padding: "12px 22px",
            borderRadius: 100,
            background: "#FEDD1E",
            color: "#111",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            zIndex: 50,
            boxShadow: "0 8px 32px rgba(254,221,30,0.45)",
          }}
        >
          Enter Zo World →
        </motion.button>
      )}
    </AnimatePresence>
  );
}
