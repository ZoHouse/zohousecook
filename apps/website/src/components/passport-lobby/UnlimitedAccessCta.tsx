import Link from 'next/link';
import { MeshGradient } from '@paper-design/shaders-react';
import { useProfile } from '@zo/auth';
import { usePassportSubscription } from '../../hooks/usePassportSubscription';
import { isFounderProfile } from '../../lib/passport/proStatus';

const GOLD_SHADER_COLORS = ['#FFF3B0', '#FFE38A', '#F5C542', '#C88A1C'];

export interface UnlimitedAccessCtaProps {
  size?: 'sm' | 'md';
  /** Override the default copy ("Get Unlimited Access"). Ignored when the
      viewer is already a Pro citizen — the component swaps to a non-
      clickable "Pro Citizen" badge regardless. */
  label?: string;
  /** When provided, renders the CTA as a button and runs this handler
      instead of navigating to /pro. Ignored when the viewer is Pro. */
  onClick?: () => void;
}

export function UnlimitedAccessCta({
  size = 'md',
  label = 'Get Unlimited Access',
  onClick,
}: UnlimitedAccessCtaProps) {
  const { profile } = useProfile();
  const { subscription } = usePassportSubscription();
  // Pro short-circuit only fires in idle/default mode. When the caller
  // supplies onClick the CTA is being morphed into a quest action — a
  // Pro citizen must still see and click that action, otherwise selecting
  // a quest is a silent no-op for them.
  const isPro =
    !onClick &&
    (isFounderProfile(profile) ||
      !!(subscription?.is_active && subscription?.is_paid));

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
  const baseClass =
    'relative overflow-hidden inline-flex items-center gap-2 font-semibold transition-all';
  const interactiveClass = isPro ? '' : 'active:scale-[0.97] hover:brightness-110';
  const className = `${baseClass} ${interactiveClass}`.trim();

  // Inline SVG sparkle — replaces the ✦ Unicode glyph (U+2726), which
  // falls back to tofu on Android system fonts that don't include it.
  const sparkle = (
    <svg
      aria-hidden
      className="relative z-10"
      width={fontSize + 2}
      height={fontSize + 2}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ flexShrink: 0 }}
    >
      <path d="M12 1.5L13.6 9.4L21.5 11L13.6 12.6L12 20.5L10.4 12.6L2.5 11L10.4 9.4Z" />
    </svg>
  );

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
      {sparkle}
      <span className="relative z-10">{isPro ? 'Pro Citizen' : label}</span>
    </>
  );

  if (isPro) {
    return (
      <div className={className} style={sharedStyle} role="status" aria-label="Pro citizen">
        {inner}
      </div>
    );
  }

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
