import Link from 'next/link';
import { Avatar2D } from './Avatar2D';
import { XpProgressBar } from './XpProgressBar';

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

export function CitizenCard({ handle: _handle, displayName, avatarUrl, xpTotal, rankTitle, onUpsell }: CitizenCardProps) {
  const tier = getTierInfo(xpTotal);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onUpsell}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onUpsell(); } }}
      className="w-[240px] text-left cursor-pointer"
      style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
        borderRadius: '18px',
        padding: '14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Avatar portrait — takes ~60% height */}
      <div className="mb-2" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Avatar2D avatarUrl={avatarUrl} displayName={displayName} />
      </div>

      {/* Name + subtitle */}
      <div className="text-white text-base font-semibold leading-tight">{displayName}</div>
      <div className="text-neutral-500 text-[11px] mb-2">Citizen of Zo World</div>

      {/* XP + rank badge */}
      <div
        className="flex items-center gap-2 py-2 mb-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
          style={{ background: 'radial-gradient(circle at 30% 30%, #FEDD1E, #F1563F 70%)' }}
          aria-hidden
        >
          ★
        </span>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-white text-[13px] font-semibold">{xpTotal.toLocaleString()} XP</span>
          <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#FEDD1E' }}>{rankTitle}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex justify-between text-[9px] mb-1">
        <span style={{ color: '#6fc4e0' }}>Traveller Level {tier.level}</span>
        <span className="text-neutral-500">{tier.xpInLevel}/{tier.xpLevelTotal || '∞'}</span>
      </div>
      <XpProgressBar current={tier.xpInLevel} max={tier.xpLevelTotal || 1} className="mb-1.5" />

      {/* Leaderboard link */}
      <div className="flex justify-between items-center text-[9px]">
        <span className="text-neutral-600">{tier.xpLevelTotal ? `${tier.xpLevelTotal - tier.xpInLevel} XP to enter Top 5000` : ''}</span>
        <Link href="/leaderboard" className="text-lime-400 font-medium" onClick={(e) => e.stopPropagation()}>
          Leaderboard
        </Link>
      </div>
    </div>
  );
}
