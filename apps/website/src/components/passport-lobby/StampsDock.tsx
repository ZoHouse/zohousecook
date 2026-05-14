import { useMemo, useState } from 'react';
import { stampUrlFor } from '../../lib/passport/stampUrl';
import { rubikClassName } from '../utils/font';
import type { MyXpData } from '../../hooks/useMyXp';
import { StampDetailModal, type StampDetail, type StampLayer } from './StampDetailModal';

type TabKey = StampLayer;

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'city', label: 'Cities' },
  { key: 'trip', label: 'Trips' },
  { key: 'experience', label: 'Experiences' },
];

const EMPTY_COPY: Record<TabKey, { headline: string; nudge: string }> = {
  city: {
    headline: 'No city stamps yet',
    nudge: 'Stay at your first Zostel — every city earns a stamp.',
  },
  trip: {
    headline: 'No trip stamps yet',
    nudge: 'Pick a Zo Trip — every trip earns a stamp.',
  },
  experience: {
    headline: 'No experience stamps yet',
    nudge: 'Do more quests — attend a Zo event or festival to earn one.',
  },
};

function StampTile({
  name,
  onTap,
}: {
  name: string;
  onTap: () => void;
}) {
  const url = stampUrlFor(name);
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={onTap}
      className="shrink-0 flex flex-col items-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-[0.96]"
      style={{ width: 120 }}
      aria-label={`${name} stamp`}
    >
      <div
        className="w-full aspect-square flex items-center justify-center overflow-hidden"
        style={{
          borderRadius: 18,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(251,248,244,0.9) 50%, rgba(242,224,236,0.85) 100%)',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.9), 0 10px 22px rgba(120,100,160,0.18)',
        }}
      >
        {url && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            onError={() => setFailed(true)}
            referrerPolicy="no-referrer"
            style={{
              width: '72%',
              height: '72%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.18))',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(42,27,61,0.55)',
              textAlign: 'center',
              padding: '0 8px',
              lineHeight: 1.2,
            }}
          >
            {name}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#2A1B3D',
          textAlign: 'center',
          lineHeight: 1.2,
          maxWidth: 120,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
        }}
      >
        {name}
      </span>
    </button>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  const copy = EMPTY_COPY[tab];
  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 md:px-6">
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{
          padding: '24px 20px',
          borderRadius: 16,
          border: '1px dashed rgba(120,100,160,0.28)',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#2A1B3D',
            marginBottom: 4,
          }}
        >
          {copy.headline}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: '#6B5B8E',
            maxWidth: 280,
            lineHeight: 1.4,
          }}
        >
          {copy.nudge}
        </div>
      </div>
    </div>
  );
}

export interface StampsDockProps {
  myXp: MyXpData | null;
  isLoading: boolean;
}

/**
 * Tabbed (Cities / Trips / Experiences) horizontal carousel of earned stamps.
 * Replaces QuestsDock in the badges page. Earned-only — locked stamps don't
 * render in v1. Tap a stamp → StampDetailModal.
 */
export function StampsDock({ myXp, isLoading }: StampsDockProps) {
  const [tab, setTab] = useState<TabKey>('city');
  const [selected, setSelected] = useState<StampDetail | null>(null);

  // Stable references — myXp can be re-spread by useMyXp when leaderboard
  // resolves, so memoize on joined keys to avoid remounting the tile grid.
  const cityKey = (myXp?.destinationNames ?? []).join('|');
  const tripKey = (myXp?.tripDestinations ?? []).join('|');

  const cities = useMemo(
    () => myXp?.destinationNames ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cityKey],
  );
  const trips = useMemo(
    () => myXp?.tripDestinations ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tripKey],
  );
  // Experiences have no earning source wired in v1 — see design doc.
  const experiences: string[] = useMemo(() => [], []);

  const counts: Record<TabKey, number> = {
    city: cities.length,
    trip: trips.length,
    experience: experiences.length,
  };

  const activeNames =
    tab === 'city' ? cities : tab === 'trip' ? trips : experiences;

  return (
    <div
      aria-label="Stamps"
      className={`${rubikClassName} w-full max-w-[1200px] mx-auto`}
    >
      {/* Tab strip — same vibe as the lobby chip palette. */}
      <div
        role="tablist"
        aria-label="Stamp layers"
        className="flex justify-center gap-2 px-3 md:px-6 mb-4"
      >
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setTab(t.key)}
              className="inline-flex items-center gap-2 transition-all active:scale-[0.97]"
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: active ? '#0A0A14' : '#6B5B8E',
                background: active
                  ? 'linear-gradient(135deg, #FFFFFF 0%, #F2E0EC 35%, #DBE6F2 70%, #DCEDE8 100%)'
                  : 'rgba(255,255,255,0.55)',
                border: active
                  ? '1px solid rgba(255,255,255,0.95)'
                  : '1px solid rgba(120,100,160,0.18)',
                boxShadow: active
                  ? '0 6px 18px rgba(120,100,160,0.25), inset 0 1px 0 rgba(255,255,255,0.95)'
                  : 'none',
                backdropFilter: active ? undefined : 'blur(8px)',
                WebkitBackdropFilter: active ? undefined : 'blur(8px)',
              }}
            >
              {t.label}
              <span
                aria-hidden
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 999,
                  color: active ? '#2A1B3D' : '#9A8FB8',
                  background: active
                    ? 'rgba(42,27,61,0.08)'
                    : 'rgba(120,100,160,0.1)',
                }}
              >
                {counts[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active tab body */}
      {isLoading ? (
        <div className="w-full max-w-[1200px] mx-auto px-3 md:px-6 flex items-center justify-center" style={{ height: 168 }}>
          <div className="animate-spin rounded-full border-2 border-[#6B5B8E]/30 border-t-[#6B5B8E]" style={{ width: 24, height: 24 }} />
        </div>
      ) : activeNames.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div
          className="flex gap-3 overflow-x-auto px-3 md:px-6 pb-2"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {activeNames.map((name, i) => (
            <StampTile
              key={`${tab}-${i}-${name}`}
              name={name}
              onTap={() => setSelected({ name, layer: tab })}
            />
          ))}
        </div>
      )}

      <StampDetailModal stamp={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
