import React, { useState } from "react";
import { GlassCard } from "./GlassCard";

type Tab = "global" | "city";

interface LeaderboardEntry {
  rank: number;
  handle: string;
  xp: number;
  isYou?: boolean;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, handle: "dvcoolster", xp: 2450 },
  { rank: 2, handle: "captainjack", xp: 1890 },
  { rank: 3, handle: "samurai", xp: 1220 },
  { rank: 4, handle: "boldrin", xp: 980 },
  { rank: 5, handle: "darshan", xp: 750 },
];

const YOU_ENTRY: LeaderboardEntry = { rank: 12, handle: "You", xp: 320, isYou: true };

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function formatXp(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const medal = RANK_MEDALS[entry.rank];

  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-2 rounded-dash-sm transition-colors ${
        entry.isYou
          ? "bg-dash-accent/10 border border-dash-accent/20"
          : "hover:bg-white/5"
      }`}
    >
      <span className="w-5 text-center flex-shrink-0">
        {medal ? (
          <span className="text-sm">{medal}</span>
        ) : (
          <span className="text-[10px] text-dash-text-40 font-medium">{entry.rank}</span>
        )}
      </span>
      <p className={`text-xs flex-1 truncate ${
        entry.isYou ? "font-semibold text-dash-accent" : "text-dash-text"
      }`}>
        {entry.isYou ? entry.handle : `@${entry.handle}`}
      </p>
      <span className={`text-[10px] tabular-nums flex-shrink-0 ${
        entry.isYou ? "text-dash-accent font-medium" : "text-dash-text-50"
      }`}>
        {formatXp(entry.xp)} XP
      </span>
    </div>
  );
}

export function SeasonLeaderboard() {
  const [activeTab, setActiveTab] = useState<Tab>("global");

  const tabs: { key: Tab; label: string }[] = [
    { key: "global", label: "Global" },
    { key: "city", label: "City" },
  ];

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-medium text-dash-text-50 uppercase tracking-wider">
          Season Leaderboard
        </h3>
        <span className="px-1.5 py-0.5 text-[9px] font-bold text-dash-accent bg-dash-accent/15 rounded-dash-pill">
          S1
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 p-0.5 bg-white/5 rounded-dash-md">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-1.5 text-[10px] font-medium rounded-dash-sm transition-colors ${
              activeTab === tab.key
                ? "bg-white/10 text-dash-text"
                : "text-dash-text-40 hover:text-dash-text-60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard rows */}
      <div className="flex flex-col gap-0.5">
        {MOCK_LEADERBOARD.map((entry) => (
          <LeaderboardRow key={entry.rank} entry={entry} />
        ))}

        {/* Separator */}
        <div className="flex items-center gap-2 py-1.5">
          <div className="flex-1 h-px bg-dash-border" />
          <span className="text-[9px] text-dash-text-40">•••</span>
          <div className="flex-1 h-px bg-dash-border" />
        </div>

        {/* You row */}
        <LeaderboardRow entry={YOU_ENTRY} />
      </div>
    </GlassCard>
  );
}
