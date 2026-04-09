/**
 * Standalone onboarding test harness.
 * Visit localhost:4202/test-onboarding while logged in.
 * Jump to any step, see the real UI with real API calls.
 * Useful for re-testing onboarding without a new phone number.
 */
import { useRouter } from "next/router";
import React, { useState, useCallback, useEffect, useRef } from "react";
import useProfile from "../../../../libs/auth/src/hooks/useProfile";
import Nickname from "../../../../libs/auth/src/components/ZoAuth/steps/Nickname";
import Avatar from "../../../../libs/auth/src/components/ZoAuth/steps/Avatar";
import Whereabouts from "../../../../libs/auth/src/components/ZoAuth/steps/Whereabouts";
import Citizen from "../../../../libs/auth/src/components/ZoAuth/steps/Citizen";
import Hometown from "../../../../libs/auth/src/components/ZoAuth/steps/Hometown";
import Birthday from "../../../../libs/auth/src/components/ZoAuth/steps/Birthday";
import Cultures from "../../../../libs/auth/src/components/ZoAuth/steps/Cultures";
import { computeOnboardingQueue } from "../../../../libs/auth/src/components/ZoAuth/steps/computeOnboardingQueue";
import { fetchWhereabouts } from "../../../../libs/auth/src/utils/whereabouts";
import { useAuth } from "../../../../libs/auth/src/contexts/auth";

type StepName =
  | "NICKNAME"
  | "AVATAR"
  | "WHEREABOUTS"
  | "CITIZEN"
  | "HOMETOWN"
  | "BIRTHDAY"
  | "CULTURES"
  | "DONE";

const ALL_STEPS: StepName[] = [
  "NICKNAME",
  "AVATAR",
  "WHEREABOUTS",
  "CITIZEN",
  "HOMETOWN",
  "BIRTHDAY",
  "CULTURES",
];

