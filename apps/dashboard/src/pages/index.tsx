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
  SeasonLeaderboard,
  TravelerScorecard,
} from "../components/dashboard";
import { LobbyScene } from "../components/lobby/LobbyScene";
import { RoomMembers } from "../components/lobby/RoomMembers";
import { VoiceControls } from "../components/lobby/VoiceControls";
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
      {/* ═══ DESKTOP: original absolute-positioned layout ═══ */}
      <div className="hidden xl:block relative w-full h-screen overflow-hidden">
        {/* Room background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${basePath}/dashboard-assets/bg-lobby.svg)`,
            backgroundSize: "cover",
            backgroundPosition: "center bottom",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: "linear-gradient(180deg, rgba(10,10,15,0.7) 0%, rgba(10,10,15,0.4) 50%, rgba(10,10,15,0.6) 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        {/* TOP: Live Updates pill */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
          <LiveUpdatesPill />
        </div>

        {/* CENTER: Lobby Scene */}
        <div className="absolute inset-0 flex items-end justify-center z-10 pointer-events-none pb-[14vh]">
          <div
            className="absolute bottom-[6vh] left-1/2 -translate-x-1/2"
            style={{
              width: "25vh",
              height: "4vh",
              background: "radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
          <LobbyScene members={members} selfCode={profile?.code} speakingMap={speakingMap} />
        </div>

        {/* LEFT PANEL */}
        <div className="absolute left-4 top-16 bottom-20 z-20 flex flex-col gap-2 w-[270px] overflow-y-auto scrollbar-hide">
          <PassportCard />
          <TravelerScorecard />
          <QuestContainer />
          <ZoBalance />
          <Achievements />
        </div>

        {/* RIGHT PANEL */}
        <div className="absolute right-4 top-14 bottom-20 z-20 w-[240px] overflow-y-auto flex flex-col gap-2 scrollbar-hide">
          <RoomMembers
            members={members}
            hostCodes={roomData?.hosts || []}
            isConnected={isConnected}
            speakingMap={speakingMap}
          />
          <SeasonLeaderboard />
          <MyCulturesCompact />
        </div>

        {/* BOTTOM CENTER: Voice Controls */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
          <VoiceControls
            isActive={voiceActive}
            isMuted={isMuted}
            onJoin={startVoice}
            onLeave={leaveVoice}
            onToggleMute={toggleMute}
          />
        </div>
      </div>

      {/* ═══ MOBILE: scrollable layout ═══ */}
      <div className="xl:hidden flex flex-col pb-20">
        {/* Hero section: avatar viewport (full screen height) */}
        <div className="relative w-full h-screen flex-shrink-0">
          {/* Room background */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${basePath}/dashboard-assets/bg-lobby.svg)`,
              backgroundSize: "cover",
              backgroundPosition: "center bottom",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background: "linear-gradient(180deg, rgba(10,10,15,0.7) 0%, rgba(10,10,15,0.4) 50%, rgba(10,10,15,0.6) 100%)",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
            }}
          />

          {/* Live Updates pill */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
            <LiveUpdatesPill />
          </div>

          {/* Avatar center stage */}
          <div className="absolute inset-0 flex items-end justify-center z-10 pointer-events-none pb-[18vh]">
            <div
              className="absolute bottom-[10vh] left-1/2 -translate-x-1/2"
              style={{
                width: "25vh",
                height: "4vh",
                background: "radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
            />
            <LobbyScene members={members} selfCode={profile?.code} speakingMap={speakingMap} />
          </div>

          {/* Voice Controls */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
            <VoiceControls
              isActive={voiceActive}
              isMuted={isMuted}
              onJoin={startVoice}
              onLeave={leaveVoice}
              onToggleMute={toggleMute}
            />
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 animate-bounce">
            <span className="text-dash-text-40 text-xs">↓</span>
          </div>
        </div>

        {/* Scrollable cards below the fold */}
        <div className="flex flex-col gap-3 px-4 py-6">
          <PassportCard />
          <TravelerScorecard />
          <QuestContainer />
          <ZoBalance />
          <SeasonLeaderboard />
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
