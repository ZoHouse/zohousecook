// apps/website/src/components/homecoming/spine/zones.ts
// See spec §3 (Named zones).

export type Zone = readonly [number, number]

export const ZONES = {
  idle:            [0.00, 0.05],
  descent:         [0.05, 0.10],
  proof1:          [0.10, 0.22],
  proof2:          [0.22, 0.34],
  proof3:          [0.34, 0.46],
  proof4:          [0.46, 0.55],
  portalApproach:  [0.55, 0.62],
  portalTraversal: [0.62, 0.70],
  chamberReveal:   [0.70, 0.85],
  issuance:        [0.85, 1.00],
} as const satisfies Record<string, Zone>

export type ZoneName = keyof typeof ZONES

/** Returns 0 before the zone, 0→1 inside it, 1 after. */
export function beatProgress(t: number, zone: Zone): number {
  const [a, b] = zone
  if (t <= a) return 0
  if (t >= b) return 1
  return (t - a) / (b - a)
}
