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
    <div className={`px-4 py-4 md:px-0 md:py-8 md:mt-6 ${rubikClassName}`}>
      <div className="grid grid-cols-4 gap-2 md:gap-4 lg:gap-6 md:max-w-[720px] md:mx-auto">
        {TILES.map((tile) => (
          <button
            key={tile.feature}
            onClick={() => onUpsell(tile.feature)}
            className="flex flex-col items-center justify-center transition-transform active:scale-95 hover:brightness-110 aspect-[3/4] w-full"
            style={{
              background: '#202020',
              borderRadius: 12,
              padding: '12px 8px',
              gap: 6,
              border: '1px solid rgba(255,255,255,0.04)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            }}
          >
            <div className="relative flex items-center justify-center" style={{ width: '72%', aspectRatio: '1 / 1' }}>
              <Image
                src={tile.src}
                alt=""
                fill
                sizes="(min-width:1024px) 130px, (min-width:768px) 100px, 53px"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <span
              className="text-center"
              style={{
                fontSize: 'clamp(14px, 1.6vw, 18px)',
                fontWeight: 500,
                color: '#FFFFFF',
                lineHeight: '1em',
                marginTop: 4,
              }}
            >
              {tile.label}
            </span>
            <span
              style={{
                fontSize: 'clamp(9px, 1.1vw, 12px)',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.44)',
                letterSpacing: '0.02em',
              }}
            >
              Apply
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
