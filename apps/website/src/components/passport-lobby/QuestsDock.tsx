import { useMemo, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useProfile } from '@zo/auth';
import { useQuests } from '../../hooks/useQuests';
import useInstagramConnect from '../../hooks/useInstagramConnect';
import ShareModal from '../passport/ShareModal';
import { fixAvatarUrl } from '../../hooks/usePublicPassport';
import {
  hasBookingData,
  hasGeomediaData,
  hasInstagramData,
  isBookingQuest,
  isGeomediaQuest,
  questDisplayTitle,
  type Quest,
} from '../../data/quests';
import { distanceMeters, formatDistance, useLiveLocation } from '../LiveLocationProvider';
import { rubikClassName, syneClassName } from '../utils/font';
import { CameraCaptureModal, type CaptureKind } from './CameraCaptureModal';
import {
  TodaysLootCard,
  isLootImminent,
  getDailyLootDrop,
} from './TodaysLootCard';

// Active = Live/Active template + the viewer's participation is still open.
// Staging seed returns status="Active" today; once Daya promotes to Live we
// keep accepting both so the lobby doesn't go dark mid-rollout.
function isActiveForViewer(q: Quest): boolean {
  if (q.status !== 'Live' && q.status !== 'Active') return false;
  const p = q.participations?.[0];
  if (!p) return false;
  return p.status === 'Assigned' || p.status === 'Submitted';
}

// Card/panel chip mirrors the server-side category (Tripper / Creator). The
// sub-kind (booking vs geomedia inside Tripper) only drives the action button.
function kindLabel(q: Quest): string {
  return q.category;
}

function kindGlyph(q: Quest): string {
  if (q.category === 'Creator') return '◐';
  if (q.category === 'Tripper') return '✦';
  return '•';
}

function formatReward(reward: { type?: string; amount?: number; label?: string }): string {
  if (typeof reward.amount === 'number' && reward.amount > 0) {
    return `+${reward.amount} ${(reward.type ?? '').toUpperCase()}`;
  }
  return reward.label ?? reward.type ?? '';
}

// Per-category placeholder gradient — used when a quest has no real cover URL
// yet. Keeps cards visually consistent without depending on a remote image.
function placeholderGradient(q: Quest): string {
  if (q.category === 'Creator') {
    return 'linear-gradient(135deg, #F4E1FF 0%, #E5D0FF 45%, #FBE7F2 100%)';
  }
  return 'linear-gradient(135deg, #DCEDE8 0%, #DBE6F2 45%, #F2E0EC 100%)';
}

function CoverArea({
  quest,
  height = 96,
  topLeft,
  topRight,
}: {
  quest: Quest;
  height?: number;
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
}) {
  const cover = (quest.data as { cover_image?: string } | undefined)?.cover_image;
  return (
    <div className="relative" style={{ width: '100%', height }}>
      {cover ? (
        <>
          <Image src={cover} alt="" fill sizes="300px" style={{ objectFit: 'cover' }} />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.5) 100%)',
            }}
          />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: placeholderGradient(quest) }}
        >
          <span
            style={{
              fontSize: 40,
              color: 'rgba(42,27,61,0.18)',
              lineHeight: 1,
              fontWeight: 800,
            }}
          >
            {kindGlyph(quest)}
          </span>
        </div>
      )}
      {topLeft && <div className="absolute top-2 left-2">{topLeft}</div>}
      {topRight && <div className="absolute top-2 right-2">{topRight}</div>}
    </div>
  );
}

function questCoords(q: Quest): { lat: number; lng: number } | null {
  // Public /api/v1/passport/quests/ doesn't expose `data` jsonb. Coords are
  // only available from CAS-bound surfaces or once the backend exposes them.
  if (!q.data) return null;
  if (hasGeomediaData(q)) return { lat: q.data.geomedia.lat, lng: q.data.geomedia.lng };
  const loc = (q.data as { location?: { lat?: number; lng?: number } }).location;
  if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
    return { lat: loc.lat, lng: loc.lng };
  }
  return null;
}

export type DockQuest = Quest & { distance?: number };

/** Describes the action a quest's CTA should take. Consumed by PassportLobby
    to render the morphed "Get Unlimited Access" button. */
export type QuestActionKind = 'instagram' | 'geomedia' | 'booking';
export interface QuestAction {
  kind: QuestActionKind;
  label: string;
  /** External link for `booking`. */
  href?: string;
  /** Accept attribute for `geomedia` (drives which native camera UI opens). */
  accept?: string;
}

