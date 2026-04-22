import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useProfile } from '@zo/auth';
import { Warp } from '@paper-design/shaders-react';
import { SideNavRail } from '../../components/passport-lobby/SideNavRail';
import { MapModal } from '../../components/passport-lobby/MapModal';
import { TopBar } from '../../components/passport-lobby/TopBar';
import { PageHeaderPill } from '../../components/passport-lobby/PageHeaderPill';
import { useMyXp } from '../../hooks/useMyXp';
import chestIcon from '../../assets/passport-lobby/treasure-chest.png';

/**
 * Quests page — /@{handle}/quests. Featured quest at the top opens a detail
 * modal; below, the list of open quests tinted by the role they belong to.
 * Shape matches the v2 quest endpoint contract (passport/mocks/quests).
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

interface Quest {
  user_quest_id: string;
  quest_id: string;
  name: string;
  description: string;
  cover_image: string;
  role_ids: string[];
  role_names: string[];
  culture_id: string | null;
  journey_role: 'side' | 'main';
  cadence: 'daily' | 'weekly' | 'seasonal' | 'oneoff';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  difficulty: 'easy' | 'medium' | 'hard';
  qualifying_actions: string[];
  verification_method: string;
  reward_pool: {
    draw_method: string;
    reward: { type: string; amount: number };
  };
  live_at: string;
  submission_deadline_at: string;
  expires_at: string;
  status: 'open' | 'submitted' | 'post_due' | 'expired' | 'claimed';
  tier_access: 'free_min' | 'pro_only';
}

// Role palette — mirrors the bright glowBg gradients from PassesDock tier
// cards. Dark text (labelInk) on bright bg, same visual treatment as tiers.
interface RoleTheme {
  bg: string;
  accent: string;      // Light accent (highlight/mid)
  labelInk: string;    // Dark text color (for quest copy on bright bg)
  pillBg: string;      // Semi-opaque background for chips
}

const ROLE_THEMES: Record<string, RoleTheme> = {
  tripper: {
    bg: 'linear-gradient(180deg, #4794FF 0%, #3079F2 60%, #0D4DFF 100%)',
    accent: '#D1E2FF',
    labelInk: '#05143A',
    pillBg: 'rgba(5, 20, 58, 0.28)',
  },
  creator: {
    bg: 'linear-gradient(180deg, #A849E0 0%, #8A26C2 60%, #5C0E92 100%)',
    accent: '#EED1FF',
    labelInk: '#1A0033',
    pillBg: 'rgba(26, 0, 51, 0.28)',
  },
  tribemaker: {
    bg: 'linear-gradient(180deg, #FF47D7 0%, #F530B6 60%, #D60E91 100%)',
    accent: '#FFD1FD',
    labelInk: '#2B001F',
    pillBg: 'rgba(43, 0, 31, 0.28)',
  },
  tribe_builder: {
    bg: 'linear-gradient(180deg, #FF47D7 0%, #F530B6 60%, #D60E91 100%)',
    accent: '#FFD1FD',
    labelInk: '#2B001F',
    pillBg: 'rgba(43, 0, 31, 0.28)',
  },
};

const DEFAULT_THEME: RoleTheme = {
  bg: 'linear-gradient(180deg, #F5B13A 0%, #E89515 60%, #C97A0A 100%)',
  accent: '#FFE79E',
  labelInk: '#1A0F00',
  pillBg: 'rgba(26, 15, 0, 0.28)',
};

function themeForQuest(q: Quest) {
  const primary = q.role_ids?.[0]?.toLowerCase();
  return (primary && ROLE_THEMES[primary]) || DEFAULT_THEME;
}

/** Live HH:MM:SS countdown hook. Returns "08 : 06 : 12" style string.
 *  Starts null on SSR + first client render so markup matches across the
 *  hydration boundary. After mount, flips to the live tick. */
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

