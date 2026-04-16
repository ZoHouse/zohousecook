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
  { size: 26, color: '#2C67F6', src: t1, offset: 0 },
  { size: 30, color: '#00BEA9', src: t2, offset: -10 },
  { size: 26, color: '#FEDD1E', src: t1, offset: -10 },
  { size: 30, color: '#BA2553', src: t3, offset: -10 },
];

export function TravelersPill({ count = 14 }: TravelersPillProps) {
  return (
    <div
      className={`flex items-center text-white ${rubikClassName}`}
      style={{
        padding: '6px 18px 6px 8px',
        borderRadius: 999,
        border: '1.5px solid transparent',
        gap: 12,
        backgroundImage: `${GRADIENT_GLASS_BG}, ${GRADIENT_GLASS_BORDER}`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: '0 6px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center" aria-hidden>
        {AVATARS.map((av, i) => (
          <div
            key={i}
            className="rounded-full overflow-hidden"
            style={{
              width: av.size,
              height: av.size,
              border: `2px solid ${av.color}`,
              marginLeft: av.offset,
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.55))',
              flexShrink: 0,
              background: '#111',
              zIndex: AVATARS.length - i,
              position: 'relative',
            }}
          >
            <Image
              src={av.src}
              alt=""
              width={av.size}
              height={av.size}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start leading-tight">
        <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
          {count} Travellers
        </span>
        <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>
          around Bangalore
        </span>
      </div>
    </div>
  );
}
