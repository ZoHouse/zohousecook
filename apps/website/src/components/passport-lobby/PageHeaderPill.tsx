import Link from 'next/link';
import { rubikClassName } from '../utils/font';

export interface PageHeaderPillProps {
  /** Page label rendered in the title pill, e.g. "Quests", "Dashboard". */
  title: string;
  /** Where the back button goes. Defaults to the lobby. */
  backHref?: string;
  /** Accessible label for the back button. */
  backLabel?: string;
}

// Glass pill geometry matches the active state of SideNavRail + the inner fill
// of RankPill (minus the green gradient border) so the three HUD anchors read
// as one system: 44px tall, same border, same shadow, same backdrop.
const PILL_STYLE: React.CSSProperties = {
  height: 44,
  borderRadius: 999,
  background:
    'linear-gradient(180deg, rgba(28,28,34,0.92) 0%, rgba(14,14,18,0.92) 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow:
    '0 4px 18px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  color: '#FFFFFF',
};

const CHEVRON_LEFT = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

/**
 * Fixed top-left HUD for passport sub-pages: circular back button + title pill.
 * Pair with the existing <TopBar /> (RankPill) anchored top-right and <SideNavRail />
 * on the right edge. All three read as a single glass HUD.
 *
 * PWA: respects env(safe-area-inset-top) / env(safe-area-inset-left) so the
 * pills don't tuck under the notch or home indicator in standalone mode.
 */
export function PageHeaderPill({
  title,
  backHref = '/passport',
  backLabel = 'Back to Passport',
}: PageHeaderPillProps) {
  return (
    <div
      className={`fixed z-[20] flex items-center gap-2 ${rubikClassName}`}
      style={{
        top: 'max(16px, calc(env(safe-area-inset-top, 0px) + 8px))',
        left: 'max(16px, calc(env(safe-area-inset-left, 0px) + 16px))',
      }}
    >
      <Link
        href={backHref}
        aria-label={backLabel}
        className="flex items-center justify-center transition-transform active:scale-95 hover:brightness-125"
        style={{
          ...PILL_STYLE,
          width: 44,
          aspectRatio: '1 / 1',
        }}
      >
        {CHEVRON_LEFT}
      </Link>

      <div
        className="flex items-center"
        style={{
          ...PILL_STYLE,
          padding: '0 16px',
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: '#FFFFFF',
          }}
        >
          {title}
        </span>
      </div>
    </div>
  );
}
