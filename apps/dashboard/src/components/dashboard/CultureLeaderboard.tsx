import React, { useState } from "react";
import { useProfile } from "@zo/auth";
import { ZoSpinner } from "../ui/ZoSpinner";
import { GlassCard } from "./GlassCard";

function CultureRow({ culture }: { culture: { key: string; name: string; icon?: string; description?: string } }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-dash-md overflow-hidden border border-dash-border transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-white/5 hover:bg-white/10 transition-colors text-left"
      >
        {culture.icon ? (
          <img src={culture.icon} alt={culture.name} className="w-6 h-6 flex-shrink-0" />
        ) : (
          <span className="text-base flex-shrink-0 w-6 text-center">🏛️</span>
        )}
        <p className="text-xs font-medium text-dash-text flex-1">{culture.name}</p>
        <span className={`text-[10px] text-dash-text-40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      <div
        className="transition-all duration-200 ease-in-out overflow-hidden"
        style={{ maxHeight: open ? "200px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="px-3 py-3 bg-white/[0.03] border-t border-dash-border/50">
          {culture.description && (
            <p className="text-[10px] text-dash-text-60 mb-2.5 leading-relaxed">{culture.description}</p>
          )}
          <div className="flex items-center gap-4 text-[10px] text-dash-text-50 mb-2.5">
            <span>Members: --</span>
            <span>Your rank: --</span>
          </div>
          <a
            href={`/dashboard/culture/${culture.key}`}
            className="inline-block px-3 py-1.5 text-[10px] font-medium text-dash-text bg-white/10 border border-dash-border hover:bg-white/15 hover:border-dash-border-hover rounded-dash-pill backdrop-blur-dash-md transition-colors"
          >
            View culture
          </a>
        </div>
      </div>
    </div>
  );
}

export function CultureLeaderboard() {
  const { profile, isLoading } = useProfile();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cultures: any[] = profile?.cultures || [];

  return (
    <GlassCard className="p-dash-xl">
      <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider mb-dash-lg">
        My Cultures
      </h3>

      <div className="flex flex-col gap-2">
        {cultures.map((culture) => (
          <CultureRow key={culture.key} culture={culture} />
        ))}
        {!isLoading && cultures.length === 0 && (
          <p className="text-xs text-dash-text-40 text-center py-3">No cultures joined yet</p>
        )}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <ZoSpinner size={24} />
          </div>
        )}
      </div>
    </GlassCard>
  );
}
