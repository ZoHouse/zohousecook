import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

interface XpProgressBarProps {
  xp: number;
  xpToNextTier: number;
  rankTitle: string;
}

const XpProgressBar: React.FC<XpProgressBarProps> = ({
  xp,
  xpToNextTier,
  rankTitle,
}) => {
  const { basePath } = useRouter();
  const total = xp + xpToNextTier;
  const progressPercent = total > 0 ? (xp / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Badge + XP + Rank */}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${basePath}/passport/compass-badge.png`}
          alt="XP Badge"
          className="w-[43px] h-[43px] rounded-xl border-2 border-[#71c8b6]"
        />
        <div className="flex flex-col">
          <span className="text-white font-bold text-[14px] uppercase tracking-wide">
            {xp.toLocaleString()} XP
          </span>
          <span className="text-[#52bda9] font-bold text-[14px] uppercase tracking-wide">
            {rankTitle}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center w-full h-[5px]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(progressPercent, 2)}%`,
            background:
              "linear-gradient(90deg, #C6FFF3 0.875%, #76D8C3 30.5%, #FBFFFE 46.7%, #3F8174 72.5%, #1E574B 85.4%, #38A08A 98.75%)",
          }}
        />
        <div className="flex-1 h-full bg-[#d9d9d9] opacity-30" />
      </div>

      {/* Labels */}
      <div className="flex justify-between items-baseline">
        <span className="text-white/55 text-[10px] tracking-wider">
          {xpToNextTier.toLocaleString()} XP to next Tier
        </span>
        <Link
          href="/leaderboard"
          className="text-[#cfff50] text-[12px] font-medium tracking-wider"
        >
          Leaderboard
        </Link>
      </div>
    </div>
  );
};

export default XpProgressBar;
