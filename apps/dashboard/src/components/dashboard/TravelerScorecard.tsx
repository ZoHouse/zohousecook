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

  // "Tripping since" — use profile created_at or fallback
  const createdAt = profile?.created_at || profile?.date_joined;
  let trippingSince = "—";
  if (createdAt) {
    const d = new Date(createdAt);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    trippingSince = `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

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
        <span className="text-[10px] text-dash-text-40">Rank #{myXp.rank}</span>
      </div>

      {/* Stats */}
      <div className="flex flex-col">
        {profile?.place_name && (
          <StatRow label="Currently In" value={profile.place_name} />
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
    </GlassCard>
  );
}
