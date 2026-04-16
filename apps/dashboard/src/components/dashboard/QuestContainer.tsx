import React from "react";
import { GlassCard } from "./GlassCard";

export function QuestContainer() {
  return (
    <GlassCard className="p-5 flex flex-col">
      <h3 className="text-base font-bold text-dash-text mb-1">
        Earn from your travel content
      </h3>
      <p className="text-xs text-dash-text-50 mb-4">
        Join the Zo Creator Programme. Daily quests, real earnings.
      </p>

      <div className="flex flex-col gap-2">
        <button className="w-full py-3 rounded-dash-md text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            background:
              "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
          }}
        >
          Join as Creator — Coming Soon
        </button>
        <button className="w-full py-2.5 rounded-dash-md text-xs font-medium text-white bg-white/5 border border-dash-border hover:bg-white/10 transition-colors">
          Share &amp; Earn — Coming Soon
        </button>
      </div>
    </GlassCard>
  );
}
