import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { MeshGradient } from '@paper-design/shaders-react';
import { toast } from 'sonner';
import { rubikClassName, syneClassName } from '../utils/font';
import chestIcon from '../../assets/passport-lobby/treasure-chest.png';
import { questDisplayTitle, type Quest, type QuestReward } from '../../data/quests';
import { useQuestClaim } from '../../hooks/useQuestClaim';
import { BorderBeam } from './BorderBeam';

// Holographic foil palette for the chest hero — gold/orange dominant so it
// reads as a treasure surface, distinct from CitizenCard's party-colour
// HOLOGRAM but using the same shader+beam pattern for spatial parity.
const TREASURE_HOLOGRAM_COLORS = ['#FFB547', '#FFD84D', '#FF6F00', '#A7D921', '#FFB547'];
const CHEST_CARD_RADIUS = 22;

// Mirrors PassportLobby's iridescent palette so the chest modal reads as
// the same surface, not a separate dark sheet floating above the lobby.
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
const INK = '#0A0A14';
const INK_MUTED = '#6B5B8E';

export interface TreasureChestCardProps {
  open: boolean;
  onClose: () => void;
  activeCount?: number;
  countdown?: string;
  /**
   * Slice of quests to surface as "today's loot." Caller derives this from
   * useQuests (e.g. top N by ends_at). Falls back to demo tiles when undefined
   * so the surface still previews in new-user / loading / no-auth states.
   */
  quests?: Quest[];
  /**
   * Tapping a tile dispatches the original Quest back to the caller so the
   * lobby can swap its QuestsDock to QuestPanel (the same detail surface
   * every other entry point uses). Caller is responsible for closing the
   * chest before showing the panel.
   */
  onSelectQuest?: (quest: Quest) => void;
}

interface Reward {
  icon: string;
  label: string;
  color: string;
}

interface QuestDef {
  id: string;
  category: string;
  categoryColor: string;
  isDaily?: boolean;
  title: string;
  // Short top-right label — e.g. "23h 14m left" or "Daily". Must stay
  // narrow; rendered with whiteSpace:nowrap so anything long here would
  // force the whole tile past its column width.
  deadline?: string;
  // Full body copy. Wraps naturally; can be arbitrarily long.
  description?: string;
  rewards: Reward[];
  cta?: { label: string; bg: string; color: string; onClick?: () => void; disabled?: boolean };
  // Slug + reward id needed to fire the claim mutation. Only set on
  // RESULTS_DECLARED tiles where a pending claim exists.
  claim?: { slug: string; rewardId: string };
}

const ROLE_STYLE: Record<string, { color: string; noun: string }> = {
  Creator: { color: '#C26BE8', noun: 'Creator' },
  Tripper: { color: '#5A9BFF', noun: 'Tripper' },
  Tribemaker: { color: '#FF66C4', noun: 'Tribe Maker' },
};

const CTA_STYLES = {
  start: {
    label: 'Start Quest',
    bg: 'linear-gradient(180deg, #FF7A2E 0%, #E15400 100%)',
    color: '#FFFFFF',
  },
  connect: {
    label: 'Connect IG',
    bg: 'linear-gradient(180deg, #A855E8 0%, #7A22C2 100%)',
    color: '#FFFFFF',
  },
  claim: {
    label: 'Claim Reward',
    bg: 'linear-gradient(180deg, #F5C542 0%, #C7950E 100%)',
    color: '#3A2900',
  },
};

