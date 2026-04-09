"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Rubik, Syne } from "next/font/google";
import { cn } from "@zo/utils/font";
import { rubikClassName } from "../utils/font";
import { useJourney } from "./JourneyContext";

// Font CSS variables for scene components that use font-[family-name:var(--font-syne)]
const syne = Syne({ subsets: ["latin"], display: "swap", variable: "--font-syne" });
const rubik = Rubik({ subsets: ["latin"], display: "swap", variable: "--font-rubik" });

// Creator scenes
import CreatorScene1 from "./scenes/CreatorScene1";
import CreatorScene2 from "./scenes/CreatorScene2";
import CreatorScene3 from "./scenes/CreatorScene3";
import CreatorScene4 from "./scenes/CreatorScene4";
import CreatorScene5 from "./scenes/CreatorScene5";

// Tribebuilder scenes
import TribebuilderScene1 from "./scenes/TribebuilderScene1";
import TribebuilderScene2 from "./scenes/TribebuilderScene2";
import TribebuilderScene3 from "./scenes/TribebuilderScene3";
import TribebuilderScene4 from "./scenes/TribebuilderScene4";
import TribebuilderScene5 from "./scenes/TribebuilderScene5";

// Host scenes
import HostScene1 from "./scenes/HostScene1";
import HostScene2 from "./scenes/HostScene2";
import HostScene3 from "./scenes/HostScene3";
import HostScene4 from "./scenes/HostScene4";
import HostScene5 from "./scenes/HostScene5";

// Traveller scenes
import TravellerScene1 from "./scenes/TravellerScene1";
import TravellerScene2 from "./scenes/TravellerScene2";
import TravellerScene3 from "./scenes/TravellerScene3";
import TravellerScene4 from "./scenes/TravellerScene4";
import TravellerScene5 from "./scenes/TravellerScene5";

// Nodebuilder scenes
import NodebuilderScene1 from "./scenes/NodebuilderScene1";
import NodebuilderScene2 from "./scenes/NodebuilderScene2";
import NodebuilderScene3 from "./scenes/NodebuilderScene3";
import NodebuilderScene4 from "./scenes/NodebuilderScene4";
import NodebuilderScene5 from "./scenes/NodebuilderScene5";

// Passport scenes
import PassportScene1 from "./scenes/PassportScene1";
import PassportScene2 from "./scenes/PassportScene2";
import PassportScene3 from "./scenes/PassportScene3";
import PassportScene4 from "./scenes/PassportScene4";
import PassportScene5 from "./scenes/PassportScene5";

const SCENE_PHASES = ["scene-1", "scene-2", "scene-3", "scene-4", "scene-5"] as const;

// Maps site role names to internal journey keys
const ROLE_TO_JOURNEY: Record<string, string> = {
  Travel: "Traveller",
  Create: "Creator",
  Vibetribe: "Tribebuilder",
  Host: "Host",
  Build: "Nodebuilder",
  Passport: "Passport",
};

const JOURNEY_META: Record<string, { labels: string[]; color: string }> = {
  Creator: { labels: ["Passport", "Travel", "Capture", "Quest", "Earn"], color: "#b85dff" },
  Tribebuilder: { labels: ["Your Link", "The Ripple", "Dashboard", "Booking", "Earnings"], color: "#FF0D55" },
  Host: { labels: ["The Space", "Invitation", "Gathering", "The Moment", "Legacy"], color: "#29bb7f" },
  Traveller: { labels: ["The Key", "Discounts", "Future", "Access", "Community"], color: "#f87b2f" },
  Nodebuilder: { labels: ["Wait...", "Patience", "Foreplay", "Loading...", "The Tease"], color: "#FF3B3B" },
  Passport: { labels: ["Awakening", "Your Universe", "Your Powers", "The Contrast", "Claim It"], color: "#c9a84c" },
};

