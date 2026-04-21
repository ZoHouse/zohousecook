import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import { rubikClassName } from '../utils/font';
import wifiIcon from '../../assets/passport-lobby/icons/wifi.svg';
import shieldIcon from '../../assets/passport-lobby/icons/shield.svg';
import mapIcon from '../../assets/passport-lobby/icons/map.svg';
import chestIcon from '../../assets/passport-lobby/treasure-chest.png';

export type LobbyTab = 'lobby' | 'dailies' | 'badges';

export interface SideNavRailProps {
  active: LobbyTab;
  onChange: (tab: LobbyTab) => void;
  onOpenMap?: () => void;
}

type IconSrc = string | StaticImageData;

const TABS: Array<{ key: LobbyTab; label: string; icon: IconSrc }> = [
  { key: 'lobby', label: 'Lobby', icon: wifiIcon as IconSrc },
  { key: 'dailies', label: 'Quests', icon: chestIcon as IconSrc },
  { key: 'badges', label: 'Badges', icon: shieldIcon as IconSrc },
];

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

export function SideNavRail({ active, onChange, onOpenMap }: SideNavRailProps) {
  return (
    <nav
      className={`flex flex-col items-center w-11 gap-3 md:w-16 md:gap-4 ${rubikClassName}`}
      aria-label="Lobby sections"
    >
      {TABS.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className="flex flex-col items-center gap-1 w-11 md:w-16 md:gap-1.5 py-2 px-1 md:py-3 md:px-1.5 transition-all active:scale-95"
            style={{ ...(isActive ? PILL_ACTIVE : PILL_INACTIVE), opacity: isActive ? 1 : 0.82 }}
            aria-current={isActive ? 'page' : undefined}
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
          </button>
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
