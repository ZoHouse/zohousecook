import React, { useState } from "react";
import { useRouter } from "next/router";
import { GlassCard } from "../components/dashboard/GlassCard";
import { useLeaderboard, LeaderboardEntry, LeaderboardScope, LeaderboardTime } from "../hooks/useLeaderboard";
import { useProfile } from "@zo/auth";

type Tab = "global" | "city" | "country";

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function formatXp(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function StatBadge({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm font-bold text-dash-text tabular-nums">{value}</span>
      <span className="text-[10px] text-dash-text-40">{label}</span>
    </div>
  );
}

function LeaderboardRow({ entry, position }: { entry: LeaderboardEntry & { isYou?: boolean }; position: number }) {
  const medal = RANK_MEDALS[position];
  const isTop3 = position <= 3;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-dash-md transition-colors ${
        entry.isYou
          ? "bg-dash-accent/10 border border-dash-accent/30"
          : isTop3
          ? "bg-white/[0.03]"
          : "hover:bg-white/5"
      }`}
    >
      {/* Rank */}
      <span className="w-8 text-center flex-shrink-0">
        {medal ? (
          <span className="text-lg">{medal}</span>
        ) : (
          <span className="text-xs text-dash-text-40 font-medium tabular-nums">{position}</span>
        )}
      </span>

      {/* Name + rank title */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${
          entry.isYou ? "font-bold text-dash-accent" : "text-dash-text"
        }`}>
          {entry.isYou ? "You" : entry.handle ? `@${entry.handle}` : entry.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {entry.rankTitle && (
            <span className={`text-[10px] ${entry.isYou ? "text-dash-accent/70" : "text-dash-text-40"}`}>
              {entry.rankTitle}
            </span>
          )}
          {entry.city && (
            <span className="text-[10px] text-dash-text-30">
              {entry.city}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
        <StatBadge label="Nights" value={entry.stats.nights} />
        <StatBadge label="Dest." value={entry.stats.destinations} />
        <StatBadge label="Props" value={entry.stats.properties} />
        <StatBadge label="Tribe" value={entry.stats.tribe} />
      </div>

      {/* XP */}
      <div className="flex flex-col items-end flex-shrink-0 ml-2">
        <span className={`text-sm font-bold tabular-nums ${
          entry.isYou ? "text-dash-accent" : "text-dash-text"
        }`}>
          {formatXp(entry.xp)}
        </span>
        <span className="text-[10px] text-dash-text-40">XP</span>
      </div>
    </div>
  );
}

function YourSummary({ entry }: { entry: LeaderboardEntry }) {
  return (
    <GlassCard className="p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-dash-accent tabular-nums">
              #{entry.rank}
            </span>
            <div>
              <p className="text-sm text-dash-text-50">Your Rank</p>
              {entry.rankTitle && (
                <p className="text-xs text-dash-accent/80 font-medium">{entry.rankTitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-dash-accent tabular-nums">
              {formatXp(entry.xp)}
            </span>
            <span className="text-sm text-dash-text-50">XP</span>
          </div>
        </div>
        <div className="flex gap-6">
          <StatBadge label="Nights" value={entry.stats.nights} />
          <StatBadge label="Destinations" value={entry.stats.destinations} />
          <StatBadge label="Properties" value={entry.stats.properties} />
          <StatBadge label="Tribe" value={entry.stats.tribe} />
        </div>
      </div>
    </GlassCard>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-4 bg-white/5 rounded animate-pulse" />
          <div className="flex-1 h-4 bg-white/5 rounded animate-pulse" />
          <div className="w-16 h-4 bg-white/5 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

type TimeFilter = "all-time" | "season";

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all-time");
  const [activeTab, setActiveTab] = useState<Tab>("global");
  const { data, isLoading, isError } = useLeaderboard(activeTab as LeaderboardScope, undefined, timeFilter as LeaderboardTime);
  const { profile } = useProfile();
  const router = useRouter();

  const timeFilters: { key: TimeFilter; label: string }[] = [
    { key: "all-time", label: "All Time" },
    { key: "season", label: "Season 1" },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: "global", label: "Global" },
    { key: "city", label: "City" },
    { key: "country", label: "Country" },
  ];

  const leaderboard = data?.leaderboard || [];
  const currentUserId = profile?.code;
  const yourEntry = currentUserId
    ? leaderboard.find((e) => e.userId === currentUserId)
    : null;

  return (
    <div className="min-h-screen bg-dash-bg-solid">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-dash-accent/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-dash-text-50 hover:text-dash-text transition-colors text-sm"
          >
            ← Back
          </button>
          <div className="flex-1" />
          <span className="px-2 py-1 text-[10px] font-bold text-dash-accent bg-dash-accent/15 rounded-dash-pill">
            LIVE
          </span>
        </div>

        <h1 className="text-2xl font-bold text-dash-text mb-1">Leaderboard</h1>
        <p className="text-sm text-dash-text-50 mb-6">
          {data ? `${data.count} travelers ranked by XP` : "Loading..."}
        </p>

        {/* XP breakdown + Ranks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <GlassCard className="p-4">
            <h2 className="text-[10px] font-medium text-dash-text-50 uppercase tracking-wider mb-3">
              How XP is earned
            </h2>
            <div className="flex flex-col gap-1">
              <XpRule action="Night stayed" xp={50} />
              <XpRule action="Destination unlocked" xp={150} />
              <XpRule action="Property unlocked" xp={100} />
              <XpRule action="Tribe member" xp={10} />
              <XpRule action="Profile field completed" xp={10} />
              <XpRule action="Verification (mobile/email/ID)" xp={15} />
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <h2 className="text-[10px] font-medium text-dash-text-50 uppercase tracking-wider mb-3">
              Passport Ranks
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <RankTier name="Citizen" threshold="0" />
              <RankTier name="Wanderer" threshold="500" />
              <RankTier name="Adventurer" threshold="2K" />
              <RankTier name="Explorer" threshold="5K" />
              <RankTier name="Voyager" threshold="10K" />
              <RankTier name="Trailblazer" threshold="25K" />
              <RankTier name="Legend" threshold="50K" className="col-span-2" />
            </div>
          </GlassCard>
        </div>

        {/* Your summary */}
        {yourEntry && <YourSummary entry={yourEntry} />}

        {/* Master filter: All Time / Season */}
        <div className="flex items-center gap-4 mb-4">
          {timeFilters.map((tf) => (
            <button
              key={tf.key}
              onClick={() => setTimeFilter(tf.key)}
              className={`text-sm font-medium pb-1 transition-colors border-b-2 ${
                timeFilter === tf.key
                  ? "text-dash-text border-dash-accent"
                  : "text-dash-text-40 border-transparent hover:text-dash-text-60"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Season info banner */}
        {timeFilter === "season" && (
          <GlassCard className="p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dash-text">
                  {data?.season?.name || "Season 1"}
                </p>
                <p className="text-xs text-dash-text-40 mt-0.5">
                  {data?.season ? `${data.season.start} → ${data.season.end}` : "Apr 1 → Apr 30, 2026"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-dash-text-40 uppercase tracking-wider">Prizes</p>
                <p className="text-xs text-dash-text-50 mt-0.5">🥇🥈🥉 City · Country · Global</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Scope tabs: Global / City / Country */}
        <div className="flex gap-1 mb-4 p-1 bg-white/5 rounded-dash-md w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-medium rounded-dash-sm transition-colors ${
                activeTab === tab.key
                  ? "bg-white/10 text-dash-text"
                  : "text-dash-text-40 hover:text-dash-text-60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <GlassCard className="p-2">
          {isLoading ? (
            <LoadingSkeleton />
          ) : isError ? (
            <p className="text-sm text-dash-text-40 text-center py-8">
              Failed to load leaderboard
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {leaderboard.map((entry) => (
                <LeaderboardRow
                  key={entry.rank}
                  entry={
                    entry.userId === currentUserId
                      ? { ...entry, isYou: true }
                      : entry
                  }
                  position={entry.rank}
                />
              ))}

              {leaderboard.length === 0 && (
                <p className="text-sm text-dash-text-40 text-center py-8">
                  No travelers found for this scope
                </p>
              )}
            </div>
          )}
        </GlassCard>

        <div className="mb-12" />
      </div>
    </div>
  );
}

function XpRule({ action, xp }: { action: string; xp: number }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-xs text-dash-text-80">{action}</span>
      <span className="text-xs font-bold text-dash-accent tabular-nums">+{xp}</span>
    </div>
  );
}

function RankTier({ name, threshold, className }: { name: string; threshold: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center py-2 px-3 rounded-dash-sm bg-white/[0.03] ${className || ''}`}>
      <span className="text-xs font-medium text-dash-text">{name}</span>
      <span className="text-[10px] text-dash-text-40 tabular-nums">{threshold} XP</span>
    </div>
  );
}
