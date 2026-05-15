import { useEffect, useState } from 'react';
import Image from 'next/image';
import chestIcon from '../../assets/passport-lobby/treasure-chest.png';

export interface LootDrop {
  title: string;
  subtitle?: string;
  /** ISO timestamp when the loot box opens. */
  opens_at: string;
}

/** Imminent = drop opens within the next 24h. */
export function isLootImminent(opens_at: string): boolean {
  const ms = new Date(opens_at).getTime() - Date.now();
  return Number.isFinite(ms) && ms > 0 && ms < 24 * 60 * 60 * 1000;
}

/** Live HH:MM:SS countdown. Starts as "-- : -- : --" on SSR to avoid hydration mismatch. */
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

// Single source of the imminent loot drop. Stays hardcoded until a backend
// endpoint for loot/bounty events ships — both /passport/quests and the
// lobby QuestsDock consume this same constant.
export const SAMPLE_LOOT: LootDrop = {
  title: 'Daily Loot Box',
  subtitle: 'Participate daily by completing quests',
  opens_at: new Date(Date.now() + (8 * 60 + 6) * 60 * 1000 + 12_000).toISOString(),
};

export interface TodaysLootCardProps {
  loot: LootDrop;
  onPlay: () => void;
  /** `card` = 300×200 dock-card (lobby). `banner` = full-width horizontal
   *  layout for vertical lists (the /quests dashboard). */
  variant?: 'card' | 'banner';
}

// Same footprint as QuestCard (300×200) so the loot slots into the dock's
// horizontal scroller alongside the other quest cards. Amber gradient is the
// only visual marker that says "this is the loot, not a normal quest."
export function TodaysLootCard({ loot, onPlay, variant = 'card' }: TodaysLootCardProps) {
  const countdown = useCountdown(loot.opens_at);

  if (variant === 'banner') return <BannerLayout loot={loot} onPlay={onPlay} countdown={countdown} />;

  return (
    <button
      type="button"
      onClick={onPlay}
      className="relative shrink-0 flex flex-col overflow-hidden text-left transition-transform hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
      style={{
        width: 300,
        height: 200,
        background: 'linear-gradient(135deg, #F5B13A 0%, #E89515 55%, #C97A0A 100%)',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.35)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.18), 0 10px 28px rgba(160,90,10,0.35)',
      }}
    >
      <div aria-hidden className="pointer-events-none absolute top-2 right-12 text-[12px]" style={{ opacity: 0.55 }}>
        ✦
      </div>
      <div aria-hidden className="pointer-events-none absolute top-5 right-8 text-[9px]" style={{ opacity: 0.45 }}>
        ✦
      </div>

      {/* Cover area — chest icon centered, label chip top-left. */}
      <div className="relative" style={{ width: '100%', height: 96 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={chestIcon}
            alt=""
            width={84}
            height={84}
            style={{ width: 84, height: 84, objectFit: 'contain' }}
          />
        </div>
        <span
          className="absolute top-2 left-2 inline-flex items-center"
          style={{
            padding: '4px 9px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#1a0f00',
            background: 'rgba(255,255,255,0.92)',
            boxShadow: '0 2px 8px rgba(120,80,10,0.18)',
          }}
        >
          Loot Box
        </span>
      </div>

      {/* Body — title + meta + countdown / Play */}
      <div className="relative flex flex-col gap-1 px-3 py-2.5 flex-1 min-h-0">
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#1a0f00',
            lineHeight: 1.15,
          }}
        >
          {loot.title}
        </div>
        {loot.subtitle && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(26,15,0,0.78)',
              lineHeight: 1.25,
            }}
          >
            {loot.subtitle}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex flex-col leading-none">
            <span
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(26,15,0,0.55)',
              }}
            >
              Expires in
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#1a0f00',
                fontVariantNumeric: 'tabular-nums',
                marginTop: 2,
              }}
            >
              {countdown}
            </span>
          </div>
          <span
            className="inline-flex items-center gap-1.5"
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 800,
              color: '#E91E7A',
              background: '#fff',
              boxShadow: '0 2px 8px rgba(120,80,10,0.22)',
            }}
          >
            Play
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </button>
  );
}

// Full-width horizontal banner — used on the /quests dashboard where a small
// 300×200 card would look orphaned. Chest icon left, copy middle, countdown +
// Play right. Stacks on mobile so timer + Play sit below the copy.
function BannerLayout({
  loot,
  onPlay,
  countdown,
}: {
  loot: LootDrop;
  onPlay: () => void;
  countdown: string;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="relative w-full text-left rounded-[28px] overflow-hidden transition-transform active:scale-[0.99]"
      style={{
        background: 'linear-gradient(135deg, #F5B13A 0%, #E89515 55%, #C97A0A 100%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.2), 0 12px 32px rgba(160,90,10,0.32)',
        padding: '20px 24px',
      }}
    >
      <div aria-hidden className="absolute top-3 right-[42%] text-[14px]" style={{ opacity: 0.55 }}>
        ✦
      </div>
      <div aria-hidden className="absolute top-6 right-[36%] text-[10px]" style={{ opacity: 0.45 }}>
        ✦
      </div>

      <div className="flex items-center gap-5">
        <div className="flex-shrink-0" style={{ width: 88, height: 88 }}>
          <Image
            src={chestIcon}
            alt=""
            width={88}
            height={88}
            style={{ width: 88, height: 88, objectFit: 'contain' }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div
            className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2"
            style={{ color: 'rgba(0,0,0,0.55)' }}
          >
            Loot Box
          </div>
          <div className="text-[17px] md:text-[18px] font-bold leading-tight mb-0.5" style={{ color: '#1a0f00' }}>
            {loot.title}
          </div>
          {loot.subtitle && (
            <div className="text-[13px] font-semibold leading-tight" style={{ color: '#1a0f00' }}>
              {loot.subtitle}
            </div>
          )}
        </div>

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
