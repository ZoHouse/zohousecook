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
      className={`inline-flex items-center text-white ${rubikClassName} ${
        onClick ? 'transition-transform active:scale-95 hover:brightness-110 cursor-pointer' : ''
      }`}
      style={{
        gap: 10,
        padding: '4px 16px 4px 4px',
        borderRadius: 999,
        // Match PageHeaderPill glass treatment so the left + right HUD anchors
        // read as one cohesive system. No more green gradient edge.
        background:
          'linear-gradient(180deg, rgba(28,28,34,0.92) 0%, rgba(14,14,18,0.92) 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow:
          '0 4px 18px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
