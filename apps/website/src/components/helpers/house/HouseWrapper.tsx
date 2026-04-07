import React, { createContext, useContext, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FrequencyGate } from "./FrequencyGate";
import { LoadingScreen } from "./LoadingScreen";

const RadioAutoplayContext = createContext(false);
export function useRadioAutoplay() { return useContext(RadioAutoplayContext); }

export function HouseWrapper({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"gate" | "loading" | "ready">("gate");
  const [radioAutoplay, setRadioAutoplay] = useState(false);

  const handleTuneIn = () => {
    setRadioAutoplay(true);
    setPhase("loading");
  };

  const handleLoadingComplete = () => {
    setPhase("ready");
  };

  return (
    <RadioAutoplayContext.Provider value={radioAutoplay}>
      <AnimatePresence mode="wait">
        {phase === "gate" && (
          <FrequencyGate key="gate" onTuneIn={handleTuneIn} />
        )}
        {phase === "loading" && (
          <LoadingScreen key="loading" onComplete={handleLoadingComplete} />
        )}
      </AnimatePresence>
      <div
        style={{
          opacity: phase === "ready" ? 1 : 0,
          transition: "opacity 0.5s ease-out",
        }}
      >
        {children}
      </div>
    </RadioAutoplayContext.Provider>
  );
}
