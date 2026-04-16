import Link from 'next/link';
import { Avatar2D } from './Avatar2D';
import { XpProgressBar } from './XpProgressBar';
import { rubikClassName, syneClassName } from '../utils/font';

const THRESHOLDS = [
  { min: 20000, label: 'Legend' },
  { min: 10000, label: 'Explorer' },
  { min: 5000,  label: 'Adventurer' },
  { min: 2000,  label: 'Traveler' },
  { min: 500,   label: 'Wanderer' },
  { min: 0,     label: 'Citizen' },
];

function getTierInfo(xp: number) {
  const idx = THRESHOLDS.findIndex(t => xp >= t.min);
  const current = THRESHOLDS[idx];
  const next = THRESHOLDS[idx - 1];
  return {
    label: current.label,
    level: THRESHOLDS.length - idx,
    xpInLevel: xp - current.min,
    xpLevelTotal: next ? next.min - current.min : 0,
  };
}

export interface CitizenCardProps {
  handle: string;
  displayName: string;
  avatarUrl?: string;
  xpTotal: number;
  rankTitle: string;
  onUpsell: () => void;
}

const GRADIENT_PRIVATE_CARD = 'linear-gradient(180deg, #292929 0%, #000000 100%)';

export function CitizenCard({ handle: _handle, displayName, avatarUrl, xpTotal, rankTitle, onUpsell }: CitizenCardProps) {
  const tier = getTierInfo(xpTotal);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onUpsell}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onUpsell(); } }}
      className={`text-left cursor-pointer ${rubikClassName}`}
      style={{
        width: 236,
        background: GRADIENT_PRIVATE_CARD,
        borderRadius: 24,
        padding: 16,
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
        boxShadow: '0px 4px 4px rgba(0,0,0,0.25), inset 0px 1.93px 7.71px rgba(255,255,255,0.25)',
      }}
    >
      {/* Avatar portrait — 128×128 per spec */}
      <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
        <Avatar2D avatarUrl={avatarUrl} displayName={displayName} />
      </div>

      {/* Name — Syne 700, 24px */}
      <div
        className={syneClassName}
        style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', lineHeight: '1.2em', marginBottom: 2 }}
      >
        {displayName}
      </div>
      {/* Subtitle — Rubik 400, 14px, 55% opacity */}
      <div style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.01em', marginBottom: 10 }}>
        Citizen of Zo World
      </div>

      {/* XP + rank badge */}
      <div
        className="flex items-center gap-2 py-2 mb-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span
          className="rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
          style={{ width: 24, height: 24, background: 'radial-gradient(circle at 30% 30%, #FEDD1E, #F1563F 70%)' }}
          aria-hidden
        >
          ★
        </span>
        <div className="flex flex-col leading-tight min-w-0">
          <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{xpTotal.toLocaleString()} XP</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#FEDD1E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {rankTitle}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex justify-between" style={{ fontSize: 9, marginBottom: 4 }}>
        <span style={{ color: '#6fc4e0' }}>Level {tier.level} · {tier.label}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{tier.xpInLevel.toLocaleString()}/{tier.xpLevelTotal ? tier.xpLevelTotal.toLocaleString() : '∞'}</span>
      </div>
      <XpProgressBar current={tier.xpInLevel} max={tier.xpLevelTotal || 1} />

      {/* Leaderboard link */}
      <div className="flex justify-end items-center" style={{ marginTop: 6, fontSize: 10 }}>
        <Link
          href="/leaderboard"
          style={{ color: '#A7D921', fontWeight: 500 }}
          onClick={(e) => e.stopPropagation()}
        >
          Leaderboard →
        </Link>
      </div>
    </div>
  );
}
