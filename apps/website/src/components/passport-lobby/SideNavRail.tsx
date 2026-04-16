export type LobbyTab = 'lobby' | 'dailies' | 'badges';

export interface SideNavRailProps {
  active: LobbyTab;
  onChange: (tab: LobbyTab) => void;
}

const ITEMS: Array<{ key: LobbyTab; label: string; icon: string }> = [
  { key: 'lobby', label: 'Lobby', icon: '📶' },
  { key: 'dailies', label: 'Dailies', icon: '🗺️' },
  { key: 'badges', label: 'Badges', icon: '🛡️' },
];

export function SideNavRail({ active, onChange }: SideNavRailProps) {
  return (
    <nav className="flex flex-col gap-5" aria-label="Lobby sections">
      {ITEMS.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`flex flex-col items-center gap-0.5 text-[9px] ${isActive ? 'text-white' : 'text-neutral-500'}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="text-lg" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
