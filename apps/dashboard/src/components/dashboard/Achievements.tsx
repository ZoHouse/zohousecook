import React, { useState } from "react";
import { GlassCard } from "./GlassCard";

const MOCK_BADGES = [
  { id: "first-checkin", emoji: "🏠", name: "First Check-in", desc: "Checked into a Zo House" },
  { id: "7-day-streak", emoji: "🔥", name: "7-Day Streak", desc: "7 consecutive days at a Zo House" },
  { id: "event-host", emoji: "🎤", name: "Event Host", desc: "Hosted your first event" },
  { id: "nft-staker", emoji: "💎", name: "NFT Staker", desc: "Staked a Founder NFT" },
  { id: "culture-leader", emoji: "🌍", name: "Culture Leader", desc: "Led a culture for a cohort" },
];

export function Achievements() {
  const [expanded, setExpanded] = useState(false);
  const earned = MOCK_BADGES;

  return (
    <GlassCard className="px-dash-lg py-dash-md overflow-hidden transition-all duration-300">
      {/* Collapsed pill */}
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex -space-x-2">
          {earned.slice(0, 5).map((badge) => (
            <div
              key={badge.id}
              className="w-7 h-7 rounded-full bg-white/10 border-2 border-dash-bg-solid flex items-center justify-center"
              title={badge.name}
            >
              <span className="text-xs">{badge.emoji}</span>
            </div>
          ))}
        </div>
        <span className="text-sm text-dash-text-80 flex-1">
          <span className="font-medium text-dash-text">{earned.length}</span>{" "}
          Badges Earned
        </span>
        <span
          className="text-dash-text-50 text-xs transition-transform duration-300"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </div>

      {/* Expanded badge grid */}
      <div
        className="grid grid-cols-2 gap-2 transition-all duration-300"
        style={{
          maxHeight: expanded ? "300px" : "0px",
          marginTop: expanded ? "12px" : "0px",
          opacity: expanded ? 1 : 0,
        }}
      >
        {earned.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center gap-2 px-3 py-2 rounded-dash-pill bg-white/5 border border-dash-border"
          >
            <span className="text-lg">{badge.emoji}</span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-dash-text truncate">{badge.name}</p>
              <p className="text-[10px] text-dash-text-50 truncate">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
