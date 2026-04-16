import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import { rubikClassName } from '../utils/font';
import wifiIcon from '../../assets/passport-lobby/icons/wifi.svg';
import laundryIcon from '../../assets/passport-lobby/icons/laundry.png';
import shieldIcon from '../../assets/passport-lobby/icons/shield.svg';
import mapIcon from '../../assets/passport-lobby/icons/map.svg';

export type LobbyTab = 'lobby' | 'dailies' | 'badges';

export interface SideNavRailProps {
  active: LobbyTab;
  onChange: (tab: LobbyTab) => void;
  onOpenMap?: () => void;
}

type IconSrc = string | StaticImageData;

const TABS: Array<{ key: LobbyTab; label: string; icon: IconSrc }> = [
  { key: 'lobby', label: 'Lobby', icon: wifiIcon as IconSrc },
  { key: 'dailies', label: 'Dailies', icon: laundryIcon as IconSrc },
  { key: 'badges', label: 'Badges', icon: shieldIcon as IconSrc },
];

export function SideNavRail({ active, onChange, onOpenMap }: SideNavRailProps) {
  return (
    <nav
      className={`flex flex-col items-center ${rubikClassName}`}
      style={{ gap: 12, width: 44 }}
      aria-label="Lobby sections"
    >
      {TABS.map((item) => {
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

      {onOpenMap && (
        <button
          onClick={onOpenMap}
          className="flex flex-col items-center transition-all active:scale-95 hover:opacity-100"
          style={{
            gap: 4,
            opacity: 0.7,
            width: 44,
            marginTop: 4,
          }}
          aria-label="Open map"
        >
          <Image src={mapIcon as IconSrc} alt="" width={24} height={24} />
          <span style={{ fontSize: 9, fontWeight: 500, color: '#F5F5F5', textAlign: 'center' }}>
            Map
          </span>
        </button>
      )}
    </nav>
  );
}
