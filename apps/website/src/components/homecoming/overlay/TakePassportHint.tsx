import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  visible: boolean;
  hasJourney: boolean;
}

export function TakePassportHint({ visible, hasJourney }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: "absolute",
            top: "22%",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          <h2 style={{
            fontFamily: "Akira, Unbounded, Rubik",
            fontWeight: 900,
            fontSize: 32,
            margin: 0,
            color: "#fff",
            letterSpacing: "-0.02em",
          }}>
            {hasJourney ? "Your journey has been of a legend." : "Your journey begins here."}
          </h2>
          <p style={{ opacity: 0.7, marginTop: 10, fontSize: 13 }}>Take your passport →</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