export default function TestOnboarding() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { profile } = useProfile();
  const [currentStep, setCurrentStep] = useState<StepName>("NICKNAME");
  const [completedSteps, setCompletedSteps] = useState<Set<StepName>>(
    new Set()
  );
  const [log, setLog] = useState<string[]>([]);
  const [missingSteps, setMissingSteps] = useState<string[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * 12;
    const rotateY = (x - 0.5) * 12;
    setTilt({ rotateX, rotateY, glareX: x * 100, glareY: y * 100 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  }, []);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 49),
    ]);
  }, []);

  useEffect(() => {
    if (!profile) return;
    fetchWhereabouts()
      .then((w) => {
        const queue = computeOnboardingQueue(profile, w);
        setMissingSteps(queue);
        addLog(
          `Queue: ${queue.length === 0 ? "all filled" : queue.join(" → ")}`
        );
      })
      .catch(() => {
        const queue = computeOnboardingQueue(profile, null);
        setMissingSteps(queue);
        addLog(`Queue (no whereabouts): ${queue.join(" → ")}`);
      });
  }, [profile, addLog]);

  const advanceOnboarding = useCallback(() => {
    addLog(`${currentStep} completed`);
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    const currentIdx = ALL_STEPS.indexOf(currentStep);
    if (currentIdx < ALL_STEPS.length - 1) {
      const next = ALL_STEPS[currentIdx + 1];
      setCurrentStep(next);
      addLog(`→ ${next}`);
    } else {
      setCurrentStep("DONE");
      addLog("All steps complete! Redirecting to /passport...");
    }
  }, [currentStep, addLog]);

  // Redirect to /passport when all steps complete
  useEffect(() => {
    if (currentStep === "DONE") {
      router.push("/passport");
    }
  }, [currentStep, router]);

  const jumpTo = (step: StepName) => {
    setCurrentStep(step);
    addLog(`Jumped → ${step}`);
    setShowPanel(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-4">Onboarding Test Harness</h1>
          <p className="text-white/50 mb-2">
            You need to be logged in to test onboarding steps.
          </p>
          <p className="text-white/30 text-sm">
            Steps call real APIs (nickname check, profile save, cultures fetch).
          </p>
          <a
            href="/"
            className="inline-block mt-6 px-6 py-3 bg-white text-black rounded-lg font-bold text-sm"
          >
            Go to Home & Log In
          </a>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case "NICKNAME":
        return <Nickname advanceOnboarding={advanceOnboarding} />;
      case "AVATAR":
        return <Avatar advanceOnboarding={advanceOnboarding} />;
      case "WHEREABOUTS":
        return <Whereabouts advanceOnboarding={advanceOnboarding} />;
      case "CITIZEN":
        return <Citizen advanceOnboarding={advanceOnboarding} />;
      case "HOMETOWN":
        return <Hometown advanceOnboarding={advanceOnboarding} />;
      case "BIRTHDAY":
        return <Birthday advanceOnboarding={advanceOnboarding} />;
      case "CULTURES":
        return <Cultures advanceOnboarding={advanceOnboarding} />;
      case "DONE":
        return null;
      default:
        return null;
    }
  };

  const stepNav = (
    <div className="flex flex-col gap-1">
      {ALL_STEPS.map((step) => (
        <button
          key={step}
          onClick={() => jumpTo(step)}
          className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
            step === currentStep
              ? "bg-white/10 text-white font-bold"
              : completedSteps.has(step)
              ? "text-green-400 hover:bg-white/5"
              : "text-white/50 hover:bg-white/5"
          }`}
        >
          {completedSteps.has(step)
            ? "✅ "
            : step === currentStep
            ? "▶ "
            : "○ "}
          {step}
          {missingSteps.includes(step) && (
            <span className="ml-2 text-xs text-yellow-400">(missing)</span>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative">
      {/* TV Frame overlay */}
      <img
        src="https://zoworld-static.s3.ap-south-1.amazonaws.com/media/meme/tv-frame.png"
        className="fixed inset-0 z-50 w-full h-full pointer-events-none object-fill"
        alt=""
      />

      <div className="flex min-h-screen relative z-[60]">
        {/* Main step area */}
        <div className="flex-1 flex items-center justify-center px-10 py-16 md:px-4 md:py-8" style={{ perspective: "1200px" }}>
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full max-w-xs md:max-w-md rounded-3xl border border-white/[0.12] p-6 md:p-10 relative overflow-hidden will-change-transform"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.2) 100%)",
              backdropFilter: "blur(60px) saturate(1.4)",
              WebkitBackdropFilter: "blur(60px) saturate(1.4)",
              boxShadow:
                "0 8px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.02)",
              transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
              transition: "transform 0.15s ease-out",
            }}
          >
            {/* Mouse-follow glare */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none opacity-40"
              style={{
                background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.08) 0%, transparent 50%)`,
                transition: "background 0.15s ease-out",
              }}
            />
            {/* Aurora glow */}
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-[120%] h-48 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(102,223,72,0.15) 0%, rgba(45,180,120,0.08) 30%, transparent 70%)",
                filter: "blur(30px)",
              }}
            />
            {/* Secondary light reflection */}
            <div
              className="absolute top-0 right-0 w-1/2 h-32 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 80% 0%, rgba(255,255,255,0.06) 0%, transparent 60%)",
              }}
            />
            {/* Progress bar */}
            <div className="relative mb-8">
              <span className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-medium">
                {currentStep}
              </span>
              <div className="flex gap-1.5 mt-3">
                {ALL_STEPS.map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      completedSteps.has(s)
                        ? "bg-[#66DF48]/70"
                        : s === currentStep
                        ? "bg-white/80"
                        : "bg-white/[0.06]"
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* Step content */}
            <div className="relative flex flex-col">
              {renderStep()}
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="w-72 flex-shrink-0 border-l border-white/10 p-4 overflow-auto hidden lg:block">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
            Jump to Step
          </h3>
          {stepNav}

          {profile && (
            <>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mt-6 mb-2">
                Profile State
              </h3>
              <div className="bg-white/5 rounded-lg p-3 text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-white/40">nickname</span>
                  <span className="text-white/70">
                    {profile.custom_nickname || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">body_type</span>
                  <span className="text-white/70">
                    {profile.body_type || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">avatar</span>
                  <span className="text-white/70">
                    {profile.avatar?.image ? "✅" : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">country</span>
                  <span className="text-white/70">
                    {profile.country?.code || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">place_name</span>
                  <span className="text-white/70">
                    {profile.place_name || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">dob</span>
                  <span className="text-white/70">
                    {profile.date_of_birth || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">cultures</span>
                  <span className="text-white/70">
                    {profile.cultures?.length ?? 0}
                  </span>
                </div>
              </div>
            </>
          )}

          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mt-6 mb-2">
            Event Log
          </h3>
          <div className="bg-white/5 rounded-lg p-2 text-[10px] font-mono max-h-48 overflow-auto space-y-0.5">
            {log.length === 0 ? (
              <span className="text-white/30">No events yet</span>
            ) : (
              log.map((entry, i) => (
                <div key={i} className="text-white/50">
                  {entry}
                </div>
              ))
            )}
          </div>

          <div className="mt-4 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-[10px] text-yellow-200/70">
            Steps call real APIs. Use a test account.
          </div>
        </div>
      </div>
    </div>
  );
}
