import React from "react";
import { toast } from "sonner";
import GlowCard from "./GlowCard";
import { syneClassName } from "../../utils/font";

const CheckIcon: React.FC = () => (
  <span className="flex-shrink-0 w-3 h-3 rounded-full bg-[#2b3228] flex items-center justify-center">
    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
      <path
        d="M2.5 6L5 8.5L9.5 3.5"
        stroke="#54B835"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

const PassportProCard: React.FC = () => {
  return (
    <GlowCard variant="purple" className="relative overflow-hidden min-h-[283px]">
      {/* Decorative purple glows */}
      <div className="absolute -top-5 right-[calc(50%-100px)] w-[183px] h-[183px] rounded-full bg-purple-500/20 blur-[37px]" />
      <div className="absolute -top-12 right-0 w-[243px] h-[243px] rounded-full bg-purple-800/15 blur-[60px]" />
      <div className="absolute -top-4 -left-5 w-[128px] h-[128px] rounded-full bg-purple-500/15 blur-[80px]" />

      {/* Content */}
      <div className="relative z-10">
        {/* Left section */}
        <div className="absolute top-6 left-6">
          <h2
            className={`${syneClassName} font-bold text-[#540967]`}
            style={{ fontSize: 24 }}
          >
            Passport Pro
          </h2>
          <p
            className={`${syneClassName} font-bold text-[#540967] mt-1`}
            style={{ fontSize: 16, maxWidth: 280 }}
          >
            Earn rewards, monetize content, and build your travel identity.
          </p>
          <div className="mt-3 flex items-baseline gap-1">
            <span
              className={`${syneClassName} font-bold text-[#111]`}
              style={{ fontSize: 24 }}
            >
              ₹ 499
            </span>
            <span className="text-[#111]" style={{ fontSize: 13 }}>
              /month
            </span>
          </div>
        </div>

        {/* Right section — benefits */}
        <div className="absolute bottom-16 right-6 flex flex-row gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CheckIcon />
              <span className="text-[#111]" style={{ fontSize: 12 }}>
                Daily Bed Drops &amp; Bounties
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon />
              <span className="text-[#111]" style={{ fontSize: 12 }}>
                Get paid for views on participating posts
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CheckIcon />
              <span className="text-[#111]" style={{ fontSize: 12 }}>
                Share your Passport and earn 7%...
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon />
              <span className="text-[#111]" style={{ fontSize: 12 }}>
                Unlock Passport profile, XP &amp; leaderboard
              </span>
            </div>
          </div>
        </div>

        {/* Check all benefits link */}
        <button
          className="absolute bottom-6 left-6 text-white font-medium"
          style={{ fontSize: 16 }}
        >
          Check all benefits
        </button>

        {/* Become a Member button */}
        <button
          className="absolute bottom-6 right-6 bg-white/80 text-[#111] rounded-xl px-8 py-4 font-medium"
          style={{ fontSize: 16 }}
          onClick={() => toast("Coming Soon")}
        >
          Become a Member
        </button>
      </div>
    </GlowCard>
  );
};

export default PassportProCard;
