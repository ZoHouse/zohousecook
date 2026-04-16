import { rubikClassName } from '../utils/font';

export interface TravelersPillProps {
  count?: number;
}

const GRADIENT_GLASS_BG =
  'linear-gradient(157deg, #343434 3%, #424141 14%, #202020 52%, #303030 100%)';
const GRADIENT_GLASS_BORDER =
  'linear-gradient(180deg, rgba(70,70,70,0.8) 0%, rgba(172,172,172,0.2) 100%)';

const AVATAR_CONFIGS = [
  { size: 17, color: '#2C67F6' },
  { size: 22, color: '#2C67F6' },
  { size: 19, color: '#00BEA9' },
  { size: 25, color: '#BA2553' },
];

export function TravelersPill({ count = 14 }: TravelersPillProps) {
  return (
    <div
      className={`flex flex-col justify-end items-center text-white ${rubikClassName}`}
      style={{
        width: 160,
        height: 36,
        padding: '7.5px 12px 9px',
        borderRadius: 16,
        border: '3px solid transparent',
        backgroundImage: `${GRADIENT_GLASS_BG}, ${GRADIENT_GLASS_BORDER}`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      {/* Avatar thumbnails row */}
      <div className="flex items-end justify-center" style={{ marginBottom: 2 }} aria-hidden>
        {AVATAR_CONFIGS.map((av, i) => (
          <div
            key={i}
            className="rounded-full bg-neutral-600"
            style={{
              width: av.size,
              height: av.size,
              border: `2px solid ${av.color}`,
              opacity: 0.9,
              marginLeft: i > 0 ? -4 : 0,
              filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.4))',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 9, fontWeight: 400, textAlign: 'center', whiteSpace: 'nowrap' }}>
        {count} Travellers around
      </span>
    </div>
  );
}
