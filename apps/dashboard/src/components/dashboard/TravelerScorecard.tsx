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
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
      <span className="text-[11px] text-dash-text-40">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-[13px] font-semibold text-dash-text tabular-nums">{value}</span>
        {sub && <span className="text-[9px] text-dash-text-30">{sub}</span>}
      </div>
    </div>
  );
}

function DrawerRow({
  label, value, sub, items, emptyText, icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  items: string[];
  emptyText?: string;
  icon?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/[0.04]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between py-2 w-full text-left group"
      >
        <span className="text-[11px] text-dash-text-40 group-hover:text-dash-text-60 transition-colors">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-dash-text tabular-nums">{value}</span>
          {sub && <span className="text-[9px] text-dash-text-30">{sub}</span>}
          <span className={`text-[8px] text-dash-text-30 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
        </div>
      </button>
      {open && (
        <div className="pb-2.5 -mt-0.5">
          {items.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {items.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-dash-text-80 bg-white/[0.04] border border-white/[0.06] rounded-dash-pill"
                >
                  {icon && <span className="text-[9px]">{icon}</span>}
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-dash-text-30 italic pl-1">{emptyText || "None yet"}</p>
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
    <GlassCard className="px-4 py-3">
      {/* Rank + XP header */}
      <div className="flex items-center justify-between p-2.5 mb-2 rounded-dash-sm bg-dash-accent/10 border border-dash-accent/20">
        <span className="text-[13px] text-dash-accent font-bold">{myXp.rankTitle}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-[13px] font-bold text-dash-accent tabular-nums">{formatXp(myXp.xp)}</span>
          <span className="text-[9px] text-dash-text-40">XP</span>
          {myXp.rank && <span className="text-[9px] text-dash-text-30 ml-1">#{myXp.rank}</span>}
        </div>
      </div>

      {/* Stats list */}
      <div className="flex flex-col">
        {currentCity && (
          <StatRow label="Currently In" value={currentCity} />
        )}
        <StatRow label="Days with Zo" value={myXp.stats.nights} sub="nights" />
        <StatRow label="Tripping Since" value={trippingSince} />

        <DrawerRow
          label="Destinations"
          value={`${myXp.stats.destinations}/${totalDestinations}`}
          items={myXp.destinationNames || []}
          icon="📍"
          emptyText="Book your first Zostel to unlock"
        />

        <DrawerRow
          label="Zostels"
          value={String(myXp.stats.properties)}
          items={myXp.zostelNames || []}
          icon="🏠"
          emptyText="No Zostels visited yet"
        />

        <DrawerRow
          label="Tribe"
          value={String(myXp.stats.tribe)}
          sub="members"
          items={myXp.tribeMembers || []}
          icon="👤"
          emptyText="Share your passport to grow"
        />
      </div>
    </GlassCard>
  );
}
