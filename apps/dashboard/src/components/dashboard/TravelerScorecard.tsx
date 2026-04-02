import React from "react";
import { GlassCard } from "./GlassCard";
import { useMyXp } from "../../hooks/useMyXp";
import { useProfile } from "@zo/auth";

function formatXp(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function StatRow({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-dash-border last:border-0">
      <span className="text-xs text-dash-text-50">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-bold text-dash-text tabular-nums">{value}</span>
        {sub && <span className="text-[9px] text-dash-text-40">{sub}</span>}
      </div>
    </div>
  );
}

export function TravelerScorecard() {
  const { myXp, isLoading } = useMyXp();
  const { profile } = useProfile();

  if (isLoading || !myXp) return null;

  // "Tripping since" — use stats createdAt or profile fallback
  const createdAt = myXp.createdAt || profile?.created_at || profile?.date_joined;
  let trippingSince = "—";
  if (createdAt) {
    const d = new Date(createdAt);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    trippingSince = `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  // Current city — from stats or profile
  const currentCity = myXp.city || profile?.place_name;

  // Total destinations possible (Zostel has 108+ properties across ~60+ destinations)
  const totalDestinations = 65;

  return (
    <GlassCard className="p-4">
      {/* Header with XP + Rank */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-medium text-dash-text-50 uppercase tracking-wider">
          Traveler Card
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-dash-accent tabular-nums">{formatXp(myXp.xp)}</span>
          <span className="text-[9px] text-dash-text-40">XP</span>
        </div>
      </div>

      {/* Rank badge */}
      <div className="flex items-center justify-between mb-3 p-2.5 rounded-dash-sm bg-dash-accent/10 border border-dash-accent/20">
        <span className="text-xs text-dash-accent font-medium">{myXp.rankTitle}</span>
        {myXp.rank && <span className="text-[10px] text-dash-text-40">Rank #{myXp.rank}</span>}
      </div>

      {/* Stats */}
      <div className="flex flex-col">
        {currentCity && (
          <StatRow label="Currently In" value={currentCity} />
        )}
        <StatRow label="Days Spent with Zo" value={myXp.stats.nights} sub="nights" />
        <StatRow label="Tripping Since" value={trippingSince} />
        <StatRow
          label="Destinations Unlocked"
          value={`${myXp.stats.destinations}/${totalDestinations}`}
        />
        <StatRow label="Zostels Visited" value={myXp.stats.properties} />
        <StatRow label="Tribe Size" value={myXp.stats.tribe} sub="members" />
      </div>

      {/* Tribe members */}
      {myXp.tribeMembers && myXp.tribeMembers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dash-border">
          <p className="text-[9px] text-dash-text-40 uppercase tracking-wider mb-2">Recent Tribe</p>
          <div className="flex flex-col gap-1.5">
            {myXp.tribeMembers.map((name, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-dash-accent/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] font-bold text-dash-accent">{name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-[11px] text-dash-text-80 truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
