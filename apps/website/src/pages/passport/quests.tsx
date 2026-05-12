import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useProfile } from '@zo/auth';
import { Warp } from '@paper-design/shaders-react';
import { SideNavRail } from '../../components/passport-lobby/SideNavRail';
import { MapModal } from '../../components/passport-lobby/MapModal';
import {
  QuestFullView,
  QuestListCard,
  useActiveQuests,
  type DockQuest,
} from '../../components/passport-lobby/QuestsDock';
import { distanceMeters, useLiveLocation } from '../../components/LiveLocationProvider';
import { TopBar } from '../../components/passport-lobby/TopBar';
import { PageHeaderPill } from '../../components/passport-lobby/PageHeaderPill';
import { useMyXp } from '../../hooks/useMyXp';
import { isGeomediaQuest } from '../../data/mock-quests';
import chestIcon from '../../assets/passport-lobby/treasure-chest.png';

/**
 * Quests page — /@{handle}/quests. Same pearl-iridescent quest cards as the
 * lobby dock (cover / title / description / location · distance / XP reward),
 * stacked full-width. Click a card → inline detail panel + action button.
 * Today's Loot banner shows when a drop is imminent (<24h).
 */

const TEXT_MUTED = '#9CA3AF';

// Treasure Warp palette — black void through amber/gold.
const WARP_COLORS = [
  '#060300',
  '#1A0E02',
  '#3B2102',
  '#7A4A09',
  '#C17D14',
  '#FFC73A',
  '#FFE79E',
  '#1A0E02',
];

// ────────────────────────────────────────────────────────────────────────────
// Today's Loot — top-of-page promo banner. Independent of the quest list.
// ────────────────────────────────────────────────────────────────────────────

interface LootDrop {
  title: string;
  bountyLine: string;
  earnLine: string;
  opens_at: string;
}

const SAMPLE_LOOT: LootDrop = {
  title: 'Free Bed',
  bountyLine: 'Bounties worth Rs 7k',
  earnLine: 'Earn upto Rs. 2,000',
  opens_at: new Date(Date.now() + (8 * 60 + 6) * 60 * 1000 + 12_000).toISOString(),
};

function isLootImminent(opens_at: string): boolean {
  const ms = new Date(opens_at).getTime() - Date.now();
  return Number.isFinite(ms) && ms > 0 && ms < 24 * 60 * 60 * 1000;
}

/** Live HH:MM:SS countdown. */
function useCountdown(iso: string): string {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return '-- : -- : --';
  const ms = new Date(iso).getTime() - now;
  if (Number.isNaN(ms) || ms <= 0) return '00 : 00 : 00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)} : ${pad(m)} : ${pad(s)}`;
}