function getSceneComponent(roleLabel: string | null, phase: string) {
  const journeyKey = roleLabel ? (ROLE_TO_JOURNEY[roleLabel] || roleLabel) : null;
  const sceneNum = phase.replace("scene-", "");

  if (journeyKey === "Creator") {
    return { "1": <CreatorScene1 />, "2": <CreatorScene2 />, "3": <CreatorScene3 />, "4": <CreatorScene4 />, "5": <CreatorScene5 /> }[sceneNum] || null;
  }
  if (journeyKey === "Tribebuilder") {
    return { "1": <TribebuilderScene1 />, "2": <TribebuilderScene2 />, "3": <TribebuilderScene3 />, "4": <TribebuilderScene4 />, "5": <TribebuilderScene5 /> }[sceneNum] || null;
  }
  if (journeyKey === "Host") {
    return { "1": <HostScene1 />, "2": <HostScene2 />, "3": <HostScene3 />, "4": <HostScene4 />, "5": <HostScene5 /> }[sceneNum] || null;
  }
  if (journeyKey === "Traveller") {
    return { "1": <TravellerScene1 />, "2": <TravellerScene2 />, "3": <TravellerScene3 />, "4": <TravellerScene4 />, "5": <TravellerScene5 /> }[sceneNum] || null;
  }
  if (journeyKey === "Nodebuilder") {
    return { "1": <NodebuilderScene1 />, "2": <NodebuilderScene2 />, "3": <NodebuilderScene3 />, "4": <NodebuilderScene4 />, "5": <NodebuilderScene5 /> }[sceneNum] || null;
  }
  if (journeyKey === "Passport") {
    return { "1": <PassportScene1 />, "2": <PassportScene2 />, "3": <PassportScene3 />, "4": <PassportScene4 />, "5": <PassportScene5 /> }[sceneNum] || null;
  }
  return null;
}

function haptic(ms: number | number[] = 15) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
}

export default function JourneyOverlay() {
  const { phase, roleLabel, exitJourney, nextPhase, prevPhase } = useJourney();
  const isActive = SCENE_PHASES.includes(phase as typeof SCENE_PHASES[number]);
  const currentIdx = SCENE_PHASES.indexOf(phase as typeof SCENE_PHASES[number]);
  const journeyKey = roleLabel ? (ROLE_TO_JOURNEY[roleLabel] || roleLabel) : "Creator";
  const meta = JOURNEY_META[journeyKey] || JOURNEY_META.Creator;
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key === "Escape") exitJourney();
      if (e.key === "ArrowLeft") { prevPhase(); haptic(); }
      if (e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        if (phase === "scene-5") exitJourney();
        else { nextPhase(); haptic(); }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isActive, phase, exitJourney, nextPhase, prevPhase]);

  // No body scroll lock needed — the fixed overlay naturally blocks the page

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > 50 && absDx > absDy) {
      if (dx < 0) {
        haptic();
        if (phase === "scene-5") exitJourney();
        else nextPhase();
      } else {
        haptic();
        prevPhase();
      }
    } else if (dy > 80 && absDy > absDx) {
      haptic([10, 30, 10]);
      exitJourney();
    }
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className={`fixed inset-0 z-[100] ${syne.variable} ${rubik.variable}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Translucent backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={exitJourney} />

          {/* Centered card */}
          <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 z-10">
            <motion.div
              className="relative w-full max-w-[520px] rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(180deg, rgba(30,30,30,0.95) 0%, rgba(10,10,10,0.98) 100%)",
                boxShadow: `0 0 80px ${meta.color}15, 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)`,
                border: `1px solid ${meta.color}20`,
              }}
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
            >
              {/* Card header */}
              <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2">
                <span className={cn("text-xs tracking-[2px]", rubikClassName)} style={{ color: `${meta.color}90` }}>
                  {(roleLabel || "").toUpperCase()} — {currentIdx + 1}/{SCENE_PHASES.length} — {meta.labels[currentIdx]}
                </span>
                <motion.button
                  className={cn("px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/50 text-xs hover:text-white hover:border-white/30 transition-colors", rubikClassName)}
                  onClick={exitJourney}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ✕
                </motion.button>
              </div>

              {/* Scene content — scrollable container + horizontal swipe zone */}
              <div
                className="relative h-[420px] md:h-[480px] overflow-y-auto overflow-x-hidden scrollbar-hide"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${roleLabel}-${phase}`}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                  >
                    {getSceneComponent(roleLabel, phase)}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Card footer — progress dots + nav hint + swipe zone */}
              <div
                className="relative z-10 flex flex-col items-center gap-2 px-5 pb-4 pt-2"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div className="flex gap-2">
                  {SCENE_PHASES.map((_, i) => (
                    <motion.div
                      key={i}
                      className="rounded-full"
                      animate={{
                        width: i === currentIdx ? 24 : 8,
                        height: 8,
                        backgroundColor: i === currentIdx ? meta.color : i < currentIdx ? meta.color : "rgba(255,255,255,0.15)",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>
                <span className={cn("text-white/20 text-[10px]", rubikClassName)}>
                  <span className="hidden md:inline">Space / → next &bull; ← back &bull; Esc close</span>
                  <span className="md:hidden">Swipe ← → navigate &bull; ↓ close</span>
                </span>
              </div>

              {/* Subtle color glow in top-left */}
              <div
                className="absolute w-[200px] h-[200px] -left-12 -top-12 pointer-events-none opacity-40"
                style={{ background: meta.color, filter: "blur(100px)" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
