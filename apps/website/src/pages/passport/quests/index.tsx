import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useProfile } from '@zo/auth';
import { MeshGradient } from '@paper-design/shaders-react';
import { toast } from 'sonner';

import { useMyXp } from '../../../hooks/useMyXp';
import { usePassportProfile } from '../../../hooks/usePassportProfile';
import { useSeason } from '../../../hooks/useSeason';
import useInstagramConnect from '../../../hooks/useInstagramConnect';
import { useQuests } from '../../../hooks/useQuests';
import { isGeomediaQuest, questDisplayTitle, type Quest, type QuestCategory } from '../../../data/mock-quests';

import { TopBar } from '../../../components/passport-lobby/TopBar';
import { MapModal } from '../../../components/passport-lobby/MapModal';
import {
  QuestListCard,
  QuestFullView,
  useActiveQuests,
  actionForQuest,
  type DockQuest,
} from '../../../components/passport-lobby/QuestsDock';
import { CameraCaptureModal, type CaptureKind } from '../../../components/passport-lobby/CameraCaptureModal';
import {
  TodaysLootCard,
  isLootImminent,
  SAMPLE_LOOT,
} from '../../../components/passport-lobby/TodaysLootCard';
import { SettingsModal } from '../../../components/passport/SettingsModal';
import ShareModal from '../../../components/passport/ShareModal';
import { rubikClassName, syneClassName } from '../../../components/utils/font';
import { distanceMeters, useLiveLocation } from '../../../components/LiveLocationProvider';

// Same iridescent pearl as PassportLobby + BadgesLobby — keeps the room reading
// consistent across passport surfaces. No pedestal / hero / LobbyRoom here;
// this is a scrollable dashboard, not a lobby variant.
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

// Milestone ladder. Citizen progresses 0→10→25→50→100→250→500→1000→2000…
// Hides the scary 4920-denominator on staging. Swap to real tier names when
// sub_category becomes meaningful.
const MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

function nextMilestone(count: number): number {
  const found = MILESTONES.find((m) => m > count);
  if (found !== undefined) return found;
  return Math.ceil((count + 1) / 1000) * 1000;
}

function progressTowardNext(count: number): number {
  const next = nextMilestone(count);
  const prevIdx = MILESTONES.indexOf(next) - 1;
  const prev = prevIdx >= 0 ? MILESTONES[prevIdx] : 0;
  const span = next - prev;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(1, (count - prev) / span));
}

interface CategoryDef {
  key: QuestCategory | 'Tribemaker';
  /** Visible label on the card; defaults to `key` if unset. */
  displayName?: string;
  glyph: string;
  bg: string;
  ink: string;
  accent: string;
  /** When false, the card shows count only (no progress bar / next milestone).
   *  Used for non-quest-based categories like Tribemaker. */
  showProgression?: boolean;
}

// Three citizen-facing categories. Tripper + Creator are quest-based
// (milestone progression). Tribemaker is referral-based (citizens onboarded
// via the viewer's affiliate links) — count-only, no milestone framing.
// Trip Captain isn't a citizen-progression role; intentionally excluded.
const CATEGORIES: CategoryDef[] = [
  {
    key: 'Tripper',
    glyph: '✦',
    bg: 'linear-gradient(180deg, rgba(71,148,255,0.28) 0%, rgba(13,77,255,0.42) 100%)',
    ink: '#05143A',
    accent: '#0D4DFF',
    showProgression: true,
  },
  {
    key: 'Creator',
    glyph: '◐',
    bg: 'linear-gradient(180deg, rgba(168,73,224,0.28) 0%, rgba(92,14,146,0.42) 100%)',
    ink: '#1A0033',
    accent: '#5C0E92',
    showProgression: true,
  },
  {
    key: 'Tribemaker',
    displayName: 'Tribe',
    glyph: '◈',
    bg: 'linear-gradient(180deg, rgba(255,71,215,0.22) 0%, rgba(214,14,145,0.32) 100%)',
    ink: '#2B001F',
    accent: '#D60E91',
    showProgression: false,
  },
];

function isCompleted(q: Quest): boolean {
  const status = q.participations?.[0]?.status;
  return status === 'Claimed' || status === 'Submitted';
}

