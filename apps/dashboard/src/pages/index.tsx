import React, { ReactElement } from "react";
import { useRouter } from "next/router";
import {
  Achievements,
  DashboardHeader,
  LiveUpdatesPill,
  PassportCard,
  QuestContainer,
  ZoBalance,
  MyCulturesCompact,
  // SeasonLeaderboard,   // parked — waiting for events table
  // TravelerScorecard,   // parked — waiting for events table
} from "../components/dashboard";
import { LobbyScene } from "../components/lobby/LobbyScene";
import { RoomMembers } from "../components/lobby/RoomMembers";
import { useRoom } from "../hooks/useRoom";
import { useAudioBridge } from "../hooks/useAudioBridge";
import type { NextPageWithLayout } from "./_app";

const DashboardPage: NextPageWithLayout = () => {
  const { basePath } = useRouter();
  const { members, roomData, roomCode, isConnected, profile } = useRoom();
  // Room ID for Janus: use room code from lobby API, or fall back to profile code (personal room)
  const janusRoomId = roomCode ? `cr-${roomCode}` : profile?.code ? `s-${profile.code}` : null;
  const {
    isActive: voiceActive, isMuted, speakingMap,
    startVoice, leaveRoom: leaveVoice, toggleMute,
  } = useAudioBridge({
    roomId: janusRoomId,
    userCode: profile?.code || null,
    displayName: profile?.nickname || null,
  });
  return (
    <div className="flex-1 min-h-screen bg-dash-bg-solid relative">
      {/* ═══ DESKTOP: 3D lobby + overlay panels ═══ */}
      <div className="hidden xl:block relative w-full h-screen overflow-hidden">
        {/* 3D Canvas — fills entire viewport */}
        <div className="absolute inset-0 z-0">
          <LobbyScene members={members} selfCode={profile?.code} speakingMap={speakingMap} />
        </div>

        {/* TOP: Live Updates pill */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
          <LiveUpdatesPill />
        </div>

        {/* LEFT PANEL */}
        <div className="absolute left-3 top-14 bottom-14 z-20 flex flex-col gap-1.5 pb-2 w-[240px] overflow-y-auto scrollbar-hide pointer-events-auto">
          <PassportCard />
          <QuestContainer />
          <ZoBalance />
          <Achievements />
        </div>

        {/* RIGHT PANEL */}
        <div className="absolute right-3 top-14 bottom-14 z-20 w-[300px] overflow-y-auto flex flex-col gap-1.5 scrollbar-hide pointer-events-auto">
          <RoomMembers
            members={members}
            hostCodes={roomData?.hosts || []}
            isConnected={isConnected}
            speakingMap={speakingMap}
          />
          <MyCulturesCompact />
        </div>
      </div>

      {/* ═══ MOBILE: scrollable layout ═══ */}
      <div className="xl:hidden flex flex-col pb-20">
        {/* Hero section: 3D lobby viewport */}
        <div className="relative w-full h-screen flex-shrink-0">
          <div className="absolute inset-0 z-0">
            <LobbyScene members={members} selfCode={profile?.code} speakingMap={speakingMap} />
          </div>

          {/* Live Updates pill */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
            <LiveUpdatesPill />
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 animate-bounce">
            <span className="text-dash-text-40 text-xs">↓</span>
          </div>
        </div>

        {/* Scrollable cards below the fold */}
        <div className="flex flex-col gap-3 px-4 py-6">
          <PassportCard />
          <QuestContainer />
          <ZoBalance />
          <RoomMembers
            members={members}
            hostCodes={roomData?.hosts || []}
            isConnected={isConnected}
            speakingMap={speakingMap}
          />
          <MyCulturesCompact />
          <Achievements />
        </div>
      </div>

      {/* Fixed bottom nav — always visible */}
      <DashboardHeader />
    </div>
  );
};

DashboardPage.getLayout = (page: ReactElement) => page;

export default DashboardPage;
// vercel redeploy 1775153783
