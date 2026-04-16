import { stampUrlFor } from '../../lib/passport/stampUrl';
import RoleBadge from '../passport/RoleBadge';
import { rubikClassName, syneClassName } from '../utils/font';
import type { UserRoleInfo } from '../../hooks/useMyRoles';
import type { MyXpData } from '../../hooks/useMyXp';
import { useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProfileData = Record<string, any>;

export interface BadgesSectionProps {
  roles: UserRoleInfo | null;
  rolesLoading: boolean;
  myXp: MyXpData | null;
  profile: ProfileData | null;
}

const BADGE_TYPES: Array<{ slug: string; type: 'creator' | 'tribebuilder' }> = [
  { slug: 'creator', type: 'creator' },
  { slug: 'tribemaker', type: 'tribebuilder' },
];

// ─── Country Achievement Cards (ported from dashboard/Achievements.tsx) ───
const COUNTRY_CARDS = [
  { id: 'india', name: 'India', src: 'https://proxy.cdn.zo.xyz/gallery/media/images/69a9f6b1-4525-407e-bf18-ba9b7135b6f8_20260402195357.gif', region: 'Asia', desc: 'Explored destinations across incredible India.' },
  { id: 'spain', name: 'Spain', src: 'https://proxy.cdn.zo.xyz/gallery/media/images/da7a6462-14cf-4cb8-800c-68e43c213361_20260402195357.gif', region: 'Europe', desc: 'Vibrant culture, tapas, and beaches across España.' },
  { id: 'france', name: 'France', src: 'https://proxy.cdn.zo.xyz/gallery/media/images/30d9e47f-9dbc-415e-a3ef-6466baaff9a7_20260402195358.gif', region: 'Europe', desc: 'Paris to Provence, the heart of France.' },
  { id: 'japan', name: 'Japan', src: 'https://proxy.cdn.zo.xyz/gallery/media/images/614b347d-304e-4e10-9853-b333963b9d2a_20260402195358.gif', region: 'Asia', desc: 'Ancient temples, neon cities, zen gardens.' },
  { id: 'russia', name: 'Russia', src: 'https://proxy.cdn.zo.xyz/gallery/media/images/69ef718c-2104-4325-bdc5-007035a11864_20260402195359.gif', region: 'Europe', desc: 'Moscow to Siberia — the world\'s largest country.' },
  { id: 'el-salvador', name: 'El Salvador', src: 'https://proxy.cdn.zo.xyz/gallery/media/images/52c22b1c-1938-45b7-82f2-1e0502942d01_20260402195359.gif', region: 'Americas', desc: 'Volcanoes, surf, and the first Bitcoin nation.' },
];

const TRIP_COUNTRY_MAP: Record<string, string> = {
  japan: 'japan', bali: 'india', nepal: 'india', bhutan: 'india',
};
const INDIA_KEYWORDS = [
  'spiti', 'ladakh', 'kashmir', 'kedarnath', 'sikkim', 'arunachal', 'meghalaya',
  'kerala', 'kareri', 'tirthan', 'mcleodganj', 'triund', 'darjeeling', 'chopta',
  'tungnath', 'chikkamagaluru', 'auli', 'yulla kanda',
];

function getUnlockedCountries(destinations: string[], trips: string[]): Set<string> {
  const countries = new Set<string>();
  if (destinations.length > 0) countries.add('india');
  for (const trip of trips) {
    const lower = trip.toLowerCase();
    for (const [kw, c] of Object.entries(TRIP_COUNTRY_MAP)) {
      if (lower.includes(kw)) countries.add(c);
    }
    if (INDIA_KEYWORDS.some((k) => lower.includes(k))) countries.add('india');
  }
  return countries;
}

// ─── Sub-components ───

function StampTile({ name }: { name: string }) {
  const url = stampUrlFor(name);
  const [failed, setFailed] = useState(false);
  return (
    <button className="flex flex-col items-center gap-1.5 transition-transform active:scale-95 w-full">
      <div
        className="w-full aspect-square flex items-center justify-center overflow-hidden"
        style={{
          borderRadius: 16,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {url && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} className="w-3/5 h-3/5 object-contain" onError={() => setFailed(true)} referrerPolicy="no-referrer" />
        ) : (
          <span className="text-xs text-white/60 text-center leading-tight px-2">{name}</span>
        )}
      </div>
      <span className="text-[10px] text-white/55 text-center leading-tight truncate w-full">{name}</span>
    </button>
  );
}

function StatCard({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <div
      className="flex-1 min-w-[70px] flex flex-col items-center justify-center gap-0.5 py-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}
    >
      <span className="text-base" aria-hidden>{icon}</span>
      <span className="text-white text-lg font-bold">{value}</span>
      <span className="text-[9px] text-white/45 uppercase tracking-wider font-medium">{label}</span>
    </div>
  );
}

function SectionHead({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">{title}</span>
      <span className="text-[9px] text-white/60 font-medium" style={{ padding: '1px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}>{count}</span>
    </div>
  );
}

/** Country achievement card — small bento tile, grayed when locked */
function CountryCard({
  card,
  isUnlocked,
  onTap,
}: {
  card: (typeof COUNTRY_CARDS)[0];
  isUnlocked: boolean;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className="relative overflow-hidden text-left transition-transform active:scale-95 flex-1 min-w-0"
      style={{
        aspectRatio: '3 / 4',
        borderRadius: 14,
        border: isUnlocked ? '1.5px solid rgba(167,217,33,0.35)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isUnlocked ? '0 4px 12px rgba(167,217,33,0.1)' : '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.src}
        alt={card.name}
        className={`w-full h-full object-cover ${isUnlocked ? '' : 'grayscale opacity-30'}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5">
        <p className="text-[9px] font-medium text-white truncate">{card.name}</p>
        {isUnlocked && <p className="text-[7px] text-[#A7D921] font-bold">Unlocked</p>}
      </div>
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm opacity-60">🔒</span>
        </div>
      )}
    </button>
  );
}

/** Country detail modal */
function CountryModal({
  card,
  isUnlocked,
  onClose,
}: {
  card: (typeof COUNTRY_CARDS)[0];
  isUnlocked: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
        <div className={`relative rounded-2xl overflow-hidden border-2 ${isUnlocked ? 'border-[#A7D921]/40' : 'border-white/10'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.src} alt={card.name} className={`w-full aspect-[3/4] object-cover ${isUnlocked ? '' : 'grayscale opacity-50'}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-black/50 border border-white/20 flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <span
              className="inline-block px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full mb-3"
              style={{
                color: isUnlocked ? '#A7D921' : 'rgba(255,255,255,0.5)',
                background: isUnlocked ? 'rgba(167,217,33,0.2)' : 'rgba(255,255,255,0.1)',
                border: `1px solid ${isUnlocked ? 'rgba(167,217,33,0.3)' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              {isUnlocked ? 'Unlocked' : 'Locked'}
            </span>
            <h2 className="text-xl font-bold text-white mb-1">{card.name}</h2>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">{card.region}</p>
            <p className="text-xs text-white/70 leading-relaxed">{card.desc}</p>
            {!isUnlocked && (
              <p className="text-[10px] text-white/40 mt-3 italic">Visit a Zostel or take a Zo Trip to {card.name} to unlock</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ───

export function BadgesSection({ roles, rolesLoading, myXp, profile }: BadgesSectionProps) {
  const [selectedCountry, setSelectedCountry] = useState<(typeof COUNTRY_CARDS)[0] | null>(null);

  const earnedBadges = roles ? BADGE_TYPES.filter((b) => roles.hasRole(b.slug)) : [];
  const allRoleNames = roles?.displayNames ?? [];

  const destinations = myXp?.destinationNames ?? [];
  const zostels = myXp?.zostelNames ?? [];
  const trips = myXp?.tripDestinations ?? [];

  const unlockedCountries = getUnlockedCountries(destinations, trips);

  const nationality = profile?.country?.name as string | undefined;
  const countryFlag = profile?.country?.flag as string | undefined;

  const stats = myXp?.stats;
  const hasStats = stats && (stats.destinations > 0 || stats.properties > 0 || stats.nights > 0 || stats.trips > 0);
  const hasAnything = earnedBadges.length > 0 || allRoleNames.length > 0 || destinations.length > 0 || zostels.length > 0 || trips.length > 0 || hasStats || !!nationality;

  return (
    <div className={`px-4 md:px-8 py-6 pb-36 md:pb-44 max-w-[600px] mx-auto ${rubikClassName}`}>
      <div className={`text-xl font-bold text-white mb-0.5 ${syneClassName}`}>Badges</div>
      <div className="text-[11px] text-white/40 mb-6">Earned through your journey in Zo World</div>

      {rolesLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full border-2 border-white/15 border-t-white" style={{ width: 24, height: 24 }} />
        </div>
      ) : !hasAnything ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-3" aria-hidden>🛡️</div>
          <div className="text-white/70 text-sm font-medium mb-1">No badges yet</div>
          <div className="text-white/40 text-xs max-w-[220px] mx-auto">Stay at Zostels, go on trips, and connect Instagram to start unlocking stamps.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Stat bento row */}
          {hasStats && (
            <div className="flex gap-2">
              {(stats.destinations > 0 || destinations.length > 0) && <StatCard value={Math.max(stats.destinations, destinations.length)} label="Cities" icon="🏙️" />}
              {stats.properties > 0 && <StatCard value={stats.properties} label="Nodes" icon="🏠" />}
              {stats.nights > 0 && <StatCard value={stats.nights} label="Nights" icon="🌙" />}
              {stats.trips > 0 && <StatCard value={stats.trips} label="Trips" icon="✈️" />}
            </div>
          )}

          {/* Countries — achievement cards from dashboard */}
          <div>
            <SectionHead title="Countries Unlocked" count={unlockedCountries.size} />
            <div className="grid grid-cols-3 gap-2">
              {COUNTRY_CARDS.map((card) => (
                <CountryCard
                  key={card.id}
                  card={card}
                  isUnlocked={unlockedCountries.has(card.id)}
                  onTap={() => setSelectedCountry(card)}
                />
              ))}
            </div>
            {nationality && (
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-white/50">
                {countryFlag && <span>{countryFlag}</span>}
                <span>Nationality: {nationality}</span>
              </div>
            )}
          </div>

          {/* Cities Unlocked */}
          {destinations.length > 0 && (
            <div>
              <SectionHead title="Cities Unlocked" count={destinations.length} />
              <div className="grid grid-cols-3 gap-3">{destinations.map((name, i) => <StampTile key={`d-${i}`} name={name} />)}</div>
            </div>
          )}

          {/* Nodes Unlocked */}
          {zostels.length > 0 && (
            <div>
              <SectionHead title="Nodes Unlocked" count={zostels.length} />
              <div className="grid grid-cols-3 gap-3">{zostels.map((name, i) => <StampTile key={`z-${i}`} name={name} />)}</div>
            </div>
          )}

          {/* Trip Destinations */}
          {trips.length > 0 && (
            <div>
              <SectionHead title="Trip Destinations" count={trips.length} />
              <div className="grid grid-cols-3 gap-3">{trips.map((name, i) => <StampTile key={`t-${i}`} name={name} />)}</div>
            </div>
          )}

          {/* Role badges */}
          {earnedBadges.length > 0 && (
            <div>
              <SectionHead title="Role Badges" count={earnedBadges.length} />
              <div className="flex flex-wrap gap-2">{earnedBadges.map((b) => <RoleBadge key={b.slug} type={b.type} />)}</div>
            </div>
          )}

          {/* Active roles */}
          {allRoleNames.length > 0 && (
            <div>
              <SectionHead title="Active Roles" count={allRoleNames.length} />
              <div className="flex flex-wrap gap-2">
                {allRoleNames.map((name) => (
                  <span key={name} className="text-[11px] font-medium text-white/75" style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>{name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedCountry && (
        <CountryModal
          card={selectedCountry}
          isUnlocked={unlockedCountries.has(selectedCountry.id)}
          onClose={() => setSelectedCountry(null)}
        />
      )}
    </div>
  );
}
