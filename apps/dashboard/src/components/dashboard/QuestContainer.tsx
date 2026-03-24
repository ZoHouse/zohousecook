import React, { useState } from "react";
import { GlassCard } from "./GlassCard";

const TABS = ["Daily", "Weekly", "Monthly"] as const;
type Tab = (typeof TABS)[number];

export function QuestContainer() {
  const [activeTab, setActiveTab] = useState<Tab>("Daily");

  return (
    <GlassCard className="p-dash-xl flex flex-col">
      <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider mb-dash-lg">Quests</h3>
      <div className="flex gap-2 mb-dash-lg">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-dash-pill border transition-colors ${
              activeTab === tab
                ? "bg-dash-accent text-black border-dash-accent"
                : "bg-transparent text-dash-text-50 border-dash-border hover:border-dash-border-hover"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-1 flex items-center justify-center min-h-[120px]">
        <p className="text-dash-text-40 text-sm">Quests coming soon</p>
      </div>
    </GlassCard>
  );
}