function rewardTile(reward: QuestReward | undefined): Reward | null {
  if (!reward) return null;

  // QuestRewardSerializer returns `category` as a display string from
  // get_category_display(): "XP", "Bed Drop", "Bounty", or "Content
  // Monetization" (passport/models/quest.py QuestReward.Category). The
  // numeric is on xp_amount or credit_amount depending on category.
  const cat = reward.category;
  const sym = reward.currency?.symbol ?? '₹';

  if (cat === 'XP' && typeof reward.xp_amount === 'number') {
    return { icon: '✦', label: `${reward.xp_amount} XP`, color: '#FFD84D' };
  }
  if (cat === 'Bed Drop') {
    return { icon: '◈', label: 'Free Bed Drop', color: '#C9A7FF' };
  }
  if (cat === 'Bounty' && typeof reward.credit_amount === 'number') {
    return { icon: sym, label: `${sym}${reward.credit_amount} bounty`, color: '#80E57B' };
  }
  if (cat === 'Content Monetization') {
    const cm = typeof reward.credit_amount === 'number'
      ? `${sym}${reward.credit_amount} per post`
      : 'Creator payout';
    return { icon: '◉', label: cm, color: '#FF9D5C' };
  }
  return null;
}

function formatDeadline(ends_at?: string | null): string | undefined {
  if (!ends_at) return undefined;
  const ms = new Date(ends_at).getTime() - Date.now();
  if (Number.isNaN(ms)) return undefined;
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (h >= 24) return `${Math.floor(h / 24)}d left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

function questDefFromQuest(q: Quest): QuestDef {
  const roleStyle = ROLE_STYLE[q.category] ?? ROLE_STYLE.Tripper;

  const rewards = q.rewards.map(rewardTile).filter(Boolean) as Reward[];

  // ends_at is CAS-only; the user-facing endpoint omits it. formatDeadline
  // returns undefined for absent values, so the deadline line disappears
  // gracefully on real data instead of breaking layout.
  const deadline = formatDeadline(q.ends_at);
  const description = q.description || undefined;

  // Claim path: pick the first participation where results have been
  // declared, then match it to the first reward id that still has a
  // PENDING claim. Server endpoint expects `{reward: <reward_id>}`; it
  // looks up the matching claim row on its side, so we don't need to send
  // the claim id directly. The claim<->reward back-reference isn't on the
  // public claim serializer, so we fall back to rewards[0].id when we
  // can't be more specific — the server returns a 422/404 if that reward
  // is already claimed, which the toast surfaces.
  const declared = q.participations?.find(
    (p) => p.status === 'Results Declared',
  );
  const hasPending = declared?.claims?.some((c) => c.status === 'Pending');
  const rewardId = q.rewards?.[0]?.id;
  const claim =
    declared && hasPending && rewardId
      ? { slug: q.slug, rewardId }
      : undefined;

  // Real staging payloads don't include `data` — Creator detection has to
  // ride on `q.category` directly. The IG connect prompt is the right CTA
  // for every Creator quest because IG-link is the gating step regardless
  // of the specific variant. RESULTS_DECLARED with a pending claim wins
  // over the start/connect default — we want the user to grab their loot
  // first.
  const baseCta = claim
    ? CTA_STYLES.claim
    : q.category === 'Creator'
    ? CTA_STYLES.connect
    : CTA_STYLES.start;

  return {
    id: q.pid,
    category: `Today's ${roleStyle.noun} Quest`,
    categoryColor: roleStyle.color,
    isDaily: false,
    // Staging seeds most stay/trip rows with empty title — fall through to
    // inventory.name → destination.name → slug so the tile is readable.
    title: questDisplayTitle(q),
    deadline,
    description,
    rewards,
    cta: baseCta,
    claim,
  };
}

