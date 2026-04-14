import React from "react";
import { PassportLockState } from "../../hooks/usePublicPassport";

interface TierPillProps {
  state: PassportLockState;
}

export function TierPill({ state }: TierPillProps) {
  if (state === "unlocked_pro") {
    return (
      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-300/90 to-yellow-400/90 text-black text-[10px] font-bold uppercase tracking-widest">
        Pro
      </span>
    );
  }
  if (state === "unlocked_free") {
    return (
      <span className="px-3 py-1 rounded-full bg-white/15 text-white text-[10px] font-bold uppercase tracking-widest border border-white/20">
        Citizen
      </span>
    );
  }
  if (state === "locked") {
    return (
      <span className="px-3 py-1 rounded-full bg-white/5 text-white/50 text-[10px] font-bold uppercase tracking-widest border border-white/10">
        Locked
      </span>
    );
  }
  return null;
}
