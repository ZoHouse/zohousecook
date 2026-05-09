import Link from 'next/link';
import { MeshGradient } from '@paper-design/shaders-react';

const GOLD_SHADER_COLORS = ['#FFF3B0', '#FFE38A', '#F5C542', '#C88A1C'];

export interface UnlimitedAccessCtaProps {
  size?: 'sm' | 'md';
  /** Override the default copy ("Get Unlimited Access"). */
  label?: string;
  /** When provided, renders as a button and runs this handler instead of
      navigating. Lets callers wire login + onboarding flows behind the CTA. */
  onClick?: () => void;
}

export function UnlimitedAccessCta({
  size = 'md',
  label = 'Get Unlimited Access',
  onClick,
}: UnlimitedAccessCtaProps) {
  const padding = size === 'sm' ? '10px 20px' : '14px 28px';
  const fontSize = size === 'sm' ? 12 : 14;
  const sharedStyle = {
    padding,
    fontSize,
    borderRadius: 999,
    color: '#3A2900',
    background: '#F5C542',
    boxShadow:
      '0 6px 22px rgba(245,197,66,0.45), 0 2px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(120,70,0,0.4)',
    letterSpacing: '0.01em',
    textShadow: '0 1px 0 rgba(255,255,255,0.35)',
    isolation: 'isolate' as const,
  };
  const className =
    'relative overflow-hidden inline-flex items-center gap-2 font-semibold transition-all active:scale-[0.97] hover:brightness-110';
  const inner = (
    <>
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
      <span aria-hidden className="relative z-10" style={{ fontSize: fontSize + 2 }}>
        ✦
      </span>
      <span className="relative z-10">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} style={sharedStyle}>
        {inner}
      </button>
    );
  }

  return (
    <Link href="/pro" className={className} style={sharedStyle}>
      {inner}
    </Link>
  );
}
