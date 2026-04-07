import React from "react";
import GlowCard from "./GlowCard";

interface QuestCardProps {
  title: string;
  reward?: string;
  type: string;
  status: "live" | "submitted" | "completed";
  timeRemaining?: string;
}

const IgIcon: React.FC = () => (
  <div className="w-[54px] h-[54px] rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0"
    style={{ filter: "blur(0.675px)" }}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
        fill="white"
      />
    </svg>
  </div>
);

const QuestCard: React.FC<QuestCardProps> = ({
  title,
  reward,
  type,
  status,
  timeRemaining,
}) => {
  const typeLabel = type.toUpperCase();

  return (
    <GlowCard
      className="rounded-[24px] p-5 relative shadow-[inset_0px_2px_8px_0px_rgba(255,255,255,0.25)]"
    >
      {/* Purple glow */}
      <div className="absolute -left-5 -top-4 w-[128px] h-[128px] rounded-full bg-purple-500/15 blur-[80px]" />

      <div className="relative z-10">
        {status === "live" ? (
          <>
            <div className="flex items-start gap-4">
              <IgIcon />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <p
                    className="text-white leading-[30px] flex-1"
                    style={{ fontSize: 20 }}
                  >
                    {title}
                  </p>
                  {reward && (
                    <span
                      className="text-[#b269ff] flex-shrink-0 ml-3"
                      style={{ fontSize: 14 }}
                    >
                      {reward}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span
                className="bg-[#4a2274] px-3 py-1 rounded-lg text-white font-medium"
                style={{ fontSize: 16 }}
              >
                Creator Quest: {typeLabel}
              </span>
              <span className="bg-[#4a2274] px-3 py-1 rounded-lg flex items-center gap-1">
                <span className="text-white" style={{ fontSize: 12 }}>
                  Live Quest
                </span>
                <span
                  className="text-white font-medium"
                  style={{ fontSize: 16 }}
                >
                  {timeRemaining}
                </span>
              </span>
            </div>
          </>
        ) : status === "submitted" ? (
          <>
            <p
              className="text-white leading-[30px]"
              style={{ fontSize: 20 }}
            >
              {title}
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span
                className="bg-[#4a2274] px-3 py-1 rounded-lg text-white font-medium"
                style={{ fontSize: 16 }}
              >
                Creator Quest: {typeLabel}
              </span>
              <span className="bg-[#6a5122] px-3 py-1 rounded-lg flex items-center gap-1">
                <span className="text-white" style={{ fontSize: 12 }}>
                  Submitted
                </span>
                <span
                  className="text-orange-400 font-medium"
                  style={{ fontSize: 16 }}
                >
                  Awaiting review from HQ
                </span>
              </span>
            </div>
          </>
        ) : null}
      </div>
    </GlowCard>
  );
};

export default QuestCard;
