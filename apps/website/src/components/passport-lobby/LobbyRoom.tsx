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
  nextMilestone: ReactNode;
  travelersPill: ReactNode;
}

/**
 * Lobby scene — Fortnite-style lobby. Avatar center-stage, HUD around edges.
 * Map access lives inside the side-nav rail (passed in via sideNav slot).
 */
export function LobbyRoom({ sideNav, hero, nextMilestone, travelersPill }: LobbyRoomProps) {
  return (
    <>
      {/* MOBILE: fill remaining viewport, content anchored low (above the tier nav). */}
      <div className="relative md:hidden flex flex-col flex-1 overflow-hidden">
        <div
          className="absolute top-3 right-3 z-[10] flex flex-col items-end gap-1"
          style={{
            // Respect iOS notch / landscape right-edge inset so the side-nav rail isn't clipped.
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingRight: 'env(safe-area-inset-right, 0px)',
          }}
        >
          {sideNav}
          <div className="mt-3 flex justify-center" style={{ width: 44 }}>{nextMilestone}</div>
        </div>

        <div className="relative z-[5] flex flex-col items-center justify-end flex-1 pt-20 pb-[190px]">
          {hero}
          <div style={{ marginTop: -6 }} aria-hidden>
            <Image src={pedestal} alt="" width={179} height={65} style={{ width: 200, height: 'auto' }} />
          </div>
          <div className="mt-4"><UnlimitedAccessCta size="sm" /></div>
        </div>
      </div>

      {/* DESKTOP: immersive Fortnite-style lobby */}
      <div
        className="hidden md:block relative"
        style={{
          minHeight: 'calc(100vh - 120px)',
          background: 'transparent',
        }}
      >
        {/* HUD: Side nav — right edge, vertically centered. Includes Map button now. */}
        <div className="absolute top-1/2 right-6 -translate-y-1/2 z-[10] flex flex-col items-center gap-6">
          {sideNav}
          <div className="opacity-60 w-11 lg:opacity-100 lg:w-auto">{nextMilestone}</div>
        </div>

        {/* CENTER STAGE: hero card + pedestal + progress bar + quest + travelers */}
        <div className="relative z-[5] flex flex-col items-center justify-center pt-[80px] lg:pt-[360px]" style={{ minHeight: 'calc(100vh - 260px)' }}>
          {hero}
          <div style={{ marginTop: 6 }} aria-hidden>
            <Image src={pedestal} alt="" width={179} height={65} style={{ width: 260, height: 'auto' }} />
          </div>
          <div className="mt-6"><UnlimitedAccessCta /></div>
        </div>
      </div>
    </>
  );
}
