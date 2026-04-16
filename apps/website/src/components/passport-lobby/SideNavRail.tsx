export type LobbyTab = 'lobby' | 'dailies' | 'badges';

export interface SideNavRailProps {
  active: LobbyTab;
  onChange: (tab: LobbyTab) => void;
}

function WifiIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#666'} strokeWidth="2" strokeLinecap="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" fill={active ? '#fff' : '#666'} />
    </svg>
  );
}

function DailiesIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#666'} strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function BadgesIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#666'} strokeWidth="2" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

const ITEMS: Array<{ key: LobbyTab; label: string; Icon: React.FC<{ active: boolean }> }> = [
  { key: 'lobby', label: 'Lobby', Icon: WifiIcon },
  { key: 'dailies', label: 'Dailies', Icon: DailiesIcon },
  { key: 'badges', label: 'Badges', Icon: BadgesIcon },
];

export function SideNavRail({ active, onChange }: SideNavRailProps) {
  return (
    <nav className="flex flex-col items-center gap-6" aria-label="Lobby sections">
      {ITEMS.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`flex flex-col items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-60'}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.Icon active={isActive} />
            <span className={`text-[8px] tracking-wide ${isActive ? 'text-white' : 'text-neutral-500'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
