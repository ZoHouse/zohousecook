import type { ProUpsellFeature } from '../pro';

export interface PassesDockProps { onUpsell: (feature: ProUpsellFeature) => void }

const TILES: Array<{ feature: ProUpsellFeature; label: string; gradient: string; emoji: string }> = [
  { feature: 'quest-pass', label: 'Quest', gradient: 'linear-gradient(135deg, #2d2410 0%, #1a1608 100%)', emoji: '📜' },
  { feature: 'earn-pass', label: 'Earn', gradient: 'linear-gradient(135deg, #0f2d14 0%, #0a1a0c 100%)', emoji: '💵' },
  { feature: 'create-pass', label: 'Create', gradient: 'linear-gradient(135deg, #1a1030 0%, #0f0a1a 100%)', emoji: '🎨' },
  { feature: 'host-pass', label: 'Host', gradient: 'linear-gradient(135deg, #2d1020 0%, #1a0a14 100%)', emoji: '🏴' },
];

export function PassesDock({ onUpsell }: PassesDockProps) {
  return (
    <div className="px-4 py-4">
      <div className="grid grid-cols-4 gap-2">
        {TILES.map((tile) => (
          <button
            key={tile.feature}
            onClick={() => onUpsell(tile.feature)}
            className="rounded-xl flex flex-col items-center justify-center gap-1.5 py-4 px-2 border border-white/[0.06] transition-transform active:scale-95"
            style={{ background: tile.gradient }}
          >
            <span className="text-2xl">{tile.emoji}</span>
            <span className="text-white text-[11px] font-semibold">{tile.label}</span>
            <span className="text-neutral-500 text-[9px]">Apply</span>
          </button>
        ))}
      </div>
    </div>
  );
}
