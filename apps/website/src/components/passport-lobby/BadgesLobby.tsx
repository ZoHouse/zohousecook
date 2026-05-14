import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useProfile } from '@zo/auth';
import { MeshGradient } from '@paper-design/shaders-react';
import { toast } from 'sonner';
import { useMyXp } from '../../hooks/useMyXp';
import { usePassportProfile } from '../../hooks/usePassportProfile';
import { useSeason } from '../../hooks/useSeason';

import { TopBar } from './TopBar';
import { SeasonLevelBar } from './SeasonLevelBar';
import { LobbyRoom } from './LobbyRoom';
import { SideNavRail } from './SideNavRail';
import { MapModal } from './MapModal';
import { TravelersPill } from './TravelersPill';
import { UnlimitedAccessCta } from './UnlimitedAccessCta';
import { BagHero } from './BagHero';
import { StampsDock } from './StampsDock';
import { SettingsModal } from '../passport/SettingsModal';
import ShareModal from '../passport/ShareModal';

// Same iridescent pearl palette as PassportLobby — the badges page is the
// same room with a different object on the pedestal, so it must share the
// shell exactly.
const IRIDESCENT_PEARL_COLORS = [
  '#FBF8F4',
  '#F2E0EC',
  '#E6D9F2',
  '#FFFFFF',
  '#DCEDE8',
  '#F4E8D4',
  '#DBE6F2',
  '#FBF8F4',
];

/**
 * Owner view for /@{handle}/badges. Structurally identical to PassportLobby:
 *   - Same pearl iridescent mesh background
 *   - Same TopBar / SeasonLevelBar / SideNavRail / TravelersPill / MapModal
 *   - Same pedestal SVG, same CTA slot, same below-CTA slot
 * The only two swaps are the pedestal object (CitizenCard → BagHero) and the
 * below-CTA content (QuestsDock → StampsDock). CTA is a static Share button.
 */
export function BadgesLobby() {
  const router = useRouter();
  const { profile } = useProfile();
  const { myXp, isLoading: xpLoading } = useMyXp();
  const { profile: passportProfile } = usePassportProfile();
  const { season } = useSeason();

  const [mapOpen, setMapOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handle = profile?.custom_nickname || profile?.nickname || 'Citizen';
  const avatarUrl = profile?.pfp_image || profile?.avatar?.image;
  const xpTotal = myXp?.xp ?? 0;
  const rank = myXp?.rank ?? 0;

  useEffect(() => {
    if (router.query.settings === 'profile') {
      setSettingsOpen(true);
    }
  }, [router.query.settings]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/@${handle}/badges`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Badges link copied!'))
      .catch(() => {});
    setShareOpen(true);
  }, [handle]);

  if (!profile) return null;

  const earnedCount =
    (myXp?.destinationNames?.length ?? 0) +
    (myXp?.tripDestinations?.length ?? 0);

  return (
    <div
      className="min-h-[100svh] md:min-h-screen md:h-auto text-white relative"
      style={{
        background: '#FBF8F4',
        WebkitTapHighlightColor: 'transparent',
        overscrollBehavior: 'none',
        touchAction: 'manipulation',
      }}
    >
      {/* Iridescent pearl mesh — slow, lacquered, low-distortion. Cloned from
          PassportLobby so the room reads identical. */}
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <MeshGradient
          colors={IRIDESCENT_PEARL_COLORS}
          speed={0.12}
          scale={0.7}
          distortion={0.08}
          swirl={0.1}
          grainMixer={0.04}
          grainOverlay={0.03}
          fit="cover"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0) 0%, rgba(220,225,235,0.15) 75%, rgba(200,210,225,0.25) 100%)',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%)',
          zIndex: 0,
        }}
      />

      <div className="relative z-[1] mx-auto w-full flex flex-col md:block md:max-w-none md:px-0">
        <TopBar
          xp={xpTotal}
          rank={rank}
          avatarUrl={avatarUrl}
          onOpenSettings={() => setSettingsOpen(true)}
          streakCurrent={passportProfile?.streak?.current}
          streakFreezeTokens={passportProfile?.streak?.freeze_tokens}
        />

        {passportProfile?.season_level != null && (
          <div className="hidden md:block fixed top-6 left-6 w-[280px] z-[20]">
            <SeasonLevelBar
              level={passportProfile.season_level}
              xpInLevel={passportProfile.season_xp ?? 0}
              seasonKey={season?.key ?? 's1'}
              levelCurve={season?.level_curve}
              rankTitle={passportProfile.rank_title}
            />
          </div>
        )}

        <LobbyRoom
          sideNav={<SideNavRail onOpenMap={() => setMapOpen(true)} handle={handle} />}
          hero={<BagHero earnedCount={earnedCount} onShare={handleShare} />}
          travelersPill={<TravelersPill />}
          ctaMobile={<UnlimitedAccessCta size="sm" label="Share my stamps" onClick={handleShare} />}
          ctaDesktop={<UnlimitedAccessCta label="Share my stamps" onClick={handleShare} />}
          belowCta={<StampsDock myXp={myXp} isLoading={xpLoading} />}
        />
      </div>

      <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        handle={handle}
        avatarUrl={avatarUrl}
        displayName={handle}
      />
    </div>
  );
}
