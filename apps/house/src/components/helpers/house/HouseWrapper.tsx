import React, { createContext, useContext, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FrequencyGate } from "./FrequencyGate";
import { LoadingScreen } from "./LoadingScreen";

const RadioAutoplayContext = createContext(false);
export function useRadioAutoplay() {
  return useContext(RadioAutoplayContext);
}

// Silent 0.1s MP3 used to unlock HTMLAudioElement playback on first user gesture.
// Chrome/Safari autoplay policy: once any Audio element has successfully played
// inside a user gesture, subsequent .play() calls on any Audio element work for
// the session. Without this, the DJ TTS clips (created deep in async callbacks
// via `new Audio(blobUrl).play()` in useRadioSync.createDJAudio) silently fail
// because the sticky activation has long expired by the time they fire.
// Ported from PR #18 which fixed the same bug on the (now-retired) apps/website
// /house page.
const SILENT_MP3 =
  "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7pyn3Xf//FJAhJluQUJgBCIAh4RGqUKgwmMiLCIzOJKuxw+6IxFv/////gfbFoyQ2PnTcOVuPvAAAAAA==";

export function HouseWrapper({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"gate" | "loading" | "ready">("gate");
  const [radioAutoplay, setRadioAutoplay] = useState(false);

  const handleTuneIn = () => {
    // Unlock audio playback for the session before any state update triggers a
    // re-render — must run inside the click event so the browser sees a valid
    // user gesture. Subsequent new Audio().play() will then work, including
    // the DJ TTS clips that fire from async callbacks later.
    try {
      const unlock = new Audio(SILENT_MP3);
      unlock.volume = 0;
      void unlock.play().catch(() => {
        /* autoplay blocked — user can re-click the radio pill */
      });
    } catch {
      /* Audio constructor unavailable (SSR / old browser) */
    }
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
