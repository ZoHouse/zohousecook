import React from "react";
import { GlassCard } from "./GlassCard";
import useInstagramConnect from "../../hooks/useInstagramConnect";

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function QuestContainer() {
  const { isLoading, isConnected, account, connect } = useInstagramConnect();

  if (isLoading) {
    return (
      <GlassCard className="p-5 flex flex-col">
        <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-2" />
        <div className="h-3 w-48 bg-white/10 rounded animate-pulse mb-4" />
        <div className="h-10 w-full bg-white/10 rounded-dash-md animate-pulse" />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5 flex flex-col">
      {isConnected && account && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-dash-border">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
            }}
          >
            IG
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-dash-text truncate">
              @{account.ig_username}
            </p>
            <p className="text-[10px] text-dash-text-50">
              {formatFollowers(account.followers_count)} followers
            </p>
          </div>
          <span className="px-2 py-0.5 text-[10px] uppercase bg-green-500/20 text-green-400 rounded-full flex-shrink-0">
            Connected
          </span>
        </div>
      )}

      <h3 className="text-base font-bold text-dash-text mb-1">
        Earn from your travel content
      </h3>
      <p className="text-xs text-dash-text-50 mb-4">
        Join the Zo Creator Programme. Daily quests, real earnings.
      </p>

      {isConnected ? (
        <div className="flex flex-col gap-2">
          <button className="w-full py-3 rounded-dash-md text-sm font-semibold text-dash-text bg-white/10 border border-dash-border hover:bg-white/15 hover:border-dash-border-hover backdrop-blur-dash-md transition-colors">
            Join as Creator
          </button>
          <button className="w-full py-2.5 rounded-dash-md text-xs font-medium text-dash-text-60 bg-white/5 border border-dash-border hover:bg-white/10 hover:text-dash-text transition-colors">
            Share &amp; Earn — Coming Soon
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            onClick={connect}
            className="w-full py-3 rounded-dash-md text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              background:
                "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
            }}
          >
            Connect Instagram
          </button>
          <button className="w-full py-2.5 rounded-dash-md text-xs font-medium text-dash-text-60 bg-white/5 border border-dash-border hover:bg-white/10 hover:text-dash-text transition-colors">
            Share &amp; Earn — Coming Soon
          </button>
        </div>
      )}
    </GlassCard>
  );
}
