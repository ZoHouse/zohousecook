import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useProfile } from '@zo/auth';
import { MeshGradient } from '@paper-design/shaders-react';

import { useMyXp } from '../../../hooks/useMyXp';
import { useQuestDetail } from '../../../hooks/useQuestDetail';
import { usePassportProfile } from '../../../hooks/usePassportProfile';
import { questDisplayTitle } from '../../../data/quests';
import { TopBar } from '../../../components/passport-lobby/TopBar';
import { MapModal } from '../../../components/passport-lobby/MapModal';
import { SettingsModal } from '../../../components/passport/SettingsModal';
import { rubikClassName, syneClassName } from '../../../components/utils/font';

/**
 * Single-quest deep-link surface — /passport/quests/<slug>.
 * Lets a citizen open a shareable quest URL directly without funneling
 * through the list page. Fetches via useQuestDetail (GET /quests/<slug>/)
 * and renders the same pearl-canon chrome as the rest of the passport.
 *
 * The detail payload has the same shape as a list item today, so this page
 * doesn't unlock new fields — it unlocks shareable URLs + future deep-link
 * traffic from IG bios, share quests, etc.
 */

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

export default function QuestDetailPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const { myXp } = useMyXp();
  const { profile: passportProfile } = usePassportProfile();

  const slug = typeof router.query.slug === 'string' ? router.query.slug : null;
  const { quest, isLoading, isNotFound } = useQuestDetail(slug);

  const [mapOpen, setMapOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handle = profile?.custom_nickname || profile?.nickname || 'Citizen';
  const avatarUrl = profile?.pfp_image || profile?.avatar?.image;
  const xpTotal = myXp?.xp ?? 0;
  const rank = myXp?.rank ?? 0;

  const title = quest ? questDisplayTitle(quest) : 'Quest';

  return (
    <>
      <Head>
        <title>{title} · Zo World</title>
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

          <main className="flex items-center justify-center min-h-[calc(100svh-120px)] px-6 py-12">
            <div className="text-center max-w-[520px] w-full">
              {isLoading && (
                <div className="animate-spin w-8 h-8 mx-auto border-2 border-black/20 border-t-black rounded-full" />
              )}

              {!isLoading && isNotFound && (
                <>
                  <div
                    className={syneClassName}
                    style={{ fontSize: 32, fontWeight: 700, color: '#2A1B3D', marginBottom: 12 }}
                  >
                    Quest not found
                  </div>
                  <p style={{ fontSize: 14, color: '#6B5B8E', lineHeight: 1.5 }}>
                    This quest might have expired, been claimed, or doesn&apos;t exist on your passport.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/passport/quests')}
                    className="mt-6 px-6 py-3 rounded-full bg-black text-white font-semibold text-sm"
                  >
                    Back to quests
                  </button>
                </>
              )}

              {!isLoading && !isNotFound && quest && (
                <>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#6B5B8E',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    {quest.category} Quest
                  </p>
                  <h1
                    className={syneClassName}
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: '#2A1B3D',
                      lineHeight: 1.1,
                      marginBottom: 16,
                    }}
                  >
                    {title}
                  </h1>
                  {quest.description ? (
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#4A3A6E',
                        lineHeight: 1.5,
                        marginBottom: 24,
                      }}
                    >
                      {quest.description}
                    </p>
                  ) : (
                    <p
                      style={{
                        fontSize: 13,
                        fontStyle: 'italic',
                        color: '#8B7BB0',
                        marginBottom: 24,
                      }}
                    >
                      {quest.destination?.name
                        ? `In ${quest.destination.name}`
                        : 'Details coming soon.'}
                    </p>
                  )}

                  {quest.inventory && (
                    <p style={{ fontSize: 12, color: '#6B5B8E', marginBottom: 8 }}>
                      Linked to <strong>{quest.inventory.name}</strong>
                    </p>
                  )}
                  {quest.operator && (
                    <p style={{ fontSize: 12, color: '#6B5B8E', marginBottom: 8 }}>
                      Hosted by <strong>{quest.operator.name}</strong>
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => router.push('/passport/quests')}
                    className="mt-6 px-6 py-3 rounded-full bg-black text-white font-semibold text-sm"
                  >
                    Back to quests
                  </button>
                </>
              )}
            </div>
          </main>
        </div>

        <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </>
  );
}