function questCoords(q: Quest): { lat: number; lng: number } | null {
  if (isGeomediaQuest(q)) return { lat: q.data.geomedia.lat, lng: q.data.geomedia.lng };
  const loc = (q.data as { location?: { lat?: number; lng?: number } }).location;
  if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
    return { lat: loc.lat, lng: loc.lng };
  }
  return null;
}

export default function QuestsPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const { myXp } = useMyXp();
  const { profile: passportProfile } = usePassportProfile();
  const { season } = useSeason();
  const ig = useInstagramConnect();
  const { quests: allQuests } = useQuests();
  const { quests: active } = useActiveQuests(20);
  const { location } = useLiveLocation();

  const [mapOpen, setMapOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<DockQuest | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<QuestCategory | null>(null);

  const availableRef = useRef<HTMLDivElement | null>(null);

  const handle = profile?.custom_nickname || profile?.nickname || 'Citizen';
  const avatarUrl = profile?.pfp_image || profile?.avatar?.image;
  const xpTotal = myXp?.xp ?? 0;
  const rankTitle = myXp?.rankTitle ?? 'Citizen';
  const rank = myXp?.rank ?? 0;

  useEffect(() => {
    if (router.query.settings === 'profile') setSettingsOpen(true);
  }, [router.query.settings]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/@${handle}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Profile link copied!')).catch(() => {});
    setShareOpen(true);
  }, [handle]);

  // Per-category counts.
  //   Tripper, Creator → completed-quest counts from useQuests participations.
  //   Tribemaker → all-time citizens onboarded via the viewer's affiliate
  //     links (separate metric, NOT quest-based). Hardcoded 0 until the
  //     affiliate/referral count hook lands.
  const completedByCategory = useMemo(() => {
    const counts: Record<string, number> = { Tripper: 0, Creator: 0, Tribemaker: 0 };
    for (const q of allQuests) {
      if (isCompleted(q) && (q.category === 'Tripper' || q.category === 'Creator')) {
        counts[q.category] += 1;
      }
    }
    // TODO: replace with useReferralStats().citizensOnboarded when ready.
    counts.Tribemaker = 0;
    return counts;
  }, [allQuests]);

  // Available Near You = Live/Active, no current viewer participation, with
  // distance-decoration when location is known. Top 6 — anything more belongs
  // behind a "see all" link to a category catalog (future). Staging seed
  // returns status="Active"; once Daya promotes to Live we keep both so
  // the list doesn't go empty mid-rollout.
  const available: DockQuest[] = useMemo(() => {
    const filtered = allQuests.filter((q) => {
      if (q.status !== 'Live' && q.status !== 'Active') return false;
      const p = q.participations?.[0];
      if (p && (p.status === 'Assigned' || p.status === 'Submitted' || p.status === 'Claimed')) return false;
      if (categoryFilter && q.category !== categoryFilter) return false;
      return true;
    });
    const decorated = filtered.map((q) => {
      const coords = questCoords(q);
      const distance = location && coords
        ? distanceMeters({ lat: location.lat, long: location.long }, { lat: coords.lat, long: coords.lng })
        : undefined;
      return { ...q, distance } as DockQuest;
    });
    decorated.sort((a, b) => {
      if (a.distance == null && b.distance == null) return 0;
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });
    return decorated.slice(0, 6);
  }, [allQuests, location, categoryFilter]);

  // Upcoming = quests with starts_at > now. Sorted soonest-first.
  // `starts_at` is optional on real staging payloads — only CAS emits it.
  // Quests without a start date can't be "upcoming" so they're filtered out.
  const upcoming: Quest[] = useMemo(() => {
    const now = Date.now();
    return allQuests
      .filter((q): q is Quest & { starts_at: string } => {
        if (q.status !== 'Live' && q.status !== 'Active') return false;
        if (!q.starts_at) return false;
        return new Date(q.starts_at).getTime() > now;
      })
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
      .slice(0, 5);
  }, [allQuests]);

  // Morphing CTA logic — same pattern as PassportLobby. Used inside QuestFullView.
  const questAction = selectedQuest ? actionForQuest(selectedQuest) : null;
  const handleQuestAction = () => {
    if (!questAction) return;
    if (questAction.kind === 'instagram') ig.connect();
    else if (questAction.kind === 'geomedia') setCameraOpen(true);
    else if (questAction.kind === 'booking' && questAction.href) {
      window.open(questAction.href, '_blank', 'noopener,noreferrer');
    }
  };
  const cameraAllowed: CaptureKind[] =
    selectedQuest && isGeomediaQuest(selectedQuest)
      ? selectedQuest.data.geomedia.media_kinds.filter((k): k is CaptureKind => k === 'photo' || k === 'video')
      : ['photo'];

  const scrollToAvailable = () => {
    availableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!profile) return null;

  return (
    <>
      <Head>
        <title>Quests · Zo World</title>
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

          <main className="mx-auto w-full max-w-[720px] px-4 md:px-6 pt-24 md:pt-28 pb-24 flex flex-col gap-8">
            {/* HEADER STRIP — All-time identity (left) + this season's progression (right). */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <AllTimeCard rankTitle={rankTitle} xpTotal={xpTotal} />
              <SeasonCard
                seasonLevel={passportProfile?.season_level ?? null}
                seasonXp={passportProfile?.season_xp ?? 0}
                seasonKey={season?.key ?? 's1'}
                levelCurve={season?.level_curve}
              />
            </div>

            {/* DAILY LOOT BOX — same component as the lobby dock, banner variant for the
                dashboard's vertical list. Renders only when the drop is imminent (<24h). */}
            {isLootImminent(SAMPLE_LOOT.opens_at) && (
              <TodaysLootCard
                loot={SAMPLE_LOOT}
                variant="banner"
                onPlay={() => toast('Loot box claim flow coming soon')}
              />
            )}

            {/* CATEGORIES */}
            <section>
              <SectionLabel>Progression</SectionLabel>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {CATEGORIES.map((cat) => {
                  const count = completedByCategory[cat.key] ?? 0;
                  return (
                    <CategoryProgressCard
                      key={cat.key}
                      def={cat}
                      count={count}
                      isFiltered={categoryFilter === cat.key}
                      onClick={() => {
                        // Tribemaker is referral-based, not quest-based —
                        // filtering the quest catalog by it would always
                        // yield zero. No-op for now until an affiliate-link
                        // surface exists to navigate to.
                        if (cat.key === 'Tribemaker') return;
                        const next = categoryFilter === cat.key ? null : (cat.key as QuestCategory);
                        setCategoryFilter(next);
                        if (next) scrollToAvailable();
                      }}
                    />
                  );
                })}
              </div>
            </section>

            {/* ACTIVE */}
            <section>
              <SectionLabel>Active</SectionLabel>
              {active.length === 0 ? (
                <EmptyHint>No active quests — pick one from Available below.</EmptyHint>
              ) : (
                <div className="flex flex-col gap-3">
                  {active.map((q) => (
                    <QuestListCard key={q.pid} quest={q} onOpen={(quest) => setSelectedQuest(quest)} />
                  ))}
                </div>
              )}
            </section>

            {/* AVAILABLE NEAR YOU */}
            <section ref={availableRef}>
              <div className="flex items-center justify-between mb-2">
                <SectionLabel inline>Available Near You</SectionLabel>
                {categoryFilter && (
                  <button
                    type="button"
                    onClick={() => setCategoryFilter(null)}
                    className="inline-flex items-center gap-1.5"
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#2A1B3D',
                      background: 'rgba(255,255,255,0.75)',
                      border: '1px solid rgba(120,100,160,0.25)',
                    }}
                  >
                    Filtered: {categoryFilter}
                    <span aria-hidden style={{ fontSize: 13, lineHeight: 1 }}>✕</span>
                  </button>
                )}
              </div>
              {available.length === 0 ? (
                <EmptyHint>
                  {categoryFilter
                    ? `No available ${categoryFilter} quests near you right now.`
                    : 'You\'ve taken on every nearby quest. Check Upcoming below.'}
                </EmptyHint>
              ) : (
                <div className="flex flex-col gap-3">
                  {available.map((q) => (
                    <QuestListCard key={q.pid} quest={q} onOpen={(quest) => setSelectedQuest(quest)} />
                  ))}
                </div>
              )}
            </section>

            {/* UPCOMING */}
            <section>
              <SectionLabel>Upcoming</SectionLabel>
              {upcoming.length === 0 ? (
                <EmptyHint>Nothing scheduled yet. New quests drop every week.</EmptyHint>
              ) : (
                <div className="flex flex-col gap-2">
                  {upcoming.map((q) => (
                    <UpcomingRow key={q.pid} quest={q} />
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>

        {/* Selected-quest overlay — full view sits above the dashboard. */}
        {selectedQuest && (
          <div
            className="fixed inset-0 z-[50] overflow-y-auto"
            style={{
              // Pearl-tinted scrim — matches the canon. Heavier blur than the
              // dashboard underneath so the detail view feels lifted above it.
              background: 'rgba(251, 248, 244, 0.78)',
              backdropFilter: 'blur(20px) saturate(140%)',
              WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            }}
            onClick={(e) => {
              // Stop bubble so taps inside the detail (CTA, links, scroll)
              // don't trigger any parent click handlers.
              e.stopPropagation();
              if (e.target === e.currentTarget) setSelectedQuest(null);
            }}
          >
            {/* Same global TopBar (rank pill + nav dropdown) the citizen
                gets on the rest of /passport, so they can hop to Lobby /
                Badges / Earn / Map from inside the quest detail. */}
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
            <div className="px-4 md:px-6 pt-24 md:pt-28 pb-12">
              <QuestFullView quest={selectedQuest} onBack={() => setSelectedQuest(null)} />
            </div>
          </div>
        )}

        <CameraCaptureModal
          open={cameraOpen}
          allowed={cameraAllowed}
          title={selectedQuest?.title ?? 'Capture'}
          onClose={() => setCameraOpen(false)}
          onCapture={(file) => {
            toast.success(
              `Captured ${file.type.startsWith('video') ? 'video' : 'photo'}. Submission coming once the upload API is wired.`,
            );
          }}
        />

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
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Section primitives — inline so the page reads top-to-bottom.
// ────────────────────────────────────────────────────────────────────────────

function SectionLabel({ children, inline }: { children: React.ReactNode; inline?: boolean }) {
  return (
    <div
      className={inline ? '' : 'mb-2'}
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: '#6B5B8E',
      }}
    >
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center text-center"
      style={{
        padding: '20px 16px',
        borderRadius: 14,
        border: '1px dashed rgba(120,100,160,0.3)',
        background: 'rgba(255,255,255,0.45)',
        color: '#6B5B8E',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

// Eyebrow label shared by both header cards. Tiny uppercase tag, dark muted.
function EyebrowLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: '#6B5B8E',
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

const HEADER_CARD_STYLE: React.CSSProperties = {
  borderRadius: 18,
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.32) 100%)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.85)',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.9), 0 10px 28px rgba(120,100,160,0.15)',
  padding: '14px 16px',
};

interface AllTimeCardProps {
  rankTitle: string;
  xpTotal: number;
}

function AllTimeCard({ rankTitle, xpTotal }: AllTimeCardProps) {
  return (
    <section className="relative overflow-hidden" style={HEADER_CARD_STYLE}>
      <EyebrowLabel>All-time</EyebrowLabel>
      <div className="flex items-center gap-2">
        <span aria-hidden style={{ fontSize: 18, color: '#A86B2A' }}>★</span>
        <span
          className={syneClassName}
          style={{ fontSize: 20, fontWeight: 700, color: '#2A1B3D', lineHeight: 1 }}
        >
          {rankTitle}
        </span>
      </div>
      <div
        className="mt-1.5"
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#6B5B8E',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {xpTotal.toLocaleString()} XP
      </div>
    </section>
  );
}

interface SeasonCardProps {
  seasonLevel: number | null;
  seasonXp: number;
  seasonKey: string;
  levelCurve?: number[];
}

// Each season caps at 100 levels — shown as `LVL N/100` so the citizen sees
// the runway without needing to do math on XP.
const SEASON_LEVEL_CAP = 100;

function SeasonCard({ seasonLevel, seasonXp, seasonKey, levelCurve }: SeasonCardProps) {
  const label = seasonKey ? `Season ${seasonKey.replace(/^s/i, '')}` : 'Season';
  const level = seasonLevel ?? 0;
  const xpForNext =
    levelCurve && levelCurve.length > Math.max(level, 1) ? levelCurve[Math.max(level, 1)] : 1000;
  const progress = Math.max(0, Math.min(1, seasonXp / xpForNext));

  return (
    <section className="relative overflow-hidden" style={HEADER_CARD_STYLE}>
      <EyebrowLabel>{label}</EyebrowLabel>
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 22,
            height: 18,
            padding: '0 5px',
            borderRadius: 5,
            background: '#E89515',
            color: '#1a0f00',
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {seasonKey.toUpperCase()}
        </span>
        <span
          className={syneClassName}
          style={{ fontSize: 20, fontWeight: 700, color: '#2A1B3D', lineHeight: 1 }}
        >
          LVL {level}/{SEASON_LEVEL_CAP}
        </span>
      </div>
      <div
        className="mt-2 overflow-hidden"
        style={{
          height: 5,
          borderRadius: 999,
          background: 'rgba(120,100,160,0.18)',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #A86B2A, #2A1B3D)',
            borderRadius: 999,
            transition: 'width 240ms ease-out',
          }}
        />
      </div>
    </section>
  );
}

interface CategoryProgressCardProps {
  def: CategoryDef;
  count: number;
  isFiltered: boolean;
  onClick: () => void;
}

function CategoryProgressCard({ def, count, isFiltered, onClick }: CategoryProgressCardProps) {
  const progress = progressTowardNext(count);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative overflow-hidden text-left transition-transform active:scale-[0.985] flex flex-col"
      style={{
        background: def.bg,
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        borderRadius: 18,
        border: isFiltered
          ? '1.5px solid rgba(255,255,255,0.85)'
          : '1px solid rgba(255,255,255,0.32)',
        boxShadow: isFiltered
          ? 'inset 0 1px 0 rgba(255,255,255,0.5), 0 12px 28px rgba(0,0,0,0.32)'
          : 'inset 0 1px 0 rgba(255,255,255,0.32), 0 10px 24px rgba(0,0,0,0.22)',
        padding: '14px 14px 12px',
        gap: 10,
        minHeight: 116,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: 60,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)',
        }}
      />

      <div className="flex items-center gap-1.5">
        <span aria-hidden style={{ fontSize: 15, color: '#fff', opacity: 0.9, lineHeight: 1 }}>
          {def.glyph}
        </span>
        <span
          className={syneClassName}
          style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1 }}
        >
          {def.displayName ?? def.key}
        </span>
      </div>

      {def.showProgression ? (
        <>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {count}
          </div>
          <div className="mt-auto">
            <div
              className="relative overflow-hidden"
              style={{
                height: 5,
                borderRadius: 999,
                background: 'rgba(0,0,0,0.18)',
              }}
            >
              <div
                style={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  background: '#fff',
                  borderRadius: 999,
                  transition: 'width 240ms ease-out',
                }}
              />
            </div>
          </div>
        </>
      ) : (
        // Count-only categories (Tribe) get a centered hero number — the
        // count IS the card.
        <div className="flex-1 flex items-center justify-center">
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              textShadow: '0 1px 4px rgba(0,0,0,0.18)',
            }}
          >
            {count}
          </span>
        </div>
      )}
    </button>
  );
}

function UpcomingRow({ quest }: { quest: Quest }) {
  // Upstream filter (upcoming useMemo) guarantees starts_at is set on every
  // quest passed in here. Fall back to an empty label for safety in case a
  // future caller skips that filter.
  const startsAt = quest.starts_at ? new Date(quest.starts_at) : null;
  const dateLabel = startsAt
    ? startsAt.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : '';
  const categoryDef = CATEGORIES.find((c) => c.key === quest.category);
  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding: '10px 14px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.55)',
        border: '1px solid rgba(255,255,255,0.85)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      }}
    >
      <div
        className="flex-shrink-0"
        style={{
          minWidth: 80,
          fontSize: 11,
          fontWeight: 700,
          color: '#6B5B8E',
          letterSpacing: '0.04em',
        }}
      >
        {dateLabel}
      </div>
      {categoryDef && (
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 6,
            background: categoryDef.accent,
            color: '#fff',
            fontSize: 12,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {categoryDef.glyph}
        </span>
      )}
      <div
        className="flex-1 min-w-0"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#2A1B3D',
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {questDisplayTitle(quest)}
      </div>
    </div>
  );
}
