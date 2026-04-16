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
      className="w-[220px] bg-neutral-900 rounded-2xl p-4 text-left shadow-2xl cursor-pointer"
    >
      <div className="mb-3">
        <Avatar2D avatarUrl={avatarUrl} displayName={displayName} />
      </div>
      <div className="text-white text-lg font-semibold leading-tight mb-0.5">{displayName}</div>
      <div className="text-neutral-500 text-xs mb-3">Citizen of Zo World</div>
      <div className="flex items-center gap-2 py-2 border-y border-neutral-800 mb-2">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: 'radial-gradient(circle at 30% 30%, #FEDD1E, #F1563F 70%)' }}
          aria-hidden
        >
          ★
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-white text-[13px] font-semibold">{xpTotal.toLocaleString()} XP</span>
          <span className="text-[10px] font-bold tracking-wider" style={{ color: '#FEDD1E' }}>{rankTitle}</span>
        </div>
      </div>
      <div className="flex justify-between text-[9px] mb-1">
        <span style={{ color: '#6fc4e0' }}>Level {tier.level} · {tier.label}</span>
        <span className="text-neutral-500">{tier.xpInLevel}/{tier.xpLevelTotal || '∞'} XP</span>
      </div>
      <XpProgressBar current={tier.xpInLevel} max={tier.xpLevelTotal || 1} className="mb-2" />
      <div className="text-[9px] text-neutral-500">
        <Link href="/leaderboard" className="text-lime-400" onClick={(e) => e.stopPropagation()}>
          Leaderboard
        </Link>
      </div>
    </div>
  );
}
