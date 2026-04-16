import { rubikClassName } from '../utils/font';

export interface XpPillProps {
  value: number;
}

const GRADIENT_PASSPORT_BORDER =
  'linear-gradient(138deg, #A7D921 0%, #DCFF80 4%, #3C4B14 55%, #587312 76%, #89B020 95%)';

export function XpPill({ value }: XpPillProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full text-white ${rubikClassName}`}
      style={{
        width: 87,
        height: 29,
        padding: 8,
        border: '2px solid transparent',
        backgroundImage: `linear-gradient(#202020, #202020), ${GRADIENT_PASSPORT_BORDER}`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      <span
        className="rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold flex-shrink-0"
        style={{ width: 22, height: 22, borderRadius: '50%', fontSize: 9, letterSpacing: '0.02em' }}
      >
        XP
      </span>
      <span style={{ fontSize: 14, fontWeight: 400, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}
