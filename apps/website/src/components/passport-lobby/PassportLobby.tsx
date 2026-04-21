import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useProfile } from '@zo/auth';
import { useMyXp } from '../../hooks/useMyXp';
import { useTodayQuests } from '../../hooks/useTodayQuests';
import useInstagramConnect from '../../hooks/useInstagramConnect';
import { toast } from 'sonner';

import { TopBar } from './TopBar';

const LobbyBackground3D = dynamic(
  () => import('./LobbyBackground3D').then((m) => m.LobbyBackground3D),
  { ssr: false },
);
import { LobbyRoom } from './LobbyRoom';
import { SideNavRail, type LobbyTab } from './SideNavRail';
import { MapModal } from './MapModal';
import { HeroStage } from './HeroStage';
import { NextMilestoneSign } from './NextMilestoneSign';
import { TravelersPill } from './TravelersPill';
import { PassesDock } from './PassesDock';
import { StubSection } from './StubSection';
import { TreasureChestCard } from './TreasureChestCard';
import { InstagramConnectModal } from './InstagramConnectModal';
import { BadgesSection } from './BadgesSection';
import { ProUpsellModal, type ProUpsellFeature } from '../pro';
import { SettingsModal } from '../passport/SettingsModal';
import ShareModal from '../passport/ShareModal';
import { useMyRoles } from '../../hooks/useMyRoles';

export function PassportLobby() {
  const { profile } = useProfile();
  const { myXp } = useMyXp();
  const ig = useInstagramConnect();
  const { roles, isLoading: rolesLoading } = useMyRoles();
  const { quests: todayQuests } = useTodayQuests();

  const [tab, setTab] = useState<LobbyTab>('lobby');
  const [upsell, setUpsell] = useState<ProUpsellFeature | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [igModalOpen, setIgModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [questsOpen, setQuestsOpen] = useState(false);

  if (!profile) return null;

  const handle = profile?.custom_nickname || profile?.nickname || 'Citizen';
  const avatarUrl = profile?.pfp_image || profile?.avatar?.image;
  const xpTotal = myXp?.xp ?? 0;
  const rankTitle = myXp?.rankTitle ?? 'Citizen';
  const rank = myXp?.rank ?? 0;

  const openUpsell = (f: ProUpsellFeature) => setUpsell(f);
  const closeUpsell = () => setUpsell(null);

  const handleTabChange = (next: LobbyTab) => {
    if (next === 'dailies') {
      setQuestsOpen(true);
      return;
    }
    setTab(next);
  };

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
        background: '#0a0a0a',
        // PWA polish: kill the grey tap flash on iOS, cancel rubber-band scroll, and
        // skip the 300ms double-tap-zoom delay so buttons feel native-responsive.
        WebkitTapHighlightColor: 'transparent',
        overscrollBehavior: 'none',
        touchAction: 'manipulation',
      }}
    >
      {/* 3D prism-cube background — fills viewport, sits behind all UI */}
      <LobbyBackground3D />


      {/* Mobile: fill viewport, no scroll. Desktop: full viewport immersive lobby. */}
      <div className="relative z-[1] mx-auto w-full h-full flex flex-col md:h-auto md:block md:max-w-none md:px-0">
        <TopBar xp={xpTotal} rank={rank} avatarUrl={avatarUrl} onOpenSettings={() => setSettingsOpen(true)} />

        {tab === 'lobby' ? (
          <LobbyRoom
            sideNav={<SideNavRail active={tab} onChange={handleTabChange} onOpenMap={() => setMapOpen(true)} />}
            hero={
              <HeroStage
                tier="free"
                citizenProps={{ handle, displayName: handle, avatarUrl, xpTotal, rankTitle, onShare: handleShare }}
                xpInLevel={0}
                xpLevelTotal={0}
                onUpsell={() => openUpsell('3d-avatar')}
              />
            }
            nextMilestone={<NextMilestoneSign />}
            travelersPill={<TravelersPill />}
          />
        ) : tab === 'dailies' ? (
          <StubSection feature="dailies" title="Dailies" onUpsell={openUpsell} />
        ) : (
          <BadgesSection roles={roles} rolesLoading={rolesLoading} myXp={myXp} profile={profile} onBack={() => setTab('lobby')} />
        )}

        <PassesDock onUpsell={openUpsell} />
      </div>

      <TreasureChestCard
        open={questsOpen}
        onClose={() => setQuestsOpen(false)}
        quests={todayQuests}
      />
      <ProUpsellModal feature={upsell} onClose={closeUpsell} />
      <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <InstagramConnectModal open={igModalOpen} onClose={() => setIgModalOpen(false)} onConnect={handleIgConnect} />
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} handle={handle} avatarUrl={avatarUrl} displayName={handle} />
    </div>
  );
}
