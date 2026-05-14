import { useEffect, useRef, useState } from 'react';
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

export interface NavMenuPillProps {
  /** User's @handle — sub-page routes are /@{handle}/{page} */
  handle?: string;
  onOpenMap?: () => void;
}

type IconSrc = string | StaticImageData;

type NavItem = {
  label: string;
  icon: IconSrc;
  route: 'lobby' | 'quests' | 'badges' | 'earnings';
};

const NAV_ITEMS: NavItem[] = [
  { route: 'lobby', label: 'Lobby', icon: wifiIcon as IconSrc },
  { route: 'quests', label: 'Quests', icon: chestIcon as IconSrc },
  { route: 'badges', label: 'Badges', icon: shieldIcon as IconSrc },
  { route: 'earnings', label: 'Earn', icon: coinIcon as IconSrc },
];

function isActiveRoute(pathname: string, route: NavItem['route']): boolean {
  if (route === 'lobby') return pathname === '/passport';
  return pathname === `/passport/${route}`;
}

function buildHref(route: NavItem['route'], urlHandle?: string): string {
  if (route === 'lobby') return urlHandle ? `/@${urlHandle}` : '/passport';
  return urlHandle ? `/@${urlHandle}/${route}` : `/passport/${route}`;
}

const PILL: React.CSSProperties = {
  background: 'rgba(255,255,255,0.65)',
  border: '1px solid rgba(255,255,255,0.85)',
  borderRadius: 999,
  boxShadow:
    '0 4px 14px rgba(120,100,160,0.18), inset 0 1px 0 rgba(255,255,255,0.95)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

const PANEL: React.CSSProperties = {
  background: 'rgba(255,255,255,0.85)',
  border: '1px solid rgba(255,255,255,0.9)',
  borderRadius: 18,
  boxShadow:
    '0 12px 32px rgba(120,100,160,0.28), inset 0 1px 0 rgba(255,255,255,1)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
};

const ROW_INACTIVE: React.CSSProperties = {
  background: 'transparent',
};
const ROW_ACTIVE: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(242,224,236,0.65) 100%)',
};

const ICON_FILTER: React.CSSProperties = {
  filter: 'invert(1) brightness(0.85) drop-shadow(0 1px 2px rgba(120,100,160,0.25))',
};

export function NavMenuPill({ handle, onOpenMap }: NavMenuPillProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const urlHandle = handle?.replace(/\.zo$/i, '');

  const currentItem =
    NAV_ITEMS.find((item) => isActiveRoute(router.pathname, item.route)) ?? NAV_ITEMS[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${rubikClassName}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 pl-2.5 pr-3 py-1.5 md:pl-3 md:pr-4 md:py-2 transition-all active:scale-95"
        style={PILL}
      >
        <span
          aria-hidden
          className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8"
        >
          <StackIcon />
        </span>
        <span
          className="text-sm md:text-base font-bold"
          style={{ color: '#0A0A14' }}
        >
          {currentItem.label}
        </span>
        <span
          aria-hidden
          className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 transition-transform"
          style={{ color: '#0A0A14', transform: open ? 'rotate(180deg)' : undefined }}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-[220px] md:w-[240px] p-1.5 z-[30]"
          style={PANEL}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActiveRoute(router.pathname, item.route);
            return (
              <Link
                key={item.route}
                href={buildHref(item.route, urlHandle)}
                onClick={() => setOpen(false)}
                role="menuitem"
                aria-current={active ? 'page' : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={active ? ROW_ACTIVE : ROW_INACTIVE}
              >
                <Image
                  src={item.icon}
                  alt=""
                  width={28}
                  height={28}
                  className="w-6 h-6"
                  style={ICON_FILTER}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: '#0A0A14' }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {onOpenMap && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenMap();
              }}
              role="menuitem"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full text-left"
              style={ROW_INACTIVE}
            >
              <Image
                src={mapIcon as IconSrc}
                alt=""
                width={28}
                height={28}
                className="w-6 h-6"
                style={ICON_FILTER}
              />
              <span
                className="text-sm font-semibold"
                style={{ color: '#0A0A14' }}
              >
                Map
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" aria-hidden>
      <rect
        x="6"
        y="3"
        width="13"
        height="17"
        rx="2.5"
        transform="rotate(-8 12.5 11.5)"
        fill="#0A0A14"
        opacity="0.35"
      />
      <rect
        x="5"
        y="5"
        width="13"
        height="17"
        rx="2.5"
        transform="rotate(6 11.5 13.5)"
        fill="#0A0A14"
        opacity="0.95"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
