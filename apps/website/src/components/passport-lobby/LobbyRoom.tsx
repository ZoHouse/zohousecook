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
      className="relative min-h-[520px] bg-[#0a0a0a]"
      style={{
        backgroundImage: [
          'linear-gradient(82deg, transparent 49%, rgba(255,255,255,0.05) 50%, transparent 51%)',
          'linear-gradient(98deg, transparent 49%, rgba(255,255,255,0.05) 50%, transparent 51%)',
          'radial-gradient(ellipse at center 85%, rgba(0,0,0,0.7) 0%, transparent 60%)',
        ].join(', '),
      }}
    >
      <div className="absolute top-3 left-3 z-[3]">{mapWidget}</div>
      <div className="absolute top-20 right-4 z-[3]">{sideNav}</div>
      <div className="absolute left-1/2 top-20 -translate-x-1/2 z-[2]">{hero}</div>
      <div className="absolute left-3 bottom-32 z-[2]">{ghostVisitors}</div>
      <div className="absolute right-3 bottom-24 z-[3]">{nextMilestone}</div>
      <div className="absolute left-1/2 bottom-10 -translate-x-1/2 z-[3]">{travelersPill}</div>
    </div>
  );
}
