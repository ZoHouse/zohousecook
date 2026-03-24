import React from "react";
import { GlassCard } from "./GlassCard";
import { useZoBalance } from "../../hooks/useZoBalance";

export function ZoBalance() {
  const { balance, isLoading } = useZoBalance();

  const displayBalance = isLoading
    ? "..."
    : balance !== undefined
      ? balance.toLocaleString()
      : "—";

  return (
    <GlassCard className="p-dash-xl">
      <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider mb-dash-lg">
        $Zo Balance
      </h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-dash-text font-display">
          {displayBalance}
        </span>
        <span className="text-sm text-dash-text-50">$Zo</span>
      </div>
    </GlassCard>
  );
}
