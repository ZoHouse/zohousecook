import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { stampUrlFor } from '../../lib/passport/stampUrl';
import { rubikClassName, syneClassName } from '../utils/font';

export type StampLayer = 'city' | 'trip' | 'experience';

export interface StampDetail {
  /** Display name of the stamp (city / trip / experience). */
  name: string;
  /** Which carousel this stamp came from — drives the kicker + earn-context copy. */
  layer: StampLayer;
}

const LAYER_LABEL: Record<StampLayer, string> = {
  city: 'City',
  trip: 'Trip',
  experience: 'Experience',
};

const LAYER_EARN_HINT: Record<StampLayer, string> = {
  city: 'Earned by staying at a Zostel in this city.',
  trip: 'Earned by booking this Zo Trip.',
  experience: 'Earned by attending this event in person.',
};

export interface StampDetailModalProps {
  stamp: StampDetail | null;
  /** Owner's handle — used to build the share URL. Optional. */
  handle?: string;
  onClose: () => void;
}

/**
 * Fullscreen centered stamp viewer — opens when a stamp tile is tapped in the
 * StampsDock. Portaled to document.body so its z-index sits above the
 * page-level stacking contexts created by TopBar / LobbyRoom's
 * belowCta wrapper.
 */
export function StampDetailModal({ stamp, handle, onClose }: StampDetailModalProps) {
  const [failed, setFailed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal only renders after mount so SSR + first-paint stay clean.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset image error state whenever the stamp swaps so a previously-failed
  // tile doesn't poison the next one.
  useEffect(() => {
    setFailed(false);
  }, [stamp?.name]);

  // ESC closes the modal — matches the rest of the lobby modals.
  useEffect(() => {
    if (!stamp) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stamp, onClose]);

  if (!stamp || !mounted) return null;

  const url = stampUrlFor(stamp.name);

  const handleShare = async () => {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/@${handle || ''}/badges`
        : '';
    const layerLabel = LAYER_LABEL[stamp.layer].toLowerCase();
    const title = `${stamp.name} stamp · Zo Passport`;
    const text = handle
      ? `${handle} unlocked the ${stamp.name} ${layerLabel} stamp on Zo Passport`
      : `${stamp.name} ${layerLabel} stamp on Zo Passport`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url: shareUrl || undefined });
        return;
      } catch (err) {
        // User cancelled or share failed silently — fall through to clipboard.
        const e = err as { name?: string };
        if (e?.name === 'AbortError') return;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard && shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(`${stamp.name} stamp link copied`);
        return;
      } catch {
        /* fall through */
      }
    }
    toast.error('Could not share — try again');
  };

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${stamp.name} stamp`}
      className={`fixed inset-0 z-[1000] flex items-center justify-center p-6 ${rubikClassName}`}
      style={{ isolation: 'isolate' }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative max-w-xs w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: 22,
            border: '1px solid rgba(255,255,255,0.18)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.32), 0 30px 60px rgba(0,0,0,0.55)',
            padding: '28px 24px 24px',
          }}
        >
          {/* Share button — mirror of the CitizenCard share icon. Top-left so
              it doesn't fight the close button visually. */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void handleShare();
            }}
            aria-label="Share stamp"
            className="absolute z-10 flex items-center justify-center transition-transform active:scale-90"
            style={{
              top: 12,
              left: 12,
              width: 32,
              height: 32,
              borderRadius: 999,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff',
              lineHeight: 1,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close stamp"
            className="absolute z-10 flex items-center justify-center transition-transform active:scale-90"
            style={{
              top: 12,
              right: 12,
              width: 32,
              height: 32,
              borderRadius: 999,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff',
              lineHeight: 1,
              fontSize: 18,
            }}
          >
            <span aria-hidden style={{ marginTop: -1 }}>×</span>
          </button>

          {/* Stamp art — large square. Falls back to a typographic plate if
              the Zostel CDN doesn't have art for this slug yet. */}
          <div
            className="relative mx-auto"
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              maxWidth: 240,
              borderRadius: 18,
              overflow: 'hidden',
              background:
                'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.08), rgba(255,255,255,0))',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            {url && !failed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={`${stamp.name} stamp`}
                onError={() => setFailed(true)}
                referrerPolicy="no-referrer"
                style={{
                  width: '76%',
                  height: '76%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.45))',
                }}
              />
            ) : (
              <div
                className={syneClassName}
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.78)',
                  letterSpacing: '0.02em',
                  textAlign: 'center',
                  padding: '0 16px',
                }}
              >
                {stamp.name}
              </div>
            )}
          </div>

          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
              marginBottom: 6,
            }}
          >
            {LAYER_LABEL[stamp.layer]} stamp
          </div>
          <h2
            className={syneClassName}
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.15,
              margin: 0,
              marginBottom: 8,
            }}
          >
            {stamp.name}
          </h2>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.7)',
              margin: 0,
            }}
          >
            {LAYER_EARN_HINT[stamp.layer]}
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
