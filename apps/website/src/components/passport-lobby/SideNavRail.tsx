import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { StaticImageData } from 'next/image';
import { rubikClassName } from '../utils/font';
import wifiIcon from '../../assets/passport-lobby/icons/wifi.svg';
import shieldIcon from '../../assets/passport-lobby/icons/shield.svg';
import mapIcon from '../../assets/passport-lobby/icons/map.svg';
import coinIcon from '../../assets/passport-lobby/icons/coin.svg';
import chestIcon from '../../assets/passport-lobby/treasure-chest.png';

/** Kept for backward-compat with existing PassportLobby — tab state is no longer the nav driver. */
export type LobbyTab = 'lobby' | 'dailies' | 'badges';

export interface SideNavRailProps {
  /** @deprecated — active state now comes from router path */
  active?: LobbyTab;
  /** @deprecated — tabs now navigate to their own pages */
  onChange?: (tab: LobbyTab) => void;
  onOpenMap?: () => void;
  /** User's @handle — sub-page routes are /@{handle}/{page} */
  handle?: string;
}

type IconSrc = string | StaticImageData;

type NavItem = {
  label: string;
  icon: IconSrc;
  /** Route key used to compute href + active state */
  route: 'lobby' | 'quests' | 'badges' | 'earnings';
};

const NAV_ITEMS: NavItem[] = [
  { route: 'lobby', label: 'Lobby', icon: wifiIcon as IconSrc },
  { route: 'quests', label: 'Quests', icon: chestIcon as IconSrc },
  { route: 'badges', label: 'Badges', icon: shieldIcon as IconSrc },
  { route: 'earnings', label: 'Earn', icon: coinIcon as IconSrc },
];

function isActiveRoute(pathname: string, route: NavItem['route']): boolean {
  // Next.js rewrites /@handle → /passport, /@handle/earnings → /passport/earnings, etc.
  // We check router.pathname which reflects the rewritten path, not the URL.
  if (route === 'lobby') return pathname === '/passport';
  return pathname === `/passport/${route}`;
}

function buildHref(route: NavItem['route'], urlHandle?: string): string {
  if (route === 'lobby') return urlHandle ? `/@${urlHandle}` : '/passport';
  return urlHandle ? `/@${urlHandle}/${route}` : `/passport/${route}`;
}

// Pearl-glass pills — match the iridescent lobby + activity modal language.
// Light, frosted, with a soft purple shadow that blends into the pearl bg.
const PILL_INACTIVE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.65)',
  border: '1px solid rgba(255,255,255,0.85)',
  borderRadius: 14,
  boxShadow:
    '0 4px 14px rgba(120,100,160,0.18), inset 0 1px 0 rgba(255,255,255,0.95)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

const PILL_ACTIVE: React.CSSProperties = {
  ...PILL_INACTIVE,
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(242,224,236,0.85) 100%)',
  border: '1px solid rgba(255,255,255,0.95)',
  boxShadow:
    '0 6px 18px rgba(120,100,160,0.28), inset 0 1px 0 rgba(255,255,255,1)',
};

// Convert the white-on-dark icon set to dark-on-light so it reads on the
// pearl pills. `invert(1)` flips white → black; `brightness(0.85)` softens
// it slightly so it doesn't scream at full black.
const ICON_DROP_SHADOW: React.CSSProperties = {
  filter:
    'invert(1) brightness(0.85) drop-shadow(0 1px 2px rgba(120,100,160,0.25))',
};

export function SideNavRail({ onOpenMap, handle }: SideNavRailProps) {
  const router = useRouter();
  // Strip `.zo` display suffix — URLs use the canonical handle (`samurai`, not `samurai.zo`)
  const urlHandle = handle?.replace(/\.zo$/i, '');

  return (
    // Self-positioned global nav — same viewport-anchored slot on every
    // passport page (lobby, quests, badges, earnings). Callers just mount
    // <SideNavRail/> without wrapping positioning divs.
    // Mobile: tracks below the TopBar — safe-area-aware so iOS PWA install
    // (where the status bar reserves ~47px) does not overlap the rank pill.
    // Desktop: middle-right, fixed to viewport so it never shifts when
    // switching routes.
    <nav
      className={`fixed z-[10] top-[calc(env(safe-area-inset-top,0px)+76px)] right-3 md:top-1/2 md:right-6 md:-translate-y-1/2 flex flex-col items-center w-11 gap-3 md:w-16 md:gap-4 ${rubikClassName}`}
      aria-label="Lobby sections"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActiveRoute(router.pathname, item.route);
        return (
          <Link
            key={item.route}
            href={buildHref(item.route, urlHandle)}
            className="flex flex-col items-center gap-1 w-11 md:w-16 md:gap-1.5 py-2 px-1 md:py-3 md:px-1.5 transition-all active:scale-95 hover:opacity-100"
            style={{ ...(active ? PILL_ACTIVE : PILL_INACTIVE), opacity: active ? 1 : 0.95 }}
            aria-current={active ? 'page' : undefined}
          >
            <Image
              src={item.icon}
              alt=""
              width={44}
              height={44}
              className="w-6 h-6 md:w-10 md:h-10"
              style={ICON_DROP_SHADOW}
            />
            <span
              className="text-[9px] md:text-xs font-semibold text-center"
              style={{ color: '#0A0A14' }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}

      {onOpenMap && (
        <button
          onClick={onOpenMap}
          className="flex flex-col items-center gap-1 w-11 md:w-16 md:gap-1.5 py-2 px-1 md:py-3 md:px-1.5 mt-1 transition-all active:scale-95 hover:opacity-100"
          style={{ ...PILL_INACTIVE, opacity: 0.95 }}
          aria-label="Open map"
        >
          <Image
            src={mapIcon as IconSrc}
            alt=""
            width={44}
            height={44}
            className="w-6 h-6 md:w-10 md:h-10"
            style={ICON_DROP_SHADOW}
          />
          <span
            className="text-[9px] md:text-xs font-semibold text-center"
            style={{ color: '#0A0A14' }}
          >
            Map
          </span>
        </button>
      )}
    </nav>
  );
}