function TodaysLootCard({ loot, onPlay }: { loot: LootDrop; onPlay: () => void }) {
  const countdown = useCountdown(loot.opens_at);
  return (
    <button
      type="button"
      onClick={onPlay}
      className="relative w-full text-left rounded-[28px] overflow-hidden transition-transform active:scale-[0.99]"
      style={{
        background: 'linear-gradient(135deg, #F5B13A 0%, #E89515 55%, #C97A0A 100%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.2), 0 12px 32px rgba(0,0,0,0.45)',
        padding: '20px 24px',
      }}
    >
      <div aria-hidden className="absolute top-3 right-[42%] text-[14px]" style={{ opacity: 0.55 }}>✦</div>
      <div aria-hidden className="absolute top-6 right-[36%] text-[10px]" style={{ opacity: 0.45 }}>✦</div>
      <div className="flex items-center gap-5">
        <div className="flex-shrink-0" style={{ width: 88, height: 88 }}>
          <Image src={chestIcon} alt="" width={88} height={88} style={{ width: 88, height: 88, objectFit: 'contain' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: 'rgba(0,0,0,0.55)' }}>
            Today's Loot
          </div>
          <div className="text-[17px] md:text-[18px] font-bold leading-tight mb-0.5" style={{ color: '#1a0f00' }}>
            {loot.title}
          </div>
          <div className="text-[13px] font-semibold leading-tight mb-0.5" style={{ color: '#1a0f00' }}>{loot.bountyLine}</div>
          <div className="text-[13px] font-semibold leading-tight" style={{ color: '#1a0f00' }}>{loot.earnLine}</div>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-2.5 flex-shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'rgba(0,0,0,0.55)' }}>Expires in</div>
          <div className="text-[18px] font-bold tabular-nums leading-none" style={{ color: '#1a0f00', fontVariantNumeric: 'tabular-nums' }}>
            {countdown}
          </div>
          <div className="mt-1 inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-[13px] transition-transform active:scale-95"
               style={{ background: '#fff', color: '#E91E7A', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            Play
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
      <div className="sm:hidden mt-4 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: 'rgba(0,0,0,0.55)' }}>Expires in</div>
          <div className="text-[15px] font-bold tabular-nums leading-tight" style={{ color: '#1a0f00' }}>{countdown}</div>
        </div>
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-[13px]"
             style={{ background: '#fff', color: '#E91E7A', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          Play
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function QuestsPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const { myXp } = useMyXp();
  const { location } = useLiveLocation();
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<DockQuest | null>(null);

  const rawQueryHandle = typeof router.query.handle === 'string' ? router.query.handle : undefined;
  const queryHandle = rawQueryHandle?.replace(/\.zo$/i, '');
  const myHandle = (profile?.nickname || profile?.custom_nickname)?.replace(/\.zo$/i, '');
  const displayHandle = queryHandle || myHandle;

  const lootShown = !selectedQuest && isLootImminent(SAMPLE_LOOT.opens_at);

  // Same source as the lobby dock — pearl quest cards stacked full-width.
  const { quests, isLoading } = useActiveQuests(20);

  // Re-compute distance when the user selects a card (so the panel meta is
  // accurate even though useActiveQuests already attached one).
  const selectedWithDistance: DockQuest | null = (() => {
    if (!selectedQuest) return null;
    if (typeof selectedQuest.distance === 'number') return selectedQuest;
    const coords = isGeomediaQuest(selectedQuest)
      ? { lat: selectedQuest.data.geomedia.lat, lng: selectedQuest.data.geomedia.lng }
      : (selectedQuest.data as { location?: { lat?: number; lng?: number } }).location;
    const distance =
      location && coords && typeof coords.lat === 'number' && typeof coords.lng === 'number'
        ? distanceMeters(
            { lat: location.lat, long: location.long },
            { lat: coords.lat, long: coords.lng },
          )
        : undefined;
    return { ...selectedQuest, distance };
  })();

  return (
    <>
      <Head>
        <title>Quests · Zo World</title>
      </Head>

      <main
        className="relative min-h-screen w-full"
        style={{
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: 'radial-gradient(ellipse at 50% 30%, #1A0E02 0%, #060300 55%, #000000 100%)',
        }}
      >
        <div aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
          <Warp
            colors={WARP_COLORS}
            speed={0.3}
            scale={1}
            shape="edge"
            shapeScale={0.5}
            distortion={0.5}
            swirl={0.6}
            swirlIterations={10}
            proportion={0.5}
            softness={0.9}
            fit="cover"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)',
            zIndex: 0,
          }}
        />

        <div className="relative" style={{ zIndex: 1 }}>
          <PageHeaderPill title="Quests" />
          <TopBar xp={myXp?.xp ?? 0} rank={myXp?.rank ?? 0} avatarUrl={profile?.pfp_image || profile?.avatar?.image} />
          <SideNavRail handle={displayHandle} onOpenMap={() => setMapOpen(true)} />

          <div className="px-6 md:px-10 pt-24 md:pt-28 pb-24 max-w-[840px] mx-auto md:pr-32">
            {selectedWithDistance ? (
              <QuestFullView
                quest={selectedWithDistance}
                onBack={() => setSelectedQuest(null)}
              />
            ) : (
              <>
                {lootShown && (
                  <div className="mb-8">
                    <TodaysLootCard
                      loot={SAMPLE_LOOT}
                      onPlay={() => alert('Loot box claim flow coming soon')}
                    />
                  </div>
                )}

                <div className="mb-3 text-[11px] uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
                  Open quests
                </div>
                {isLoading && quests.length === 0 ? (
                  <div className="text-[13px]" style={{ color: TEXT_MUTED }}>Loading…</div>
                ) : quests.length === 0 ? (
                  <div className="text-[13px]" style={{ color: TEXT_MUTED }}>No active quests yet.</div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {quests.map((q) => (
                      <QuestListCard key={q.pid} quest={q} onOpen={setSelectedQuest} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
      </main>
    </>
  );
}
