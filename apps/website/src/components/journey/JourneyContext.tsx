"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type JourneyPhase =
  | "idle"
  | "scene-1"
  | "scene-2"
  | "scene-3"
  | "scene-4"
  | "scene-5"
  | "zoom-out";

const PHASE_ORDER: JourneyPhase[] = [
  "idle",
  "scene-1", "scene-2", "scene-3", "scene-4", "scene-5",
  "zoom-out",
];

interface JourneyState {
  phase: JourneyPhase;
  roleLabel: string | null;
  startJourney: (label: string) => void;
  nextPhase: () => void;
  prevPhase: () => void;
  exitJourney: () => void;
}

const JourneyContext = createContext<JourneyState>({
  phase: "idle",
  roleLabel: null,
  startJourney: () => {},
  nextPhase: () => {},
  prevPhase: () => {},
  exitJourney: () => {},
});

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<JourneyPhase>("idle");
  const [roleLabel, setRoleLabel] = useState<string | null>(null);

  const startJourney = useCallback((label: string) => {
    if (phase !== "idle") return;
    setRoleLabel(label);
    setPhase("scene-1");
  }, [phase]);

  const nextPhase = useCallback(() => {
    setPhase((current) => {
      const idx = PHASE_ORDER.indexOf(current);
      if (idx === -1 || idx >= PHASE_ORDER.length - 1) return "idle";
      return PHASE_ORDER[idx + 1];
    });
  }, []);

  const prevPhase = useCallback(() => {
    setPhase((current) => {
      const idx = PHASE_ORDER.indexOf(current);
      if (idx <= 1) return current;
      return PHASE_ORDER[idx - 1];
    });
  }, []);

  const exitJourney = useCallback(() => {
    setPhase("zoom-out");
    setTimeout(() => {
      setPhase("idle");
      setRoleLabel(null);
    }, 600);
  }, []);

  return (
    <JourneyContext.Provider value={{ phase, roleLabel, startJourney, nextPhase, prevPhase, exitJourney }}>
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  return useContext(JourneyContext);
}

export { JourneyContext };
