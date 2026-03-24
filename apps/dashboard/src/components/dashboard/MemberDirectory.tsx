import React from "react";
import { GlassCard } from "./GlassCard";
import { useFounderMembers } from "../../hooks/useFounderMembers";
import { useFounderNfts } from "../../hooks/useFounderNfts";

export function MemberDirectory() {
  const { summary, isLoading: summaryLoading } = useFounderMembers();
  const { allEntries, isLoading: nftsLoading } = useFounderNfts();

  const isLoading = summaryLoading || nftsLoading;
  const memberCount = summary?.users_count || allEntries.length;

  // Show first few member avatars as a preview strip
  const previewMembers = allEntries.slice(0, 5).map((entry) => {
    const firstToken = entry.tokens?.[0];
    return {
      wallet_address: entry.wallet_address,
      image_url: firstToken?.metadata?.image_url,
    };
  });

  return (
    <GlassCard className="px-dash-lg py-dash-md">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {isLoading ? (
            <div className="w-7 h-7 rounded-full bg-dash-border animate-pulse" />
          ) : (
            previewMembers.map((m) => (
              <div
                key={m.wallet_address}
                className="w-7 h-7 rounded-full overflow-hidden border-2 border-dash-bg-solid"
              >
                {m.image_url ? (
                  <img
                    src={m.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-dash-border" />
                )}
              </div>
            ))
          )}
        </div>
        <span className="text-sm text-dash-text-80">
          <span className="font-medium text-dash-text">{memberCount}</span> Founder Members
        </span>
      </div>
    </GlassCard>
  );
}
