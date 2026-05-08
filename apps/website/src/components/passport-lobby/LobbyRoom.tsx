import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MeshGradient } from '@paper-design/shaders-react';
import pedestal from '../../assets/passport-lobby/scene/pedestal.svg';

// Gold-palette shader for the CTA — shimmer that reads as polished metal.
const GOLD_SHADER_COLORS = ['#FFF3B0', '#FFE38A', '#F5C542', '#C88A1C'];

function UnlimitedAccessCta({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const padding = size === 'sm' ? '10px 20px' : '14px 28px';
  const fontSize = size === 'sm' ? 12 : 14;
  return (
    <Link
      href="/pro"
      className="relative overflow-hidden inline-flex items-center gap-2 font-semibold transition-all active:scale-[0.97] hover:brightness-110"
      style={{
        padding,
        fontSize,
        borderRadius: 999,
        color: '#3A2900',
        background: '#F5C542',
        boxShadow: '0 6px 22px rgba(245,197,66,0.45), 0 2px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(120,70,0,0.4)',
        letterSpacing: '0.01em',
        textShadow: '0 1px 0 rgba(255,255,255,0.35)',
        isolation: 'isolate',
      }}
    >
      <MeshGradient
        colors={GOLD_SHADER_COLORS}
        speed={1.4}
        scale={2}
        distortion={0.5}
        swirl={0.45}
        grainMixer={0.05}
        grainOverlay={0.06}
        fit="cover"
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />
      <span aria-hidden className="relative z-10" style={{ fontSize: fontSize + 2 }}>✦</span>
      <span className="relative z-10">Get Unlimited Access</span>
    </Link>
  );
}

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
