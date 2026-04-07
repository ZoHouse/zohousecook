import React from "react";
import { toast } from "sonner";
import GlowCard from "./GlowCard";
import { syneClassName, rubikClassName } from "../utils/font";

const CheckIcon: React.FC = () => (
  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#2b3228] p-[2px] flex items-center justify-center mt-0.5">
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
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

const BENEFITS = [
  "Daily Creator Bed Drops & Bounties",
  "Monetize views on Instagram content",
  "Your Invited Guests get 10% discounts on first booking",
  "Build your Passport profile with avatar, stamps, XP, and leaderboard",
  "Share your Passport, build your network, and earn 7% commission on bookings for 1 year — live from 30 April",
];

const WhyPassportPlus: React.FC = () => {
  return (
    <div>
      <h2
        className={`${rubikClassName} font-medium text-white mb-4`}
        style={{ fontSize: 32 }}
      >
        Why Passport Plus?
      </h2>

      <GlowCard variant="purple" className="relative overflow-hidden">
        {/* Decorative purple glows */}
        <div className="absolute -top-8 right-[calc(50%-120px)] w-[220px] h-[220px] rounded-full bg-purple-500/20 blur-[50px] pointer-events-none" />
        <div className="absolute -top-16 right-0 w-[300px] h-[300px] rounded-full bg-purple-800/15 blur-[80px] pointer-events-none" />
        <div className="absolute -top-6 -left-8 w-[160px] h-[160px] rounded-full bg-purple-500/15 blur-[100px] pointer-events-none" />

        <div className="relative z-10 p-7 flex flex-col md:flex-row gap-8">
          {/* Left side */}
          <div className="flex-1">
            <h3
              className={`${syneClassName} font-bold text-white`}
              style={{
                fontSize: 42,
                lineHeight: 1.15,
                textShadow: "0px 0px 73px #950dff, 0px 0px 19px #950dff",
              }}
            >
              Unlock Revenue with Zostel Passport Plus
            </h3>

            <div className="mt-4 flex items-baseline gap-1">
              <span className={`${syneClassName} font-bold text-[#d2cfd4] text-2xl`}>
                ₹ 499
              </span>
              <span className="text-[#d2cfd4] text-sm">/month</span>
            </div>

            {/* Benefits teaser (faded) */}
            <div className="mt-6 opacity-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 bg-purple-700 rounded-lg flex items-center justify-center text-sm">
                  ⭐️
                </span>
                <span className="text-white font-medium text-sm">Benefits</span>
              </div>
              <div className="flex gap-3">
                <div className="bg-white/10 rounded-lg px-3 py-2">
                  <span className="text-white text-xs">Daily quests, real rewards</span>
                </div>
                <div className="bg-white/10 rounded-lg px-3 py-2">
                  <span className="text-white text-xs">Affiliate link</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side — Member Perks */}
          <div className="w-full md:w-[320px] flex-shrink-0 flex flex-col justify-between">
            <div>
              <p className="text-white font-medium text-base mb-4">Member Perks</p>
              <div className="flex flex-col gap-3">
                {BENEFITS.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckIcon />
                    <span className="text-white text-xs leading-[18px] tracking-wider">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="mt-6 w-full bg-white/90 hover:bg-white text-[#111] rounded-xl h-14 font-medium text-base transition-colors"
              onClick={() => toast("Coming Soon")}
            >
              Become a Member
            </button>
          </div>
        </div>
      </GlowCard>
    </div>
  );
};

export default WhyPassportPlus;
