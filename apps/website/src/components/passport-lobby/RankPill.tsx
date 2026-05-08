import { rubikClassName } from '../utils/font';

export interface RankPillProps {
  rank: number;
  xp: number;
  avatarUrl?: string;
  onClick?: () => void;
}

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
      className={`inline-flex items-center ${rubikClassName} ${
        onClick ? 'transition-transform active:scale-95 hover:brightness-105 cursor-pointer' : ''
      }`}
      style={{
        gap: 10,
        padding: '4px 16px 4px 4px',
        borderRadius: 999,
        // Pearl-glass to match the iridescent lobby + activity modal language.
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(242,224,236,0.7) 100%)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow:
          '0 6px 18px rgba(120,100,160,0.22), inset 0 1px 0 rgba(255,255,255,0.95)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        color: '#0A0A14',
        // 30px avatar + 4px vertical padding = 38px. Bump to 44px for WCAG.
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
          border: '2px solid rgba(255,255,255,0.95)',
          boxShadow: '0 1px 4px rgba(120,100,160,0.25)',
          ...(avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}),
        }}
        aria-hidden
      />
      <div className="flex items-baseline" style={{ gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#0A0A14', letterSpacing: '0.01em' }}>
          #{rank || '\u2014'}
        </span>
        <span style={{ width: 1, height: 14, background: 'rgba(120,100,160,0.3)' }} aria-hidden />
        <span style={{ fontSize: 13, fontWeight: 500, color: '#0A0A14', letterSpacing: '0.01em' }}>
          <span style={{ color: '#6B5B8E', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginRight: 4 }}>XP</span>
          {xp.toLocaleString()}
        </span>
      </div>
    </Wrapper>
  );
}
