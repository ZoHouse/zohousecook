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

function CenterStack({ hero, activeQuest, travelersPill }: { hero: ReactNode; activeQuest?: ReactNode; travelersPill: ReactNode }) {
  return (
    <div className="flex flex-col items-center w-full">
      {hero}
      {/* Pedestal directly under the hero */}
      <div style={{ marginTop: -6 }} aria-hidden>
        <Image src={pedestal} alt="" width={179} height={65} style={{ width: 220, height: 'auto' }} />
      </div>
      {/* Progress bar below pedestal */}
      <div style={{ marginTop: -14 }} aria-hidden>
        <Image src={progressBar} alt="" width={113} height={6} style={{ width: 130, height: 'auto' }} />
      </div>
      {activeQuest && <div className="mt-4 flex justify-center w-full">{activeQuest}</div>}
      <div className="mt-3 flex justify-center w-full">{travelersPill}</div>
    </div>
  );
}

export function LobbyRoom({ mapWidget, sideNav, hero, ghostVisitors, nextMilestone, travelersPill, activeQuest }: LobbyRoomProps) {
  return (
    <>
      {/* MOBILE: absolute-positioned 360px room (unchanged) */}
      <div
        className="relative md:hidden"
        style={{
          minHeight: 620,
          background: '#111111',
          backgroundImage:
            'radial-gradient(ellipse 140% 35% at 50% 95%, rgba(50,48,40,0.5) 0%, transparent 100%), radial-gradient(ellipse 90% 20% at 50% 100%, rgba(30,28,22,0.9) 0%, transparent 100%)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none flex justify-center items-start pt-10"
          aria-hidden
        >
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
          <CenterStack hero={hero} activeQuest={activeQuest} travelersPill={travelersPill} />
        </div>

        <div className="absolute left-3 bottom-[40px] z-[4]">{ghostVisitors}</div>
      </div>

      {/* DESKTOP: 3-column grid — map left, hero center, nav right */}
      <div
        className="hidden md:block relative overflow-hidden rounded-3xl"
        style={{
          background: '#111111',
          minHeight: 680,
          border: '1px solid rgba(255,255,255,0.05)',
          backgroundImage:
            'radial-gradient(ellipse 80% 30% at 50% 100%, rgba(50,48,40,0.45) 0%, transparent 70%)',
        }}
      >
        {/* Room perspective SVG — fills desktop container background */}
        <div
          className="absolute inset-0 pointer-events-none flex justify-center items-start pt-6"
          aria-hidden
        >
          <Image
            src={roomPerspective}
            alt=""
            width={507}
            height={386}
            style={{ width: '100%', maxWidth: 900, height: 'auto', opacity: 0.45 }}
          />
        </div>

        {/* 3-column layout: left / center / right */}
        <div className="relative z-[5] grid grid-cols-[auto_1fr_auto] gap-6 lg:gap-10 px-6 py-8 lg:px-10 lg:py-10">
          {/* LEFT COLUMN: Map + Ghosts */}
          <div className="flex flex-col justify-between min-h-[540px] w-[150px] lg:w-[180px]">
            <div>{mapWidget}</div>
            <div className="mt-auto">{ghostVisitors}</div>
          </div>

          {/* CENTER COLUMN: Hero stack */}
          <div className="flex items-center justify-center">
            <CenterStack hero={hero} activeQuest={activeQuest} travelersPill={travelersPill} />
          </div>

          {/* RIGHT COLUMN: Side nav + Next milestone */}
          <div className="flex flex-col items-end justify-between min-h-[540px] w-[60px] lg:w-[80px]">
            <div>{sideNav}</div>
            <div className="mt-4" style={{ width: 44 }}>{nextMilestone}</div>
          </div>
        </div>
      </div>
    </>
  );
}
