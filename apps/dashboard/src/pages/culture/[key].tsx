import React, { ReactElement } from "react";
import { useRouter } from "next/router";
import { useProfile } from "@zo/auth";
import { GlassCard, DashboardHeader } from "../../components/dashboard";
import type { NextPageWithLayout } from "../_app";

const MOCK_LEADERBOARD = [
  { rank: 1, name: "Samurai", xp: 4200 },
  { rank: 2, name: "Boldrin", xp: 3800 },
  { rank: 3, name: "Darshan", xp: 2900 },
  { rank: 4, name: "Sai Karthik", xp: 2100 },
  { rank: 5, name: "dvcoolster", xp: 1600 },
  { rank: 6, name: "Akhilesh", xp: 1200 },
  { rank: 7, name: "Damodar", xp: 900 },
  { rank: 8, name: "Tapas", xp: 650 },
  { rank: 9, name: "Arun", xp: 400 },
  { rank: 10, name: "Biju", xp: 250 },
];

const CulturePage: NextPageWithLayout = () => {
  const router = useRouter();
  const { key } = router.query;
  const { profile } = useProfile();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cultures: any[] = profile?.cultures || [];
  const culture = cultures.find((c) => c.key === key);
  const cultureName = culture?.name || (typeof key === "string" ? key.replace(/_/g, " ") : "Culture");

  return (
    <div
      className="flex-1 min-h-screen bg-dash-bg-solid"
      style={{
        backgroundImage: `url(${router.basePath}/dashboard-assets/dashboard-bg.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <DashboardHeader />
      <div className="max-w-2xl mx-auto px-dash-xl py-dash-xl pb-32">
        <button
          onClick={() => router.push("/")}
          className="mb-dash-lg text-sm text-dash-text-50 hover:text-dash-text transition-colors"
        >
          &larr; Back to Dashboard
        </button>

        {/* Culture header */}
        <GlassCard className="p-dash-xl mb-dash-xl">
          <div className="flex items-center gap-4">
            {culture?.icon ? (
              <img src={culture.icon} alt={cultureName} className="w-12 h-12" />
            ) : (
              <span className="text-4xl">🏛️</span>
            )}
            <div>
              <h1 className="text-xl font-bold text-dash-text capitalize">{cultureName}</h1>
              {culture?.description && (
                <p className="text-sm text-dash-text-60 mt-1">{culture.description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-6 mt-4 pt-4 border-t border-dash-border/50">
            <div>
              <p className="text-[10px] text-dash-text-40 uppercase tracking-wider">Members</p>
              <p className="text-lg font-bold text-dash-text">--</p>
            </div>
            <div>
              <p className="text-[10px] text-dash-text-40 uppercase tracking-wider">Total XP</p>
              <p className="text-lg font-bold text-dash-accent">--</p>
            </div>
            <div>
              <p className="text-[10px] text-dash-text-40 uppercase tracking-wider">Your Rank</p>
              <p className="text-lg font-bold text-dash-text">--</p>
            </div>
          </div>
        </GlassCard>

        {/* Leaderboard */}
        <GlassCard className="p-dash-xl">
          <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider mb-dash-lg">
            Leaderboard
          </h3>
          <div className="flex flex-col gap-2">
            {MOCK_LEADERBOARD.map((entry) => (
              <div
                key={entry.rank}
                className="flex items-center gap-3 px-4 py-3 rounded-dash-md bg-white/5 border border-dash-border"
              >
                <span className={`text-sm font-bold w-6 text-center ${
                  entry.rank <= 3 ? "text-dash-accent" : "text-dash-text-50"
                }`}>
                  {entry.rank}
                </span>
                <div className="w-8 h-8 rounded-full bg-white/10 border border-dash-border flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-dash-text">{entry.name.charAt(0)}</span>
                </div>
                <p className="text-sm font-medium text-dash-text flex-1">{entry.name}</p>
                <div className="text-right">
                  <p className="text-sm font-bold text-dash-accent">{entry.xp.toLocaleString()}</p>
                  <p className="text-[9px] text-dash-text-50">$Zo XP</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

CulturePage.getLayout = (page: ReactElement) => page;

export default CulturePage;
