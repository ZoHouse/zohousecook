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
import { MapModal } from './MapModal';
import { TravelersPill } from './TravelersPill';
import { UnlimitedAccessCta } from './UnlimitedAccessCta';
import { BagModel3D } from './BagModel3D';
import { StampsDock } from './StampsDock';
import { SettingsModal } from '../passport/SettingsModal';
import ShareModal from '../passport/ShareModal';

// Hologram-pearl palette — chromatic iridescent shift (lavender → mint →
// peach → cyan → magenta) tuned for the badges room. Pulls more saturation
// than PassportLobby's pearl since the bag pedestal reads as a foil object.
const IRIDESCENT_PEARL_COLORS = [
  '#9D7CFF',
  '#5FE3C0',
  '#FFB07A',
  '#7AB8FF',
  '#FF7ACF',
  '#C8FF7A',
  '#B07AFF',
  '#FFD060',
];

/**
 * Owner view for /@{handle}/badges. Structurally identical to PassportLobby:
 *   - Same pearl iridescent mesh background
 *   - Same TopBar / SeasonLevelBar / TravelersPill / MapModal
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

  return (
    <div
      className="min-h-[100svh] md:min-h-screen md:h-auto text-white relative"
      style={{
        background: '#B89DFF',
        WebkitTapHighlightColor: 'transparent',
        overscrollBehavior: 'none',
        touchAction: 'manipulation',
      }}
    >
      {/* Iridescent hologram mesh — full chromatic foil, no pearl wash. */}
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <MeshGradient
          colors={IRIDESCENT_PEARL_COLORS}
          speed={0.32}
          scale={0.45}
          distortion={0.4}
          swirl={0.5}
          grainMixer={0.08}
          grainOverlay={0.06}
          fit="cover"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0) 0%, rgba(120,80,200,0.12) 70%, rgba(80,40,160,0.22) 100%)',
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
          handle={handle}
          onOpenMap={() => setMapOpen(true)}
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
          hero={
            <BagModel3D
              stamps={[
                ...(myXp?.destinationNames ?? []),
                ...(myXp?.tripDestinations ?? []),
              ]}
            />
          }
          travelersPill={<TravelersPill />}
          ctaMobile={
            <div className="mt-2">
              <UnlimitedAccessCta size="sm" label="Share my stamps" onClick={handleShare} />
            </div>
          }
          ctaDesktop={
            <div className="mt-2">
              <UnlimitedAccessCta label="Share my stamps" onClick={handleShare} />
            </div>
          }
          belowCta={
            <div className="pt-6 md:pt-8">
              <StampsDock myXp={myXp} isLoading={xpLoading} handle={handle} />
            </div>
          }
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
