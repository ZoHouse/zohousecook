import Head from 'next/head';
import { useState } from 'react';
import { useProfile } from '@zo/auth';
import { MeshGradient } from '@paper-design/shaders-react';

import { useMyXp } from '../../hooks/useMyXp';
import { usePassportProfile } from '../../hooks/usePassportProfile';
import { TopBar } from '../../components/passport-lobby/TopBar';
import { MapModal } from '../../components/passport-lobby/MapModal';
import { SettingsModal } from '../../components/passport/SettingsModal';
import { rubikClassName, syneClassName } from '../../components/utils/font';

// Same iridescent pearl as the rest of the passport canon — keeps the
// coming-soon surface visually consistent with /, /badges, /quests.
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
 * /@{handle}/earnings — placeholder until the real earnings surface ships.
 * Routed via next.config rewrite (/@:handle/earnings → /passport/earnings).
 * Top-nav (RankPill + NavMenuPill) handles all navigation so the citizen
 * can leave the page without needing a back button here.
 */
export default function EarningsPage() {
  const { profile } = useProfile();
  const { myXp } = useMyXp();
  const { profile: passportProfile } = usePassportProfile();

  const [mapOpen, setMapOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handle = profile?.custom_nickname || profile?.nickname || 'Citizen';
  const avatarUrl = profile?.pfp_image || profile?.avatar?.image;
  const xpTotal = myXp?.xp ?? 0;
  const rank = myXp?.rank ?? 0;

  return (
    <>
      <Head>
        <title>Earnings · Zo World</title>
      </Head>

      <div
        className={`min-h-[100svh] md:min-h-screen md:h-auto text-white relative ${rubikClassName}`}
        style={{
          background: '#FBF8F4',
          WebkitTapHighlightColor: 'transparent',
          overscrollBehavior: 'none',
          touchAction: 'manipulation',
        }}
      >
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

        <div className="relative z-[1] mx-auto w-full">
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

          <main className="flex items-center justify-center min-h-[calc(100svh-120px)] px-6">
            <div className="text-center max-w-[420px]">
              <div
                className={syneClassName}
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: '#2A1B3D',
                  lineHeight: 1.05,
                  marginBottom: 12,
                }}
              >
                Coming soon
              </div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#6B5B8E',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Earnings will surface here when the next chapter ships.
              </p>
            </div>
          </main>
        </div>

        <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </>
  );
}
