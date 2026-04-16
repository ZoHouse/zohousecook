import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import type { ProUpsellFeature } from '../pro';
import { rubikClassName } from '../utils/font';
import quest from '../../assets/passport-lobby/cards/quest.png';
import earn from '../../assets/passport-lobby/cards/earn.png';
import create from '../../assets/passport-lobby/cards/create.png';
import host from '../../assets/passport-lobby/cards/host.png';

export interface PassesDockProps { onUpsell: (feature: ProUpsellFeature) => void }

const TILES: Array<{ feature: ProUpsellFeature; label: string; src: StaticImageData }> = [
  { feature: 'quest-pass', label: 'Quest', src: quest },
  { feature: 'earn-pass', label: 'Earn', src: earn },
  { feature: 'create-pass', label: 'Create', src: create },
  { feature: 'host-pass', label: 'Host', src: host },
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
              padding: '10px 0',
              gap: 4,
            }}
          >
            <div style={{ width: 53, height: 41, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src={tile.src} alt="" width={53} height={41} style={{ objectFit: 'contain', width: 'auto', height: '100%' }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 500, color: '#FFFFFF', textAlign: 'center', lineHeight: '0.9375em', marginTop: 4 }}>
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
