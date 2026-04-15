import React from "react";
import GlowCard from "./GlowCard";
import { syneClassName } from "../utils/font";

const CheckIcon: React.FC = () => (
  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#2b3228] flex items-center justify-center mt-0.5">
    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
      <path
        d="M2.5 6L5 8.5L9.5 3.5"
        stroke="#54B835"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

interface PassportPlusUpsellProps {
  onBecomeMember: () => void;
  onUnlockAndGo: () => void;
}

const BENEFITS = [
  "Earn 7% commission on every passport you refer",
  "Daily Bed Drops & Bounties at 108+ Zostel properties",
  "Get paid for views on Zo World content",
  "Unlock Season trophies and exclusive role badges",
  "Priority booking and ₹500+ worth of monthly perks",
];

const PassportPlusUpsell: React.FC<PassportPlusUpsellProps> = ({
  onBecomeMember,
  onUnlockAndGo,
}) => {
  return (
    <GlowCard variant="purple" className="relative overflow-hidden">
      <div className="absolute -top-5 right-[calc(50%-100px)] w-[183px] h-[183px] rounded-full bg-purple-500/25 blur-[37px] pointer-events-none" />
      <div className="absolute -top-12 right-0 w-[243px] h-[243px] rounded-full bg-purple-800/20 blur-[60px] pointer-events-none" />
      <div className="absolute -top-4 -left-5 w-[128px] h-[128px] rounded-full bg-purple-500/20 blur-[80px] pointer-events-none" />

      <div className="relative z-10 p-6 flex flex-col gap-5">
        <div>
          <h2 className={`${syneClassName} font-bold text-white text-2xl leading-tight`}>
            Unlock Revenue with
            <br />
            Zostel Passport Plus
          </h2>
          <p className="text-white/70 text-sm mt-2 max-w-[380px]">
            Zo World&apos;s citizen tier — turn your travel into recurring income
            and premium stays.
          </p>
        </div>

        <div className="flex items-baseline gap-1">
          <span className={`${syneClassName} font-bold text-white text-2xl`}>
            ₹ 499
          </span>
          <span className="text-white/60 text-sm">/month · Cancel anytime</span>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          {BENEFITS.map((benefit) => (
            <div key={benefit} className="flex items-start gap-2">
              <CheckIcon />
              <span className="text-white/85 text-xs leading-[18px]">
                {benefit}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
          <button
            onClick={onBecomeMember}
            className="bg-white/95 hover:bg-white text-[#111] rounded-xl px-6 py-3 font-semibold text-sm transition-colors flex-1 sm:flex-none"
          >
            Become a Member
          </button>
          <button
            onClick={onUnlockAndGo}
            className="text-white/70 hover:text-white font-medium text-sm transition-colors px-4 py-3"
          >
            Unlock &amp; Go to Passport →
          </button>
        </div>
      </div>
    </GlowCard>
  );
};

export default PassportPlusUpsell;
