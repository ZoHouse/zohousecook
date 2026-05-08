import { useState } from 'react';
import { useLobbyActivities, type LobbyActivityItem } from '../../hooks/useLobbyActivities';
import { formatDistance } from '../LiveLocationProvider';
import { rubikClassName } from '../utils/font';
import { ActivityDetailModal } from './ActivityDetailModal';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (sameDay(d, today)) return `Today · ${time}`;
  if (sameDay(d, tomorrow)) return `Tomorrow · ${time}`;
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) + ` · ${time}`;
}

function ActivityCard({
  item,
  onOpen,
}: {
  item: LobbyActivityItem;
  onOpen: (item: LobbyActivityItem) => void;
}) {
  const cover = item.coverImage;
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="relative shrink-0 flex flex-col overflow-hidden text-left transition-transform hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
      style={{
        width: 300,
        height: 200,
        // Pearl-white base with a faint iridescent shift across the surface.
        background:
          'linear-gradient(135deg, #FFFFFF 0%, #FBF8F4 50%, #F2E0EC 100%)',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.85)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.9), 0 10px 28px rgba(120,100,160,0.18)',
      }}
    >
      {/* Iridescent shimmer overlay */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(120deg, rgba(220,237,232,0.5) 0%, rgba(255,255,255,0) 35%, rgba(219,230,242,0.5) 100%)',
          mixBlendMode: 'overlay',
        }}
      />
      {cover && (
        <div className="relative" style={{ width: '100%', height: 116 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Soft pearl fade so text below reads cleanly on light theme. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.5) 100%)',
            }}
          />
        </div>
      )}
      <div className="relative flex flex-col gap-1.5 p-4 flex-1 min-h-0">
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#2A1B3D',
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.name}
        </div>
        <div className="flex items-center justify-between gap-2 mt-auto">
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B5B8E' }}>
            {formatWhen(item.date)}
            {typeof item.distance === 'number' && Number.isFinite(item.distance) && (
              <span style={{ color: '#9A8FB8' }}>
                {' · '}{formatDistance(item.distance)}
              </span>
            )}
          </span>
          {item.price > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#A86B2A' }}>
              ₹{item.price}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export interface ActivitiesDockProps {
  maxItems?: number;
}

/**
 * Bottom dock of nearby live activities. Bbox-scoped around the viewer's
 * live location (~50 km), sorted by soonest start_at.
 */
export function ActivitiesDock({ maxItems = 10 }: ActivitiesDockProps) {
  const { activities, isLoading, hasLocation } = useLobbyActivities(maxItems);
  const [openItem, setOpenItem] = useState<LobbyActivityItem | null>(null);

  if (activities.length === 0) {
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
          {!hasLocation
            ? 'Allow location in your browser to see nearby activities'
            : isLoading
            ? 'Loading nearby activities…'
            : 'No upcoming activities found'}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        aria-label="Nearby activities at Zo"
        className={`${rubikClassName} w-full max-w-[1200px] mx-auto`}
      >
        <div
          className="flex gap-3 overflow-x-auto px-3 md:px-6 pb-2"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {activities.map((item) => (
            <ActivityCard key={item.id} item={item} onOpen={setOpenItem} />
          ))}
        </div>
      </div>
      <ActivityDetailModal activity={openItem} onClose={() => setOpenItem(null)} />
    </>
  );
}
