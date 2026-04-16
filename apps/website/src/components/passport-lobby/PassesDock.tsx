import type { ProUpsellFeature } from '../pro';
import { rubikClassName } from '../utils/font';

export interface PassesDockProps { onUpsell: (feature: ProUpsellFeature) => void }

const TILES: Array<{ feature: ProUpsellFeature; label: string; emoji: string }> = [
  { feature: 'quest-pass', label: 'Quest', emoji: '\uD83D\uDCDC' },
  { feature: 'earn-pass', label: 'Earn', emoji: '\uD83D\uDCB5' },
  { feature: 'create-pass', label: 'Create', emoji: '\uD83C\uDFA8' },
  { feature: 'host-pass', label: 'Host', emoji: '\uD83C\uDFF4' },
];

export function PassesDock({ onUpsell }: PassesDockProps) {
  return (
    <div className={`px-4 py-4 ${rubikClassName}`}>
      <div className="flex justify-center" style={{ gap: 8 }}>
        {TILES.map((tile) => (
          <button
            key={tile.feature}
            onClick={() => onUpsell(tile.feature)}
            className="flex flex-col items-center justify-center transition-transform active:scale-95"
            style={{
              width: 73,
              height: 108,
              background: '#202020',
              borderRadius: 8,
              padding: '8px 0',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 32, lineHeight: 1, width: 53, height: 41, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {tile.emoji}
            </span>
            <span style={{ fontSize: 16, fontWeight: 500, color: '#FFFFFF', textAlign: 'center', lineHeight: '0.9375em' }}>
              {tile.label}
            </span>
            <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.44)', letterSpacing: '0.02em' }}>
              Apply
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
