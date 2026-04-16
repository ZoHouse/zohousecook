import { useCallback, useState } from 'react';
import { useProfile } from '@zo/auth';
import { useMyXp } from '../../hooks/useMyXp';
import useInstagramConnect from '../../hooks/useInstagramConnect';
import { toast } from 'sonner';

import { TopBar } from './TopBar';
import { LobbyRoom } from './LobbyRoom';
import { SideNavRail, type LobbyTab } from './SideNavRail';
import { MapModal } from './MapModal';
import { HeroStage } from './HeroStage';
import { GhostVisitors } from './GhostVisitors';
import { NextMilestoneSign } from './NextMilestoneSign';
import { TravelersPill } from './TravelersPill';
import { PassesDock } from './PassesDock';
import { StubSection } from './StubSection';
import { ActiveQuestCard } from './ActiveQuestCard';
import { InstagramConnectModal } from './InstagramConnectModal';
import { BadgesSection } from './BadgesSection';
import { ProUpsellModal, type ProUpsellFeature } from '../pro';
import { SettingsModal } from '../passport/SettingsModal';
import { useMyRoles } from '../../hooks/useMyRoles';

export function PassportLobby() {
  const { profile } = useProfile();
  const { myXp } = useMyXp();
  const ig = useInstagramConnect();
  const { roles, isLoading: rolesLoading } = useMyRoles();

  const [tab, setTab] = useState<LobbyTab>('lobby');
  const [upsell, setUpsell] = useState<ProUpsellFeature | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [igModalOpen, setIgModalOpen] = useState(false);

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
      openUpsell(next);
      return;
    }
    setTab(next);
  };

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/@${handle}`;
    const shareData = { title: `${handle} · Zo World`, text: 'Check out my Zo Passport', url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Profile link copied!');
    }
  }, [handle]);

  // Quest tap: if IG not connected → show IG connect modal. If connected → dailies upsell.
  const handleQuestTap = () => {
    if (!ig.isConnected) {
      setIgModalOpen(true);
      return;
    }
    openUpsell('dailies');
  };

  // IG modal "Connect" button → close modal + redirect to Meta OAuth.
  const handleIgConnect = () => {
    setIgModalOpen(false);
    ig.connect();
  };

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(167,217,33,0.06) 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,47,142,0.05) 0%, transparent 60%), #0a0a0a',
      }}
    >
      {/* Ambient decorative glow blobs — desktop only */}
      <div
        aria-hidden
        className="hidden md:block absolute pointer-events-none"
        style={{
          top: '10%',
          left: '5%',
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(128,0,255,0.16) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      <div
        aria-hidden
        className="hidden md:block absolute pointer-events-none"
        style={{
          bottom: '10%',
          right: '5%',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,47,142,0.14) 0%, transparent 70%)',
          filter: 'blur(110px)',
        }}
      />

      {/* Wordmark — desktop only, bottom-left */}
      <div
        aria-hidden
        className="hidden md:flex fixed bottom-6 left-6 z-20 items-center gap-3 pointer-events-none"
      >
        <span
          className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.75)',
          }}
        >
          \z/
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-white/80 text-sm font-medium">Zo World</span>
          <span className="text-white/35 text-[10px]">Follow Your Heart</span>
        </div>
      </div>

      {/* Mobile: 360px column. Desktop: full viewport immersive lobby. */}
      <div className="relative mx-auto w-full max-w-[360px] md:max-w-none md:px-0">
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
            ghostVisitors={<GhostVisitors />}
            nextMilestone={<NextMilestoneSign />}
            travelersPill={<TravelersPill />}
            activeQuest={<ActiveQuestCard onTap={handleQuestTap} />}
          />
        ) : tab === 'dailies' ? (
          <StubSection feature="dailies" title="Dailies" onUpsell={openUpsell} />
        ) : (
          <BadgesSection roles={roles} rolesLoading={rolesLoading} myXp={myXp} profile={profile} onBack={() => setTab('lobby')} />
        )}

        <PassesDock onUpsell={openUpsell} />
      </div>

      <ProUpsellModal feature={upsell} onClose={closeUpsell} />
      <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <InstagramConnectModal open={igModalOpen} onClose={() => setIgModalOpen(false)} onConnect={handleIgConnect} />
    </div>
  );
}
