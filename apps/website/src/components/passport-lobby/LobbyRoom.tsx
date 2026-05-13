import type { ReactNode } from 'react';
import Image from 'next/image';
import pedestal from '../../assets/passport-lobby/scene/pedestal.svg';
import { UnlimitedAccessCta } from './UnlimitedAccessCta';

export interface LobbyRoomProps {
  sideNav: ReactNode;
  hero: ReactNode;
  travelersPill: ReactNode;
  /** Rendered immediately below the "Get Unlimited Access" CTA. */
  belowCta?: ReactNode;
}

/**
 * Lobby scene — Fortnite-style lobby. Avatar center-stage, HUD around edges.
 * Map access lives inside the side-nav rail (passed in via sideNav slot).
 */
export function LobbyRoom({ sideNav, hero, travelersPill, belowCta }: LobbyRoomProps) {
  return (
    <>
      {/* MOBILE — three-row distribution inside one viewport.
          Top: hero/pedestal/CTA cluster, slightly above optical center.
          Bottom: activities carousel, with bottom clearance for the
          PWA Install pill (~64px) so they don't overlap. */}
      <div
        className="relative md:hidden flex flex-col h-[100svh] overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {sideNav}

        <div className="relative z-[5] flex flex-col items-center justify-center flex-1 pt-20 gap-1">
          {hero}
          <div style={{ marginTop: -4 }} aria-hidden>
            <Image src={pedestal} alt="" width={179} height={65} style={{ width: 200, height: 'auto' }} />
          </div>
          <div className="mt-3"><UnlimitedAccessCta size="sm" /></div>
        </div>
        {belowCta && (
          <div className="relative z-[5] w-full pb-[72px]">{belowCta}</div>
        )}
      </div>

      {/* DESKTOP: immersive Fortnite-style lobby */}
      <div
        className="hidden md:block relative"
        style={{
          minHeight: 'calc(100vh - 120px)',
          background: 'transparent',
        }}
      >
        {sideNav}

        <div className="relative z-[5] flex flex-col items-center pt-[80px] lg:pt-32 pb-16" style={{ minHeight: 'calc(100vh - 120px)' }}>
          {hero}
          <div style={{ marginTop: 6 }} aria-hidden>
            <Image src={pedestal} alt="" width={179} height={65} style={{ width: 260, height: 'auto' }} />
          </div>
          <div className="mt-6"><UnlimitedAccessCta /></div>
          {belowCta && <div className="mt-10 w-full">{belowCta}</div>}
        </div>
      </div>
    </>
  );
}
