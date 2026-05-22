import { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { rubikClassName } from '../utils/font';
import chestIcon from '../../assets/passport-lobby/treasure-chest.png';
import { questDisplayTitle, type Quest, type QuestReward } from '../../data/quests';

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
  meta?: string;
  rewards: Reward[];
  cta?: { label: string; bg: string; color: string };
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
};

function rewardTile(reward: QuestReward | undefined): Reward | null {
  if (!reward) return null;
  const { type, amount } = reward;
  if (type === 'xp' && typeof amount === 'number') {
    return { icon: '✦', label: `${amount} XP`, color: '#FFD84D' };
  }
  if (type === 'bed_drop') {
    return { icon: '◈', label: 'Free Bed Drop', color: '#C9A7FF' };
  }
  if (type === 'discount' && typeof amount === 'number') {
    return { icon: '₹', label: `Rs. ${Math.round(amount / 100)}`, color: '#80E57B' };
  }
  if (type === 'credit' && typeof amount === 'number') {
    return { icon: '◉', label: `${amount} Zo Cred`, color: '#A7D921' };
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

  // Real staging payloads don't include `data` — Creator detection has to
  // ride on `q.category` directly. The IG connect prompt is the right CTA
  // for every Creator quest because IG-link is the gating step regardless
  // of the specific variant.
  const cta = q.category === 'Creator' ? CTA_STYLES.connect : CTA_STYLES.start;

  const rewards = q.rewards.map(rewardTile).filter(Boolean) as Reward[];

  // ends_at is CAS-only; the user-facing endpoint omits it. formatDeadline
  // returns undefined for absent values, so the deadline line disappears
  // gracefully on real data instead of breaking layout.
  const deadlineMeta = formatDeadline(q.ends_at);
  const meta = q.description || deadlineMeta;

  return {
    id: q.pid,
    category: `Today's ${roleStyle.noun} Quest`,
    categoryColor: roleStyle.color,
    isDaily: false,
    // Staging seeds most stay/trip rows with empty title — fall through to
    // inventory.name → destination.name → slug so the tile is readable.
    title: questDisplayTitle(q),
    meta,
    rewards,
    cta,
  };
}

const QUESTS: QuestDef[] = [
  {
    id: 'drink-water',
    category: 'Daily Tripper Quest',
    categoryColor: '#5A9BFF',
    isDaily: true,
    title: 'Drink Water',
    rewards: [{ icon: '✦', label: '200 XP', color: '#FFD84D' }],
  },
  {
    id: 'pahalgam',
    category: "Today's Tripper Quest",
    categoryColor: '#5A9BFF',
    title: 'Book a Stay in Pahalgam for 2 nights',
    meta: '23h 14m left',
    rewards: [
      { icon: '₹', label: 'Rs. 50', color: '#80E57B' },
      { icon: '✦', label: '150 XP', color: '#FFD84D' },
      { icon: '◈', label: 'Earn Pahalgam Stamp', color: '#C9A7FF' },
    ],
    cta: { label: 'Start Quest', bg: 'linear-gradient(180deg, #FF7A2E 0%, #E15400 100%)', color: '#FFFFFF' },
  },
  {
    id: 'connect-ig',
    category: "Today's Creator Quest",
    categoryColor: '#C26BE8',
    title: 'Connect Instagram',
    meta: "Unlock the daily reel brief and start earning on posts you'd already make.",
    rewards: [
      { icon: '◉', label: '100 On Connect', color: '#FFD84D' },
      { icon: '◉', label: 'Earn Creator Role', color: '#C26BE8' },
    ],
    cta: { label: 'Connect IG', bg: 'linear-gradient(180deg, #A855E8 0%, #7A22C2 100%)', color: '#FFFFFF' },
  },
  {
    id: 'share-passport',
    category: 'Daily Tribe Maker Quest',
    categoryColor: '#FF66C4',
    isDaily: true,
    title: 'Share your passport',
    rewards: [
      { icon: '✦', label: '200 XP', color: '#FFD84D' },
      { icon: '◉', label: 'Earn Tribe Builder Role', color: '#FF66C4' },
    ],
  },
];

function QuestTile({ quest }: { quest: QuestDef }) {
  return (
    <div
      className="flex flex-col gap-2 p-3"
      style={{
        background: 'rgba(15, 8, 22, 0.72)',
        backdropFilter: 'blur(8px)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div style={{ fontSize: 9, fontWeight: 700, color: quest.categoryColor, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {quest.category}
        </div>
        {quest.meta && !quest.isDaily && (
          <div style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>{quest.meta}</div>
        )}
        {quest.isDaily && (
          <div style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>Daily</div>
        )}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', lineHeight: '1.3em' }}>{quest.title}</div>
      {quest.meta && !quest.isDaily && (
        <div style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.58)', lineHeight: '1.35em' }}>
          {quest.meta}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {quest.rewards.map((r, i) => (
          <div key={i} className="flex items-center gap-1" style={{ fontSize: 10, color: r.color }}>
            <span aria-hidden style={{ fontSize: 11 }}>{r.icon}</span>
            <span style={{ fontWeight: 500 }}>{r.label}</span>
          </div>
        ))}
      </div>
      {quest.cta && (
        <button
          type="button"
          className="mt-1 self-start transition-all active:scale-[0.97]"
          style={{
            background: quest.cta.bg,
            color: quest.cta.color,
            fontSize: 11,
            fontWeight: 700,
            padding: '7px 14px',
            borderRadius: 999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}
        >
          {quest.cta.label}
        </button>
      )}
    </div>
  );
}

function QuestsBanner({ countdown }: { countdown: string }) {
  return (
    <div
      className="relative overflow-hidden flex items-center gap-3 p-3"
      style={{
        background: 'linear-gradient(135deg, #FFB547 0%, #FF8A26 55%, #FF6F17 100%)',
        borderRadius: 12,
        boxShadow: '0 4px 16px rgba(255,138,39,0.35), inset 0 1px 0 rgba(255,255,255,0.3)',
      }}
    >
      <div className="shrink-0" style={{ width: 44, height: 44 }}>
        <Image src={chestIcon} alt="" width={44} height={44} style={{ width: 44, height: 44, objectFit: 'contain' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 11, fontWeight: 700, color: '#2A1400', lineHeight: '1.25em' }}>
          Complete any Quest to win today's drops
        </div>
        <div style={{ fontSize: 9, fontWeight: 500, color: 'rgba(42,20,0,0.8)', marginTop: 3 }}>
          Free Bed · Rs7k bounties · Up to Rs.2000
        </div>
      </div>
      <div className="text-right shrink-0">
        <div style={{ fontSize: 14, fontWeight: 700, color: '#2A1400', fontVariantNumeric: 'tabular-nums' }}>
          {countdown}
        </div>
        <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(42,20,0,0.65)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Expires
        </div>
      </div>
    </div>
  );
}

/**
 * Daily quest modal — controlled by parent.
 * Mobile: bottom sheet (slides up from the tier nav area).
 * Desktop: centered dialog card.
 */
export function TreasureChestCard({
  open,
  onClose,
  activeCount: _activeCount,
  countdown = '08:06:12',
  quests: liveQuests,
}: TreasureChestCardProps) {
  void _activeCount;

  const tiles = useMemo<QuestDef[]>(() => {
    if (liveQuests && liveQuests.length > 0) {
      return liveQuests.map(questDefFromQuest);
    }
    return QUESTS;
  }, [liveQuests]);

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
      className={`fixed inset-0 z-[50] flex flex-col items-center justify-end md:justify-center ${rubikClassName}`}
      style={{ background: 'rgba(5,0,10,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full md:max-w-[480px] md:rounded-3xl flex flex-col gap-3 p-4"
        style={{
          background: '#1a0a20',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          border: '1px solid rgba(255,184,76,0.25)',
          // Sheet can reach the top of the viewport on tall phones (maxHeight:85vh on a short screen),
          // so pad for the notch too. Bottom pad keeps clear of the home indicator.
          paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          maxHeight: '85vh',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-1 right-1 flex items-center justify-center text-white/70 active:scale-90 transition-all"
          // Visual chrome is a 22px ×, but we expand the hit area to 44×44 (WCAG / Apple HIG min) with
          // transparent padding — looks the same, just easier to tap.
          style={{ width: 44, height: 44, fontSize: 22, lineHeight: 1, background: 'transparent' }}
        >
          ×
        </button>
        <QuestsBanner countdown={countdown} />
        <div
          className="flex flex-col gap-2 overflow-y-auto"
          style={{ maxHeight: '60vh' }}
        >
          {tiles.map((q) => (
            <QuestTile key={q.id} quest={q} />
          ))}
        </div>
      </div>
    </div>
  );
}