function timeRemaining(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return 'expired';
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)}m left`;
  if (h < 24) return `${h}h left`;
  return `${Math.floor(h / 24)}d left`;
}

function statusPillStyle(status: Quest['status']): React.CSSProperties {
  switch (status) {
    case 'open':
      return { background: 'rgba(74,222,128,0.18)', color: '#4ADE80' };
    case 'submitted':
      return { background: 'rgba(250,204,21,0.18)', color: '#FACC15' };
    case 'post_due':
      return { background: 'rgba(148,163,184,0.2)', color: '#CBD5E1' };
    case 'expired':
      return { background: 'rgba(248,113,113,0.18)', color: '#F87171' };
    case 'claimed':
      return { background: 'rgba(196,181,253,0.2)', color: '#C4B5FD' };
    default:
      return { background: 'rgba(255,255,255,0.1)', color: '#fff' };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Sample data — matches the v2 shape. Swap for zoPassportServer call later.
// ────────────────────────────────────────────────────────────────────────────

// Today's Loot drop — separate from quests. Only rendered when imminent (<24h).
const SAMPLE_LOOT: LootDrop = {
  title: 'Free Bed',
  bountyLine: 'Bounties worth Rs 7k',
  earnLine: 'Earn upto Rs. 2,000',
  // 8h 6m 12s from now-ish — adjust to a realistic opens_at from backend later
  opens_at: new Date(Date.now() + (8 * 60 + 6) * 60 * 1000 + 12_000).toISOString(),
};

const SAMPLE_QUESTS: Quest[] = [
  {
    user_quest_id: '11111111-1111-1111-1111-111111111111',
    quest_id: 'aaa11111-0000-0000-0000-000000000001',
    name: 'Catch a moment today',
    description: 'Share one photo from wherever you are — café, street, room, view.',
    cover_image: 'https://cdn.zo.xyz/quests/catch-moment.jpg',
    role_ids: ['tripper'],
    role_names: ['Tripper'],
    culture_id: null,
    journey_role: 'side',
    cadence: 'daily',
    rarity: 'common',
    difficulty: 'easy',
    qualifying_actions: ['photo_upload'],
    verification_method: 'geo_media',
    reward_pool: { draw_method: 'all_qualified', reward: { type: 'xp', amount: 25 } },
    live_at: '2026-04-21T00:00:00Z',
    submission_deadline_at: '2026-04-21T23:59:59Z',
    expires_at: '2026-04-22T10:00:00Z',
    status: 'post_due',
    tier_access: 'free_min',
  },
  {
    user_quest_id: '22222222-2222-2222-2222-222222222222',
    quest_id: 'aaa22222-0000-0000-0000-000000000002',
    name: 'Connect Instagram',
    description: 'Link your IG to unlock creator rewards and bed drops.',
    cover_image: 'https://cdn.zo.xyz/quests/connect-ig.jpg',
    role_ids: ['creator'],
    role_names: ['Creator'],
    culture_id: null,
    journey_role: 'main',
    cadence: 'oneoff',
    rarity: 'uncommon',
    difficulty: 'easy',
    qualifying_actions: ['oauth_link'],
    verification_method: 'oauth_callback',
    reward_pool: { draw_method: 'all_qualified', reward: { type: 'xp', amount: 50 } },
    live_at: '2026-04-01T00:00:00Z',
    submission_deadline_at: '2026-05-01T23:59:59Z',
    expires_at: '2026-05-15T00:00:00Z',
    status: 'open',
    tier_access: 'free_min',
  },
  {
    user_quest_id: '33333333-3333-3333-3333-333333333333',
    quest_id: 'aaa33333-0000-0000-0000-000000000003',
    name: 'Invite 3 builders',
    description: 'Share your passport link and onboard 3 new citizens this month.',
    cover_image: 'https://cdn.zo.xyz/quests/invite-builders.jpg',
    role_ids: ['tribemaker'],
    role_names: ['Tribe Builder'],
    culture_id: null,
    journey_role: 'main',
    cadence: 'weekly',
    rarity: 'rare',
    difficulty: 'medium',
    qualifying_actions: ['referral_signup'],
    verification_method: 'backend_event',
    reward_pool: { draw_method: 'all_qualified', reward: { type: 'xp', amount: 300 } },
    live_at: '2026-04-20T00:00:00Z',
    submission_deadline_at: '2026-04-27T23:59:59Z',
    expires_at: '2026-04-28T10:00:00Z',
    status: 'open',
    tier_access: 'free_min',
  },
  {
    user_quest_id: '44444444-4444-4444-4444-444444444444',
    quest_id: 'aaa44444-0000-0000-0000-000000000004',
    name: 'Stay at Zostel Pahalgam',
    description: '3-night stay between Apr 25 – May 15. Bed drop claim.',
    cover_image: 'https://cdn.zo.xyz/quests/pahalgam.jpg',
    role_ids: ['tripper'],
    role_names: ['Tripper'],
    culture_id: null,
    journey_role: 'main',
    cadence: 'seasonal',
    rarity: 'legendary',
    difficulty: 'hard',
    qualifying_actions: ['booking_confirmed'],
    verification_method: 'booking_event',
    reward_pool: { draw_method: 'all_qualified', reward: { type: 'xp', amount: 300 } },
    live_at: '2026-04-15T00:00:00Z',
    submission_deadline_at: '2026-05-15T23:59:59Z',
    expires_at: '2026-05-16T00:00:00Z',
    status: 'open',
    tier_access: 'pro_only',
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Today's Loot — top-of-page promo banner. Only shown when a loot drop is
// imminent. Independent of the quest list below.
// ────────────────────────────────────────────────────────────────────────────

interface LootDrop {
  title: string;
  bountyLine: string;
  earnLine: string;
  /** ISO timestamp when the loot box opens */
  opens_at: string;
}

/** Decide when to show the banner — e.g. only if opens_at is within 24h. */
function isLootImminent(opens_at: string): boolean {
  const ms = new Date(opens_at).getTime() - Date.now();
  return Number.isFinite(ms) && ms > 0 && ms < 24 * 60 * 60 * 1000;
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
      {/* Sparkles — decorative dots top-right */}
      <div aria-hidden className="absolute top-3 right-[42%] text-[14px]" style={{ opacity: 0.55 }}>
        ✦
      </div>
      <div aria-hidden className="absolute top-6 right-[36%] text-[10px]" style={{ opacity: 0.45 }}>
        ✦
      </div>

      <div className="flex items-center gap-5">
        {/* Chest image */}
        <div className="flex-shrink-0" style={{ width: 88, height: 88 }}>
          <Image
            src={chestIcon}
            alt=""
            width={88}
            height={88}
            style={{ width: 88, height: 88, objectFit: 'contain' }}
          />
        </div>

        {/* Copy block */}
        <div className="flex-1 min-w-0">
          <div
            className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2"
            style={{ color: 'rgba(0,0,0,0.55)' }}
          >
            Today's Loot
          </div>
          <div className="text-[17px] md:text-[18px] font-bold leading-tight mb-0.5" style={{ color: '#1a0f00' }}>
            {loot.title}
          </div>
          <div className="text-[13px] font-semibold leading-tight mb-0.5" style={{ color: '#1a0f00' }}>
            {loot.bountyLine}
          </div>
          <div className="text-[13px] font-semibold leading-tight" style={{ color: '#1a0f00' }}>
            {loot.earnLine}
          </div>
        </div>

        {/* Right column: timer + play */}
        <div className="hidden sm:flex flex-col items-end gap-2.5 flex-shrink-0">
          <div
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'rgba(0,0,0,0.55)' }}
          >
            Expires in
          </div>
          <div
            className="text-[18px] font-bold tabular-nums leading-none"
            style={{ color: '#1a0f00', fontVariantNumeric: 'tabular-nums' }}
          >
            {countdown}
          </div>
          <div
            className="mt-1 inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-[13px] transition-transform active:scale-95"
            style={{
              background: '#fff',
              color: '#E91E7A',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            Play
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Mobile: timer + play below the copy */}
      <div className="sm:hidden mt-4 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: 'rgba(0,0,0,0.55)' }}>
            Expires in
          </div>
          <div className="text-[15px] font-bold tabular-nums leading-tight" style={{ color: '#1a0f00' }}>
            {countdown}
          </div>
        </div>
        <div
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-[13px]"
          style={{
            background: '#fff',
            color: '#E91E7A',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
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
// Quest card (role-colored, below the featured)
// ────────────────────────────────────────────────────────────────────────────

function Pill({
  children,
  bg,
  color,
}: {
  children: React.ReactNode;
  bg?: string;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
      style={{ background: bg ?? 'rgba(0,0,0,0.25)', color: color ?? 'rgba(0,0,0,0.7)' }}
    >
      {children}
    </span>
  );
}

function QuestCard({ q, onOpen }: { q: Quest; onOpen: (q: Quest) => void }) {
  const theme = themeForQuest(q);
  const remaining = timeRemaining(q.submission_deadline_at);
  const rewardText = `+${q.reward_pool.reward.amount} ${q.reward_pool.reward.type.toUpperCase()}`;

  return (
    <button
      type="button"
      onClick={() => onOpen(q)}
      className="text-left rounded-3xl p-6 transition-all active:scale-[0.985] hover:brightness-[1.03] w-full"
      style={{
        background: theme.bg,
        border: '1px solid rgba(255,255,255,0.25)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.15), 0 12px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill bg={theme.pillBg} color={theme.labelInk}>
            {q.role_names[0] ?? 'Open'}
          </Pill>
          <Pill bg="rgba(255,255,255,0.3)" color={theme.labelInk}>{q.cadence}</Pill>
          <Pill bg="rgba(255,255,255,0.3)" color={theme.labelInk}>{q.difficulty}</Pill>
          {q.rarity !== 'common' && <Pill bg="rgba(255,255,255,0.3)" color={theme.labelInk}>{q.rarity}</Pill>}
          {q.tier_access === 'pro_only' && (
            <Pill bg="rgba(255,215,0,0.9)" color="#3A2100">Pro</Pill>
          )}
        </div>
        <span
          className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
          style={statusPillStyle(q.status)}
        >
          {q.status.replace('_', ' ')}
        </span>
      </div>

      <div className="text-[18px] font-bold leading-tight mb-1" style={{ color: theme.labelInk }}>
        {q.name}
      </div>
      <div className="text-[13px] font-medium leading-snug mb-4" style={{ color: theme.labelInk, opacity: 0.8 }}>
        {q.description}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div
          className="inline-flex items-center text-[13px] font-bold tabular-nums px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.95)', color: theme.labelInk }}
        >
          {rewardText}
        </div>
        <div
          className="text-[11px] uppercase tracking-wider font-bold"
          style={{ color: theme.labelInk, opacity: 0.65 }}
        >
          {remaining}
        </div>
      </div>
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Detail modal — full quest info
// ────────────────────────────────────────────────────────────────────────────

function QuestDetailModal({ q, onClose }: { q: Quest | null; onClose: () => void }) {
  if (!q) return null;
  const theme = themeForQuest(q);
  const remaining = timeRemaining(q.submission_deadline_at);
  const rewardText = `+${q.reward_pool.reward.amount} ${q.reward_pool.reward.type.toUpperCase()}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quest-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-[560px] max-h-[88vh] rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: theme.bg,
          border: `1px solid ${theme.accent}33`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 24px 60px rgba(0,0,0,0.7)`,
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full" style={{ background: `${theme.accent}22`, color: theme.labelInk }}>
              {q.role_names[0] ?? 'Open'}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full" style={statusPillStyle(q.status)}>
              {q.status.replace('_', ' ')}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 4L4 12M4 4l8 8" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h2 id="quest-modal-title" className="text-white text-[26px] font-semibold mb-2">{q.name}</h2>
          <p className="text-[14px] mb-6" style={{ color: 'rgba(255,255,255,0.8)' }}>{q.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Reward</div>
              <div className="text-white font-semibold">{rewardText}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Due</div>
              <div className="text-white font-semibold">{remaining}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Cadence</div>
              <div className="text-white font-medium capitalize">{q.cadence}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Difficulty</div>
              <div className="text-white font-medium capitalize">{q.difficulty}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Rarity</div>
              <div className="text-white font-medium capitalize">{q.rarity}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Journey</div>
              <div className="text-white font-medium capitalize">{q.journey_role}</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Verification
            </div>
            <div className="text-[13px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Via <span className="font-mono">{q.verification_method}</span> · Actions:{' '}
              {q.qualifying_actions.map((a) => <span key={a} className="font-mono mr-2">{a}</span>)}
            </div>
          </div>

          <button
            type="button"
            className="w-full py-3 rounded-xl font-semibold text-[14px] transition-colors disabled:opacity-50"
            disabled={q.status !== 'open'}
            style={{
              background: q.status === 'open' ? theme.accent : 'rgba(255,255,255,0.1)',
              color: q.status === 'open' ? '#000' : 'rgba(255,255,255,0.6)',
            }}
          >
            {q.status === 'open' ? 'Start quest' : `Quest ${q.status.replace('_', ' ')}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function QuestsPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const { myXp } = useMyXp();
  const [mapOpen, setMapOpen] = useState(false);
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);

  const rawQueryHandle = typeof router.query.handle === 'string' ? router.query.handle : undefined;
  const queryHandle = rawQueryHandle?.replace(/\.zo$/i, '');
  const myHandle = (profile?.nickname || profile?.custom_nickname)?.replace(/\.zo$/i, '');
  const displayHandle = queryHandle || myHandle;

  // Today's Loot banner only renders when the drop is imminent (<24h away).
  const lootShown = isLootImminent(SAMPLE_LOOT.opens_at);

  // Quests sorted chronologically by upcoming deadline (soonest first).
  const sortedQuests = [...SAMPLE_QUESTS].sort(
    (a, b) => new Date(a.submission_deadline_at).getTime() - new Date(b.submission_deadline_at).getTime(),
  );

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
          {/* Global HUD — three anchored pills that share the same 44px height
              and glass treatment. Left: back + page title. Right: RankPill.
              Below right: nav rail. */}
          <PageHeaderPill title="Quests" />
          <TopBar xp={myXp?.xp ?? 0} rank={myXp?.rank ?? 0} avatarUrl={profile?.pfp_image || profile?.avatar?.image} />
          {/* SideNavRail self-positions globally (same slot on every page) */}
          <SideNavRail handle={displayHandle} onOpenMap={() => setMapOpen(true)} />

          <div className="px-6 md:px-10 pt-24 md:pt-28 pb-24 max-w-[840px] mx-auto md:pr-32">
            {/* Today's Loot — only when drop is imminent (<24h). Separate from quests. */}
            {lootShown && (
              <div className="mb-8">
                <TodaysLootCard
                  loot={SAMPLE_LOOT}
                  onPlay={() => {
                    // TODO: wire to loot claim flow when backend ships
                    alert('Loot box claim flow coming soon');
                  }}
                />
              </div>
            )}

            {/* Quests — chronologically, soonest deadline first */}
            <div className="mb-2 text-[11px] uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
              Open quests
            </div>
            <div className="flex flex-col gap-4">
              {sortedQuests.map((q) => (
                <QuestCard key={q.user_quest_id} q={q} onOpen={setActiveQuest} />
              ))}
            </div>
          </div>
        </div>

        <QuestDetailModal q={activeQuest} onClose={() => setActiveQuest(null)} />
        <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
      </main>
    </>
  );
}
