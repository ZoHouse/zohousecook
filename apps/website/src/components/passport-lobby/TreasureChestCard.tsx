import { useEffect, useMemo, type ReactNode } from 'react';
import { MeshGradient } from '@paper-design/shaders-react';
import { rubikClassName } from '../utils/font';
import { Chest3D } from './Chest3D';
import { LobbyRoom } from './LobbyRoom';
import { QuestsDock, type DockQuest } from './QuestsDock';
import { getDailyLootDrop, useCountdown } from './TodaysLootCard';

// Treasure-pearl palette — the lobby's iridescent pearl warmed with gold /
// champagne so the loot box reads as a richer, treasure-toned view of the same
// surface. Livelier params (below) keep the shader clearly alive rather than a
// near-flat ivory wash.
const TREASURE_PEARL_COLORS = [
  '#FBF8F4', // ivory base
  '#FBE9C7', // champagne gold
  '#F4D58A', // soft gold
  '#FFFFFF', // white highlight
  '#F2E0EC', // rose pearl
  '#FCEBB6', // warm gold cream
  '#E9D7F2', // lilac shimmer
  '#FBF8F4', // back to ivory
];
const INK = '#0A0A14';
const INK_MUTED = '#6B5B8E';

// Default CTA for the loot box when no quest is selected — a live countdown to
// the next daily reward announcement (4 PM IST rollover) rather than the
// lobby's "Get Unlimited Access" pill. Non-interactive: it's a status readout.
function RewardCountdownPill({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const drop = useMemo(() => getDailyLootDrop(), []);
  const countdown = useCountdown(drop.opens_at);
  const sm = size === 'sm';
  return (
    <div
      role="timer"
      aria-label="Time until reward announcement"
      className={`inline-flex items-center justify-center gap-2 ${rubikClassName}`}
      style={{
        height: sm ? 44 : 52,
        padding: sm ? '0 20px' : '0 26px',
        borderRadius: 999,
        background:
          'linear-gradient(135deg, #FFFFFF 0%, #F4E8D4 45%, #FBF8F4 100%)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow:
          '0 8px 24px rgba(160,120,40,0.18), inset 0 1px 0 rgba(255,255,255,0.95)',
      }}
    >
      <span
        style={{
          fontSize: sm ? 8 : 9,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: INK_MUTED,
          lineHeight: 1,
        }}
      >
        Rewards in
      </span>
      <span
        style={{
          fontSize: sm ? 15 : 17,
          fontWeight: 800,
          color: INK,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {countdown}
      </span>
    </div>
  );
}

export interface TreasureChestCardProps {
  open: boolean;
  onClose: () => void;
  /** Selected quest — owned by PassportLobby and shared with the lobby so the
      two surfaces stay in sync. Drives QuestsDock's swap to the centered
      QuestPanel. */
  selectedQuest?: DockQuest | null;
  /** Same participate-then-open bridge the lobby dock uses. */
  onSelect?: (q: DockQuest | null) => void;
  /** Morphing CTA rendered below the pedestal, exactly like the lobby. Built
      from the selected quest's action upstream; undefined → LobbyRoom falls
      back to the default "Get Unlimited Access" pill. */
  ctaMobile?: ReactNode;
  ctaDesktop?: ReactNode;
}

/**
 * Daily loot box — a full-screen takeover that mirrors the lobby composition
 * (LobbyRoom: hero on pedestal → morphing CTA → quests dock) with the 3D
 * treasure chest as the hero instead of the avatar. Because it reuses the same
 * pedestal, CTA, and dock as PassportLobby, opening the loot box reads as a
 * seamless continuation of the lobby rather than a different screen.
 */
export function TreasureChestCard({
  open,
  onClose,
  selectedQuest,
  onSelect,
  ctaMobile,
  ctaDesktop,
}: TreasureChestCardProps) {
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
      aria-label="Daily loot box"
      className={`fixed inset-0 z-[60] overflow-y-auto ${rubikClassName}`}
      style={{
        // Ivory anchor under the shader so the first paint / out-of-bounds
        // areas don't flash a different tone — same trick as PassportLobby.
        background: '#FBF8F4',
        WebkitTapHighlightColor: 'transparent',
        overscrollBehavior: 'none',
      }}
    >
      {/* Treasure-pearl mesh — same shader family as the lobby, warmed with
          gold and run livelier so the loot box clearly reads as a shader
          surface rather than flat ivory. */}
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <MeshGradient
          colors={TREASURE_PEARL_COLORS}
          speed={0.22}
          scale={0.6}
          distortion={0.28}
          swirl={0.32}
          grainMixer={0.05}
          grainOverlay={0.04}
          fit="cover"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%)',
          zIndex: 0,
        }}
      />

      {/* Close — pearl-glass chrome, 44px hit area (WCAG / Apple HIG). */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed top-4 right-4 md:top-6 md:right-6 z-[2] flex items-center justify-center active:scale-90 transition-all"
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

      {/* Lobby-mirror body: chest on pedestal → morphing CTA → quests dock.
          The dock hides its own loot tile (we're already inside the loot box)
          and swaps to the centered QuestPanel when a quest is selected. */}
      <div className="relative z-[1]">
        <LobbyRoom
          hero={<Chest3D size={260} />}
          travelersPill={null}
          ctaMobile={ctaMobile ?? <RewardCountdownPill size="sm" />}
          ctaDesktop={ctaDesktop ?? <RewardCountdownPill />}
          belowCta={
            <QuestsDock hideLoot selectedQuest={selectedQuest} onSelect={onSelect} />
          }
        />
      </div>
    </div>
  );
}