/**
 * Self-contained quest action button — for surfaces without a morphing CTA
 * (e.g. /passport/quests). The lobby renders its own version via the gold
 * UnlimitedAccessCta, so it doesn't use this.
 */
export function QuestActionButton({ quest }: { quest: Quest }) {
  const ig = useInstagramConnect();
  const { profile } = useProfile();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const action = actionForQuest(quest, ig.isConnected);
  if (!action) return null;

  const handle =
    (profile?.profile as { custom_nickname?: string } | undefined)?.custom_nickname ||
    (profile?.profile as { nickname?: string } | undefined)?.nickname ||
    '';
  const avatarUrl = fixAvatarUrl(
    (profile?.profile as { avatar?: { image?: string } } | undefined)?.avatar?.image,
  ) || null;
  const displayName =
    (profile?.profile as { first_name?: string; last_name?: string } | undefined)?.first_name
      ? `${(profile.profile as { first_name?: string }).first_name}`
      : handle;

  const sharedClass =
    'relative inline-flex items-center justify-center font-semibold transition-all active:scale-[0.98] hover:brightness-105';
  const sharedStyle: React.CSSProperties = {
    height: 48,
    padding: '0 22px',
    borderRadius: 999,
    background:
      'linear-gradient(135deg, #FFFFFF 0%, #F2E0EC 35%, #DBE6F2 70%, #DCEDE8 100%)',
    color: '#0A0A14',
    fontSize: 14,
    border: '1px solid rgba(255,255,255,0.9)',
    boxShadow:
      '0 8px 24px rgba(120,100,160,0.28), inset 0 1px 0 rgba(255,255,255,0.95)',
  };

  if (action.kind === 'booking' && action.href) {
    return (
      <a href={action.href} target="_blank" rel="noreferrer noopener" className={sharedClass} style={sharedStyle}>
        <span aria-hidden style={{ marginRight: 8 }}>✦</span>
        {action.label}
      </a>
    );
  }
  if (action.kind === 'instagram') {
    const onClick = ig.isConnected ? () => setShareOpen(true) : () => ig.connect();
    return (
      <>
        <button type="button" onClick={onClick} className={sharedClass} style={sharedStyle}>
          <span aria-hidden style={{ marginRight: 8 }}>✦</span>
          {action.label}
        </button>
        <ShareModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          handle={handle}
          avatarUrl={avatarUrl}
          displayName={displayName}
          instagramOnly
        />
      </>
    );
  }
  // geomedia
  const allowed: CaptureKind[] = hasGeomediaData(quest)
    ? quest.data.geomedia.media_kinds.filter(
        (k): k is CaptureKind => k === 'photo' || k === 'video',
      )
    : ['photo'];
  return (
    <>
      <button type="button" onClick={() => setCameraOpen(true)} className={sharedClass} style={sharedStyle}>
        <span aria-hidden style={{ marginRight: 8 }}>📷</span>
        {action.label}
      </button>
      <CameraCaptureModal
        open={cameraOpen}
        allowed={allowed}
        title={questDisplayTitle(quest)}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => {
          toast.success(
            `Captured ${file.type.startsWith('video') ? 'video' : 'photo'}. Submission coming once the upload API is wired.`,
          );
        }}
      />
    </>
  );
}

export function actionForQuest(q: Quest, igConnected = false): QuestAction | null {
  // Archetype is derived from the FK tuple (category + destination / operator /
  // inventory) — all present on the public AND recommendations responses. The
  // `data` JSONB only enriches these (precise media kinds, booking href) and is
  // absent on recommendations, so every branch must resolve to a usable action
  // WITHOUT it — otherwise the lobby CTA can't morph and the quest is
  // impossible to start (the recommendations-in-lobby bug).

  // Creator = Instagram content quest — both the no-FK first-share and a
  // shoot-at-a-place. Connect when unlinked, submit the post once linked.
  if (q.category === 'Creator') {
    return { kind: 'instagram', label: igConnected ? 'Share' : 'Connect Instagram' };
  }
  // Tripper + destination only → capture media at the place. `data.geomedia`
  // gives exact media kinds on CAS surfaces; default to a photo capture when
  // it's absent (recommendations).
  if (isGeomediaQuest(q)) {
    const accept = hasGeomediaData(q)
      ? q.data.geomedia.media_kinds
          .map((k) => (k === 'video' ? 'video/*' : k === 'audio' ? 'audio/*' : 'image/*'))
          .join(',')
      : 'image/*';
    const isVideo = hasGeomediaData(q) && q.data.geomedia.media_kinds[0] === 'video';
    return {
      kind: 'geomedia',
      label: isVideo ? 'Open camera (video)' : 'Open camera',
      accept,
    };
  }
  // Tripper + operator/inventory → book the stay/trip. Use the explicit href on
  // CAS surfaces; recommendations omit it, so send the citizen to the Zostel
  // booking page.
  if (isBookingQuest(q)) {
    const href = hasBookingData(q) ? q.data.booking.href : 'https://www.zostel.com/';
    return { kind: 'booking', label: 'Book on Zostel', href };
  }
  return null;
}

