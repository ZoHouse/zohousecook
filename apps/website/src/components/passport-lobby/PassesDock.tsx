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
    <div className={`${rubikClassName} px-4 py-4 md:fixed md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:px-0 md:py-0 md:z-[15]`}>
      <div className="grid grid-cols-4 gap-2 md:flex md:gap-4">
        {TILES.map((tile) => (
          <button
            key={tile.feature}
            onClick={() => onUpsell(tile.feature)}
            className="flex flex-col items-center justify-center transition-all active:scale-95 hover:brightness-110 hover:-translate-y-0.5"
            style={{
              width: undefined,
              background: '#202020',
              borderRadius: 12,
              padding: '10px 8px',
              gap: 4,
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <div className="relative flex items-center justify-center md:w-[70px] md:h-[70px] w-[53px] h-[41px]">
              <Image
                src={tile.src}
                alt=""
                fill
                sizes="(min-width:768px) 70px, 53px"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <span
              className="text-center mt-1"
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: '#FFFFFF',
                lineHeight: '1em',
              }}
            >
              {tile.label}
            </span>
            <span
              style={{
                fontSize: 10,
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
