// apps/website/src/lib/homecoming/beatTimeline.ts

export type BeatIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Beat {
  index: BeatIndex;
  // vh ranges; total rail = 800vh
  startVh: number;
  endVh: number;
  // normalized scroll [0..1] same ranges
  start: number;
  end: number;
  // obelisk beat? which one?
  obeliskIndex?: 0 | 1 | 2 | 3;
}

const TOTAL_VH = 800;
const toNormalized = (vh: number) => vh / TOTAL_VH;

export const BEATS: Beat[] = [
  { index: 0, startVh:   0, endVh:  50,  start: 0,                   end: toNormalized(50)  },
  { index: 1, startVh:  50, endVh: 150,  start: toNormalized(50),    end: toNormalized(150) },
  { index: 2, startVh: 150, endVh: 220,  start: toNormalized(150),   end: toNormalized(220) },
  { index: 3, startVh: 220, endVh: 320,  start: toNormalized(220),   end: toNormalized(320), obeliskIndex: 0 },
  { index: 4, startVh: 320, endVh: 420,  start: toNormalized(320),   end: toNormalized(420), obeliskIndex: 1 },
  { index: 5, startVh: 420, endVh: 520,  start: toNormalized(420),   end: toNormalized(520), obeliskIndex: 2 },
  { index: 6, startVh: 520, endVh: 640,  start: toNormalized(520),   end: toNormalized(640), obeliskIndex: 3 },
  { index: 7, startVh: 640, endVh: 800,  start: toNormalized(640),   end: 1                  },
];

export const RAIL_TOTAL_VH = TOTAL_VH;

/**
 * Given a normalized scroll (0..1), returns { beatIndex, beatProgress }.
 * beatProgress is 0..1 within the current beat.
 */
export function getBeatState(scroll: number): { beatIndex: BeatIndex; beatProgress: number } {
  const clamped = Math.max(0, Math.min(1, scroll));
  const beat = BEATS.find((b) => clamped >= b.start && clamped <= b.end) ?? BEATS[0];
  const span = beat.end - beat.start || 1;
  return {
    beatIndex: beat.index,
    beatProgress: (clamped - beat.start) / span,
  };
}
