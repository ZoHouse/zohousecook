import React from "react";
import { toast } from "sonner";
import GlowCard from "./GlowCard";
import { syneClassName } from "../utils/font";

const CheckIcon: React.FC = () => (
  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#2b3228] flex items-center justify-center">
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

const PassportProCard: React.FC = () => {
  return (
    <GlowCard variant="purple" className="relative overflow-hidden">
      {/* Decorative purple glows */}
      <div className="absolute -top-5 right-[calc(50%-100px)] w-[183px] h-[183px] rounded-full bg-purple-500/20 blur-[37px] pointer-events-none" />
      <div className="absolute -top-12 right-0 w-[243px] h-[243px] rounded-full bg-purple-800/15 blur-[60px] pointer-events-none" />
      <div className="absolute -top-4 -left-5 w-[128px] h-[128px] rounded-full bg-purple-500/15 blur-[80px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 p-6 flex flex-col gap-4">
        {/* Title + subtitle */}
        <div>
          <h2 className={`${syneClassName} font-bold text-white text-2xl`}>
            Passport Pro
          </h2>
          <p className="text-white/70 text-sm mt-1 max-w-[320px]">
            Earn rewards, monetize content, and build your travel identity.
          </p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className={`${syneClassName} font-bold text-white text-2xl`}>
            ₹ 499
          </span>
          <span className="text-white/60 text-sm">/month</span>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {[
            "Daily Bed Drops & Bounties",
            "Get paid for views on participating posts",
            "Share your Passport and earn 7% on referrals",
            "Unlock Passport profile, XP & leaderboard",
          ].map((benefit) => (
            <div key={benefit} className="flex items-start gap-2">
              <CheckIcon />
              <span className="text-white/80 text-xs leading-[18px]">
                {benefit}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-2">
          <button className="text-white/70 font-medium text-sm hover:text-white transition-colors">
            Check all benefits
          </button>
          <button
            className="bg-white/90 hover:bg-white text-[#111] rounded-xl px-6 py-3 font-medium text-sm transition-colors"
            onClick={() => toast("Coming Soon")}
          >
            Become a Member
          </button>
        </div>
      </div>
    </GlowCard>
  );
};

export default PassportProCard;
