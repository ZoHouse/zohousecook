import { useEffect } from 'react';
import type { LobbyActivityItem } from '../../hooks/useLobbyActivities';
import { formatDistance } from '../LiveLocationProvider';
import { rubikClassName } from '../utils/font';

interface ActivityDetailModalProps {
  activity: LobbyActivityItem | null;
  onClose: () => void;
}

function formatSlot(date: string, startTime?: string): string {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const d = new Date(`${date}T${startTime || '00:00:00'}`);
  const time = startTime ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';
  let day: string;
  if (sameDay(d, today)) day = 'Today';
  else if (sameDay(d, tomorrow)) day = 'Tomorrow';
  else day = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  return time ? `${day} · ${time}` : day;
}

function MetaPill({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full"
      style={{
        padding: '6px 12px',
        background: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(255,255,255,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 2px 10px rgba(120,100,160,0.12), inset 0 1px 0 rgba(255,255,255,0.95)',
        fontSize: 12,
        fontWeight: 600,
        color: '#0A0A14',
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden style={{ fontSize: 13 }}>
        {icon}
      </span>
      {children}
    </span>
  );
}

export function ActivityDetailModal({ activity, onClose }: ActivityDetailModalProps) {
  useEffect(() => {
    if (!activity) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [activity, onClose]);

  if (!activity) return null;

  const cover = activity.coverImage;
  const slots = activity.upcomingSkus ?? [];
  const nextSlot = slots[0];
  const description = activity.description?.trim() || activity.shortDescription?.trim();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={activity.name}
      className={`${rubikClassName} fixed inset-0 z-[80] flex items-stretch justify-center md:items-center`}
      onClick={onClose}
      style={{
        // Pearl-tinted backdrop, not slate.
        background: 'rgba(232, 220, 240, 0.55)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full md:w-[480px] md:max-h-[88vh] md:rounded-[28px] flex flex-col overflow-hidden"
        style={{
          // Pearl-white iridescent base — same palette as the lobby bg.
          background:
            'linear-gradient(160deg, #FFFFFF 0%, #FBF8F4 40%, #F2E0EC 75%, #DBE6F2 100%)',
          color: '#2A1B3D',
          boxShadow: '0 24px 80px rgba(120,100,160,0.35)',
        }}
      >
        {/* Iridescent shimmer overlay across the whole sheet. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(120deg, rgba(220,237,232,0.45) 0%, rgba(255,255,255,0) 35%, rgba(219,230,242,0.4) 100%)',
            mixBlendMode: 'overlay',
          }}
        />

        {/* Hero: cover image with bottom-fade to pearl. */}
        <div className="relative" style={{ height: 280, flexShrink: 0 }}>
          {cover && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={cover}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          {/* Soft fade to pearl base so the title sits readable on light theme. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 30%, rgba(251,248,244,0.7) 75%, #FBF8F4 100%)',
            }}
          />

          {/* Top-row: back button (left) + Zo wordmark (right). */}
          <div className="absolute top-4 right-4 left-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              aria-label="Back"
              className="inline-flex items-center gap-1.5 transition-transform active:scale-[0.96]"
              style={{
                height: 38,
                padding: '0 16px 0 12px',
                borderRadius: 999,
                // Pearl glass — matches the meta pills + lobby chrome.
                background: 'rgba(255,255,255,0.78)',
                color: '#0A0A14',
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1,
                border: '1px solid rgba(255,255,255,0.9)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow:
                  '0 6px 18px rgba(120,100,160,0.22), inset 0 1px 0 rgba(255,255,255,0.95)',
              }}
            >
              <span aria-hidden style={{ fontSize: 18, lineHeight: 1, marginTop: -1 }}>‹</span>
              Back
            </button>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.95)',
                textShadow: '0 1px 8px rgba(42,27,61,0.45)',
              }}
            >
              ZO WORLD
            </span>
          </div>

          {/* Title overlay sits low — on the faded-to-pearl band, near-black ink for legibility. */}
          <div className="absolute bottom-3 left-5 right-5">
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                lineHeight: 1.15,
                margin: 0,
                color: '#0A0A14',
                textShadow: '0 1px 12px rgba(255,255,255,0.7)',
              }}
            >
              {activity.name}
            </h2>
          </div>
        </div>

        {/* Body: scrollable. */}
        <div className="relative flex-1 overflow-y-auto px-5 pt-4 pb-6">
          {/* Meta pills row */}
          <div className="flex flex-wrap gap-2 mb-5">
            {nextSlot && (
              <MetaPill icon="🕐">{formatSlot(nextSlot.date, nextSlot.start_time)}</MetaPill>
            )}
            <MetaPill icon="📍">{activity.operatorName ?? activity.location}</MetaPill>
            {typeof activity.distance === 'number' && Number.isFinite(activity.distance) && (
              <MetaPill icon="🧭">{formatDistance(activity.distance)}</MetaPill>
            )}
            {activity.subcategory && <MetaPill icon="✨">{activity.subcategory}</MetaPill>}
          </div>

          {description && (
            <section className="mb-5">
              <SectionLabel>About</SectionLabel>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: '#0A0A14',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {description}
              </p>
            </section>
          )}

          {slots.length > 0 && (
            <section className="mb-5">
              <SectionLabel>Upcoming slots</SectionLabel>
              <div className="flex flex-col">
                {slots.map((sku, i) => (
                  <div
                    key={sku.pid || i}
                    className="flex items-center justify-between py-2.5"
                    style={{
                      borderBottom:
                        i === slots.length - 1 ? 'none' : '1px solid rgba(120,100,160,0.12)',
                    }}
                  >
                    <span style={{ fontSize: 14, color: '#0A0A14', fontWeight: 500 }}>
                      {formatSlot(sku.date, sku.start_time)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0A0A14' }}>
                      {sku.price > 0 ? `₹${sku.price}` : 'Free'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sticky footer CTA */}
        {activity.bookingUrl && (
          <div
            className="relative px-5 pt-3"
            style={{
              borderTop: '1px solid rgba(120,100,160,0.15)',
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
            }}
          >
            <a
              href={activity.bookingUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="relative flex items-center justify-center w-full font-semibold transition-all active:scale-[0.98] hover:brightness-105 overflow-hidden"
              style={{
                height: 52,
                borderRadius: 999,
                // Pearl-iridescent button — same palette as the lobby bg, with
                // a soft holographic shift across its surface.
                background:
                  'linear-gradient(135deg, #FFFFFF 0%, #F2E0EC 35%, #DBE6F2 70%, #DCEDE8 100%)',
                color: '#0A0A14',
                fontSize: 15,
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow:
                  '0 8px 24px rgba(120,100,160,0.28), inset 0 1px 0 rgba(255,255,255,0.95)',
              }}
            >
              <span aria-hidden style={{ marginRight: 8, fontSize: 14 }}>✦</span>
              Book on Zostel
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#6B5B8E',
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}
