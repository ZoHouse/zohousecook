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

/**
 * Lobby scene — a Fortnite-style lobby. Avatar center-stage, HUD around edges.
 *
 * Mobile (<md): compact 360px absolute-positioned room.
 * Desktop (≥md): full viewport immersive scene, avatar is the star, elements hug the edges.
 */
export function LobbyRoom({ mapWidget, sideNav, hero, ghostVisitors, nextMilestone, travelersPill, activeQuest }: LobbyRoomProps) {
  return (
    <>
      {/* MOBILE: compact 360px room */}
      <div
        className="relative md:hidden"
        style={{
          minHeight: 620,
          background: '#111111',
          backgroundImage:
            'radial-gradient(ellipse 140% 35% at 50% 95%, rgba(50,48,40,0.5) 0%, transparent 100%), radial-gradient(ellipse 90% 20% at 50% 100%, rgba(30,28,22,0.9) 0%, transparent 100%)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none flex justify-center items-start pt-10" aria-hidden>
          <Image
            src={roomPerspective}
            alt=""
            width={507}
            height={386}
            style={{ width: '140%', height: 'auto', opacity: 0.55, marginLeft: '-20%' }}
          />
        </div>

        <div className="absolute top-3 left-3 z-[10]">{mapWidget}</div>
        <div className="absolute top-3 right-3 z-[10] flex flex-col items-end gap-1">
          {sideNav}
          <div className="mt-3 flex justify-center" style={{ width: 44 }}>{nextMilestone}</div>
        </div>

        <div className="relative z-[5] flex flex-col items-center pt-[78px] pb-4">
          {hero}
          <div style={{ marginTop: -6 }} aria-hidden>
            <Image src={pedestal} alt="" width={179} height={65} style={{ width: 200, height: 'auto' }} />
          </div>
          <div style={{ marginTop: -12 }} aria-hidden>
            <Image src={progressBar} alt="" width={113} height={6} style={{ width: 120, height: 'auto' }} />
          </div>
          {activeQuest && <div className="mt-4 flex justify-center w-full">{activeQuest}</div>}
          <div className="mt-3 flex justify-center w-full">{travelersPill}</div>
        </div>

        <div className="absolute left-3 bottom-[40px] z-[4]">{ghostVisitors}</div>
      </div>

      {/* DESKTOP: immersive Fortnite-style lobby */}
      <div
        className="hidden md:block relative"
        style={{
          minHeight: 'calc(100vh - 120px)',
          background: 'transparent',
        }}
      >
        {/* Full-bleed perspective scene */}
        <div className="absolute inset-0 pointer-events-none flex justify-center items-start" aria-hidden>
          <Image
            src={roomPerspective}
            alt=""
            width={507}
            height={386}
            style={{
              width: '100%',
              maxWidth: 1200,
              height: 'auto',
              opacity: 0.55,
              marginTop: '2%',
            }}
          />
        </div>

        {/* Floor spotlight glow */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '55%',
            width: 600,
            height: 300,
            transform: 'translateX(-50%)',
            background: 'radial-gradient(ellipse at center, rgba(167,217,33,0.08) 0%, rgba(255,47,142,0.05) 40%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* HUD: Map — top-left */}
        <div className="absolute top-6 left-6 z-[10]">{mapWidget}</div>

        {/* HUD: Side nav — right edge, vertically centered */}
        <div className="absolute top-1/2 right-6 -translate-y-1/2 z-[10] flex flex-col items-center gap-6">
          {sideNav}
          <div className="opacity-60" style={{ width: 44 }}>{nextMilestone}</div>
        </div>

        {/* CENTER STAGE: big hero + pedestal */}
        <div className="relative z-[5] flex flex-col items-center justify-center pt-[60px]" style={{ minHeight: 'calc(100vh - 240px)' }}>
          <div className="scale-[1.35] lg:scale-[1.55] origin-center transition-transform">
            {hero}
          </div>
          <div style={{ marginTop: -8 }} aria-hidden>
            <Image src={pedestal} alt="" width={179} height={65} style={{ width: 340, height: 'auto' }} />
          </div>
          <div style={{ marginTop: -18 }} aria-hidden>
            <Image src={progressBar} alt="" width={113} height={6} style={{ width: 200, height: 'auto' }} />
          </div>
        </div>

        {/* BOTTOM HUD: Active quest (left) + Travelers (right) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[8] flex items-center gap-6 w-full justify-center px-8">
          {activeQuest && <div>{activeQuest}</div>}
          {travelersPill}
        </div>

        {/* HUD: ghost visitors — bottom-left */}
        <div className="absolute left-8 bottom-8 z-[4]">{ghostVisitors}</div>
      </div>
    </>
  );
}
