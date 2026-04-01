import React, { useRef } from "react";
import { useProfile } from "@zo/auth";
import { useRouter } from "next/router";
import { GlassCard } from "./GlassCard";

function CultureTile({ culture }: { culture: { key: string; name: string; icon?: string } }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/culture/${culture.key}`)}
      className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-dash-md bg-white/5 border border-dash-border hover:bg-white/10 hover:border-dash-border-hover transition-colors min-w-0"
    >
      {culture.icon ? (
        <img src={culture.icon} alt={culture.name} className="w-7 h-7 flex-shrink-0" />
      ) : (
        <span className="text-lg flex-shrink-0">🏛️</span>
      )}
      <p className="text-[10px] font-medium text-dash-text truncate w-full text-center">
        {culture.name}
      </p>
    </button>
  );
}

export function MyCulturesCompact() {
  const { profile, isLoading } = useProfile();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cultures: any[] = profile?.cultures || [];
  const scrollRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <GlassCard className="p-4">
        <div className="h-3 w-24 bg-white/10 rounded animate-pulse mb-3" />
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-dash-md animate-pulse" />
          ))}
        </div>
      </GlassCard>
    );
  }

  if (cultures.length === 0) {
    return (
      <GlassCard className="p-4">
        <h3 className="text-[10px] font-medium text-dash-text-50 uppercase tracking-wider mb-3">
          My Cultures
        </h3>
        <p className="text-xs text-dash-text-40 text-center py-3">No cultures joined yet</p>
      </GlassCard>
    );
  }

  // Group cultures into pages of 4 (2x2 grids)
  const pages: typeof cultures[] = [];
  for (let i = 0; i < cultures.length; i += 4) {
    pages.push(cultures.slice(i, i + 4));
  }

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-medium text-dash-text-50 uppercase tracking-wider">
          My Cultures
        </h3>
        {pages.length > 1 && (
          <span className="text-[9px] text-dash-text-40">
            {cultures.length} cultures
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {pages.map((page, pageIdx) => (
          <div
            key={pageIdx}
            className="grid grid-cols-2 gap-2 flex-shrink-0 snap-center"
            style={{ width: "100%" }}
          >
            {page.map((culture: { key: string; name: string; icon?: string }) => (
              <CultureTile key={culture.key} culture={culture} />
            ))}
          </div>
        ))}
      </div>

      {pages.length > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {pages.map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-dash-text-40"
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
