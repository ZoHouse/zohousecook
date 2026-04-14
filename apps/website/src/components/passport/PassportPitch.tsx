import React from "react";
import { useRouter } from "next/router";
import { useAuth } from "@zo/auth";

export type ViewerState =
  | "logged_out"
  | "logged_in_no_passport"
  | "free"
  | "pro";

interface PassportPitchProps {
  inviterHandle: string;
  viewerState: ViewerState;
}

function PitchButton({
  label,
  primary,
  onClick,
}: {
  label: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        primary
          ? "w-full py-3.5 rounded-full bg-white text-black font-semibold text-base"
          : "w-full py-3.5 rounded-full bg-white/10 text-white font-semibold text-base border border-white/20"
      }
    >
      {label}
    </button>
  );
}

export function PassportPitch({ inviterHandle, viewerState }: PassportPitchProps) {
  const router = useRouter();
  const { showLoginModal } = useAuth();

  const handleBecomeCitizen = () => {
    showLoginModal(undefined, "/passport");
  };

  const handleBecomePro = () => {
    router.push("/passport");
  };

  const handleReelQuests = () => {
    router.push("/passport");
  };

  const handleShareQuests = () => {
    router.push("/passport");
  };

  const handleBookZostels = () => {
    router.push("/");
  };

  return (
    <div className="w-full max-w-md mx-auto mt-6 p-5 bg-black/70 backdrop-blur rounded-2xl border border-white/10 flex flex-col gap-3">
      <p className="text-center text-white/60 text-xs uppercase tracking-wider">
        Invited by {inviterHandle}
      </p>

      {viewerState === "logged_out" && (
        <>
          <PitchButton label="Become a Citizen" primary onClick={handleBecomeCitizen} />
          <PitchButton label="Become a Pro Citizen" onClick={handleBecomeCitizen} />
        </>
      )}

      {viewerState === "logged_in_no_passport" && (
        <>
          <PitchButton label="Unlock Your Passport" primary onClick={handleBecomePro} />
          <PitchButton label="Become a Pro Citizen" onClick={handleBecomePro} />
        </>
      )}

      {viewerState === "free" && (
        <>
          <PitchButton label="Become a Pro Citizen" primary onClick={handleBecomePro} />
          <PitchButton label="Reel Quests" onClick={handleReelQuests} />
          <PitchButton label="Share Quests" onClick={handleShareQuests} />
          <PitchButton label="Book Zostels" onClick={handleBookZostels} />
        </>
      )}

      {viewerState === "pro" && (
        <>
          <PitchButton label="Reel Quests" primary onClick={handleReelQuests} />
          <PitchButton label="Share Quests" onClick={handleShareQuests} />
          <PitchButton label="Book Zostels" onClick={handleBookZostels} />
        </>
      )}
    </div>
  );
}
