import StampsGrid from '../passport/StampsGrid';
import RoleBadge from '../passport/RoleBadge';
import { rubikClassName, syneClassName } from '../utils/font';
import type { UserRoleInfo } from '../../hooks/useMyRoles';
import type { MyXpData } from '../../hooks/useMyXp';

export interface BadgesSectionProps {
  roles: UserRoleInfo | null;
  rolesLoading: boolean;
  myXp: MyXpData | null;
}

const BADGE_TYPES: Array<{ slug: string; type: 'creator' | 'tribebuilder' }> = [
  { slug: 'creator', type: 'creator' },
  { slug: 'tribemaker', type: 'tribebuilder' },
];

export function BadgesSection({ roles, rolesLoading, myXp }: BadgesSectionProps) {
  const earnedBadges = roles
    ? BADGE_TYPES.filter((b) => roles.hasRole(b.slug))
    : [];

  const allRoleNames = roles?.displayNames ?? [];

  // Destination stamps (cities unlocked) — from useMyXp().destinationNames
  const destinationStamps = (myXp?.destinationNames ?? []).map((name) => ({ name }));

  // Zostel property stamps (properties stayed at)
  const zostelStamps = (myXp?.zostelNames ?? []).map((name) => ({ name }));

  // Trip destinations
  const tripStamps = (myXp?.tripDestinations ?? []).map((name) => ({ name }));

  const hasAnything =
    earnedBadges.length > 0 ||
    allRoleNames.length > 0 ||
    destinationStamps.length > 0 ||
    zostelStamps.length > 0 ||
    tripStamps.length > 0;

  return (
    <div className={`px-6 py-8 min-h-[400px] ${rubikClassName}`}>
      <div className={`text-2xl font-bold text-white mb-1 ${syneClassName}`}>
        Badges
      </div>
      <div className="text-xs text-white/45 mb-8">
        Earned through your journey in Zo World
      </div>

      {rolesLoading ? (
        <div className="flex items-center justify-center py-16">
          <div
            className="animate-spin rounded-full border-2 border-white/15 border-t-white"
            style={{ width: 24, height: 24 }}
          />
        </div>
      ) : !hasAnything ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-4" aria-hidden>🛡️</div>
          <div className="text-white/70 text-sm font-medium mb-1">
            No badges yet
          </div>
          <div className="text-white/40 text-xs max-w-[240px] mx-auto">
            Stay at Zostels, go on trips, and connect Instagram to start unlocking stamps and badges.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Cities unlocked — destination stamps */}
          {destinationStamps.length > 0 && (
            <StampsGrid
              stamps={destinationStamps}
              heading={`Cities Unlocked · ${destinationStamps.length}`}
            />
          )}

          {/* Properties stayed at */}
          {zostelStamps.length > 0 && (
            <StampsGrid
              stamps={zostelStamps}
              heading={`Zostels Stayed · ${zostelStamps.length}`}
            />
          )}

          {/* Trip destinations */}
          {tripStamps.length > 0 && (
            <StampsGrid
              stamps={tripStamps}
              heading={`Trip Destinations · ${tripStamps.length}`}
            />
          )}

          {/* Role badges */}
          {earnedBadges.length > 0 && (
            <div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest font-medium mb-3">
                Role Badges
              </div>
              <div className="flex flex-wrap gap-3">
                {earnedBadges.map((b) => (
                  <RoleBadge key={b.slug} type={b.type} />
                ))}
              </div>
            </div>
          )}

          {/* All active roles as text pills */}
          {allRoleNames.length > 0 && (
            <div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest font-medium mb-3">
                Active Roles
              </div>
              <div className="flex flex-wrap gap-2">
                {allRoleNames.map((name) => (
                  <span
                    key={name}
                    className="text-xs font-medium text-white/80"
                    style={{
                      padding: '5px 14px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
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
