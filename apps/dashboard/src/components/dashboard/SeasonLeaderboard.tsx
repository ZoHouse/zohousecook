import React, { useState } from "react";
import { GlassCard } from "./GlassCard";
import { useLeaderboard, LeaderboardEntry, LeaderboardScope } from "../../hooks/useLeaderboard";
import { useProfile } from "@zo/auth";

type Tab = "global" | "city" | "country";

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function formatXp(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function LeaderboardRow({ entry, expanded }: { entry: LeaderboardEntry; expanded?: boolean }) {
  const medal = RANK_MEDALS[entry.rank];

  return (
    <div
      className={`flex flex-col rounded-dash-sm transition-colors ${
        entry.isYou
          ? "bg-dash-accent/10 border border-dash-accent/20"
          : "hover:bg-white/5"
      }`}
    >
      <div className="flex items-center gap-2 px-2.5 py-2">
        <span className="w-6 text-center flex-shrink-0">
          {medal ? (
            <span className="text-sm">{medal}</span>
          ) : (
            <span className="text-[10px] text-dash-text-40 font-medium">{entry.rank}</span>
          )}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-xs truncate ${
            entry.isYou ? "font-semibold text-dash-accent" : "text-dash-text"
          }`}>
            {entry.isYou ? "You" : entry.handle ? `@${entry.handle}` : entry.name}
          </p>
          {expanded && entry.rankTitle && (
            <p className="text-[9px] text-dash-text-40">{entry.rankTitle}</p>
          )}
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          <span className={`text-[10px] tabular-nums ${
            entry.isYou ? "text-dash-accent font-medium" : "text-dash-text-50"
          }`}>
            {formatXp(entry.xp)} XP
          </span>
          {expanded && (
            <span className="text-[8px] text-dash-text-30 tabular-nums">
              {entry.stats.nights}N · {entry.stats.destinations}D · {entry.stats.properties}P
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function YourXpCard({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div className="mb-3 p-3 rounded-dash-md bg-dash-accent/10 border border-dash-accent/20">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-dash-text-50 uppercase tracking-wider">Your XP</span>
        <span className="text-[9px] text-dash-accent font-medium">#{entry.rank}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-dash-accent tabular-nums">
          {formatXp(entry.xp)}
        </span>
        <span className="text-[10px] text-dash-text-50">XP</span>
        {entry.rankTitle && (
          <span className="ml-auto text-[10px] text-dash-accent/80 font-medium">
            {entry.rankTitle}
          </span>
        )}
      </div>
      <div className="flex gap-3 mt-2">
        <Stat label="Nights" value={entry.stats.nights} />
        <Stat label="Destinations" value={entry.stats.destinations} />
        <Stat label="Properties" value={entry.stats.properties} />
        <Stat label="Tribe" value={entry.stats.tribe} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-semibold text-dash-text tabular-nums">{value}</span>
      <span className="text-[8px] text-dash-text-40">{label}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2.5 py-2">
          <div className="w-5 h-3 bg-white/5 rounded animate-pulse" />
          <div className="flex-1 h-3 bg-white/5 rounded animate-pulse" />
          <div className="w-12 h-3 bg-white/5 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function SeasonLeaderboard() {
  const [activeTab, setActiveTab] = useState<Tab>("global");
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, isError } = useLeaderboard(activeTab as LeaderboardScope);
  const { profile } = useProfile();

  const tabs: { key: Tab; label: string }[] = [
    { key: "global", label: "Global" },
    { key: "city", label: "City" },
    { key: "country", label: "Country" },
  ];

  const leaderboard = data?.leaderboard || [];
  const displayCount = expanded ? 25 : 10;
  const topEntries = leaderboard.slice(0, displayCount);

  // Find current user
  const currentUserId = profile?.code;
  const yourEntry = currentUserId
    ? leaderboard.find((e) => e.userId === currentUserId)
    : null;
  const yourRank = yourEntry ? { ...yourEntry, isYou: true } : null;
  const youInTop = yourEntry ? yourEntry.rank <= displayCount : false;

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-medium text-dash-text-50 uppercase tracking-wider">
          Leaderboard
        </h3>
        <span className="px-1.5 py-0.5 text-[9px] font-bold text-dash-accent bg-dash-accent/15 rounded-dash-pill">
          LIVE
        </span>
      </div>

      {/* Your XP card — always visible when we have your data */}
      {yourRank && <YourXpCard entry={yourRank} />}

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
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <p className="text-[10px] text-dash-text-40 text-center py-4">
          Failed to load leaderboard
        </p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {topEntries.map((entry) => (
            <LeaderboardRow
              key={entry.rank}
              entry={youInTop && entry.userId === currentUserId ? { ...entry, isYou: true } : entry}
              expanded={expanded}
            />
          ))}

          {/* Separator + You row (if not in visible range) */}
          {yourRank && !youInTop && (
            <>
              <div className="flex items-center gap-2 py-1.5">
                <div className="flex-1 h-px bg-dash-border" />
                <span className="text-[9px] text-dash-text-40">•••</span>
                <div className="flex-1 h-px bg-dash-border" />
              </div>
              <LeaderboardRow entry={yourRank} expanded={expanded} />
            </>
          )}

          {/* Footer: count + expand toggle */}
          <div className="flex items-center justify-between mt-2">
            {data && data.count > 10 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[9px] text-dash-accent hover:text-dash-accent/80 transition-colors"
              >
                {expanded ? "Show less" : `Show top 25`}
              </button>
            )}
            {data && (
              <p className="text-[9px] text-dash-text-30 ml-auto">
                {data.count.toLocaleString()} travelers
              </p>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
