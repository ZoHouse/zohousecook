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

/** Compact stamp tile — 56×56 on mobile, slightly larger on desktop */
function StampTile({ name }: { name: string }) {
  const url = stampUrlFor(name);
  const [failed, setFailed] = useState(false);

  return (
    <div
      className="flex flex-col items-center gap-1"
      style={{ width: 64 }}
    >
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {url && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={name}
            className="w-10 h-10 object-contain"
            onError={() => setFailed(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-[10px] text-white/60 text-center leading-tight px-1">
            {name.slice(0, 8)}
          </span>
        )}
      </div>
      <span className="text-[9px] text-white/50 text-center leading-tight truncate w-full">
        {name}
      </span>
    </div>
  );
}

/** Stat bento card — compact glass tile showing a number + label */
function StatCard({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <div
      className="flex-1 min-w-[90px] flex flex-col items-center justify-center gap-1 py-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
      }}
    >
      <span className="text-lg" aria-hidden>{icon}</span>
      <span className="text-white text-xl font-bold">{value}</span>
      <span className="text-[10px] text-white/45 uppercase tracking-wider font-medium">{label}</span>
    </div>
  );
}

/** Section header with count chip */
function SectionHead({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">{title}</span>
      <span
        className="text-[9px] text-white/60 font-medium"
        style={{
          padding: '1px 7px',
          borderRadius: 99,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {count}
      </span>
    </div>
  );
}

/** Culture / country pill */
function CultureTile({ name, icon }: { name: string; icon?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/80"
      style={{
        padding: '5px 12px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {icon && <span>{icon}</span>}
      {name}
    </span>
  );
}

export function BadgesSection({ roles, rolesLoading, myXp, profile }: BadgesSectionProps) {
  const earnedBadges = roles
    ? BADGE_TYPES.filter((b) => roles.hasRole(b.slug))
    : [];
  const allRoleNames = roles?.displayNames ?? [];

  const destinations = myXp?.destinationNames ?? [];
  const zostels = myXp?.zostelNames ?? [];
  const trips = myXp?.tripDestinations ?? [];

  // Country from profile
  const nationality = profile?.country?.name as string | undefined;
  const countryFlag = profile?.country?.flag as string | undefined;

  const stats = myXp?.stats;
  const hasStats = stats && (stats.destinations > 0 || stats.properties > 0 || stats.nights > 0 || stats.trips > 0);
  const hasAnything = earnedBadges.length > 0 || allRoleNames.length > 0 || destinations.length > 0 || zostels.length > 0 || trips.length > 0 || hasStats || !!nationality;

  return (
    <div className={`px-4 md:px-8 py-6 max-w-[600px] mx-auto ${rubikClassName}`}>
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
              {(stats.destinations > 0 || destinations.length > 0) && (
                <StatCard value={Math.max(stats.destinations, destinations.length)} label="Cities" icon="🏙️" />
              )}
              {stats.properties > 0 && <StatCard value={stats.properties} label="Nodes" icon="🏠" />}
              {stats.nights > 0 && <StatCard value={stats.nights} label="Nights" icon="🌙" />}
              {stats.trips > 0 && <StatCard value={stats.trips} label="Trips" icon="✈️" />}
            </div>
          )}

          {/* Countries Unlocked */}
          {nationality && (
            <div>
              <SectionHead title="Countries Unlocked" count={1} />
              <div className="flex flex-wrap gap-2">
                <CultureTile name={nationality} icon={countryFlag} />
              </div>
            </div>
          )}

          {/* Cities Unlocked */}
          {destinations.length > 0 && (
            <div>
              <SectionHead title="Cities Unlocked" count={destinations.length} />
              <div className="flex flex-wrap gap-3">
                {destinations.map((name, i) => <StampTile key={`dest-${i}`} name={name} />)}
              </div>
            </div>
          )}

          {/* Nodes Unlocked (Zostels stayed at) */}
          {zostels.length > 0 && (
            <div>
              <SectionHead title="Nodes Unlocked" count={zostels.length} />
              <div className="flex flex-wrap gap-3">
                {zostels.map((name, i) => <StampTile key={`zos-${i}`} name={name} />)}
              </div>
            </div>
          )}

          {/* Trip Destinations */}
          {trips.length > 0 && (
            <div>
              <SectionHead title="Trip Destinations" count={trips.length} />
              <div className="flex flex-wrap gap-3">
                {trips.map((name, i) => <StampTile key={`trip-${i}`} name={name} />)}
              </div>
            </div>
          )}

          {/* Role badges */}
          {earnedBadges.length > 0 && (
            <div>
              <SectionHead title="Role Badges" count={earnedBadges.length} />
              <div className="flex flex-wrap gap-2">
                {earnedBadges.map((b) => <RoleBadge key={b.slug} type={b.type} />)}
              </div>
            </div>
          )}

          {/* Active roles as pills */}
          {allRoleNames.length > 0 && (
            <div>
              <SectionHead title="Active Roles" count={allRoleNames.length} />
              <div className="flex flex-wrap gap-2">
                {allRoleNames.map((name) => (
                  <span
                    key={name}
                    className="text-[11px] font-medium text-white/75"
                    style={{
                      padding: '4px 12px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