function QuestTile({ quest, onSelect }: { quest: QuestDef; onSelect?: () => void }) {
  // Always call the hook — react rules-of-hooks. When `quest.claim` is
  // undefined the slug is undefined; the mutation just guards on that.
  const claimMutation = useQuestClaim(quest.claim?.slug);
  const [optimisticClaimed, setOptimisticClaimed] = useState(false);

  const handleClick = async () => {
    if (!quest.claim) return;
    try {
      await claimMutation.mutateAsync({ reward: quest.claim.rewardId });
      setOptimisticClaimed(true);
      toast.success('Reward claimed — see badges & XP for details');
    } catch (e) {
      const message =
        (e as { response?: { data?: { errors?: string[] } } })?.response?.data
          ?.errors?.[0] ||
        (e as { message?: string })?.message ||
        'Claim failed — try again';
      toast.error(message);
    }
  };

  const isClaim = !!quest.claim;
  const isLoading = claimMutation.isLoading;
  const ctaLabel =
    isClaim && optimisticClaimed
      ? 'Claimed'
      : isClaim && isLoading
      ? 'Claiming…'
      : quest.cta?.label;
  const ctaDisabled = isClaim && (isLoading || optimisticClaimed);

  const interactive = !!onSelect;

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onSelect?.() : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.();
              }
            }
          : undefined
      }
      className={`flex flex-col gap-2 p-3 text-left ${interactive ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}`}
      style={{
        // Fixed height so every tile in the dock/chest row is uniform
        // regardless of title length, reward presence, or CTA. Title clamps
        // to 2 lines and the CTA is pushed to the bottom (mt-auto) so the
        // baselines align across cards.
        height: 160,
        // Pearl glass — matches the rest of the lobby (CameraCaptureModal
        // PEARL_BG / GLASS_PILL) so this surface reads as part of the
        // same material set, not a dark eggplant intrusion.
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow:
          '0 6px 18px rgba(120,100,160,0.18), inset 0 1px 0 rgba(255,255,255,0.95)',
      }}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div
          className="truncate"
          style={{ fontSize: 9, fontWeight: 700, color: quest.categoryColor, letterSpacing: '0.04em', textTransform: 'uppercase' }}
        >
          {quest.category}
        </div>
        {(quest.deadline || quest.isDaily) && (
          <div
            className="shrink-0"
            style={{ fontSize: 9, fontWeight: 500, color: INK_MUTED, whiteSpace: 'nowrap' }}
          >
            {quest.isDaily ? 'Daily' : quest.deadline}
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: INK,
          lineHeight: '1.3em',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {quest.title}
      </div>
      {quest.rewards.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {quest.rewards.map((r, i) => (
            <div key={i} className="flex items-center gap-1" style={{ fontSize: 10, color: r.color }}>
              <span aria-hidden style={{ fontSize: 11 }}>{r.icon}</span>
              <span style={{ fontWeight: 600 }}>{r.label}</span>
            </div>
          ))}
        </div>
      )}
      {quest.cta && (
        <button
          type="button"
          onClick={(e) => {
            // Stop propagation either way — the tile body listener would
            // otherwise also fire and double-trigger. Then route by intent:
            // claim CTAs run the claim mutation (terminal action). Non-claim
            // CTAs (Start Quest / Connect IG) route to the detail view, the
            // natural next step — without this fall-through the button would
            // be a dead zone over a clickable tile.
            e.stopPropagation();
            if (isClaim) {
              void handleClick();
            } else {
              onSelect?.();
            }
          }}
          disabled={ctaDisabled}
          className="mt-auto self-start transition-all active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
          style={{
            background: quest.cta.bg,
            color: quest.cta.color,
            fontSize: 11,
            fontWeight: 700,
            padding: '7px 14px',
            borderRadius: 999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.35)',
            cursor: ctaDisabled ? 'default' : 'pointer',
          }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

// Hero treasure-chest card — mirrors CitizenCard's hero treatment so the
// chest reads as the modal's focal point (same shader-foil + animated
// border-beam pattern, gold/orange palette instead of party-colour). The
// avatar slot is replaced with the big chest illustration; the handle slot
// becomes "Daily Loot Box"; the subtitle becomes the expiry countdown.
function ChestHero({ countdown }: { countdown: string }) {
  return (
    <div style={{ perspective: 900 }}>
      <div
        className={`relative ${rubikClassName}`}
        style={{
          width: 240,
          padding: 16,
          background: 'linear-gradient(180deg, #2A1400 0%, #0E0700 100%)',
          borderRadius: CHEST_CARD_RADIUS,
          boxShadow:
            '0 24px 48px -12px rgba(120,60,0,0.45), inset 0 1.93px 7.71px rgba(255,255,255,0.18)',
          overflow: 'hidden',
        }}
      >
        {/* Treasure hologram foil — same shader spec as CitizenCard's
            HOLOGRAM, swapped palette. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: CHEST_CARD_RADIUS,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <MeshGradient
            colors={TREASURE_HOLOGRAM_COLORS}
            speed={0.6}
            scale={1.4}
            distortion={0.6}
            swirl={0.55}
            grainMixer={0.05}
            grainOverlay={0.08}
            fit="cover"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Subtle diagonal sheen — same hue as CitizenCard's static streak. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: CHEST_CARD_RADIUS,
            background:
              'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.08) 50%, transparent 80%)',
            pointerEvents: 'none',
            zIndex: 2,
            mixBlendMode: 'overlay',
          }}
        />

        <BorderBeam
          radius={CHEST_CARD_RADIUS}
          duration={6}
          borderWidth={1.5}
          colorFrom="#F5C542"
          colorTo="#FF2F8E"
          trailDegrees={90}
        />

        {/* Chest image — sits where the avatar would on CitizenCard.
            Fills the 208px content area with breathing room. */}
        <div
          className="relative flex items-center justify-center"
          style={{
            width: 208,
            height: 208,
            zIndex: 4,
            marginBottom: 10,
          }}
        >
          <Image
            src={chestIcon}
            alt="Treasure chest"
            width={208}
            height={208}
            priority
            style={{
              width: 208,
              height: 208,
              objectFit: 'contain',
              filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.55))',
            }}
          />
        </div>

        {/* Title — Syne 700, same slot as the citizen handle. */}
        <div
          className={syneClassName}
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#0A0A0A',
            lineHeight: '1.15em',
            marginBottom: 4,
            position: 'relative',
            zIndex: 4,
            whiteSpace: 'nowrap',
            textShadow: '0 1px 0 rgba(255,255,255,0.4)',
          }}
        >
          Daily Loot Box
        </div>
        <div
          style={{
            position: 'relative',
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'rgba(0,0,0,0.65)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Expires
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#0A0A0A',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {countdown}
          </span>
        </div>
      </div>
    </div>
  );
}

// Soft elliptical shadow under the hero — same pattern the lobby uses
// beneath the citizen card so the chest looks anchored to the surface,
// not floating in space.
function HeroDiscShadow() {
  return (
    <div
      aria-hidden
      style={{
        width: 220,
        height: 26,
        marginTop: -6,
        background:
          'radial-gradient(ellipse at center, rgba(60,30,0,0.28) 0%, rgba(60,30,0,0.08) 55%, rgba(60,30,0,0) 80%)',
        filter: 'blur(1px)',
      }}
    />
  );
}

// "Today's drops" pill — same orange treatment as the previous banner,
// compressed into a single line so it sits as a focal-point caption
// between the hero and the quest tiles.
function DropsPill() {
  return (
    <div
      className="self-center flex items-center gap-2 px-4 py-2"
      style={{
        borderRadius: 999,
        background: 'linear-gradient(135deg, #FFB547 0%, #FF8A26 55%, #FF6F17 100%)',
        boxShadow:
          '0 6px 18px rgba(255,138,39,0.32), inset 0 1px 0 rgba(255,255,255,0.35)',
        color: '#2A1400',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700 }}>Today's drops:</span>
      <span style={{ fontSize: 11, fontWeight: 500 }}>
        Free Bed · ₹7k bounties · Up to ₹2,000
      </span>
    </div>
  );
}

/**
 * Daily quest modal — controlled by parent. Full-screen pearl iridescent
 * takeover on both mobile + desktop so it reads as a deeper view of the
 * lobby surface rather than a sheet floating above it.
 */
export function TreasureChestCard({
  open,
  onClose,
  activeCount: _activeCount,
  countdown = '08:06:12',
  quests: liveQuests,
  onSelectQuest,
}: TreasureChestCardProps) {
  void _activeCount;

  // Pair each tile definition with its raw Quest so tile clicks can hand
  // the original record back to the lobby — that's what QuestPanel needs
  // to render the detail view. No demo fallback: any non-array (undefined
  // / null caller, no live data yet) is treated the same as an empty
  // array, which renders the empty-state card below.
  const tiles = useMemo<Array<{ def: QuestDef; quest: Quest }>>(() => {
    if (!liveQuests) return [];
    return liveQuests.map((q) => ({ def: questDefFromQuest(q), quest: q }));
  }, [liveQuests]);
  const isSingle = tiles.length === 1;
  const isEmpty = tiles.length === 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Today's quests"
      className={`fixed inset-0 z-[60] ${rubikClassName}`}
      style={{
        // Ivory anchor under the shader so the first paint and out-of-bounds
        // areas don't flash a different tone — same trick as PassportLobby.
        background: '#FBF8F4',
        WebkitTapHighlightColor: 'transparent',
        overscrollBehavior: 'none',
      }}
    >
      {/* Iridescent pearl mesh — same shader settings as the lobby root so
          the modal feels like a deeper view of the same surface. */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: 0 }}>
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
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%)',
          zIndex: 0,
        }}
      />

      {/* Content layer — vertical rhythm mirrors PassportLobby:
          close-X → hero card → disc shadow → drops pill → horizontal
          scroll of quest tiles at the bottom. */}
      <div
        className="relative z-[1] mx-auto w-full h-full flex flex-col"
        style={{
          paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="self-end mr-4 md:mr-6 flex items-center justify-center active:scale-90 transition-all"
          // 22px × chrome with a 44×44 hit area (WCAG / Apple HIG min).
          style={{
            width: 44,
            height: 44,
            fontSize: 24,
            lineHeight: 1,
            color: INK,
            background: 'rgba(255,255,255,0.6)',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 4px 12px rgba(120,100,160,0.18)',
          }}
        >
          ×
        </button>

        {/* Hero stack — chest, disc shadow, drops pill — centred and
            allowed to grow into the upper viewport. */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <ChestHero countdown={countdown} />
          <HeroDiscShadow />
          <DropsPill />
        </div>

        {/* Empty state — caller passed liveQuests=[] (real logged-in
            user with no assigned quests yet). Never fall back to demo
            tiles here: demos are intentionally non-interactive, which
            read as "the modal is broken" to live users. */}
        {isEmpty ? (
          <div className="mx-auto w-full max-w-md px-4">
            <div
              className="flex flex-col items-center gap-2 px-5 py-6 text-center"
              style={{
                background: 'rgba(255,255,255,0.78)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow:
                  '0 6px 18px rgba(120,100,160,0.18), inset 0 1px 0 rgba(255,255,255,0.95)',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>
                No active quests yet
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: INK_MUTED,
                  lineHeight: '1.4em',
                }}
              >
                New quests get assigned daily. Check back soon — or earn XP by exploring nearby destinations.
              </div>
            </div>
          </div>
        ) : isSingle ? (
          <div className="mx-auto w-full max-w-md px-4">
            <QuestTile
              quest={tiles[0].def}
              onSelect={
                onSelectQuest ? () => onSelectQuest(tiles[0].quest) : undefined
              }
            />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-2xl">
            <div
              className="flex gap-3 overflow-x-auto px-4 pb-2"
              style={{
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {tiles.map(({ def, quest }) => (
                <div key={def.id} style={{ flex: '0 0 280px' }}>
                  <QuestTile
                    quest={def}
                    onSelect={
                      onSelectQuest ? () => onSelectQuest(quest) : undefined
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
