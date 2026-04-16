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
import { ProUpsellModal, type ProUpsellFeature } from '../pro';

export function PassportLobby() {
  const { profile } = useProfile();
  const { myXp } = useMyXp();

  const [tab, setTab] = useState<LobbyTab>('lobby');
  const [upsell, setUpsell] = useState<ProUpsellFeature | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

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
    <div className="min-h-screen bg-[#111111] text-white">
      <div className="max-w-[360px] mx-auto relative" style={{ background: '#111111', minHeight: '100vh' }}>
      <TopBar xp={xpTotal} rank={rank} avatarUrl={avatarUrl} />

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
        />
      ) : tab === 'dailies' ? (
        <StubSection feature="dailies" title="Dailies" onUpsell={openUpsell} />
      ) : (
        <StubSection feature="badges" title="Badges" onUpsell={openUpsell} />
      )}

      <PassesDock onUpsell={openUpsell} />
      <ProUpsellModal feature={upsell} onClose={closeUpsell} />
      <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
      </div>
    </div>
  );
}
