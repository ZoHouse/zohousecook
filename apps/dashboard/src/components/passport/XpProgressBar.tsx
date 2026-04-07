import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { rubikClassName } from "../../utils/font";

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
    <div className={`flex flex-col gap-2 w-full ${rubikClassName}`}>
      <div className="flex items-center gap-2">
        <Image
          src={`${basePath}/passport/compass-badge.png`}
          alt="XP Badge"
          width={43}
          height={43}
          className="rounded-xl border-2 border-[#71c8b6]"
        />
        <span className="text-white font-bold text-[14px] uppercase">
          {xp} XP
        </span>
        <span className="text-[#52bda9] font-bold text-[14px] uppercase">
          {rankTitle}
        </span>
      </div>

      <div className="relative w-full h-[8px] rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-[#d9d9d9] opacity-30 rounded-full" />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${progressPercent}%`,
            background:
              "linear-gradient(90deg, #C6FFF3, #76D8C3, #FBFFFE, #3F8174, #1E574B, #38A08A)",
          }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-white/55 text-[10px]">
          {xpToNextTier} XP to next Tier
        </span>
        <Link
          href="/leaderboard"
          className="text-[#cfff50] text-[12px] font-medium"
        >
          Leaderboard
        </Link>
      </div>
    </div>
  );
};

export default XpProgressBar;