const CHIP_STYLE: React.CSSProperties = {
  padding: '4px 9px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: '#0A0A14',
  background: 'rgba(255,255,255,0.85)',
  border: '1px solid rgba(255,255,255,0.95)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  boxShadow: '0 2px 8px rgba(120,100,160,0.15)',
};

function QuestCard({ quest, onOpen }: { quest: DockQuest; onOpen: (q: DockQuest) => void }) {
  const reward = quest.rewards?.[0];
  return (
    <button
      type="button"
      onClick={() => onOpen(quest)}
      className="relative shrink-0 flex flex-col overflow-hidden text-left transition-transform hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
      style={{
        width: 300,
        height: 200,
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FBF8F4 50%, #F2E0EC 100%)',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.85)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.9), 0 10px 28px rgba(120,100,160,0.18)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(120deg, rgba(220,237,232,0.5) 0%, rgba(255,255,255,0) 35%, rgba(219,230,242,0.5) 100%)',
          mixBlendMode: 'overlay',
        }}
      />
      <CoverArea
        quest={quest}
        topLeft={
          <span className="inline-flex items-center gap-1" style={CHIP_STYLE}>
            <span aria-hidden>{kindGlyph(quest)}</span>
            {kindLabel(quest)}
          </span>
        }
      />
      <div className="relative flex flex-col gap-1.5 px-4 py-3 flex-1 min-h-0">
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#2A1B3D',
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {questDisplayTitle(quest)}
        </div>
        <div className="flex items-center justify-between gap-2 mt-auto">
          <span style={{ fontSize: 11, fontWeight: 600, color: '#6B5B8E' }}>
            {(quest.data as { location?: { name?: string } } | undefined)?.location?.name ?? 'Anywhere'}
            {typeof quest.distance === 'number' && Number.isFinite(quest.distance) && (
              <span style={{ color: '#9A8FB8' }}>{' · '}{formatDistance(quest.distance)}</span>
            )}
          </span>
          {reward && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#A86B2A' }}>
              {formatReward(reward)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Inline panel — sits in the same dock slot as the cards and is the same
 * footprint as a card (300×200). The per-kind action button is the morphed
 * "Get Unlimited Access" CTA above (wired in PassportLobby).
 */
export function QuestPanel({
  quest,
  onBack,
}: {
  quest: DockQuest;
  onBack: () => void;
}) {
  const locName = (quest.data as { location?: { name?: string } } | undefined)?.location?.name;
  const reward = quest.rewards?.[0];

  // Compact per-kind body line so the panel stays at card height. Falls back
  // to the quest description when `data` jsonb isn't populated (public path).
  let bodyLine: string | null = null;
  if (hasInstagramData(quest)) bodyLine = quest.data.instagram.brief;
  else if (hasGeomediaData(quest)) bodyLine = quest.data.geomedia.prompt;
  else if (hasBookingData(quest) && typeof quest.data.booking.price === 'number' && quest.data.booking.price > 0) {
    bodyLine = `₹${quest.data.booking.price}`;
  } else if (quest.description) {
    bodyLine = quest.description;
  }

  return (
    <div
      aria-label={`Quest · ${questDisplayTitle(quest)}`}
      className={`${rubikClassName} w-full max-w-[1200px] mx-auto`}
    >
      <div className="flex justify-center px-3 md:px-6 pb-2">
        <div
          className="relative shrink-0 flex flex-col overflow-hidden"
          style={{
            width: 300,
            height: 200,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FBF8F4 50%, #F2E0EC 100%)',
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.9), 0 10px 28px rgba(120,100,160,0.18)',
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(120deg, rgba(220,237,232,0.5) 0%, rgba(255,255,255,0) 35%, rgba(219,230,242,0.5) 100%)',
              mixBlendMode: 'overlay',
            }}
          />

          <CoverArea
            quest={quest}
            topLeft={
              <span className="inline-flex items-center gap-1" style={CHIP_STYLE}>
                <span aria-hidden>{kindGlyph(quest)}</span>
                {kindLabel(quest)}
              </span>
            }
            topRight={
              <button
                type="button"
                onClick={onBack}
                aria-label="Back to quests"
                className="inline-flex items-center justify-center transition-transform active:scale-[0.96]"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.85)',
                  color: '#0A0A14',
                  fontSize: 16,
                  border: '1px solid rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 2px 8px rgba(120,100,160,0.15)',
                  lineHeight: 1,
                }}
              >
                <span aria-hidden style={{ marginTop: -2 }}>‹</span>
              </button>
            }
          />

          <div className="relative flex flex-col gap-1 px-4 py-3 flex-1 min-h-0">
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#2A1B3D',
                lineHeight: 1.2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {questDisplayTitle(quest)}
            </div>

            {bodyLine && (
              <p
                style={{
                  fontSize: 11,
                  lineHeight: 1.35,
                  color: '#6B5B8E',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {bodyLine}
              </p>
            )}

            <div className="flex items-center justify-between gap-2 mt-auto">
              <span style={{ fontSize: 11, fontWeight: 600, color: '#6B5B8E' }}>
                {locName ?? 'Anywhere'}
                {typeof quest.distance === 'number' && Number.isFinite(quest.distance) && (
                  <span style={{ color: '#9A8FB8' }}>{' · '}{formatDistance(quest.distance)}</span>
                )}
              </span>
              {reward && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#A86B2A' }}>
                  ✦ {formatReward(reward)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Role-tinted glass themes — translucent, backdrop-blurred so the warp
// shader behind the page shows through. Booking + Geomedia both = Tripper.
const ROLE_THEMES = {
  Tripper: {
    bg: 'linear-gradient(180deg, rgba(71,148,255,0.32) 0%, rgba(13,77,255,0.42) 100%)',
    ink: '#05143A',
    chipBg: 'rgba(5, 20, 58, 0.28)',
    soft: 'rgba(255,255,255,0.18)',
    tint: 'rgba(13,77,255,0.35)',
  },
  Creator: {
    bg: 'linear-gradient(180deg, rgba(168,73,224,0.30) 0%, rgba(92,14,146,0.42) 100%)',
    ink: '#1A0033',
    chipBg: 'rgba(26, 0, 51, 0.28)',
    soft: 'rgba(255,255,255,0.18)',
    tint: 'rgba(92,14,146,0.35)',
  },
} as const;

function themeForQuest(q: Quest) {
  return ROLE_THEMES[q.category] ?? ROLE_THEMES.Tripper;
}

/**
 * Full-width list card — role-tinted (blue Tripper / purple Creator), with
 * cover image, title, description, location · distance, and XP reward.
 * Used on the /@handle/quests page.
 */
export function QuestListCard({
  quest,
  onOpen,
}: {
  quest: DockQuest;
  onOpen: (q: DockQuest) => void;
}) {
  const theme = themeForQuest(quest);
  const reward = quest.rewards?.[0];
  const locName = (quest.data as { location?: { name?: string } } | undefined)?.location?.name;
  const cover = (quest.data as { cover_image?: string } | undefined)?.cover_image;
  return (
    <button
      type="button"
      onClick={() => onOpen(quest)}
      className="relative w-full overflow-hidden text-left transition-transform hover:-translate-y-0.5 active:scale-[0.995] cursor-pointer"
      style={{
        background: theme.bg,
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderRadius: 22,
        border: '1px solid rgba(255,255,255,0.28)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(255,255,255,0.08), 0 18px 40px rgba(0,0,0,0.35)',
      }}
    >
      {/* Specular highlight — top edge sheen so it reads as glass, not flat fill. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: 120,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)',
        }}
      />
      {/* Cover — image when set, else a soft tinted band with the kind glyph. */}
      <div className="relative" style={{ width: '100%', height: 150 }}>
        {cover ? (
          <Image src={cover} alt="" fill sizes="(max-width: 768px) 100vw, 720px" style={{ objectFit: 'cover' }} />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: theme.soft }}
          >
            <span style={{ fontSize: 48, color: 'rgba(255,255,255,0.35)', fontWeight: 800, lineHeight: 1 }}>
              {kindGlyph(quest)}
            </span>
          </div>
        )}
        {/* Bottom fade into the role tint so text below sits on a clean band. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.35) 100%)',
          }}
        />
        {/* Kind chip on cover */}
        <span
          className="absolute top-3 left-3 inline-flex items-center gap-1"
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: theme.ink,
            background: 'rgba(255,255,255,0.92)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          }}
        >
          <span aria-hidden>{kindGlyph(quest)}</span>
          {kindLabel(quest)}
        </span>
        {/* XP reward chip on cover */}
        {reward && (
          <span
            className="absolute top-3 right-3 inline-flex items-center"
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: theme.ink,
              background: '#FFE79E',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            }}
          >
            {formatReward(reward)}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="relative px-5 py-5 flex flex-col gap-2">
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.25, margin: 0 }}>
          {questDisplayTitle(quest)}
        </h3>
        {quest.description && (
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.78)',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {quest.description}
          </p>
        )}
        <div
          className="flex items-center gap-3 mt-1"
          style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.78)' }}
        >
          <span>📍 {locName ?? 'Anywhere'}</span>
          {typeof quest.distance === 'number' && Number.isFinite(quest.distance) && (
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>🧭 {formatDistance(quest.distance)}</span>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Full-screen quest detail — used on the /@handle/quests page (and any other
 * surface that wants a roomy single-quest view). Pearl canon: same shell as
 * lobby / badges / dashboard. Role color is reduced to a soft accent on the
 * chip + XP + hero glyph rather than dominating the surface.
 */
export function QuestFullView({
  quest,
  onBack,
  backLabel = 'Quests',
}: {
  quest: DockQuest;
  onBack: () => void;
  /** Label for the top-left back pill. Defaults to 'Quests' (the /passport/quests
      use). MapModal overrides with 'Map' since onBack returns the citizen to the map. */
  backLabel?: string;
}) {
  const theme = themeForQuest(quest);
  const reward = quest.rewards?.[0];
  const cover = (quest.data as { cover_image?: string } | undefined)?.cover_image;
  const locName = (quest.data as { location?: { name?: string } } | undefined)?.location?.name;

  return (
    <div className={`relative w-full max-w-[640px] mx-auto pb-32 md:pb-8 ${rubikClassName}`}>
      {/* Top bar: pearl-glass back pill — matches lobby pill treatment. */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label={`Back to ${backLabel.toLowerCase()}`}
          className="inline-flex items-center gap-1.5 transition-transform active:scale-[0.96]"
          style={{
            height: 36,
            padding: '0 14px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.7)',
            color: '#2A1B3D',
            fontSize: 13,
            fontWeight: 700,
            border: '1px solid rgba(255,255,255,0.85)',
            backdropFilter: 'blur(16px) saturate(140%)',
            WebkitBackdropFilter: 'blur(16px) saturate(140%)',
            boxShadow: '0 6px 18px rgba(120,100,160,0.18)',
          }}
        >
          <span aria-hidden style={{ fontSize: 18, lineHeight: 1, marginTop: -2 }}>‹</span>
          {backLabel}
        </button>
      </div>

      {/* SINGLE FUSED MODAL — image top, body bottom, CTA below.
          One border, one shadow, one continuous surface. */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 22,
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 14px 32px rgba(120,100,160,0.22)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.55) 100%)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        }}
      >
        {/* TOP REGION — image (or glyph hero) with chip + XP overlays.
            Taller on desktop so the modal doesn't feel squat in the wide layout. */}
        <div
          className="relative w-full overflow-hidden h-[200px] md:h-[280px]"
          style={{
            background: cover
              ? '#FBF8F4'
              : `linear-gradient(180deg, rgba(255,255,255,0.4) 0%, ${theme.tint} 100%)`,
          }}
        >
          {cover ? (
            <Image src={cover} alt="" fill sizes="(max-width: 768px) 100vw, 640px" style={{ objectFit: 'cover' }} priority />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 flex items-center justify-center"
            >
              <span
                className="text-[88px] md:text-[120px]"
                style={{ color: theme.ink, opacity: 0.45, fontWeight: 800, lineHeight: 1 }}
              >
                {kindGlyph(quest)}
              </span>
            </div>
          )}

          {/* Role chip — pearl pill, role-color text */}
          <span
            className="absolute top-3 left-3 inline-flex items-center gap-1"
            style={{
              padding: '5px 11px',
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: theme.ink,
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(255,255,255,0.95)',
              boxShadow: '0 4px 14px rgba(120,100,160,0.22)',
            }}
          >
            <span aria-hidden>{kindGlyph(quest)}</span>
            {kindLabel(quest)}
          </span>

          {/* XP pill — pearl with amber text */}
          {reward && (
            <span
              className="absolute top-3 right-3 inline-flex items-center"
              style={{
                padding: '5px 13px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
                color: '#A86B2A',
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(255,255,255,0.95)',
                boxShadow: '0 4px 14px rgba(160,100,40,0.18)',
              }}
            >
              {formatReward(reward)}
            </span>
          )}
        </div>

        {/* BOTTOM REGION — title + description + meta + per-kind detail.
            Tighter on mobile, more generous on desktop. */}
        <div className="px-5 pt-5 pb-6 md:px-7 md:pt-6 md:pb-7">
          <h2
            className={`${syneClassName} text-[22px] md:text-[28px]`}
            style={{
              fontWeight: 700,
              color: '#2A1B3D',
              lineHeight: 1.15,
              margin: 0,
              marginBottom: 12,
            }}
          >
            {questDisplayTitle(quest)}
          </h2>

          {quest.description && (
            <p
              className="text-[14px] md:text-[15px]"
              style={{
                lineHeight: 1.6,
                color: '#2A1B3D',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {quest.description}
            </p>
          )}

          {/* Meta row */}
          <div
            className="flex flex-wrap items-center gap-3 mt-3"
            style={{ fontSize: 12, fontWeight: 600, color: '#6B5B8E' }}
          >
            <span>📍 {locName ?? 'Anywhere'}</span>
            {typeof quest.distance === 'number' && Number.isFinite(quest.distance) && (
              <span style={{ color: '#9A8FB8' }}>🧭 {formatDistance(quest.distance)}</span>
            )}
          </div>

          {/* Per-kind detail — only rendered when `data` jsonb is populated
              (CAS-bound surfaces). The public /api/v1/passport/quests/
              response omits `data`, so these silently skip and the top-level
              description above carries the gist. */}
          {hasInstagramData(quest) && (
            <div className="mt-5">
              <SectionLabel>Rules</SectionLabel>
              <ul className="m-0 p-0 list-none flex flex-col gap-1.5" style={{ color: '#2A1B3D', fontSize: 13 }}>
                <li><span style={{ color: '#6B5B8E' }}>Brief · </span>{quest.data.instagram.brief}</li>
                {quest.data.instagram.post_type && (
                  <li><span style={{ color: '#6B5B8E' }}>Post type · </span>{quest.data.instagram.post_type}</li>
                )}
                {quest.data.instagram.mention && (
                  <li><span style={{ color: '#6B5B8E' }}>Mention · </span>{quest.data.instagram.mention}</li>
                )}
                {quest.data.instagram.hashtags?.length ? (
                  <li><span style={{ color: '#6B5B8E' }}>Hashtags · </span>{quest.data.instagram.hashtags.map((h) => `#${h}`).join(' ')}</li>
                ) : null}
              </ul>
            </div>
          )}

          {hasGeomediaData(quest) && (
            <div className="mt-5">
              <SectionLabel>Capture</SectionLabel>
              <p style={{ margin: 0, fontSize: 13, color: '#2A1B3D' }}>
                {quest.data.geomedia.prompt}
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: '#6B5B8E' }}>
                Within {Math.round(quest.data.geomedia.radius_m)}m · {quest.data.geomedia.media_kinds.join(' or ')}
              </p>
            </div>
          )}

          {hasBookingData(quest) && (
            <div className="mt-5">
              <SectionLabel>Booking</SectionLabel>
              <ul className="m-0 p-0 list-none flex flex-col gap-1.5" style={{ color: '#2A1B3D', fontSize: 13 }}>
                <li>
                  <span style={{ color: '#6B5B8E' }}>Provider · </span>
                  {quest.data.booking.provider === 'zostel' ? 'Zostel' : 'Zo'}
                </li>
                {typeof quest.data.booking.price === 'number' && quest.data.booking.price > 0 && (
                  <li><span style={{ color: '#6B5B8E' }}>Price · </span>₹{quest.data.booking.price}</li>
                )}
                {quest.data.booking.when?.date && (
                  <li>
                    <span style={{ color: '#6B5B8E' }}>When · </span>
                    {quest.data.booking.when.date}
                    {quest.data.booking.when.start_time ? ` · ${quest.data.booking.when.start_time}` : ''}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Sticky action button — pearl fade strip on mobile, in-flow on desktop. */}
      <div
        className="fixed left-0 right-0 bottom-0 px-6 pt-3 md:static md:px-0 md:pt-6"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)',
          background:
            'linear-gradient(180deg, rgba(251,248,244,0) 0%, rgba(251,248,244,0.92) 60%, rgba(251,248,244,1) 100%)',
          zIndex: 10,
        }}
      >
        <div className="max-w-[680px] mx-auto flex justify-center">
          <QuestActionButton quest={quest} />
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#6B5B8E',
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

export interface QuestsDockProps {
  maxItems?: number;
  /** Controlled — the selected quest is owned by PassportLobby so the lobby
      CTA can morph in sync with the dock. */
  selectedQuest?: DockQuest | null;
  onSelect?: (q: DockQuest | null) => void;
  /** Wires the "Daily Loot Box" tile's Play CTA to the TreasureChestCard
   *  modal owned by PassportLobby. Falls back to a toast when undefined so
   *  the dock can still render in isolation (e.g. PublicPassportView). */
  onOpenChest?: () => void;
}

/** Custom hook — returns the viewer's active quests sorted by distance. */
export function useActiveQuests(maxItems = 10): { quests: DockQuest[]; isLoading: boolean } {
  const { quests, isLoading } = useQuests();
  const { location } = useLiveLocation();
  return useMemo(() => {
    const active = quests.filter(isActiveForViewer).map((q) => {
      const coords = questCoords(q);
      const distance =
        location && coords
          ? distanceMeters(
              { lat: location.lat, long: location.long },
              { lat: coords.lat, long: coords.lng },
            )
          : undefined;
      return { ...q, distance } as DockQuest;
    });
    const sorted = active
      .sort((a, b) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      })
      .slice(0, maxItems);
    return { quests: sorted, isLoading };
  }, [quests, location, maxItems, isLoading]);
}

/**
 * Bottom dock of active quests for the viewer. Click a card → the horizontal
 * scroll is replaced by an inline detail panel in the same slot. The selected
 * quest is owned upstream (PassportLobby) so the page CTA can swap in sync.
 */
export function QuestsDock({ maxItems = 10, selectedQuest, onSelect, onOpenChest }: QuestsDockProps) {
  const { quests: visible, isLoading } = useActiveQuests(maxItems);
  const dailyLoot = useMemo(() => getDailyLootDrop(), []);
  const lootShown = isLootImminent(dailyLoot.opens_at);

  if (selectedQuest) {
    return <QuestPanel quest={selectedQuest} onBack={() => onSelect?.(null)} />;
  }

  // Empty state only fires when there's nothing at all — no loot AND no
  // active quests. Otherwise the loot card renders alongside whatever
  // active quests exist in the same horizontal scroller.
  if (visible.length === 0 && !lootShown) {
    return (
      <div className={`${rubikClassName} w-full max-w-[1200px] mx-auto px-3 md:px-6`}>
        <div
          className="flex items-center justify-center text-center"
          style={{
            height: 80,
            borderRadius: 12,
            border: '1px dashed rgba(120,100,160,0.25)',
            background: 'rgba(255,255,255,0.4)',
            color: '#6B5B8E',
            fontSize: 12,
          }}
        >
          {isLoading ? 'Loading active quests…' : 'No active quests yet'}
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label="Active quests"
      className={`${rubikClassName} w-full max-w-[1200px] mx-auto`}
    >
      <div
        className="flex gap-3 overflow-x-auto px-3 md:px-6 pb-2"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {lootShown && (
          <TodaysLootCard
            loot={dailyLoot}
            onPlay={onOpenChest ?? (() => toast('Loot box claim flow coming soon'))}
          />
        )}
        {visible.map((quest) => (
          <QuestCard key={quest.pid} quest={quest} onOpen={(q) => onSelect?.(q)} />
        ))}
      </div>
    </div>
  );
}
