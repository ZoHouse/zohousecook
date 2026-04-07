import React, { useState } from "react";
import { rubikClassName } from "../utils/font";
import GlowCard from "./GlowCard";
import QuestCard from "./QuestCard";

const SAMPLE_QUESTS = [
  {
    title:
      "Create a Reel on: Why I'd choose Zostel Pahalgam for my next trip",
    type: "reel" as const,
    status: "live" as const,
    timeRemaining: "12h 14m",
  },
  {
    title: "Why I'd choose Zostel Pahalgam for my next trip",
    type: "reel" as const,
    status: "submitted" as const,
  },
];

const IgIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
      fill="white"
    />
  </svg>
);

const QuestsSection: React.FC = () => {
  const [igConnected, setIgConnected] = useState(false);

  return (
    <div>
      <h2
        className={`${rubikClassName} font-medium text-white mb-4`}
        style={{ fontSize: 20 }}
      >
        Quests
      </h2>
      <div className="flex flex-col gap-4">
        {!igConnected ? (
          <GlowCard className="rounded-[24px] p-6 relative shadow-[inset_0px_2px_8px_0px_rgba(255,255,255,0.25)]">
            <div className="absolute -left-5 -top-4 w-[128px] h-[128px] rounded-full bg-purple-500/15 blur-[80px]" />
            <div className="relative z-10 flex flex-col items-center text-center gap-4 py-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                <IgIcon size={28} />
              </div>
              <div>
                <p className={`${rubikClassName} text-white font-medium text-lg`}>
                  Connect Instagram to unlock Creator Quests
                </p>
                <p className={`${rubikClassName} text-white/50 text-sm mt-1`}>
                  Complete daily quests, earn rewards, and monetize your content
                </p>
              </div>
              <button
                onClick={() => setIgConnected(true)}
                className={`${rubikClassName} flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white text-sm transition-all hover:scale-[1.02]`}
                style={{
                  background: "linear-gradient(135deg, #833AB4, #C13584, #E1306C, #F77737)",
                }}
              >
                <IgIcon size={16} />
                Connect Instagram
              </button>
            </div>
          </GlowCard>
        ) : (
          SAMPLE_QUESTS.map((quest, index) => (
            <QuestCard key={index} {...quest} />
          ))
        )}
      </div>
    </div>
  );
};

export default QuestsSection;
