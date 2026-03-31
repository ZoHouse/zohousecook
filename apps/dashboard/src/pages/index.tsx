import React, { ReactElement } from "react";
import { useRouter } from "next/router";
import {
  Achievements,
  DashboardHeader,
  LiveUpdatesPill,
  QuestContainer,
  ZoBalance,
  CultureLeaderboard,
} from "../components/dashboard";
import { LobbyScene } from "../components/lobby/LobbyScene";
import type { NextPageWithLayout } from "./_app";

const DashboardPage: NextPageWithLayout = () => {
  const { basePath } = useRouter();
  return (
    <div
      className="flex-1 min-h-screen bg-dash-bg-solid relative overflow-hidden"
      style={{
        backgroundImage: `url(${basePath}/dashboard-assets/dashboard-bg.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Lobby layout: character center stage, panels floating at edges */}
      <div className="relative w-full h-screen">
        {/* Vignette overlay for depth */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        {/* TOP: Live Updates pill */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
          <LiveUpdatesPill />
        </div>

        {/* CENTER: Lobby Scene — Zobu avatar with editor */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          {/* Ground shadow / platform under the avatar */}
          <div
            className="absolute bottom-[22%] left-1/2 -translate-x-1/2"
            style={{
              width: "280px",
              height: "24px",
              background:
                "radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
          <LobbyScene />
        </div>

        {/* LEFT PANEL: Balance + Achievements — anchored bottom-left, above footer */}
        <div className="absolute left-4 bottom-20 z-20 flex flex-col gap-2 w-[200px] hidden xl:flex">
          <ZoBalance />
          <Achievements />
        </div>

        {/* RIGHT PANEL: Culture Leaderboard — anchored right, vertically centered */}
        <div className="absolute right-4 top-14 bottom-20 z-20 w-[240px] overflow-y-auto hidden xl:flex flex-col scrollbar-hide">
          <CultureLeaderboard />
        </div>

        {/* BOTTOM CENTER: Quests — between passport and footer */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 w-[320px] hidden md:block">
          <QuestContainer />
        </div>
      </div>

      {/* Fixed bottom nav */}
      <DashboardHeader />
    </div>
  );
};

DashboardPage.getLayout = (page: ReactElement) => page;

export default DashboardPage;
