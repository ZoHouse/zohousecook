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

// Solid pills — the 3D canvas below has ChromaticAberration so any backdrop-blur
// picks up the aberrated colors and makes buttons look hazy. Solid bg sits cleanly
// above the canvas.
const PILL_INACTIVE: React.CSSProperties = {
  background: '#0d0d10',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
  boxShadow: '0 2px 12px rgba(0,0,0,0.45)',
};

const PILL_ACTIVE: React.CSSProperties = {
  ...PILL_INACTIVE,
  background: '#1a1a20',
  border: '1px solid rgba(255,255,255,0.22)',
  boxShadow: '0 2px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)',
};

const ICON_DROP_SHADOW: React.CSSProperties = {
  filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))',
};

const LABEL_TEXT_SHADOW = '0 1px 3px rgba(0,0,0,0.8)';

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
            style={{ ...(active ? PILL_ACTIVE : PILL_INACTIVE), opacity: active ? 1 : 0.82 }}
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
              className="text-[9px] md:text-xs font-medium text-center text-[#F5F5F5]"
              style={{ textShadow: LABEL_TEXT_SHADOW }}
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
          style={{ ...PILL_INACTIVE, opacity: 0.88 }}
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
            className="text-[9px] md:text-xs font-medium text-center text-[#F5F5F5]"
            style={{ textShadow: LABEL_TEXT_SHADOW }}
          >
            Map
          </span>
        </button>
      )}
    </nav>
  );
}
