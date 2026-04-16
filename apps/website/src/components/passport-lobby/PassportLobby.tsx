import { useState } from 'react';
import { useProfile } from '@zo/auth';
import { useMyXp } from '../../hooks/useMyXp';

import { TopBar } from './TopBar';
import { LobbyRoom } from './LobbyRoom';
import { SideNavRail, type LobbyTab } from './SideNavRail';
import { MapWidget } from './MapWidget';
import { MapModal } from './MapModal';
import { HeroStage } from './HeroStage';
import { GhostVisitors } from './GhostVisitors';
import { NextMilestoneSign } from './NextMilestoneSign';
import { TravelersPill } from './TravelersPill';
import { PassesDock } from './PassesDock';
import { StubSection } from './StubSection';
import { ActiveQuestCard } from './ActiveQuestCard';
import { ProUpsellModal, type ProUpsellFeature } from '../pro';
import { SettingsModal } from '../passport/SettingsModal';

export function PassportLobby() {
  const { profile } = useProfile();
  const { myXp } = useMyXp();

  const [tab, setTab] = useState<LobbyTab>('lobby');
  const [upsell, setUpsell] = useState<ProUpsellFeature | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!profile) return null;

  const handle = profile?.custom_nickname || profile?.nickname || 'Citizen';
  const avatarUrl = profile?.pfp_image || profile?.avatar?.image;
  const xpTotal = myXp?.xp ?? 0;
  const rankTitle = myXp?.rankTitle ?? 'Citizen';
  const rank = myXp?.rank ?? 0;

  const openUpsell = (f: ProUpsellFeature) => setUpsell(f);
  const closeUpsell = () => setUpsell(null);

  const handleTabChange = (next: LobbyTab) => {
    if (next === 'dailies' || next === 'badges') {
      openUpsell(next);
      return;
    }
    setTab(next);
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

      {/* Wordmark — desktop only, top-left corner of the page */}
      <div
        aria-hidden
        className="hidden md:flex absolute top-6 left-8 z-20 items-center gap-3 pointer-events-none"
      >
        <span
          className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-bold"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.75)',
          }}
        >
          \z/
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-white text-base font-medium">Zo World</span>
          <span className="text-white/40 text-[11px]">Follow Your Heart</span>
        </div>
      </div>

      {/* Responsive content shell.
          Mobile: 360px column, edge-to-edge.
          md:    720px, wider breathing room.
          lg:    960px, full room spread. */}
      <div className="relative mx-auto w-full max-w-[360px] md:max-w-[760px] lg:max-w-[960px] md:px-6 md:py-6">
        <TopBar xp={xpTotal} rank={rank} avatarUrl={avatarUrl} onOpenSettings={() => setSettingsOpen(true)} />

        {tab === 'lobby' ? (
          <LobbyRoom
            mapWidget={<MapWidget onOpen={() => setMapOpen(true)} />}
            sideNav={<SideNavRail active={tab} onChange={handleTabChange} />}
            hero={
              <HeroStage
                tier="free"
                citizenProps={{ handle, displayName: handle, avatarUrl, xpTotal, rankTitle }}
                xpInLevel={0}
                xpLevelTotal={0}
                onUpsell={() => openUpsell('3d-avatar')}
              />
            }
            ghostVisitors={<GhostVisitors />}
            nextMilestone={<NextMilestoneSign />}
            travelersPill={<TravelersPill />}
            activeQuest={<ActiveQuestCard onTap={() => openUpsell('dailies')} />}
          />
        ) : tab === 'dailies' ? (
          <StubSection feature="dailies" title="Dailies" onUpsell={openUpsell} />
        ) : (
          <StubSection feature="badges" title="Badges" onUpsell={openUpsell} />
        )}

        <PassesDock onUpsell={openUpsell} />
      </div>

      <ProUpsellModal feature={upsell} onClose={closeUpsell} />
      <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
