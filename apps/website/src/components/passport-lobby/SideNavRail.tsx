import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import { rubikClassName } from '../utils/font';
import wifiIcon from '../../assets/passport-lobby/icons/wifi.svg';
import mapIcon from '../../assets/passport-lobby/icons/map.svg';
import shieldIcon from '../../assets/passport-lobby/icons/shield.svg';

export type LobbyTab = 'lobby' | 'dailies' | 'badges';

export interface SideNavRailProps {
  active: LobbyTab;
  onChange: (tab: LobbyTab) => void;
}

type IconSrc = string | StaticImageData;

const ITEMS: Array<{ key: LobbyTab; label: string; icon: IconSrc }> = [
  { key: 'lobby', label: 'Lobby', icon: wifiIcon as IconSrc },
  { key: 'dailies', label: 'Dailies', icon: mapIcon as IconSrc },
  { key: 'badges', label: 'Badges', icon: shieldIcon as IconSrc },
];

export function SideNavRail({ active, onChange }: SideNavRailProps) {
  return (
    <nav
      className={`flex flex-col items-center ${rubikClassName}`}
      style={{ gap: 12, width: 44 }}
      aria-label="Lobby sections"
    >
      {ITEMS.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className="flex flex-col items-center transition-opacity"
            style={{
              gap: 4,
              opacity: isActive ? 1.0 : 0.3,
              width: 44,
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            <Image src={item.icon} alt="" width={24} height={24} />
            <span style={{ fontSize: 9, fontWeight: 500, color: '#F5F5F5', textAlign: 'center' }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
