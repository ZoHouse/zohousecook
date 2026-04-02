import React, { useState } from "react";
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
    <div className="flex items-center justify-between py-2.5 border-b border-dash-border">
      <span className="text-xs text-dash-text-50">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-bold text-dash-text tabular-nums">{value}</span>
        {sub && <span className="text-[9px] text-dash-text-40">{sub}</span>}
      </div>
    </div>
  );
}

function DrawerRow({
  label, value, sub, items, emptyText,
}: {
  label: string;
  value: string | number;
  sub?: string;
  items: string[];
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-dash-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between py-2.5 w-full text-left group"
      >
        <span className="text-xs text-dash-text-50 group-hover:text-dash-text-80 transition-colors">{label}</span>
        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-dash-text tabular-nums">{value}</span>
            {sub && <span className="text-[9px] text-dash-text-40">{sub}</span>}
          </div>
          <span className={`text-[9px] text-dash-text-30 transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
        </div>
      </button>
      {open && (
        <div className="pb-2.5 pl-1">
          {items.length > 0 ? (
            <div className="flex flex-col gap-1">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[9px] text-dash-text-30 w-4 text-right tabular-nums">{i + 1}.</span>
                  <span className="text-[11px] text-dash-text-80">{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-dash-text-30 italic">{emptyText || "None yet"}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function TravelerScorecard() {
  const { myXp, isLoading } = useMyXp();
  const { profile } = useProfile();

  if (isLoading || !myXp) return null;

  const createdAt = myXp.createdAt || profile?.created_at || profile?.date_joined;
  let trippingSince = "—";
  if (createdAt) {
    const d = new Date(createdAt);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    trippingSince = `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  const currentCity = myXp.city || profile?.place_name;
  const totalDestinations = 65;

  return (
    <GlassCard className="p-4">
      {/* Header: Rank + XP in one line */}
      <div className="flex items-center justify-between mb-3 p-2.5 rounded-dash-sm bg-dash-accent/10 border border-dash-accent/20">
        <span className="text-sm text-dash-accent font-bold">{myXp.rankTitle}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-dash-accent tabular-nums">{formatXp(myXp.xp)}</span>
          <span className="text-[9px] text-dash-text-40">XP</span>
          {myXp.rank && <span className="text-[9px] text-dash-text-30 ml-1">#{myXp.rank}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col">
        {currentCity && (
          <StatRow label="Currently In" value={currentCity} />
        )}
        <StatRow label="Days Spent with Zo" value={myXp.stats.nights} sub="nights" />
        <StatRow label="Tripping Since" value={trippingSince} />

        <DrawerRow
          label="Destinations Unlocked"
          value={`${myXp.stats.destinations}/${totalDestinations}`}
          items={myXp.destinationNames || []}
          emptyText="Book your first Zostel to unlock"
        />

        <DrawerRow
          label="Zostels Visited"
          value={myXp.stats.properties}
          items={myXp.zostelNames || []}
          emptyText="No Zostels visited yet"
        />

        <DrawerRow
          label="Tribe Size"
          value={myXp.stats.tribe}
          sub="members"
          items={myXp.tribeMembers || []}
          emptyText="Share your passport link to grow your tribe"
        />
      </div>
    </GlassCard>
  );
}
