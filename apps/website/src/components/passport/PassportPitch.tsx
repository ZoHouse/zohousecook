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
  const { isLoggedIn, showLoginModal } = useAuth();

  // Viewer-side actions: when logged out, open login modal and resume to the
  // intended destination after auth. When logged in, route directly.
  const gateRoute = (path: string) => {
    if (isLoggedIn) router.push(path);
    else showLoginModal(undefined, path);
  };

  const handleBecomeCitizen = () => gateRoute("/passport");
  // Pro subscription upsell lives on the viewer's own /passport surface.
  const handleBecomePro     = () => gateRoute("/passport");
  // Routes to the Pearl-canon quest list; ?role=Creator narrows once the
  // page-side filter is wired (cheap to add when needed).
  const handleReelQuests    = () => gateRoute("/passport/quests?role=Creator");
  // ?share=1 auto-opens the ShareModal on the viewer's own passport.
  const handleShareQuests   = () => gateRoute("/passport?share=1");
  // Zostel booking lives off-site; open in a new tab so the passport stays
  // the citizen's home base.
  const handleBookZostels   = () =>
    window.open("https://www.zostel.com/", "_blank", "noopener,noreferrer");

  return (
    <div className="w-full max-w-md mx-auto mt-6 p-5 bg-black/70 backdrop-blur rounded-2xl border border-white/10 flex flex-col gap-3">
      <p className="text-center text-white/60 text-xs uppercase tracking-wider">
        Invited by {inviterHandle}
      </p>

      {viewerState === "logged_out" && (
        <>
          <PitchButton label="Become a Citizen" primary onClick={handleBecomeCitizen} />
          <PitchButton label="Become a Pro Citizen" onClick={handleBecomePro} />
        </>
      )}

      {viewerState === "logged_in_no_passport" && (
        <>
          <PitchButton label="Become a Citizen" primary onClick={handleBecomeCitizen} />
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
