import React, { useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import { GlassCard } from "../../components/dashboard/GlassCard";
import { DashboardHeader } from "../../components/dashboard";

interface PublicProfile {
  handle: string | null;
  city: string | null;
  nationality: string | null;
  xp: number;
  rankTitle: string;
  stats: {
    nights: number;
    destinations: number;
    properties: number;
    tribe: number;
  };
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zo-admin-token') || localStorage.getItem('zo-web-token') || null;
}

function formatXp(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center py-3 rounded-dash-md bg-white/[0.03]">
      <span className="text-xl font-bold text-dash-text tabular-nums">{value}</span>
      <span className="text-[10px] text-dash-text-40 mt-1">{label}</span>
    </div>
  );
}

export default function PublicPassportPage() {
  const router = useRouter();
  const handle = typeof router.query.handle === "string" ? router.query.handle : "";

  const { data: profile, isLoading, isError } = useQuery<PublicProfile>(
    ['public-profile', handle],
    async () => {
      const token = getToken();
      const res = await fetch(`/dashboard/api/public-profile?handle=${encodeURIComponent(handle)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    {
      enabled: !!handle,
      staleTime: 5 * 60 * 1000,
    }
  );

  if (!handle) return null;

  return (
    <div className="min-h-screen bg-dash-bg-solid">
      <div className="fixed inset-0 bg-gradient-to-b from-dash-accent/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-lg mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={() => router.push("/")}
          className="text-dash-text-50 hover:text-dash-text transition-colors text-sm mb-6"
        >
          ← Back
        </button>

        {isLoading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-8 h-8 border-2 border-dash-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-dash-text-40 mt-4">Loading passport...</p>
          </div>
        ) : isError || !profile ? (
          <div className="flex flex-col items-center py-20">
            <p className="text-lg text-dash-text mb-2">Passport not found</p>
            <p className="text-sm text-dash-text-40">This traveler hasn't unlocked their passport yet.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <p className="text-sm text-dash-text-40 mb-2">
                {profile.handle ? `${profile.handle} has shared their passport with you` : "Zo World Passport"}
              </p>
            </div>

            {/* Passport Card */}
            <GlassCard className="p-6 mb-6">
              {/* Avatar placeholder */}
              <div className="flex flex-col items-center mb-5">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-dash-accent/30 to-dash-accent/10 flex items-center justify-center mb-3">
                  <span className="text-3xl font-bold text-dash-text">
                    {(profile.handle || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-dash-text">
                  {profile.handle ? `${profile.handle}.zo` : "Citizen"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-dash-text-50">Citizen of Zo World</span>
                </div>
                {(profile.city || profile.nationality) && (
                  <p className="text-xs text-dash-text-40 mt-1">
                    {profile.city && `from ${profile.city}`}
                    {profile.city && profile.nationality && ", "}
                    {profile.nationality}
                  </p>
                )}
              </div>

              {/* Rank */}
              <div className="text-center mb-5">
                <p className="text-[10px] text-dash-text-40 uppercase tracking-wider">Passport Rank</p>
                <p className="text-2xl font-bold text-dash-text mt-1">{profile.rankTitle}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Destinations" value={profile.stats.destinations} />
                <StatCard label="Stays" value={profile.stats.nights} />
                <StatCard label="Tribe" value={profile.stats.tribe} />
              </div>
            </GlassCard>

            {/* XP */}
            <GlassCard className="p-5 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-dash-text-40 uppercase tracking-wider">Total XP</p>
                  <p className="text-2xl font-bold text-dash-accent tabular-nums mt-1">{formatXp(profile.xp)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-dash-text-40 uppercase tracking-wider">Zostels Visited</p>
                  <p className="text-2xl font-bold text-dash-text tabular-nums mt-1">{profile.stats.properties}</p>
                </div>
              </div>
            </GlassCard>

            {/* CTA */}
            <GlassCard className="p-5 text-center">
              <p className="text-sm text-dash-text-80 mb-1">Travelled with Zostel?</p>
              <p className="text-xs text-dash-text-40 mb-4">Check your own passport and see where you rank.</p>
              <button
                onClick={() => router.push("/passport")}
                className="w-full py-3 bg-dash-accent text-white font-medium text-sm rounded-dash-md hover:bg-dash-accent/90 transition-colors"
              >
                Check my Passport
              </button>
            </GlassCard>
          </>
        )}
      </div>

      <DashboardHeader />
    </div>
  );
}
