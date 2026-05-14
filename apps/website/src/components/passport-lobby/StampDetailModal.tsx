import { useEffect, useState } from 'react';
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
  onClose: () => void;
}

/**
 * Fullscreen centered stamp viewer — opens when a stamp tile is tapped in the
 * StampsDock. Same backdrop-blur + tap-to-dismiss pattern as the older
 * CountryModal that lived inside BadgesSection.
 */
export function StampDetailModal({ stamp, onClose }: StampDetailModalProps) {
  const [failed, setFailed] = useState(false);

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

  if (!stamp) return null;

  const url = stampUrlFor(stamp.name);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${stamp.name} stamp`}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-6 ${rubikClassName}`}
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
}
