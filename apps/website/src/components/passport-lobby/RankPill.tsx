import { rubikClassName } from '../utils/font';

export interface RankPillProps {
  rank: number;
  xp: number;
  avatarUrl?: string;
  onClick?: () => void;
}

const GRADIENT_PASSPORT_BORDER =
  'linear-gradient(138deg, #A7D921 0%, #DCFF80 4%, #3C4B14 55%, #587312 76%, #89B020 95%)';

export function RankPill({ rank, xp, avatarUrl, onClick }: RankPillProps) {
  const Wrapper = onClick ? 'button' : 'div';
  const wrapperProps = onClick
    ? {
        type: 'button' as const,
        onClick,
        'aria-label': 'Open profile settings',
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`inline-flex items-center text-white ${rubikClassName} ${
        onClick ? 'transition-transform active:scale-95 hover:brightness-110 cursor-pointer' : ''
      }`}
      style={{
        gap: 10,
        padding: '4px 16px 4px 4px',
        borderRadius: 100,
        background: '#202020',
        border: '2px solid transparent',
        backgroundImage: `linear-gradient(#202020, #202020), ${GRADIENT_PASSPORT_BORDER}`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        // 30px avatar + 4px vertical padding + 2px border × 2 = 40px. Bump to 44px min-height
        // so tapping from mobile clears WCAG 2.5.5 / Apple HIG. Visual pill grows ~4px vertically.
        minHeight: 44,
        minWidth: onClick ? 44 : undefined,
      }}
    >
      <span
        className="bg-pink-500 bg-cover bg-center flex-shrink-0"
        style={{
          width: 30,
          height: 30,
          borderRadius: 512,
          border: '2px solid rgba(255,255,255,0.16)',
          ...(avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}),
        }}
        aria-hidden
      />
      <div className="flex items-baseline" style={{ gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF', letterSpacing: '0.01em' }}>
          #{rank || '\u2014'}
        </span>
        <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.16)' }} aria-hidden />
        <span style={{ fontSize: 13, fontWeight: 400, color: '#FFFFFF', letterSpacing: '0.01em' }}>
          <span style={{ opacity: 0.55, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', marginRight: 4 }}>XP</span>
          {xp.toLocaleString()}
        </span>
      </div>
    </Wrapper>
  );
}
