import type { ReactNode } from 'react';

export interface LobbyRoomProps {
  mapWidget: ReactNode;
  sideNav: ReactNode;
  hero: ReactNode;
  ghostVisitors: ReactNode;
  nextMilestone: ReactNode;
  travelersPill: ReactNode;
}

export function LobbyRoom({ mapWidget, sideNav, hero, ghostVisitors, nextMilestone, travelersPill }: LobbyRoomProps) {
  return (
    <div
      className="relative"
      style={{
        minHeight: '580px',
        background: '#0a0a0a',
        backgroundImage: [
          'linear-gradient(76deg, transparent 46%, rgba(255,255,255,0.07) 49.5%, rgba(255,255,255,0.07) 50.5%, transparent 54%)',
          'linear-gradient(104deg, transparent 46%, rgba(255,255,255,0.07) 49.5%, rgba(255,255,255,0.07) 50.5%, transparent 54%)',
          'linear-gradient(90deg, transparent 49.7%, rgba(255,255,255,0.03) 50%, transparent 50.3%)',
          'radial-gradient(ellipse 140% 35% at 50% 95%, rgba(50,48,40,0.5) 0%, transparent 100%)',
          'radial-gradient(ellipse 90% 20% at 50% 100%, rgba(30,28,22,0.9) 0%, transparent 100%)',
        ].join(', '),
      }}
    >
      {/* Map widget — top left */}
      <div className="absolute top-4 left-4 z-10">{mapWidget}</div>

      {/* Side nav — right edge */}
      <div className="absolute top-4 right-2 z-10 flex flex-col items-end gap-1">
        {sideNav}
        <div className="mt-4">{nextMilestone}</div>
      </div>

      {/* Hero citizen card — centered */}
      <div className="flex justify-center pt-[80px] pb-[90px] relative z-[5]">
        {hero}
      </div>

      {/* Ghost visitors — bottom left */}
      <div className="absolute left-5 bottom-[70px] z-[4]">{ghostVisitors}</div>

      {/* Travelers pill — centered at bottom */}
      <div className="absolute left-1/2 bottom-5 -translate-x-1/2 z-[6]">{travelersPill}</div>
    </div>
  );
}
