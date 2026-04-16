import Image from 'next/image';
import { rubikClassName } from '../utils/font';
import t1 from '../../assets/passport-lobby/traveler-1.png';
import t2 from '../../assets/passport-lobby/traveler-2.png';
import t3 from '../../assets/passport-lobby/traveler-3.png';

export interface TravelersPillProps {
  count?: number;
}

const GRADIENT_GLASS_BG =
  'linear-gradient(157deg, #343434 3%, #424141 14%, #202020 52%, #303030 100%)';
const GRADIENT_GLASS_BORDER =
  'linear-gradient(180deg, rgba(70,70,70,0.8) 0%, rgba(172,172,172,0.2) 100%)';

const AVATARS = [
  { size: 17, color: '#2C67F6', src: t1 },
  { size: 22, color: '#2C67F6', src: t1 },
  { size: 19, color: '#00BEA9', src: t2 },
  { size: 25, color: '#BA2553', src: t3 },
];

export function TravelersPill({ count = 14 }: TravelersPillProps) {
  return (
    <div
      className={`flex items-center text-white ${rubikClassName}`}
      style={{
        width: 180,
        height: 36,
        padding: '4px 12px 4px 6px',
        borderRadius: 16,
        border: '1.5px solid transparent',
        gap: 8,
        backgroundImage: `${GRADIENT_GLASS_BG}, ${GRADIENT_GLASS_BORDER}`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      <div className="flex items-end" aria-hidden>
        {AVATARS.map((av, i) => (
          <div
            key={i}
            className="rounded-full overflow-hidden"
            style={{
              width: av.size,
              height: av.size,
              border: `1.5px solid ${av.color}`,
              opacity: 0.92,
              marginLeft: i > 0 ? -5 : 0,
              filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))',
              flexShrink: 0,
            }}
          >
            <Image src={av.src} alt="" width={av.size} height={av.size} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: 400, textAlign: 'left', whiteSpace: 'nowrap', flex: 1 }}>
        {count} Travellers around
      </span>
    </div>
  );
}
