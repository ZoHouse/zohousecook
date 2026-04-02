import React, { ReactElement } from "react";
import { useRouter } from "next/router";
import { bgLobby } from "../../assets";
import { DashboardHeader, LiveUpdatesPill } from "../../components/dashboard";
import { GlassCard } from "../../components/dashboard/GlassCard";
import { LobbyScene } from "../../components/lobby/LobbyScene";
import { RoomMembers } from "../../components/lobby/RoomMembers";
import { VoiceControls } from "../../components/lobby/VoiceControls";
import { useRoom } from "../../hooks/useRoom";
import { useAudioBridge } from "../../hooks/useAudioBridge";
import type { NextPageWithLayout } from "../_app";

const RoomPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { basePath } = router;
  const handle = typeof router.query.handle === "string" ? router.query.handle : "";

  const { members, roomData, roomCode, roomName, isConnected, isHost, isLoading, profile } = useRoom(handle);
  const {
    isActive: voiceActive, isMuted, speakingMap,
    startVoice, leaveRoom: leaveVoice, toggleMute,
  } = useAudioBridge({
    roomId: roomCode ? `cr-${roomCode}` : null,
    userCode: profile?.code || null,
    displayName: profile?.nickname || null,
  });

  if (!handle) return null;

  return (
    <div className="flex-1 min-h-screen bg-dash-bg-solid relative">
      <div className="relative w-full h-screen overflow-hidden">
        {/* Room background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${bgLobby})`,
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
            background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        {/* TOP: Room name + back button */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <GlassCard className="px-4 py-2 flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="text-dash-text-50 hover:text-dash-text text-sm transition-colors"
            >
              &larr;
            </button>
            <span className="text-dash-text font-semibold text-sm">
              {roomName || handle}&apos;s Room
            </span>
            {isHost && (
              <span className="text-[9px] text-dash-accent bg-dash-accent/10 px-2 py-0.5 rounded-dash-pill">
                Host
              </span>
            )}
          </GlassCard>
          {isLoading && (
            <span className="text-dash-text-40 text-xs">Connecting to room...</span>
          )}
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

        {/* RIGHT: Room Members */}
        <div className="absolute right-4 top-14 bottom-20 z-20 w-[240px] overflow-y-auto hidden xl:flex flex-col gap-2 scrollbar-hide">
          <RoomMembers
            members={members}
            hostCodes={roomData?.hosts || []}
            isConnected={isConnected}
            speakingMap={speakingMap}
          />
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

      <DashboardHeader />
    </div>
  );
};

RoomPage.getLayout = (page: ReactElement) => page;

export default RoomPage;
