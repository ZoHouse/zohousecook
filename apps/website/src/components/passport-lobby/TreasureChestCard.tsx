import { useEffect, type ReactNode } from 'react';
import { MeshGradient } from '@paper-design/shaders-react';
import { rubikClassName } from '../utils/font';
import { Chest3D } from './Chest3D';
import { LobbyRoom } from './LobbyRoom';
import { QuestsDock, type DockQuest } from './QuestsDock';

// Mirrors PassportLobby's iridescent palette so the loot box reads as the same
// surface — a deeper view of the lobby, not a separate sheet floating above it.
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
      {/* Iridescent pearl mesh — identical shader settings to the lobby root. */}
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
          ctaMobile={ctaMobile}
          ctaDesktop={ctaDesktop}
          belowCta={
            <QuestsDock hideLoot selectedQuest={selectedQuest} onSelect={onSelect} />
          }
        />
      </div>
    </div>
  );
}
