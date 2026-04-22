import { useCallback, useState } from 'react';
import { useProfile } from '@zo/auth';
import { MeshGradient } from '@paper-design/shaders-react';
import { useMyXp } from '../../hooks/useMyXp';
import { usePassportProfile } from '../../hooks/usePassportProfile';
import { useSeason } from '../../hooks/useSeason';
import useInstagramConnect from '../../hooks/useInstagramConnect';
import { toast } from 'sonner';

import { TopBar } from './TopBar';
import { SeasonLevelBar } from './SeasonLevelBar';

import { LobbyRoom } from './LobbyRoom';
import { SideNavRail } from './SideNavRail';
import { MapModal } from './MapModal';
import { HeroStage } from './HeroStage';
import { TravelersPill } from './TravelersPill';
import { PassesDock } from './PassesDock';
import { InstagramConnectModal } from './InstagramConnectModal';
import { ProUpsellModal, type ProUpsellFeature } from '../pro';
import { SettingsModal } from '../passport/SettingsModal';
import ShareModal from '../passport/ShareModal';

// Jet black + rare gold glint. Seven near-blacks and one muted bronze —
// dimmed from bright gold so it reads as a subtle catch of light rather than
// a visible accent. Motion kept extremely slow so the gold surfaces infrequently.
const JET_BLACK_GOLD_COLORS = [
  '#000000',
  '#060503',
  '#0A0805',
  '#8A6D2E', // muted bronze glint (was #C89A3C — too bright)
  '#0C0A06',
  '#050402',
  '#020201',
  '#000000',
];

export function PassportLobby() {
  const { profile } = useProfile();
  const { myXp } = useMyXp();
  const ig = useInstagramConnect();
  const { profile: passportProfile } = usePassportProfile();
  const { season } = useSeason();

  const [upsell, setUpsell] = useState<ProUpsellFeature | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [igModalOpen, setIgModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  if (!profile) return null;

  const handle = profile?.custom_nickname || profile?.nickname || 'Citizen';
  const avatarUrl = profile?.pfp_image || profile?.avatar?.image;
  const xpTotal = myXp?.xp ?? 0;
  const rankTitle = myXp?.rankTitle ?? 'Citizen';
  const rank = myXp?.rank ?? 0;

  const openUpsell = (f: ProUpsellFeature) => setUpsell(f);
  const closeUpsell = () => setUpsell(null);

  const handleShare = useCallback(() => {
    // Copy link + open the full share modal (IG story, X, copy link etc)
    const url = `${window.location.origin}/@${handle}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Profile link copied!')).catch(() => {});
    setShareOpen(true);
  }, [handle]);

  // IG modal "Connect" button → close modal + redirect to Meta OAuth.
  const handleIgConnect = () => {
    setIgModalOpen(false);
    ig.connect();
  };

  return (
    <div
      className="h-[100svh] md:min-h-screen md:h-auto overflow-hidden md:overflow-visible text-white relative"
      style={{
        // Fallback solid — the shader paints on top but this keeps the initial
        // render + out-of-bounds areas jet black. Hairline tint, not pure #000.
        background: '#050505',
        // PWA polish: kill the grey tap flash on iOS, cancel rubber-band scroll, and
        // skip the 300ms double-tap-zoom delay so buttons feel native-responsive.
        WebkitTapHighlightColor: 'transparent',
        overscrollBehavior: 'none',
        touchAction: 'manipulation',
      }}
    >
      {/* Jet-black + gold mesh shader — quiet luxury ambient. Sits behind every
          UI layer (z-0 implicit). Edge vignette pushes the gold toward the
          corners so the centre stays dark for the hero card + pedestal. */}
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <MeshGradient
          colors={JET_BLACK_GOLD_COLORS}
          speed={0.18}
          scale={0.6}
          distortion={0.1}
          swirl={0.15}
          grainMixer={0.02}
          grainOverlay={0}
          fit="cover"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {/* Heavier vignette — pushes black over most of the frame so the gold
          only hints at the corners. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,0.96) 100%)',
          zIndex: 0,
        }}
      />

      {/* Mobile: fill viewport, no scroll. Desktop: full viewport immersive lobby. */}
      <div className="relative z-[1] mx-auto w-full h-full flex flex-col md:h-auto md:block md:max-w-none md:px-0">
        <TopBar
          xp={xpTotal}
          rank={rank}
          avatarUrl={avatarUrl}
          onOpenSettings={() => setSettingsOpen(true)}
          streakCurrent={passportProfile?.streak?.current}
          streakFreezeTokens={passportProfile?.streak?.freeze_tokens}
        />

        {/* Season XP meter (L1-L100). Desktop only — mobile copy lives inside
            PassesDock's mobileTopSlot so it stacks flush above the tier cards.
            Hidden on prod until Daya ships v2 (season_level is null in v1 shape). */}
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
          hero={
            <HeroStage
              tier="free"
              citizenProps={{ handle, displayName: handle, avatarUrl, xpTotal, rankTitle, onShare: handleShare }}
              xpInLevel={0}
              xpLevelTotal={0}
              onUpsell={() => openUpsell('3d-avatar')}
            />
          }
          travelersPill={<TravelersPill />}
        />

        <PassesDock
          onUpsell={openUpsell}
          mobileTopSlot={
            passportProfile?.season_level != null ? (
              <SeasonLevelBar
                level={passportProfile.season_level}
                xpInLevel={passportProfile.season_xp ?? 0}
                seasonKey={season?.key ?? 's1'}
                levelCurve={season?.level_curve}
                rankTitle={passportProfile.rank_title}
              />
            ) : undefined
          }
        />
      </div>

      <ProUpsellModal feature={upsell} onClose={closeUpsell} />
      <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <InstagramConnectModal open={igModalOpen} onClose={() => setIgModalOpen(false)} onConnect={handleIgConnect} />
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} handle={handle} avatarUrl={avatarUrl} displayName={handle} />
    </div>
  );
}
