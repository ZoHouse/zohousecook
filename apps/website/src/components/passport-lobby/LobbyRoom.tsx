import type { ReactNode } from 'react';
import Image from 'next/image';
import roomPerspective from '../../assets/passport-lobby/scene/room-perspective.svg';
import pedestal from '../../assets/passport-lobby/scene/pedestal.svg';
import progressBar from '../../assets/passport-lobby/scene/progress-bar.svg';

export interface LobbyRoomProps {
  mapWidget: ReactNode;
  sideNav: ReactNode;
  hero: ReactNode;
  ghostVisitors: ReactNode;
  nextMilestone: ReactNode;
  travelersPill: ReactNode;
  activeQuest?: ReactNode;
}

export function LobbyRoom({
  mapWidget,
  sideNav,
  hero,
  ghostVisitors,
  nextMilestone,
  travelersPill,
  activeQuest,
}: LobbyRoomProps) {
  return (
    <div className="relative" style={{ minHeight: 680, background: '#111111', overflow: 'hidden' }}>
      {/* Room perspective backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: 40,
        }}
        aria-hidden
      >
        <Image
          src={roomPerspective}
          alt=""
          width={507}
          height={386}
          style={{
            width: '140%',
            maxWidth: 'none',
            height: 'auto',
            opacity: 0.55,
            marginLeft: '-20%',
          }}
        />
      </div>

      {/* Map widget — top left */}
      <div className="absolute top-3 left-3 z-[10]">{mapWidget}</div>

      {/* Side nav — right edge */}
      <div className="absolute top-3 right-3 z-[10] flex flex-col items-end gap-1">
        {sideNav}
        <div className="mt-3 flex justify-center" style={{ width: 44 }}>{nextMilestone}</div>
      </div>

      {/* Hero + pedestal + quest card stack — centered */}
      <div className="relative z-[5] flex flex-col items-center" style={{ paddingTop: 78, paddingBottom: 100 }}>
        {hero}
        {/* Pedestal directly under the card */}
        <div style={{ marginTop: -6, display: 'flex', justifyContent: 'center', width: '100%' }} aria-hidden>
          <Image src={pedestal} alt="" width={179} height={65} style={{ width: 200, height: 'auto' }} />
        </div>
        {/* Progress bar below pedestal */}
        <div style={{ marginTop: -12, display: 'flex', justifyContent: 'center', width: '100%' }} aria-hidden>
          <Image src={progressBar} alt="" width={113} height={6} style={{ width: 120, height: 'auto' }} />
        </div>
        {/* Active quest — between pedestal and travelers pill */}
        {activeQuest && (
          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', width: '100%' }}>
            {activeQuest}
          </div>
        )}
      </div>

      {/* Ghost visitors — bottom left */}
      <div className="absolute left-3 bottom-[80px] z-[4]">{ghostVisitors}</div>

      {/* Travelers pill — centered at bottom */}
      <div className="absolute left-1/2 bottom-5 -translate-x-1/2 z-[6]">{travelersPill}</div>
    </div>
  );
}
