# Homecoming Ceremony Engine — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Homecoming ceremony in `apps/website` as a scroll-driven 3D cinematic: Mars exterior with a chrome `\z/` monument, descent through red dust past 4 proof monoliths, pulsating stone portal, concentric chamber, particle Zobu figure, CTA that completes the one-time homecoming and lands the user on their `/@handle` passport page.

**Scope:** `/homecoming` is a **one-time onboarding ceremony**. The plan replaces the current page's rendering engine in-place while preserving every existing SSR gate (preview override, kill-switch, auth, identity, one-time-completion, backend payload fetch). Users who have already completed homecoming are still redirected to `/@{handle}`; `?replay=1` still bypasses the one-time gate; `?preview=1` (non-prod only) still bypasses auth and uses demo fixtures. On CTA click the ceremony writes `profile.homecoming_completed_at` via `POST /api/v1/passport/homecoming/complete/` (unless replay), then navigates to `/@{handle}`.

**Architecture:** One `<Canvas>` (React Three Fiber), one continuous 3D world, one spinal camera rig that rides a `CatmullRomCurve3` driven by normalized scroll progress `t ∈ [0, 1]`. All scene modules mount once and read their local animation from `t`. See spec §1–3 for the full mental model.

**Tech Stack:** Next.js 14.2 Pages Router (`apps/website` of the NX monorepo), React 18, TypeScript, Three.js 0.160.1, `@react-three/fiber` 8.18, `@react-three/drei` 9.122, `@react-three/postprocessing` 2.19, `zustand` (new), `detect-gpu` (new), Jest (existing monorepo test framework), Playwright (existing).

---

## Spec Reference

Full design spec: `docs/superpowers/specs/2026-04-23-homecoming-ceremony-engine-design.md`. Section numbers in this plan refer to that spec.

## Prerequisites (before starting Chunk 1)

- [ ] **Pre-plan blocker: `\z/` monument `.glb` audit** (spec §5.5). Confirm the existing model has separable pillar meshes and an emissive channel for the inner pulse. If fused, split and re-export before Chunk 3 begins. If no emissive channel, spec the alternate authoring path.
- [ ] **Pre-plan blocker: idle Zobu `.glb` audit** (spec §5.5). Confirm watertight + sub-50k triangles. Fix before Chunk 5 begins.
- [ ] **CTA destination confirmed: `/@{handle}`.** The `apps/website/next.config.js` rewrites `/@:handle` → `/passport?handle=:handle`, so navigating to `/@samurai` serves the passport page keyed to that handle. `CitizenshipCTA` and `CeremonyFallback` both build this route at click time from `data.user.handle`.
- [ ] **Branch:** `feat/homecoming-ceremony`. Three spec commits already landed (`9659b3a`, `013e6b4`, `25ffc84`). The old homecoming code in `apps/website/src/components/homecoming/` has uncommitted changes — **stash or commit** before Task 1.1 deletes everything.
- [ ] **Install new deps** — `zod` is needed for the `CeremonyDataSchema` validator, `zustand` for stores, `detect-gpu` for tier classification:
  ```bash
  cd /Users/samuraizan/samuraidojo/zohouse/zo.xyz/mono-front-main
  npm install zod zustand@^4.5 detect-gpu@^5.0
  ```
- [ ] **Upload existing `.glb`s to cdn.zo.xyz** before Chunk 3 begins. The engine loads from canonical URLs (no `public/` per memory `feedback_vercel_public_not_served`):
  - `cdn.zo.xyz/homecoming/models/z-monument.glb` — the chrome `\z/` monument (already in hand, verify Pre-plan blocker 1 passed)
  - `cdn.zo.xyz/homecoming/models/` — the idle Zobu (already in hand; final filename is `zobu-generic-v1.glb`, referenced as `cdn.zo.xyz/zobu/generic-v1.glb` per `data/demo.ts`)
  - `cdn.zo.xyz/homecoming/hdri/mars-warm-2k.hdr` — Mars exterior HDRI (Poly Haven source acceptable for v1)
  - `cdn.zo.xyz/homecoming/textures/mars-albedo-2k.jpg`, `mars-normal-2k.jpg` — Mars terrain textures (tileable)
  - `cdn.zo.xyz/homecoming/posters/idle-mars-2880x1800.jpg` — fallback poster (captured after Chunk 3 renders; placeholder is fine for dev)

  If any of these return 404 during dev, the corresponding module's loader throws and the fallback path activates — expected behavior for CI without CDN, but the visual walkthrough in Task 6.7 requires these assets live.
- [ ] **E2E framework status:** the monorepo does NOT yet have an `apps/website-e2e` project. Playwright smoke tests (Task 6.8) require scaffolding `website-e2e` via `npx nx g @nx/playwright:configuration website-e2e` **or** demoting Task 6.8 to a follow-up. Default: demote and file follow-up. Skip Task 6.8 unless the scaffold already exists.

## File Structure Summary (spec §7)

All new files live under `apps/website/src/components/homecoming/` unless noted. Every existing file in that directory is deleted in Task 1.1. The page route lives at `apps/website/src/pages/homecoming/index.tsx`; tests live at `apps/website/src/__tests__/homecoming/`.

## Skill References

- Test-driven workflow for pure modules: @superpowers:test-driven-development
- Verification before marking tasks done: @superpowers:verification-before-completion
- Visual-first workflow for 3D components: use the local dev server (`npx nx serve website` → http://localhost:4202/homecoming) and the `?debug=1&t=<value>` deep-link (implemented in Task 1.12). 3D modules do NOT get unit tests; they get a visual checklist per task.

---

## Chunk 1: Clean slate + foundations (pure modules)

Deletes the prototype and establishes all non-R3F scaffolding: types, constants, spine construction, stores, data, copy, hooks. Every task in this chunk follows strict TDD with Jest.

### Task 1.1: Delete the old homecoming directory

**Files:**
- Delete: `apps/website/src/components/homecoming/` (entire directory, 32 files — see spec §7 Deletions)

- [ ] **Step 1: Verify no uncommitted changes left in that directory**

```bash
cd /Users/samuraizan/samuraidojo/zohouse/zo.xyz/mono-front-main
git status apps/website/src/components/homecoming/
```

If anything shows as modified or untracked that you care about, stash or commit on a separate branch first. Otherwise proceed.

- [ ] **Step 2: Delete the directory**

```bash
git rm -rf apps/website/src/components/homecoming/
```

- [ ] **Step 3: Grep the rest of the app for orphan imports from the deleted code**

```bash
grep -rn "from.*components/homecoming\|from.*lib/homecoming" apps/website/src --include="*.tsx" --include="*.ts"
```

Known orphan surface (confirmed before plan was written):
- `apps/website/src/lib/homecoming/beatTimeline.ts` — **deleted in Task 6.6**
- `apps/website/src/lib/homecoming/endpoints.ts` — **kept** (repointed internally), still used by the new CTA + SSR
- `apps/website/src/lib/homecoming/fixtures.ts` — **deleted in Task 6.6** (replaced by `data/demo.ts`)
- `apps/website/src/lib/homecoming/obeliskPositions.ts` — **deleted in Task 6.6**
- `apps/website/src/lib/homecoming/rankBands.ts` — **deleted in Task 6.6**
- `apps/website/src/pages/homecoming/index.tsx` — **rewritten in Task 6.5** (imports `<Ceremony>` instead of `<HomecomingStage>`)

The old `lib/homecoming/` existed only to serve the prototype. We keep `endpoints.ts` because the new engine still hits the same two passport endpoints (`/api/v1/passport/homecoming/` and `/api/v1/passport/homecoming/complete/`). Everything else is deleted. Compile errors from `endpoints.ts` importing deleted `HomecomingPayload` / `HomecomingCompleteResponse` types are fixed in Task 6.6 Step 1 by rehoming those interfaces into `endpoints.ts` itself.

- [ ] **Step 4: Build to verify the error surface is only the expected orphans**

```bash
npx nx build website 2>&1 | head -80
```

Expected: compile errors limited to the 6 files above. Any *other* errors indicate the deletion hit something unexpected — investigate.

- [ ] **Step 5: Commit**

```bash
git add -A apps/website/src/components/homecoming/
git commit -m "feat(homecoming): delete prototype, begin rewrite"
```

---

### Task 1.2: `types.ts`

**Files:**
- Create: `apps/website/src/components/homecoming/types.ts`
- Test: `apps/website/src/__tests__/homecoming/schema.test.ts`

- [ ] **Step 1: Write the failing schema test**

```ts
// apps/website/src/__tests__/homecoming/schema.test.ts
import { CeremonyDataSchema } from '../../components/homecoming/types'

describe('CeremonyDataSchema', () => {
  const valid = {
    user: { id: 'u', handle: 'samurai', displayName: 'Samurai' },
    proofs: [
      { id: 'destinations', label: 'Destinations', count: 47 },
      { id: 'nights',       label: 'Nights',       count: 112 },
      { id: 'zostels',      label: 'Zostels',      count: 23 },
      { id: 'tribe',        label: 'Tribe',        count: 184 },
    ],
    zobu: { modelUrl: 'https://cdn.zo.xyz/zobu/generic-v1.glb' },
  }

  it('accepts a valid ceremony data object', () => {
    expect(() => CeremonyDataSchema.parse(valid)).not.toThrow()
  })

  it('rejects when proofs.length !== 4', () => {
    const bad = { ...valid, proofs: valid.proofs.slice(0, 3) }
    expect(() => CeremonyDataSchema.parse(bad)).toThrow()
  })

  it('rejects an unknown proof id', () => {
    const bad = { ...valid, proofs: [{ ...valid.proofs[0], id: 'snacks' }, ...valid.proofs.slice(1)] }
    expect(() => CeremonyDataSchema.parse(bad)).toThrow()
  })

  it('rejects duplicate proof ids (two destinations)', () => {
    const bad = {
      ...valid,
      proofs: [valid.proofs[0], valid.proofs[0], valid.proofs[2], valid.proofs[3]],
    }
    expect(() => CeremonyDataSchema.parse(bad)).toThrow(/exactly one of each/i)
  })

  it('rejects missing category (no tribe)', () => {
    const bad = {
      ...valid,
      proofs: [valid.proofs[0], valid.proofs[1], valid.proofs[2], { ...valid.proofs[0] }],
    }
    expect(() => CeremonyDataSchema.parse(bad)).toThrow(/exactly one of each/i)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL (module not found)**

```bash
npx nx test website --testPathPattern=schema.test.ts
```

- [ ] **Step 3: Implement `types.ts`**

```ts
// apps/website/src/components/homecoming/types.ts
import { z } from 'zod'

export const ProofIdSchema = z.enum(['destinations', 'nights', 'zostels', 'tribe'])
export type ProofId = z.infer<typeof ProofIdSchema>

export const ProofDataSchema = z.object({
  id: ProofIdSchema,
  label: z.string().min(1),
  count: z.number().int().nonnegative(),
  accent: z.string().optional(),
})
export type ProofData = z.infer<typeof ProofDataSchema>

export const ZobuDataSchema = z.object({
  modelUrl: z.string().url(),
})
export type ZobuData = z.infer<typeof ZobuDataSchema>

const REQUIRED_PROOF_IDS: ReadonlySet<ProofId> = new Set([
  'destinations', 'nights', 'zostels', 'tribe',
])

export const CeremonyDataSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    handle: z.string().min(1),
    displayName: z.string().min(1),
  }),
  proofs: z.array(ProofDataSchema).length(4).superRefine((proofs, ctx) => {
    const seen = new Set(proofs.map((p) => p.id))
    if (seen.size !== proofs.length || ![...REQUIRED_PROOF_IDS].every((id) => seen.has(id))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'proofs must contain exactly one of each id: destinations, nights, zostels, tribe',
      })
    }
  }),
  zobu: ZobuDataSchema,
  issuedAt: z.string().optional(),
})
export type CeremonyData = z.infer<typeof CeremonyDataSchema>
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx nx test website --testPathPattern=schema.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add apps/website/src/components/homecoming/types.ts apps/website/src/__tests__/homecoming/schema.test.ts
git commit -m "feat(homecoming): add CeremonyData schema + tests"
```

---

### Task 1.3: `constants.ts`

**Files:**
- Create: `apps/website/src/components/homecoming/constants.ts`

No tests — constants only, no behavior to test.

- [ ] **Step 1: Create file**

```ts
// apps/website/src/components/homecoming/constants.ts
// See spec §5 (Named constants) for rationale.

export const SCROLL_SPACER_VH = 600  // total scroll distance; governs t sensitivity

/**
 * Post-ceremony destination. /@handle is rewritten by Next to /passport?handle=:handle
 * in apps/website/next.config.js, so the user lands on their own passport page.
 */
export function buildHandleHome(handle: string): string {
  return `/@${handle}`
}

// Redirect targets used by SSR on auth/identity/one-time/error paths.
export const REDIRECT_AUTH = '/zo-auth?next=/homecoming'
export const REDIRECT_ONBOARDING = '/onboarding?next=/homecoming'
// Completion & failsafe redirects use buildHandleHome(handle) above.

export const INTRO_PHASE_B_MS = 1400   // wireframe hold
export const INTRO_PHASE_C_MS = 1500   // materialization + camera pan
export const INTRO_SKIP_COMPRESS_MS = 300  // fast-forward duration on user intent

export const DAMPING_LAMBDA = 8  // damp() smoothing for tLerp

export const CHROME_STONE_PULSE_BASELINE = 0.25
export const CHROME_STONE_PULSE_AMPLITUDE = 0.75
export const CHROME_STONE_PULSE_FREQ_HZ = 0.6  // at rest
export const CHROME_STONE_PULSE_FREQ_HZ_HOVERED = 1.6

export const LOAD_TIMEOUT_MS = 10_000  // spec §6: fall back if assets don't load in 10s
export const COMPLETE_ENDPOINT = '/api/v1/passport/homecoming/complete/'
export const HOMECOMING_ENDPOINT = '/api/v1/passport/homecoming/'
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/constants.ts
git commit -m "feat(homecoming): add named constants (scroll, intro, pulse)"
```

---

### Task 1.4: `spine/zones.ts` + `useBeatProgress`

**Files:**
- Create: `apps/website/src/components/homecoming/spine/zones.ts`
- Create: `apps/website/src/components/homecoming/hooks/useBeatProgress.ts`
- Test: `apps/website/src/__tests__/homecoming/beatProgress.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/website/src/__tests__/homecoming/beatProgress.test.ts
import { beatProgress, ZONES } from '../../components/homecoming/spine/zones'

describe('beatProgress', () => {
  it('returns 0 before the zone', () => {
    expect(beatProgress(0.00, ZONES.proof1)).toBe(0)
    expect(beatProgress(0.09, ZONES.proof1)).toBe(0)
  })
  it('returns 1 after the zone', () => {
    expect(beatProgress(0.90, ZONES.proof1)).toBe(1)
  })
  it('interpolates 0 → 1 across the zone', () => {
    const [a, b] = ZONES.proof1
    const mid = (a + b) / 2
    expect(beatProgress(a, ZONES.proof1)).toBe(0)
    expect(beatProgress(mid, ZONES.proof1)).toBeCloseTo(0.5, 5)
    expect(beatProgress(b, ZONES.proof1)).toBe(1)
  })
  it('handles exact zone boundaries', () => {
    expect(beatProgress(0.10, ZONES.proof1)).toBe(0)
    expect(beatProgress(0.22, ZONES.proof1)).toBe(1)
  })
  it('ZONES contract: all zones are well-ordered and within [0,1]', () => {
    Object.values(ZONES).forEach(([a, b]) => {
      expect(a).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThanOrEqual(1)
      expect(b).toBeGreaterThan(a)
    })
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx nx test website --testPathPattern=beatProgress.test.ts
```

- [ ] **Step 3: Implement `zones.ts`**

```ts
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
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx nx test website --testPathPattern=beatProgress.test.ts
```

- [ ] **Step 5: Implement `useBeatProgress` hook (reads from the progress store)**

Defer this until Task 1.7 lands the store. Leave a stub:

```ts
// apps/website/src/components/homecoming/hooks/useBeatProgress.ts
// Populated in Task 1.7 once useCeremonyProgress exists.
export {}
```

- [ ] **Step 6: Commit**

```bash
git add apps/website/src/components/homecoming/spine/zones.ts \
        apps/website/src/components/homecoming/hooks/useBeatProgress.ts \
        apps/website/src/__tests__/homecoming/beatProgress.test.ts
git commit -m "feat(homecoming): ZONES + beatProgress helper with tests"
```

---

### Task 1.5: `spine/waypoints.ts`

**Files:**
- Create: `apps/website/src/components/homecoming/spine/waypoints.ts`

- [ ] **Step 1: Create file (spec §3 waypoint table verbatim)**

```ts
// apps/website/src/components/homecoming/spine/waypoints.ts
import type { Vector3Tuple } from 'three'

export type Waypoint = {
  u: number               // progress along the spine ∈ [0,1]
  pos: Vector3Tuple
  lookAt: Vector3Tuple
  note: string
}

export const WAYPOINTS: readonly Waypoint[] = [
  { u: 0.00, pos: [0,   2,  14],   lookAt: [0,   3,   0], note: 'idle front-on' },
  { u: 0.08, pos: [0,  -2,  10],   lookAt: [0,  -5,   0], note: 'tilt into dust' },
  { u: 0.15, pos: [0, -10,   8],   lookAt: [0, -15,   0], note: 'approach proof 1' },
  { u: 0.27, pos: [0, -28,   8],   lookAt: [0, -35,   0], note: 'approach proof 2' },
  { u: 0.39, pos: [0, -48,   8],   lookAt: [0, -55,   0], note: 'approach proof 3' },
  { u: 0.50, pos: [0, -68,   8],   lookAt: [0, -75,   0], note: 'approach proof 4' },
  { u: 0.56, pos: [0, -86,   6],   lookAt: [0, -95,   0], note: 'post-proof4 settle, begin pitch' },
  { u: 0.60, pos: [0, -98,   3],   lookAt: [0,-110,   0], note: 'tip to top-down' },
  { u: 0.62, pos: [0,-110,   0],   lookAt: [0,-160,   0], note: 'enter portal' },
  { u: 0.70, pos: [0,-135,   0],   lookAt: [0,-160,   0], note: 'through rings' },
  { u: 0.82, pos: [0,-150,   2],   lookAt: [0,-158,   0], note: 'ease off-axis, see Zobu' },
  { u: 1.00, pos: [0.5,-148, 3.5], lookAt: [0,-155,   0], note: 'chamber settle' },
]
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/spine/waypoints.ts
git commit -m "feat(homecoming): spine waypoint list"
```

---

### Task 1.6: `spine/buildSpine.ts`

**Files:**
- Create: `apps/website/src/components/homecoming/spine/buildSpine.ts`
- Test: `apps/website/src/__tests__/homecoming/spine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/website/src/__tests__/homecoming/spine.test.ts
import { Vector3 } from 'three'
import { buildSpine } from '../../components/homecoming/spine/buildSpine'
import { WAYPOINTS } from '../../components/homecoming/spine/waypoints'

describe('buildSpine', () => {
  const spine = buildSpine(WAYPOINTS)

  it('exposes positionSpine and lookAtSpine curves', () => {
    expect(spine.positionSpine).toBeDefined()
    expect(spine.lookAtSpine).toBeDefined()
  })

  it('getPointAt(0) matches the first waypoint', () => {
    const p = spine.positionSpine.getPointAt(0, new Vector3())
    expect(p.x).toBeCloseTo(0, 3)
    expect(p.y).toBeCloseTo(2, 3)
    expect(p.z).toBeCloseTo(14, 3)
  })

  it('getPointAt(1) matches the last waypoint', () => {
    const p = spine.positionSpine.getPointAt(1, new Vector3())
    expect(p.x).toBeCloseTo(0.5, 3)
    expect(p.y).toBeCloseTo(-148, 3)
    expect(p.z).toBeCloseTo(3.5, 3)
  })

  it('getPointAt(0.5) returns a finite Vector3', () => {
    const p = spine.positionSpine.getPointAt(0.5, new Vector3())
    expect(Number.isFinite(p.x)).toBe(true)
    expect(Number.isFinite(p.y)).toBe(true)
    expect(Number.isFinite(p.z)).toBe(true)
  })

  it('y coordinate is monotonically decreasing (never overshoots up)', () => {
    let prevY = Infinity
    for (let u = 0; u <= 1; u += 0.05) {
      const p = spine.positionSpine.getPointAt(u, new Vector3())
      expect(p.y).toBeLessThanOrEqual(prevY + 1e-3)
      prevY = p.y
    }
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx nx test website --testPathPattern=spine.test.ts
```

- [ ] **Step 3: Implement `buildSpine.ts`**

```ts
// apps/website/src/components/homecoming/spine/buildSpine.ts
import { CatmullRomCurve3, Vector3 } from 'three'
import type { Waypoint } from './waypoints'

export type Spine = {
  positionSpine: CatmullRomCurve3
  lookAtSpine: CatmullRomCurve3
}

export function buildSpine(waypoints: readonly Waypoint[]): Spine {
  const positionPoints = waypoints.map(w => new Vector3(...w.pos))
  const lookAtPoints = waypoints.map(w => new Vector3(...w.lookAt))
  const positionSpine = new CatmullRomCurve3(positionPoints, false, 'catmullrom', 0.3)
  const lookAtSpine = new CatmullRomCurve3(lookAtPoints, false, 'catmullrom', 0.3)
  return { positionSpine, lookAtSpine }
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx nx test website --testPathPattern=spine.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add apps/website/src/components/homecoming/spine/buildSpine.ts \
        apps/website/src/__tests__/homecoming/spine.test.ts
git commit -m "feat(homecoming): buildSpine returns two CatmullRom curves with tests"
```

---

### Task 1.6a: `spine/sampleSpine.ts` — preserve authored `u` timing

Problem to fix (spec §3 misdirection): `CatmullRomCurve3.getPointAt(u)` samples by arc-length, which discards the authored `u` values on waypoints. That means `t = 0.15` would NOT land on "approach proof 1" — it would land wherever arc-length `0.15` happens to be along the curve. Zones (`proof1 = [0.10, 0.22]`) assume authored timing.

This task adds a helper that maps `authoredU` → curve parameter via a piecewise-linear table built from the waypoint list.

**Files:**
- Create: `apps/website/src/components/homecoming/spine/sampleSpine.ts`
- Test: `apps/website/src/__tests__/homecoming/spine.test.ts` (extend existing)

- [ ] **Step 1: Extend the failing test**

Append to `spine.test.ts`:

```ts
import { sampleSpineAt } from '../../components/homecoming/spine/sampleSpine'

describe('sampleSpineAt (authored-u mapping)', () => {
  const { positionSpine, lookAtSpine } = buildSpine(WAYPOINTS)
  const out = new Vector3()

  it('sampling at authored u of waypoint i returns that waypoint position', () => {
    for (const w of WAYPOINTS) {
      sampleSpineAt(positionSpine, WAYPOINTS, w.u, out)
      expect(out.x).toBeCloseTo(w.pos[0], 2)
      expect(out.y).toBeCloseTo(w.pos[1], 2)
      expect(out.z).toBeCloseTo(w.pos[2], 2)
    }
  })

  it('interpolates smoothly between waypoints', () => {
    // halfway between waypoint[2] (u=0.15) and waypoint[3] (u=0.27) is u=0.21
    sampleSpineAt(positionSpine, WAYPOINTS, 0.21, out)
    expect(Number.isFinite(out.y)).toBe(true)
    expect(out.y).toBeLessThan(WAYPOINTS[2].pos[1])       // below proof 1 anchor
    expect(out.y).toBeGreaterThan(WAYPOINTS[3].pos[1])    // above proof 2 anchor
  })

  it('clamps out-of-range u', () => {
    sampleSpineAt(positionSpine, WAYPOINTS, -0.5, out)
    expect(out.y).toBeCloseTo(WAYPOINTS[0].pos[1], 2)
    sampleSpineAt(positionSpine, WAYPOINTS, 1.5, out)
    expect(out.y).toBeCloseTo(WAYPOINTS[WAYPOINTS.length - 1].pos[1], 2)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx nx test website --testPathPattern=spine.test.ts
```

- [ ] **Step 3: Implement**

```ts
// apps/website/src/components/homecoming/spine/sampleSpine.ts
import type { CatmullRomCurve3, Vector3 } from 'three'
import type { Waypoint } from './waypoints'

/**
 * Maps authored `u` (as declared on Waypoint) to the curve's own parameter
 * (which runs evenly across control points: waypoint i is at i/(n-1)), then
 * samples the curve at that position via `getPoint` (NOT `getPointAt` — we
 * want the curve parameter, not arc-length, so authored timing is preserved).
 *
 * Writes into `out` to avoid allocating. Clamps authoredU to [0, 1].
 */
export function sampleSpineAt(
  curve: CatmullRomCurve3,
  waypoints: readonly Waypoint[],
  authoredU: number,
  out: Vector3,
): Vector3 {
  const n = waypoints.length
  if (n === 0) return out
  if (authoredU <= waypoints[0].u) return curve.getPoint(0, out)
  if (authoredU >= waypoints[n - 1].u) return curve.getPoint(1, out)

  // Find the segment [i, i+1] where waypoints[i].u <= authoredU < waypoints[i+1].u
  for (let i = 0; i < n - 1; i++) {
    const a = waypoints[i].u
    const b = waypoints[i + 1].u
    if (authoredU <= b) {
      const segProgress = (authoredU - a) / (b - a)
      // Curve parameter at waypoint i is i / (n - 1); each segment is that wide.
      const curveT = (i + segProgress) / (n - 1)
      return curve.getPoint(curveT, out)
    }
  }
  return curve.getPoint(1, out)
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/website/src/components/homecoming/spine/sampleSpine.ts \
        apps/website/src/__tests__/homecoming/spine.test.ts
git commit -m "feat(homecoming): sampleSpineAt preserves authored waypoint timing"
```

---

### Task 1.7: `state/useCeremonyProgress.ts` + wire `useBeatProgress`

**Files:**
- Create: `apps/website/src/components/homecoming/state/useCeremonyProgress.ts`
- Modify: `apps/website/src/components/homecoming/hooks/useBeatProgress.ts`

No direct test — zustand store behavior covered by integration tests later.

- [ ] **Step 1: Create the progress store**

```ts
// apps/website/src/components/homecoming/state/useCeremonyProgress.ts
import { create } from 'zustand'

type ProgressStore = {
  t: number
  tLerp: number
  uMaterialization: number
  introDone: boolean
  setT: (t: number) => void
  setTLerp: (t: number) => void
  setMaterialization: (v: number) => void
  setIntroDone: () => void
  reset: () => void
}

export const useCeremonyProgress = create<ProgressStore>((set) => ({
  t: 0,
  tLerp: 0,
  uMaterialization: 0,
  introDone: false,
  setT: (t) => set({ t }),
  setTLerp: (tLerp) => set({ tLerp }),
  setMaterialization: (uMaterialization) => set({ uMaterialization }),
  setIntroDone: () => set({ introDone: true }),
  reset: () => set({ t: 0, tLerp: 0, uMaterialization: 0, introDone: false }),
}))
```

- [ ] **Step 2: Replace `useBeatProgress` stub with the real hook**

```ts
// apps/website/src/components/homecoming/hooks/useBeatProgress.ts
import { useCeremonyProgress } from '../state/useCeremonyProgress'
import { beatProgress, type Zone } from '../spine/zones'

/**
 * Read a smoothed beat progress value without causing React re-renders.
 * Callers use this inside useFrame so zustand is subscribed imperatively.
 */
export function readBeatProgress(zone: Zone): number {
  return beatProgress(useCeremonyProgress.getState().tLerp, zone)
}

/** React-subscribed variant for HUD/CTA that need to re-render on zone entry. */
export function useBeatProgress(zone: Zone): number {
  return useCeremonyProgress((s) => beatProgress(s.tLerp, zone))
}
```

- [ ] **Step 3: Typecheck**

```bash
npx nx build website --skip-nx-cache 2>&1 | tail -20
```

Expected: either a clean build (if pages/homecoming is already set up for the new world) or the same orphan errors from Task 1.1. No new errors.

- [ ] **Step 4: Commit**

```bash
git add apps/website/src/components/homecoming/state/useCeremonyProgress.ts \
        apps/website/src/components/homecoming/hooks/useBeatProgress.ts
git commit -m "feat(homecoming): progress store + beat progress hooks"
```

---

### Task 1.8: `state/useCeremonyInteraction.ts`

**Files:**
- Create: `apps/website/src/components/homecoming/state/useCeremonyInteraction.ts`

- [ ] **Step 1: Create the interaction store**

```ts
// apps/website/src/components/homecoming/state/useCeremonyInteraction.ts
import { create } from 'zustand'

type InteractionStore = {
  monumentHovered: boolean
  audioEnabled: boolean
  ctaClicked: boolean
  setMonumentHovered: (v: boolean) => void
  toggleAudio: () => void
  fireCTA: () => void
}

export const useCeremonyInteraction = create<InteractionStore>((set) => ({
  monumentHovered: false,
  audioEnabled: false,
  ctaClicked: false,
  setMonumentHovered: (monumentHovered) => set({ monumentHovered }),
  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
  fireCTA: () => set({ ctaClicked: true }),
}))
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/state/useCeremonyInteraction.ts
git commit -m "feat(homecoming): interaction store (hover, audio, cta)"
```

---

### Task 1.9: `data/demo.ts`

**Files:**
- Create: `apps/website/src/components/homecoming/data/demo.ts`

- [ ] **Step 1: Create demo data**

```ts
// apps/website/src/components/homecoming/data/demo.ts
import type { CeremonyData } from '../types'

export const DEMO_CEREMONY: CeremonyData = {
  user: { id: 'demo', handle: 'samurai', displayName: 'Samurai' },
  proofs: [
    { id: 'destinations', label: 'Destinations', count: 47 },
    { id: 'nights',       label: 'Nights',       count: 112 },
    { id: 'zostels',      label: 'Zostels',      count: 23 },
    { id: 'tribe',        label: 'Tribe',        count: 184 },
  ],
  zobu: { modelUrl: 'https://cdn.zo.xyz/zobu/generic-v1.glb' },
}

// Zero-state variant for preview — flip in getServerSideProps via ?zero=1.
export const ZERO_STATE_CEREMONY: CeremonyData = {
  user: { id: 'new', handle: 'newcitizen', displayName: 'New Citizen' },
  proofs: [
    { id: 'destinations', label: 'Destinations', count: 0 },
    { id: 'nights',       label: 'Nights',       count: 0 },
    { id: 'zostels',      label: 'Zostels',      count: 0 },
    { id: 'tribe',        label: 'Tribe',        count: 0 },
  ],
  zobu: { modelUrl: 'https://cdn.zo.xyz/zobu/generic-v1.glb' },
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/data/demo.ts
git commit -m "feat(homecoming): demo + zero-state ceremony fixtures"
```

---

### Task 1.10: `copy/getProofCopy.ts`

**Files:**
- Create: `apps/website/src/components/homecoming/copy/getProofCopy.ts`
- Test: `apps/website/src/__tests__/homecoming/getProofCopy.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/website/src/__tests__/homecoming/getProofCopy.test.ts
import { getProofCopy } from '../../components/homecoming/copy/getProofCopy'
import type { ProofData } from '../../components/homecoming/types'

describe('getProofCopy', () => {
  it('returns "Label · <count>" for populated proofs', () => {
    const p: ProofData = { id: 'destinations', label: 'Destinations', count: 47 }
    expect(getProofCopy(p)).toBe('Destinations · 47')
  })

  it('returns zero-state copy for count=0 destinations', () => {
    const p: ProofData = { id: 'destinations', label: 'Destinations', count: 0 }
    expect(getProofCopy(p)).toBe('Destinations · Your first one awaits')
  })

  it('returns zero-state copy for count=0 nights', () => {
    const p: ProofData = { id: 'nights', label: 'Nights', count: 0 }
    expect(getProofCopy(p)).toBe('Nights · The archive is listening')
  })

  it('returns zero-state copy for count=0 zostels', () => {
    const p: ProofData = { id: 'zostels', label: 'Zostels', count: 0 }
    expect(getProofCopy(p)).toBe('Zostels · 108+ waypoints ready')
  })

  it('returns zero-state copy for count=0 tribe', () => {
    const p: ProofData = { id: 'tribe', label: 'Tribe', count: 0 }
    expect(getProofCopy(p)).toBe('Tribe · You are the first signal')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx nx test website --testPathPattern=getProofCopy.test.ts
```

- [ ] **Step 3: Implement**

```ts
// apps/website/src/components/homecoming/copy/getProofCopy.ts
import type { ProofData } from '../types'

const ZERO_STATE_COPY: Record<ProofData['id'], string> = {
  destinations: 'Your first one awaits',
  nights:       'The archive is listening',
  zostels:      '108+ waypoints ready',
  tribe:        'You are the first signal',
}

export function getProofCopy(proof: ProofData): string {
  if (proof.count === 0) return `${proof.label} · ${ZERO_STATE_COPY[proof.id]}`
  return `${proof.label} · ${proof.count}`
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/website/src/components/homecoming/copy/getProofCopy.ts \
        apps/website/src/__tests__/homecoming/getProofCopy.test.ts
git commit -m "feat(homecoming): getProofCopy with zero-state branches"
```

---

### Task 1.11: `hooks/useScrollListener.ts`

**Files:**
- Create: `apps/website/src/components/homecoming/hooks/useScrollListener.ts`

- [ ] **Step 1: Create hook**

```ts
// apps/website/src/components/homecoming/hooks/useScrollListener.ts
import { useEffect } from 'react'
import { useCeremonyProgress } from '../state/useCeremonyProgress'

type Options = { enabled?: boolean }

/**
 * Attaches a passive scroll listener that writes normalized t to the store.
 * When `enabled` is false, the listener is skipped — used so the fallback
 * path doesn't install global scroll handlers.
 */
export function useScrollListener(
  spacerRef: React.RefObject<HTMLElement>,
  { enabled = true }: Options = {},
) {
  useEffect(() => {
    if (!enabled) return
    const onScroll = () => {
      const el = spacerRef.current
      if (!el) return
      const scrollable = el.offsetHeight - window.innerHeight
      if (scrollable <= 0) return
      const raw = window.scrollY / scrollable
      const clamped = Math.max(0, Math.min(1, raw))
      useCeremonyProgress.getState().setT(clamped)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()  // prime on mount
    return () => window.removeEventListener('scroll', onScroll)
  }, [spacerRef, enabled])
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/hooks/useScrollListener.ts
git commit -m "feat(homecoming): useScrollListener writes normalized t"
```

---

### Task 1.12: `hooks/useDeviceTier.ts` + debug param helper

**Files:**
- Create: `apps/website/src/components/homecoming/hooks/useDeviceTier.ts`

- [ ] **Step 1: Create hook**

```ts
// apps/website/src/components/homecoming/hooks/useDeviceTier.ts
import { useEffect, useState } from 'react'
import { getGPUTier } from 'detect-gpu'

export type DeviceTier = 0 | 1 | 2 | 3  // 0 = unknown/low, 3 = high

export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>(0)
  useEffect(() => {
    let cancelled = false
    getGPUTier().then((r) => {
      if (cancelled) return
      // r.tier is 0-3 from detect-gpu; treat 0/unknown as tier 1 (spec §6)
      const t = (r.tier === 0 ? 1 : r.tier) as DeviceTier
      setTier(t)
    }).catch(() => setTier(1))
    return () => { cancelled = true }
  }, [])
  return tier
}

/** Parse `?debug=1` and `?t=<float>` from window.location. Returns null if not present. */
export function readDebugParams(): { debug: boolean; t: number | null } {
  if (typeof window === 'undefined') return { debug: false, t: null }
  const p = new URLSearchParams(window.location.search)
  const debug = p.get('debug') === '1'
  const tRaw = p.get('t')
  const t = tRaw !== null && !Number.isNaN(parseFloat(tRaw))
    ? Math.max(0, Math.min(1, parseFloat(tRaw)))
    : null
  return { debug, t }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/hooks/useDeviceTier.ts
git commit -m "feat(homecoming): device tier + debug URL param helpers"
```

---

### Task 1.13: `hooks/useIntroTimeline.ts`

**Files:**
- Create: `apps/website/src/components/homecoming/hooks/useIntroTimeline.ts`

- [ ] **Step 1: Create hook (spec §2.5)**

```ts
// apps/website/src/components/homecoming/hooks/useIntroTimeline.ts
import { useEffect, useRef } from 'react'
import { useProgress } from '@react-three/drei'
import { useCeremonyProgress } from '../state/useCeremonyProgress'
import {
  INTRO_PHASE_B_MS,
  INTRO_PHASE_C_MS,
  INTRO_SKIP_COMPRESS_MS,
} from '../constants'

type Options = { enabled?: boolean }

/**
 * Runs on mount before scroll is live:
 *   Phase A: wait for drei useProgress loaded === true
 *   Phase B: hold wireframe for INTRO_PHASE_B_MS
 *   Phase C: tween uMaterialization 0 → 1 over INTRO_PHASE_C_MS
 *   Phase D: setIntroDone(true)
 *
 * Listens at window for wheel/touchmove intent to fast-forward
 * (overflow: hidden on body prevents actual scroll; we watch intent).
 *
 * When `enabled` is false (fallback path), all effects no-op so the overflow
 * lock never gets installed on devices that are supposed to see the static
 * poster.
 */
export function useIntroTimeline({ enabled = true }: Options = {}) {
  const loaded = useProgress((s) => s.loaded > 0 && s.active === false)
  const rafRef = useRef<number | null>(null)
  const skipRef = useRef(false)

  useEffect(() => {
    if (!enabled) return
    const onIntent = () => { skipRef.current = true }
    window.addEventListener('wheel', onIntent, { passive: true })
    window.addEventListener('touchmove', onIntent, { passive: true })
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('wheel', onIntent)
      window.removeEventListener('touchmove', onIntent)
      // Restore scroll if we unmount before intro finished (e.g., nav away).
      document.body.style.overflow = ''
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || !loaded) return

    const startB = performance.now()
    const phaseBMs = () => (skipRef.current ? INTRO_SKIP_COMPRESS_MS * 0.3 : INTRO_PHASE_B_MS)
    const phaseCMs = () => (skipRef.current ? INTRO_SKIP_COMPRESS_MS * 0.7 : INTRO_PHASE_C_MS)

    const tick = (now: number) => {
      const { setMaterialization, setIntroDone } = useCeremonyProgress.getState()
      const elapsed = now - startB
      const bEnd = phaseBMs()
      const cEnd = bEnd + phaseCMs()

      if (elapsed < bEnd) {
        setMaterialization(0)
      } else if (elapsed < cEnd) {
        const u = (elapsed - bEnd) / phaseCMs()
        // ease-out cubic
        const eased = 1 - Math.pow(1 - u, 3)
        setMaterialization(eased)
      } else {
        setMaterialization(1)
        setIntroDone()
        document.body.style.overflow = ''
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [loaded, enabled])
}
```

- [ ] **Step 2: Typecheck**

```bash
npx nx build website 2>&1 | tail -10
```

Expected: the orphan import errors from Task 1.1 still exist (they'll be resolved in Chunk 6). No *new* errors from this hook.

- [ ] **Step 3: Commit**

```bash
git add apps/website/src/components/homecoming/hooks/useIntroTimeline.ts
git commit -m "feat(homecoming): useIntroTimeline (wireframe → materialize)"
```

---

## Chunk 2: Materials & camera infrastructure

Chrome-stone material factory, dust shader, and the three R3F components that are everywhere (camera rig, environment, post-FX). No unit tests in this chunk — visual review only. All tasks follow the write-compile-render-review flow with an explicit visual checklist.

### Task 2.1: `materials/ChromeStoneMaterial.ts`

**Files:**
- Create: `apps/website/src/components/homecoming/materials/ChromeStoneMaterial.ts`

- [ ] **Step 1: Create the factory (spec §4.1)**

```ts
// apps/website/src/components/homecoming/materials/ChromeStoneMaterial.ts
import { Color, MeshPhysicalMaterial, Texture } from 'three'

export type ChromeStoneOptions = {
  albedo?: Texture
  normalMap?: Texture
  roughnessMap?: Texture
  envMapIntensity?: number
  pulseColor?: Color
  pulseBaseline?: number
  pulseAmplitude?: number
  pulsePhase?: number
}

/**
 * Pure factory. Returns a MeshPhysicalMaterial configured for chrome-stone
 * with userData slots holding pulse state.
 *
 * Consumers are responsible for writing `material.emissiveIntensity` inside
 * their own useFrame loop, typically via `applyChromeStonePulse(material)`
 * below. Three.js does not have a material-level per-frame hook, so the
 * pattern is: factory seeds state + helper, consumers drive it.
 */
export function createChromeStoneMaterial(opts: ChromeStoneOptions = {}): MeshPhysicalMaterial {
  const {
    albedo,
    normalMap,
    roughnessMap,
    envMapIntensity = 1.4,
    pulseColor = new Color(0xffd9a8),
    pulseBaseline = 0.25,
    pulseAmplitude = 0.75,
    pulsePhase = 0,
  } = opts

  const mat = new MeshPhysicalMaterial({
    color: 0x8a6a5a,
    map: albedo,
    normalMap,
    roughnessMap,
    metalness: 1.0,
    roughness: 0.15,
    envMapIntensity,
    emissive: pulseColor,
    emissiveIntensity: pulseBaseline,
  })

  mat.userData.pulseBaseline = pulseBaseline
  mat.userData.pulseAmplitude = pulseAmplitude
  mat.userData.pulsePhase = pulsePhase
  mat.userData.pulseHoverBoost = 0
  mat.userData.pulseProximity = 0
  mat.userData.uMaterialization = 1

  return mat
}

/**
 * Call every frame from the consumer's useFrame. Computes emissiveIntensity
 * from the material's userData slots and writes it to the material. Consumers
 * mutate userData.pulseHoverBoost / pulseProximity / uMaterialization as needed.
 */
export function applyChromeStonePulse(mat: MeshPhysicalMaterial): void {
  const b = (mat.userData.pulseBaseline ?? 0.25) as number
  const a = (mat.userData.pulseAmplitude ?? 0.75) as number
  const boost = (mat.userData.pulseHoverBoost ?? 0) as number
  const proximity = (mat.userData.pulseProximity ?? 0) as number
  const uMat = (mat.userData.uMaterialization ?? 1) as number
  mat.emissiveIntensity = (b + a * (boost + proximity)) * uMat
}
```

- [ ] **Step 2: Typecheck**

```bash
npx nx build website 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add apps/website/src/components/homecoming/materials/ChromeStoneMaterial.ts
git commit -m "feat(homecoming): ChromeStoneMaterial factory with inner-pulse emissive"
```

---

### Task 2.2: `materials/DustShader.ts`

**Files:**
- Create: `apps/website/src/components/homecoming/materials/DustShader.ts`

- [ ] **Step 1: Create dust shader (raymarched on tier 3, billboard on tier 2/1)**

```ts
// apps/website/src/components/homecoming/materials/DustShader.ts
import { ShaderMaterial, Color, Vector2, AdditiveBlending, DoubleSide } from 'three'

export type DustMode = 'raymarch' | 'billboard'

export function createDustShader(mode: DustMode): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    // DoubleSide so the dust renders while the camera is inside the slab
    // (camera travels from y=-2 to y=-86 *through* this volume).
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color(0xc46144) },
      uDensity: { value: mode === 'raymarch' ? 0.035 : 0.05 },
      uScroll: { value: new Vector2(0.02, 0.015) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uDensity;
      uniform vec2 uScroll;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      // Cheap 3D simplex noise approximation (Ashima's open-source variant would go here
      // in production — using layered 2D for simplicity).
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise2(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
      }

      void main() {
        vec2 uv = vUv + uScroll * uTime;
        float n = 0.0;
        float amp = 0.5;
        vec2 p = uv * 4.0;
        for (int i = 0; i < 4; i++) {
          n += noise2(p) * amp;
          p *= 2.02;
          amp *= 0.5;
        }
        float alpha = smoothstep(0.2, 0.8, n) * uDensity * 20.0;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/materials/DustShader.ts
git commit -m "feat(homecoming): DustShader (layered noise for Mars dust)"
```

---

### Task 2.3: `canvas/CameraRig.tsx`

**Files:**
- Create: `apps/website/src/components/homecoming/canvas/CameraRig.tsx`

- [ ] **Step 1: Create the rig (spec §3)**

```tsx
// apps/website/src/components/homecoming/canvas/CameraRig.tsx
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Vector3, MathUtils } from 'three'
import { useCeremonyProgress } from '../state/useCeremonyProgress'
import { WAYPOINTS } from '../spine/waypoints'
import { buildSpine } from '../spine/buildSpine'
import { sampleSpineAt } from '../spine/sampleSpine'
import { DAMPING_LAMBDA } from '../constants'
import { readDebugParams } from '../hooks/useDeviceTier'

const tmpPos = new Vector3()
const tmpLook = new Vector3()

export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const { positionSpine, lookAtSpine } = useMemo(() => buildSpine(WAYPOINTS), [])
  const debugTRef = useRef<number | null>(null)

  // Honor ?t=<value> for isolated beat review
  useEffect(() => {
    const { t } = readDebugParams()
    debugTRef.current = t
  }, [])

  useFrame((_, delta) => {
    const state = useCeremonyProgress.getState()
    const target = debugTRef.current !== null ? debugTRef.current : (state.introDone ? state.t : 0)
    const tLerp = MathUtils.damp(state.tLerp, target, DAMPING_LAMBDA, delta)
    state.setTLerp(tLerp)

    // Sample with authored-u mapping so zones align with waypoint timing.
    sampleSpineAt(positionSpine, WAYPOINTS, tLerp, tmpPos)
    sampleSpineAt(lookAtSpine, WAYPOINTS, tLerp, tmpLook)
    camera.position.copy(tmpPos)
    camera.lookAt(tmpLook)
  })

  return null
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/canvas/CameraRig.tsx
git commit -m "feat(homecoming): CameraRig samples spine, supports ?t= debug"
```

---

### Task 2.4: `canvas/SceneEnvironment.tsx`

**Files:**
- Create: `apps/website/src/components/homecoming/canvas/SceneEnvironment.tsx`

- [ ] **Step 1: Create environment (spec §4)**

```tsx
// apps/website/src/components/homecoming/canvas/SceneEnvironment.tsx
import { useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useRef } from 'react'
import { Color, Fog } from 'three'
import { useCeremonyProgress } from '../state/useCeremonyProgress'
import { beatProgress, ZONES } from '../spine/zones'

const MARS_FOG = new Color('#c46144')
const CHAMBER_FOG = new Color('#d8cfc6')
const MARS_AMBIENT = new Color('#3a1a12')
const CHAMBER_AMBIENT = new Color('#1a1a1c')
const MARS_KEY = new Color('#ffb07a')
const CHAMBER_KEY = new Color('#f3e8dc')

const fogColor = new Color()
const ambient = new Color()
const keyColor = new Color()

export function SceneEnvironment() {
  const scene = useThree((s) => s.scene)
  const dirRef = useRef<any>(null)
  const ambRef = useRef<any>(null)

  // Lazy-init fog so we can mutate .color per frame without recreating.
  if (!scene.fog) scene.fog = new Fog(MARS_FOG.clone(), 10, 200)

  useFrame(() => {
    const t = useCeremonyProgress.getState().tLerp
    // Cross-fade from Mars to chamber across portalTraversal + chamberReveal.
    const mix = beatProgress(t, [ZONES.portalTraversal[0], ZONES.chamberReveal[1]])

    fogColor.copy(MARS_FOG).lerp(CHAMBER_FOG, mix)
    ambient.copy(MARS_AMBIENT).lerp(CHAMBER_AMBIENT, mix)
    keyColor.copy(MARS_KEY).lerp(CHAMBER_KEY, mix)

    ;(scene.fog as Fog).color.copy(fogColor)
    ;(scene.fog as Fog).near = 10 - mix * 3
    ;(scene.fog as Fog).far = 200 - mix * 130
    if (ambRef.current) ambRef.current.color.copy(ambient)
    if (dirRef.current) dirRef.current.color.copy(keyColor)
  })

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.4} color={MARS_AMBIENT} />
      <directionalLight ref={dirRef} intensity={1.2} color={MARS_KEY} position={[12, 20, 8]} castShadow={false} />
      <Environment files="https://cdn.zo.xyz/homecoming/hdri/mars-warm-2k.hdr" background={false} />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/canvas/SceneEnvironment.tsx
git commit -m "feat(homecoming): SceneEnvironment cross-fades Mars↔chamber palette"
```

---

### Task 2.5: `canvas/PostFX.tsx`

**Files:**
- Create: `apps/website/src/components/homecoming/canvas/PostFX.tsx`

- [ ] **Step 1: Create post-processing stack**

```tsx
// apps/website/src/components/homecoming/canvas/PostFX.tsx
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { useMemo } from 'react'
import type { DeviceTier } from '../hooks/useDeviceTier'

export function PostFX({ tier }: { tier: DeviceTier }) {
  if (tier <= 1) return null

  const caOffset = useMemo(() => new Vector2(0.0008, 0.0008), [])

  return (
    <EffectComposer multisampling={tier >= 3 ? 4 : 0}>
      <Bloom intensity={0.6} luminanceThreshold={0.6} luminanceSmoothing={0.2} mipmapBlur />
      {tier >= 3 ? (
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={caOffset} />
      ) : <></>}
      <Noise opacity={0.04} premultiply blendFunction={BlendFunction.SCREEN} />
      {tier >= 3 ? <Vignette eskil={false} offset={0.3} darkness={0.6} /> : <></>}
    </EffectComposer>
  )
}
```

Note: postprocessing's `<EffectComposer>` children must be effect elements — using fragment (`<></>`) as a no-op skips the slot.

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/canvas/PostFX.tsx
git commit -m "feat(homecoming): PostFX with tiered effect stack"
```

---

## Chunk 3: Exterior scene modules

Mars surface, `\z/` monument, wireframe overlay. After this chunk, the idle state (Mars + pulsating monument) should be renderable in isolation via a test route.

### Task 3.1: `canvas/MarsSurface.tsx`

**Files:**
- Create: `apps/website/src/components/homecoming/canvas/MarsSurface.tsx`

- [ ] **Step 1: Create MarsSurface (spec §4)**

```tsx
// apps/website/src/components/homecoming/canvas/MarsSurface.tsx
import { useRef, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { PlaneGeometry, TextureLoader, RepeatWrapping, Mesh, MeshStandardMaterial, DoubleSide } from 'three'
import { createDustShader } from '../materials/DustShader'
import type { DeviceTier } from '../hooks/useDeviceTier'

const ALBEDO_URL = 'https://cdn.zo.xyz/homecoming/textures/mars-albedo-2k.jpg'
const NORMAL_URL = 'https://cdn.zo.xyz/homecoming/textures/mars-normal-2k.jpg'

export function MarsSurface({ tier }: { tier: DeviceTier }) {
  const [albedo, normal] = useLoader(TextureLoader, [ALBEDO_URL, NORMAL_URL])
  for (const tex of [albedo, normal]) {
    tex.wrapS = tex.wrapT = RepeatWrapping
    tex.repeat.set(8, 8)
  }

  const size = tier >= 3 ? 200 : tier >= 2 ? 120 : 80
  const segs = tier >= 3 ? 128 : tier >= 2 ? 64 : 32

  const dustMode = tier >= 3 ? 'raymarch' : 'billboard'
  const dustMat = useMemo(() => createDustShader(dustMode), [dustMode])

  useFrame((_, delta) => {
    dustMat.uniforms.uTime.value += delta
  })

  return (
    <group>
      {/* Terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow={false}>
        <planeGeometry args={[size, size, segs, segs]} />
        <meshStandardMaterial map={albedo} normalMap={normal} roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Dust volume — tall slab from y=-5 to y=-95 centered on spine axis.
          DustShader renders DoubleSide so it's visible while camera is inside. */}
      <mesh position={[0, -50, 0]} material={dustMat}>
        <boxGeometry args={[80, 90, 80]} />
      </mesh>

      {/* Ringed planet billboard */}
      <mesh position={[30, 22, -80]}>
        <sphereGeometry args={[10, 32, 32]} />
        <meshBasicMaterial color="#d4a480" />
      </mesh>
      <mesh position={[30, 22, -80]} rotation={[Math.PI / 2.2, 0.3, 0]}>
        <ringGeometry args={[12, 18, 64]} />
        <meshBasicMaterial color="#e6c89a" transparent opacity={0.7} side={DoubleSide} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/canvas/MarsSurface.tsx
git commit -m "feat(homecoming): MarsSurface terrain + dust slab + ringed planet"
```

---

### Task 3.2: `canvas/ZLogoMonument.tsx`

**Files:**
- Create: `apps/website/src/components/homecoming/canvas/ZLogoMonument.tsx`

- [ ] **Step 1: Create monument (spec §4, §5 pulse constants)**

```tsx
// apps/website/src/components/homecoming/canvas/ZLogoMonument.tsx
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useRef, useMemo, useEffect } from 'react'
import { Group, MeshPhysicalMaterial, Mesh, MathUtils } from 'three'
import { createChromeStoneMaterial, applyChromeStonePulse } from '../materials/ChromeStoneMaterial'
import { useCeremonyProgress } from '../state/useCeremonyProgress'
import { useCeremonyInteraction } from '../state/useCeremonyInteraction'
import {
  CHROME_STONE_PULSE_BASELINE,
  CHROME_STONE_PULSE_AMPLITUDE,
  CHROME_STONE_PULSE_FREQ_HZ,
  CHROME_STONE_PULSE_FREQ_HZ_HOVERED,
} from '../constants'

const MONUMENT_URL = 'https://cdn.zo.xyz/homecoming/models/z-monument.glb'

useGLTF.preload(MONUMENT_URL)

export function ZLogoMonument() {
  const groupRef = useRef<Group>(null!)
  const { scene } = useGLTF(MONUMENT_URL) as any
  const setHovered = useCeremonyInteraction((s) => s.setMonumentHovered)
  const hoverBoostRef = useRef(0)

  // Wrap each child (pillar) mesh's material with a shared ChromeStoneMaterial.
  // The glb audit (Pre-plan blocker) ensures pillars are separable.
  const materials = useMemo(() => {
    const mats: MeshPhysicalMaterial[] = []
    scene.traverse((obj: any) => {
      if (obj.isMesh) {
        const phase = mats.length * 2.1
        const mat = createChromeStoneMaterial({
          pulseBaseline: CHROME_STONE_PULSE_BASELINE,
          pulseAmplitude: CHROME_STONE_PULSE_AMPLITUDE,
          pulsePhase: phase,
        })
        obj.material = mat
        mats.push(mat)
      }
    })
    return mats
  }, [scene])

  useFrame((_, delta) => {
    const t = performance.now() / 1000
    const hovered = useCeremonyInteraction.getState().monumentHovered
    const uMat = useCeremonyProgress.getState().uMaterialization

    // Damped hover boost
    hoverBoostRef.current = MathUtils.damp(hoverBoostRef.current, hovered ? 1 : 0, 6, delta)
    const boost = hoverBoostRef.current
    const freq = CHROME_STONE_PULSE_FREQ_HZ + (CHROME_STONE_PULSE_FREQ_HZ_HOVERED - CHROME_STONE_PULSE_FREQ_HZ) * boost

    materials.forEach((m) => {
      const phase = m.userData.pulsePhase ?? 0
      const osc = 0.5 + 0.5 * Math.sin(2 * Math.PI * freq * t + phase)
      m.userData.pulseHoverBoost = osc * boost * 0.5
      m.userData.pulseProximity = osc * 0.5  // baseline breath
      m.userData.uMaterialization = uMat
      applyChromeStonePulse(m)
    })
  })

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false) }}
    >
      <primitive object={scene} />
    </group>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/canvas/ZLogoMonument.tsx
git commit -m "feat(homecoming): ZLogoMonument with chrome-stone pulse + hover"
```

---

### Task 3.3: `canvas/LoadingGridline.tsx`

**Files:**
- Create: `apps/website/src/components/homecoming/canvas/LoadingGridline.tsx`

- [ ] **Step 1: Create the wireframe overlay**

```tsx
// apps/website/src/components/homecoming/canvas/LoadingGridline.tsx
import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, LineSegments, EdgesGeometry, LineBasicMaterial, GridHelper, AdditiveBlending } from 'three'
import { useCeremonyProgress } from '../state/useCeremonyProgress'

export function LoadingGridline() {
  const scene = useThree((s) => s.scene)
  const groupRef = useRef<Group>(null!)
  const linesRef = useRef<LineSegments[]>([])
  const grid = useMemo(() => {
    const g = new GridHelper(200, 40, 0xffaa77, 0xffaa77)
    g.position.y = 0.02
    return g
  }, [])

  // After mount, collect edge lines for every solid mesh in the scene.
  useFrame(() => {
    const uMat = useCeremonyProgress.getState().uMaterialization
    const wireOpacity = 1 - uMat

    // Lazy-populate edge lines once meshes exist.
    if (linesRef.current.length === 0) {
      scene.traverse((obj: any) => {
        if (obj.isMesh && obj.geometry && !obj.userData._homecoming_skip_wire) {
          const edges = new EdgesGeometry(obj.geometry)
          const mat = new LineBasicMaterial({
            color: 0xffd9a8,
            transparent: true,
            blending: AdditiveBlending,
            depthWrite: false,
          })
          const line = new LineSegments(edges, mat)
          obj.add(line)
          linesRef.current.push(line)
        }
      })
    }

    linesRef.current.forEach((line) => {
      ;(line.material as LineBasicMaterial).opacity = wireOpacity
      line.visible = wireOpacity > 0.01
    })
    ;(grid.material as any).opacity = wireOpacity * 0.4
    ;(grid.material as any).transparent = true
  })

  return <primitive ref={groupRef} object={grid} />
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/canvas/LoadingGridline.tsx
git commit -m "feat(homecoming): LoadingGridline wireframe overlay tied to uMaterialization"
```

---

## Chunk 4: Proofs, portal, chamber

The middle of the ceremony — ProofStack + Proof, PortalStoneRings, Chamber.

### Task 4.1: `canvas/Proof.tsx`

**Files:**
- Create: `apps/website/src/components/homecoming/canvas/Proof.tsx`

- [ ] **Step 1: Create the canvas-texture card face builder**

```tsx
// apps/website/src/components/homecoming/canvas/Proof.tsx
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh, CanvasTexture, MathUtils } from 'three'
import type { ProofData } from '../types'
import type { Zone } from '../spine/zones'
import { readBeatProgress } from '../hooks/useBeatProgress'
import { getProofCopy } from '../copy/getProofCopy'
import { createChromeStoneMaterial } from '../materials/ChromeStoneMaterial'

function drawCardTexture(text: string): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 640
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#1c1008'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.fillStyle = '#ffd9a8'
  ctx.font = '600 96px "Space Grotesk", system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText(text, c.width / 2, c.height / 2)
  // Subtle border
  ctx.strokeStyle = '#8a6a5a'
  ctx.lineWidth = 6
  ctx.strokeRect(12, 12, c.width - 24, c.height - 24)
  const tex = new CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

export function Proof({
  data,
  zone,
  anchorY,
}: {
  data: ProofData
  zone: Zone
  anchorY: number
}) {
  const groupRef = useRef<Group>(null!)
  const material = useMemo(() => createChromeStoneMaterial(), [])
  const faceTexture = useMemo(() => drawCardTexture(getProofCopy(data)), [data])

  useFrame(() => {
    const u = readBeatProgress(zone)

    // Local envelope (spec §4 <Proof>):
    //   u < 0.25  → rise + fade in  from anchorY - 6
    //   0.25-0.75 → hold, slight drift
    //   u > 0.75  → rise out + fade
    let yOffset = -6
    let opacity = 0
    if (u <= 0) {
      yOffset = -6
      opacity = 0
    } else if (u < 0.25) {
      const n = u / 0.25
      yOffset = MathUtils.lerp(-6, 0, n)
      opacity = n
    } else if (u < 0.75) {
      yOffset = 0
      opacity = 1
    } else if (u < 1) {
      const n = (u - 0.75) / 0.25
      yOffset = MathUtils.lerp(0, 6, n)
      opacity = 1 - n
    } else {
      yOffset = 6
      opacity = 0
    }

    if (groupRef.current) {
      groupRef.current.position.y = anchorY + yOffset
      groupRef.current.visible = opacity > 0.01
      groupRef.current.rotation.y = 0.08 * Math.sin(performance.now() / 2000)
      // cascade opacity to material channels
      groupRef.current.traverse((obj: any) => {
        if (obj.isMesh && obj.material) {
          obj.material.transparent = true
          obj.material.opacity = opacity
        }
      })
    }
  })

  return (
    <group ref={groupRef} position={[0, anchorY - 6, 0]}>
      {/* Chrome-stone frame (placeholder geometry — real proof-frame.glb lands in Task 4.2) */}
      <mesh material={material}>
        <boxGeometry args={[2.2, 1.4, 0.2]} />
      </mesh>
      {/* Front face with the canvas texture */}
      <mesh position={[0, 0, 0.11]}>
        <planeGeometry args={[2.0, 1.25]} />
        <meshBasicMaterial map={faceTexture} toneMapped={false} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/canvas/Proof.tsx
git commit -m "feat(homecoming): Proof with rise/hold/fade envelope + canvas-drawn face"
```

---

### Task 4.2: `canvas/ProofStack.tsx`

**Files:**
- Create: `apps/website/src/components/homecoming/canvas/ProofStack.tsx`

- [ ] **Step 1: Create stack wrapper**

```tsx
// apps/website/src/components/homecoming/canvas/ProofStack.tsx
import { Proof } from './Proof'
import { ZONES } from '../spine/zones'
import type { ProofData } from '../types'

const ANCHORS: Record<ProofData['id'], number> = {
  destinations: -15,
  nights: -35,
  zostels: -55,
  tribe: -75,
}

const ZONE_FOR: Record<ProofData['id'], keyof typeof ZONES> = {
  destinations: 'proof1',
  nights: 'proof2',
  zostels: 'proof3',
  tribe: 'proof4',
}

export function ProofStack({ proofs }: { proofs: ProofData[] }) {
  return (
    <group>
      {proofs.map((p) => (
        <Proof
          key={p.id}
          data={p}
          zone={ZONES[ZONE_FOR[p.id]]}
          anchorY={ANCHORS[p.id]}
        />
      ))}
    </group>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/canvas/ProofStack.tsx
git commit -m "feat(homecoming): ProofStack maps 4 proofs to anchors + zones"
```

---

### Task 4.3: `canvas/PortalStoneRings.tsx`

**Files:**
- Create: `apps/website/src/components/homecoming/canvas/PortalStoneRings.tsx`

- [ ] **Step 1: Create portal (spec §4, §6 LOD)**

```tsx
// apps/website/src/components/homecoming/canvas/PortalStoneRings.tsx
import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, MathUtils, Vector3 } from 'three'
import { createChromeStoneMaterial, applyChromeStonePulse } from '../materials/ChromeStoneMaterial'
import { readBeatProgress } from '../hooks/useBeatProgress'
import { ZONES } from '../spine/zones'
import type { DeviceTier } from '../hooks/useDeviceTier'

const FRAGMENTS_PER_RING: Record<DeviceTier, number> = { 0: 8, 1: 8, 2: 10, 3: 12 }

type RingCfg = { radius: number; y: number; thickness: number }
const RINGS: RingCfg[] = [
  { radius: 6.5, y: -108, thickness: 0.6 },
  { radius: 5.0, y: -111, thickness: 0.55 },
  { radius: 3.7, y: -114, thickness: 0.5 },
  { radius: 2.5, y: -117, thickness: 0.45 },
]

// Hoist module-scope temp to avoid per-frame allocation (spec §6).
const PORTAL_CENTER = new Vector3(0, -112, 0)

export function PortalStoneRings({ tier }: { tier: DeviceTier }) {
  const groupRef = useRef<Group>(null!)
  const material = useMemo(() => createChromeStoneMaterial({ pulsePhase: 1.5 }), [])
  const camera = useThree((s) => s.camera)
  const fragCount = FRAGMENTS_PER_RING[tier]

  useFrame(() => {
    const dist = camera.position.distanceTo(PORTAL_CENTER)
    const proximity = MathUtils.clamp(1 - dist / 30, 0, 1)
    material.userData.pulseProximity = proximity
    material.userData.uMaterialization = 1
    applyChromeStonePulse(material)
    if (groupRef.current) groupRef.current.visible = true
  })

  return (
    <group ref={groupRef}>
      {RINGS.map((ring, i) => (
        <group key={i} position={[0, ring.y, 0]}>
          {Array.from({ length: fragCount }).map((_, k) => {
            const theta = (k / fragCount) * Math.PI * 2
            const arc = (Math.PI * 2) / fragCount * 0.82  // visible seam
            return (
              <mesh
                key={k}
                rotation={[0, theta, 0]}
                material={material}
              >
                <torusGeometry args={[ring.radius, ring.thickness, 8, 16, arc]} />
              </mesh>
            )
          })}
        </group>
      ))}
      {/* Bright core disc — drives bloom during traversal */}
      <mesh position={[0, -118, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 48]} />
        <meshBasicMaterial color="#fff6e0" toneMapped={false} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/canvas/PortalStoneRings.tsx
git commit -m "feat(homecoming): PortalStoneRings 4-ring pulsating aperture"
```

---

### Task 4.4: `canvas/Chamber.tsx`

**Files:**
- Create: `apps/website/src/components/homecoming/canvas/Chamber.tsx`

- [ ] **Step 1: Create chamber (spec §4)**

```tsx
// apps/website/src/components/homecoming/canvas/Chamber.tsx
import { useMemo } from 'react'
import { createChromeStoneMaterial } from '../materials/ChromeStoneMaterial'

const FLOOR_RINGS = [
  { r: 10, y: -159.9 },
  { r: 8, y: -159.95 },
  { r: 6, y: -159.97 },
  { r: 4, y: -159.99 },
]

export function Chamber() {
  const pedestalMat = useMemo(() => createChromeStoneMaterial({ pulsePhase: 3.1 }), [])

  return (
    <group>
      {/* Concentric floor rings */}
      {FLOOR_RINGS.map((r, i) => (
        <mesh key={i} position={[0, r.y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r.r - 0.08, r.r, 96]} />
          <meshBasicMaterial color="#d8cfc6" transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Pedestal */}
      <mesh position={[0, -157, 0]} material={pedestalMat}>
        <cylinderGeometry args={[1.3, 1.5, 2, 48]} />
      </mesh>

      {/* Ceiling light ring */}
      <mesh position={[0, -145, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4, 0.12, 16, 64]} />
        <meshBasicMaterial color="#fff1dd" toneMapped={false} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/canvas/Chamber.tsx
git commit -m "feat(homecoming): Chamber concentric floor + pedestal + ceiling light"
```

---

## Chunk 5: Zobu particle form

Single task chunk. Resolves the identity figure on the pedestal.

### Task 5.1: `canvas/ZobuParticleForm.tsx`

**Files:**
- Create: `apps/website/src/components/homecoming/canvas/ZobuParticleForm.tsx`

- [ ] **Step 1: Create the two-stage reveal component**

```tsx
// apps/website/src/components/homecoming/canvas/ZobuParticleForm.tsx
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import {
  BufferGeometry, BufferAttribute, Points, ShaderMaterial, Vector3,
  EdgesGeometry, LineSegments, LineBasicMaterial, AdditiveBlending, Mesh, MathUtils,
} from 'three'
import type { DeviceTier } from '../hooks/useDeviceTier'
import { readBeatProgress } from '../hooks/useBeatProgress'
import { ZONES } from '../spine/zones'

const POINTS_PER_TIER: Record<DeviceTier, number> = { 0: 8000, 1: 8000, 2: 20000, 3: 40000 }

export function ZobuParticleForm({ modelUrl, tier }: { modelUrl: string; tier: DeviceTier }) {
  const pointCount = POINTS_PER_TIER[tier]
  const { scene: zobuScene } = useGLTF(modelUrl) as any

  // Find first mesh in the loaded zobu.
  const zobuMesh = useMemo<Mesh | null>(() => {
    let m: Mesh | null = null
    zobuScene.traverse((o: any) => { if (!m && o.isMesh) m = o as Mesh })
    return m
  }, [zobuScene])

  // Build wireframe line segments.
  const wireframe = useMemo(() => {
    if (!zobuMesh) return null
    const edges = new EdgesGeometry(zobuMesh.geometry)
    const mat = new LineBasicMaterial({
      color: 0xd8cfc6,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      opacity: 0,
    })
    return new LineSegments(edges, mat)
  }, [zobuMesh])

  // Build point cloud.
  const { geometry: pointGeom, targetPositions, spawnOffsets } = useMemo(() => {
    if (!zobuMesh) return { geometry: null, targetPositions: null, spawnOffsets: null }
    const sampler = new MeshSurfaceSampler(zobuMesh).build()
    const targets = new Float32Array(pointCount * 3)
    const offsets = new Float32Array(pointCount * 3)
    const positions = new Float32Array(pointCount * 3)
    const tmp = new Vector3()
    for (let i = 0; i < pointCount; i++) {
      sampler.sample(tmp)
      targets[i * 3 + 0] = tmp.x
      targets[i * 3 + 1] = tmp.y
      targets[i * 3 + 2] = tmp.z
      // Random offset for initial scatter
      offsets[i * 3 + 0] = (Math.random() - 0.5) * 4
      offsets[i * 3 + 1] = (Math.random() - 0.5) * 4
      offsets[i * 3 + 2] = (Math.random() - 0.5) * 4
      positions[i * 3 + 0] = targets[i * 3 + 0] + offsets[i * 3 + 0]
      positions[i * 3 + 1] = targets[i * 3 + 1] + offsets[i * 3 + 1]
      positions[i * 3 + 2] = targets[i * 3 + 2] + offsets[i * 3 + 2]
    }
    const geom = new BufferGeometry()
    geom.setAttribute('position', new BufferAttribute(positions, 3))
    return { geometry: geom, targetPositions: targets, spawnOffsets: offsets }
  }, [zobuMesh, pointCount])

  const pointMat = useMemo(() => new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uOpacity: { value: 0 }, uSize: { value: tier >= 3 ? 2.4 : 1.8 } },
    vertexShader: /* glsl */ `
      uniform float uSize;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * (120.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.2, length(p));
        gl_FragColor = vec4(0.93, 0.88, 0.82, a * uOpacity);
      }
    `,
  }), [tier])

  const pointsRef = useRef<Points | null>(null)
  const wireRef = useRef<LineSegments | null>(null)

  useEffect(() => {
    if (wireframe) wireRef.current = wireframe
  }, [wireframe])

  useFrame((_, delta) => {
    const u = readBeatProgress(ZONES.chamberReveal)
    // 0-0.5: wireframe stage. 0.5-1: particle stage.
    const wireOpacity = u < 0.5 ? (u / 0.5) : Math.max(0, 1 - (u - 0.5) / 0.2)
    const pointOpacity = u < 0.4 ? 0 : MathUtils.clamp((u - 0.4) / 0.4, 0, 1)

    if (wireRef.current) {
      ;(wireRef.current.material as LineBasicMaterial).opacity = wireOpacity
      wireRef.current.visible = wireOpacity > 0.01
    }
    pointMat.uniforms.uOpacity.value = pointOpacity
    if (pointsRef.current) pointsRef.current.visible = pointOpacity > 0.01

    // Condensation: lerp current positions toward targets based on particle stage progress.
    if (pointGeom && targetPositions && spawnOffsets) {
      const progress = MathUtils.clamp((u - 0.5) / 0.4, 0, 1)
      const arr = pointGeom.attributes.position.array as Float32Array
      for (let i = 0; i < pointCount; i++) {
        const tx = targetPositions[i * 3 + 0]
        const ty = targetPositions[i * 3 + 1]
        const tz = targetPositions[i * 3 + 2]
        const ox = spawnOffsets[i * 3 + 0] * (1 - progress)
        const oy = spawnOffsets[i * 3 + 1] * (1 - progress)
        const oz = spawnOffsets[i * 3 + 2] * (1 - progress)
        // Breathing term once resolved
        const breath = progress > 0.95 ? 0.02 * Math.sin(performance.now() / 500 + i * 0.01) : 0
        arr[i * 3 + 0] = tx + ox + breath
        arr[i * 3 + 1] = ty + oy + breath
        arr[i * 3 + 2] = tz + oz + breath
      }
      pointGeom.attributes.position.needsUpdate = true
    }
  })

  if (!pointGeom || !wireframe) return null

  return (
    <group position={[0, -155, 0]} scale={[1.2, 1.2, 1.2]}>
      <primitive object={wireframe} />
      <points ref={pointsRef} geometry={pointGeom} material={pointMat} />
    </group>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/canvas/ZobuParticleForm.tsx
git commit -m "feat(homecoming): ZobuParticleForm wireframe→points condensation"
```

---

## Chunk 6: HUD, fallback, integration, ship

Wires everything together: HUD chrome, fallback path, the Ceremony.tsx wrapper, and the page route. Ends with a Playwright smoke test.

### Task 6.1: HUD components

**Files:**
- Create: `apps/website/src/components/homecoming/hud/TopLeftLogo.tsx`
- Create: `apps/website/src/components/homecoming/hud/BottomLeftSound.tsx`
- Create: `apps/website/src/components/homecoming/hud/ScrollHint.tsx`

- [ ] **Step 1: Create all three HUD components**

```tsx
// TopLeftLogo.tsx
import { useCeremonyProgress } from '../state/useCeremonyProgress'
import { ZONES } from '../spine/zones'
export function TopLeftLogo() {
  const t = useCeremonyProgress((s) => s.tLerp)
  const opacity = t < ZONES.chamberReveal[0] ? 1 : Math.max(0, 1 - (t - ZONES.chamberReveal[0]) / 0.1)
  return (
    <div
      style={{ position: 'fixed', top: 24, left: 24, zIndex: 20, pointerEvents: 'none',
               fontFamily: 'monospace', fontSize: 14, letterSpacing: 2, color: '#ffd9a8', opacity, transition: 'opacity 300ms' }}
      aria-hidden
    >
      \z/
    </div>
  )
}
```

```tsx
// BottomLeftSound.tsx
import { useCeremonyInteraction } from '../state/useCeremonyInteraction'
export function BottomLeftSound() {
  const { audioEnabled, toggleAudio } = useCeremonyInteraction()
  return (
    <button
      onClick={toggleAudio}
      style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 20, background: 'transparent',
               border: 'none', color: '#ffd9a8', fontFamily: 'monospace', fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}
      aria-label={audioEnabled ? 'Mute audio' : 'Enable audio'}
    >
      sound: {audioEnabled ? 'on' : 'off'}
    </button>
  )
}
```

```tsx
// ScrollHint.tsx
// The bounce keyframe is inlined via a <style> tag — the website app does
// not currently have a global stylesheet entrypoint we can append to
// without touching other teams.
import { useCeremonyProgress } from '../state/useCeremonyProgress'

const BOUNCE_KEYFRAME = `
@keyframes homecoming-scrollhint-bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%      { transform: translateX(-50%) translateY(6px); }
}`

export function ScrollHint() {
  const t = useCeremonyProgress((s) => s.tLerp)
  const introDone = useCeremonyProgress((s) => s.introDone)
  if (!introDone || t > 0.03) return null
  return (
    <>
      <style>{BOUNCE_KEYFRAME}</style>
      <div
        style={{ position: 'fixed', bottom: 48, left: '50%', transform: 'translateX(-50%)',
                 zIndex: 20, color: '#ffd9a8', fontFamily: 'monospace', fontSize: 12, opacity: 0.7, letterSpacing: 2,
                 animation: 'homecoming-scrollhint-bounce 1.8s infinite ease-in-out' }}
        aria-hidden
      >
        scroll ↓
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/hud/
git commit -m "feat(homecoming): HUD chrome (logo, sound, scroll hint)"
```

---

### Task 6.2: `hud/CitizenshipCTA.tsx`

**Files:**
- Create: `apps/website/src/components/homecoming/hud/CitizenshipCTA.tsx`

- [ ] **Step 1: Create the CTA**

```tsx
// apps/website/src/components/homecoming/hud/CitizenshipCTA.tsx
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useCeremonyProgress } from '../state/useCeremonyProgress'
import { useCeremonyInteraction } from '../state/useCeremonyInteraction'
import { completeHomecoming } from '../../../lib/homecoming/endpoints'
import { buildHandleHome } from '../constants'

type Props = { handle: string; replay: boolean }

export function CitizenshipCTA({ handle, replay }: Props) {
  const router = useRouter()
  const t = useCeremonyProgress((s) => s.tLerp)
  const fireCTA = useCeremonyInteraction((s) => s.fireCTA)
  const [busy, setBusy] = useState(false)

  const show = t >= 0.95
  const opacity = Math.min(1, Math.max(0, (t - 0.95) / 0.04))
  const destination = buildHandleHome(handle)

  const onClick = async () => {
    if (busy) return
    setBusy(true)
    fireCTA()
    // Lock scroll so the user doesn't overshoot while we transition.
    document.body.style.overflow = 'hidden'
    // Write homecoming_completed_at unless this is a replay (?replay=1 or ?preview=1).
    // Server-side this is idempotent, but we skip the write for replay so preview/
    // debug sessions do not flip the one-time flag.
    if (!replay) {
      try {
        await completeHomecoming()
      } catch {
        // Completion failure is not fatal for navigation — the next /homecoming
        // request will re-run the SSR gate and either redirect or retry.
      }
    }
    router.push(destination)
  }

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 25,
        padding: '16px 36px', fontFamily: 'monospace', fontSize: 14, letterSpacing: 3,
        color: '#1c1008', background: '#ffd9a8', border: 'none', cursor: show ? 'pointer' : 'default',
        opacity, pointerEvents: show ? 'auto' : 'none',
        transition: 'opacity 300ms, transform 300ms',
        textTransform: 'uppercase',
      }}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      disabled={busy}
    >
      Become a citizen
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/hud/CitizenshipCTA.tsx
git commit -m "feat(homecoming): CitizenshipCTA navigates to PASSPORT_SUCCESS_ROUTE"
```

---

### Task 6.3: `fallback/CeremonyFallback.tsx`

**Files:**
- Create: `apps/website/src/components/homecoming/fallback/CeremonyFallback.tsx`

- [ ] **Step 1: Create fallback**

```tsx
// apps/website/src/components/homecoming/fallback/CeremonyFallback.tsx
import { useRouter } from 'next/router'
import { useState } from 'react'
import type { CeremonyData } from '../types'
import { getProofCopy } from '../copy/getProofCopy'
import { completeHomecoming } from '../../../lib/homecoming/endpoints'
import { buildHandleHome } from '../constants'

const POSTER_URL = 'https://cdn.zo.xyz/homecoming/posters/idle-mars-2880x1800.jpg'

export function CeremonyFallback({ data, replay }: { data: CeremonyData; replay: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const destination = buildHandleHome(data.user.handle)

  const onClick = async () => {
    if (busy) return
    setBusy(true)
    if (!replay) {
      try { await completeHomecoming() } catch { /* non-fatal */ }
    }
    router.push(destination)
  }

  return (
    <div style={{ minHeight: '100vh', background: `#1c1008 url(${POSTER_URL}) center/cover no-repeat`, color: '#ffd9a8', padding: '48px 24px', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', background: 'rgba(28,16,8,0.82)', padding: 32 }}>
        <h1 style={{ fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 24 }}>
          Welcome back, {data.user.displayName}
        </h1>
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
          {data.proofs.map((p) => (
            <li key={p.id} style={{ padding: '12px 0', borderBottom: '1px solid #8a6a5a', fontSize: 16 }}>
              {getProofCopy(p)}
            </li>
          ))}
        </ul>
        <button
          onClick={onClick}
          disabled={busy}
          style={{ padding: '14px 28px', background: '#ffd9a8', color: '#1c1008', border: 'none', fontFamily: 'monospace', fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer' }}
        >
          Become a citizen
        </button>
        <p style={{ marginTop: 20, fontSize: 12, opacity: 0.7 }}>
          Your ceremony is ready when your device is.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/fallback/CeremonyFallback.tsx
git commit -m "feat(homecoming): CeremonyFallback static poster + proofs + CTA"
```

---

### Task 6.3a: Error boundary + load timeout

**Files:**
- Create: `apps/website/src/components/homecoming/fallback/CeremonyErrorBoundary.tsx`
- Create: `apps/website/src/components/homecoming/hooks/useLoadTimeout.ts`

Both guard the fallback path so any runtime failure or slow asset load ends on the poster instead of a white screen.

- [ ] **Step 1: Error boundary**

```tsx
// apps/website/src/components/homecoming/fallback/CeremonyErrorBoundary.tsx
import React from 'react'

type Props = { fallback: React.ReactNode; children: React.ReactNode }
type State = { hasError: boolean }

export class CeremonyErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State { return { hasError: true } }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Homecoming] canvas crashed → rendering fallback', error)
    }
    // TODO: wire to Sentry once the website app's Sentry config confirms
    // a reporter is available — see apps/website/sentry.client.config.ts
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
```

- [ ] **Step 2: Load timeout hook**

```ts
// apps/website/src/components/homecoming/hooks/useLoadTimeout.ts
import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { LOAD_TIMEOUT_MS } from '../constants'

/**
 * Returns true if drei's loader has been "still loading" for LOAD_TIMEOUT_MS
 * since mount. Consumers flip the fallback path on. Pass `active = false`
 * to skip (e.g., when fallback is already decided for other reasons).
 */
export function useLoadTimeout(active: boolean): boolean {
  const [timedOut, setTimedOut] = useState(false)
  const active$ = useProgress((s) => s.active)
  useEffect(() => {
    if (!active) return
    const id = window.setTimeout(() => {
      if (active$) setTimedOut(true)
    }, LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(id)
  }, [active, active$])
  return timedOut
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/website/src/components/homecoming/fallback/CeremonyErrorBoundary.tsx \
        apps/website/src/components/homecoming/hooks/useLoadTimeout.ts
git commit -m "feat(homecoming): error boundary + 10s load timeout → fallback"
```

---

### Task 6.4: `Ceremony.tsx`

**Files:**
- Create: `apps/website/src/components/homecoming/Ceremony.tsx`

- [ ] **Step 1: Create the top-level wrapper**

```tsx
// apps/website/src/components/homecoming/Ceremony.tsx
import { Suspense, useMemo, useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { SCROLL_SPACER_VH } from './constants'
import type { CeremonyData } from './types'
import { useDeviceTier } from './hooks/useDeviceTier'
import { useScrollListener } from './hooks/useScrollListener'
import { useIntroTimeline } from './hooks/useIntroTimeline'
import { useLoadTimeout } from './hooks/useLoadTimeout'
import { CameraRig } from './canvas/CameraRig'
import { SceneEnvironment } from './canvas/SceneEnvironment'
import { MarsSurface } from './canvas/MarsSurface'
import { ZLogoMonument } from './canvas/ZLogoMonument'
import { LoadingGridline } from './canvas/LoadingGridline'
import { ProofStack } from './canvas/ProofStack'
import { PortalStoneRings } from './canvas/PortalStoneRings'
import { Chamber } from './canvas/Chamber'
import { ZobuParticleForm } from './canvas/ZobuParticleForm'
import { PostFX } from './canvas/PostFX'
import { TopLeftLogo } from './hud/TopLeftLogo'
import { BottomLeftSound } from './hud/BottomLeftSound'
import { ScrollHint } from './hud/ScrollHint'
import { CitizenshipCTA } from './hud/CitizenshipCTA'
import { CeremonyFallback } from './fallback/CeremonyFallback'
import { CeremonyErrorBoundary } from './fallback/CeremonyErrorBoundary'

/**
 * Feature detection for fallback. Runs on client only (component is mounted
 * via next/dynamic { ssr: false } in pages/homecoming/index.tsx).
 * Lazily initialized via useState so the value is stable across renders.
 */
function initialShouldFallback(): boolean {
  if (typeof window === 'undefined') return false
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let noWebGL = false
  try {
    const c = document.createElement('canvas')
    noWebGL = !c.getContext('webgl2') && !c.getContext('webgl')
  } catch { noWebGL = true }
  return reducedMotion || noWebGL
}

type Props = { data: CeremonyData; replay: boolean }

export function Ceremony({ data, replay }: Props) {
  const spacerRef = useRef<HTMLDivElement>(null)
  const tier = useDeviceTier()
  const [featureFallback] = useState(initialShouldFallback)
  const loadTimedOut = useLoadTimeout(!featureFallback)
  const fallback = featureFallback || loadTimedOut

  // Hooks run unconditionally; effects no-op when fallback is active.
  useScrollListener(spacerRef, { enabled: !fallback })
  useIntroTimeline({ enabled: !fallback })

  const maxDpr = useMemo(
    () => Math.min(1.5, typeof window !== 'undefined' ? window.devicePixelRatio : 1),
    [],
  )

  if (fallback) return <CeremonyFallback data={data} replay={replay} />

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <CeremonyErrorBoundary fallback={<CeremonyFallback data={data} replay={replay} />}>
          <Canvas
            camera={{ position: [0, 30, 0], fov: 45, near: 0.1, far: 400 }}
            dpr={[1, maxDpr]}
            gl={{ antialias: tier >= 3, alpha: false }}
          >
            <color attach="background" args={['#1c0a04']} />
            <Suspense fallback={null}>
              <CameraRig />
              <SceneEnvironment />
              <MarsSurface tier={tier} />
              <ZLogoMonument />
              <ProofStack proofs={data.proofs} />
              <PortalStoneRings tier={tier} />
              <Chamber />
              <ZobuParticleForm modelUrl={data.zobu.modelUrl} tier={tier} />
              <LoadingGridline />
              <PostFX tier={tier} />
            </Suspense>
          </Canvas>
        </CeremonyErrorBoundary>
      </div>
      <div ref={spacerRef} style={{ height: `${SCROLL_SPACER_VH}vh`, pointerEvents: 'none' }} />
      <TopLeftLogo />
      <BottomLeftSound />
      <ScrollHint />
      <CitizenshipCTA handle={data.user.handle} replay={replay} />
      {/* SR-only narrative */}
      <section aria-label="Homecoming ceremony" style={{ position: 'absolute', left: -9999, width: 1, height: 1 }}>
        <h1>Homecoming</h1>
        <p>You have returned to the archive. Four proofs of your journey:</p>
        <ul>
          {data.proofs.map((p) => (
            <li key={p.id}>{p.count} {p.label}</li>
          ))}
        </ul>
        <p>The archive recognizes you. Become a citizen.</p>
      </section>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/homecoming/Ceremony.tsx
git commit -m "feat(homecoming): Ceremony top-level wrapper wires every module"
```

---

### Task 6.5: `pages/homecoming/index.tsx` (preserves all existing SSR gates)

**Files:**
- Create: `apps/website/src/components/homecoming/data/adapt.ts` (payload → CeremonyData)
- Modify (rewrite): `apps/website/src/pages/homecoming/index.tsx`

The page must keep everything the current implementation does — preview override, kill-switch, auth redirect, identity redirect, one-time redirect, payload fetch — and simply swap `<HomecomingStage>` for `<Ceremony>` with data adapted to the new `CeremonyData` shape.

- [ ] **Step 1: Write payload adapter**

```ts
// apps/website/src/components/homecoming/data/adapt.ts
import type { CeremonyData } from '../types'

// Subset of the backend shape we actually consume. Full shape lives in the
// backend's passport serializer; we only care about handle + 4 counts.
type BackendHomecomingPayload = {
  handle: string
  first_name: string | null
  avatar_image: string
  destinations: { count: number }
  nights:       { count: number }
  zostels:      { count: number }
  tribe:        { count: number }
  has_journey?: boolean
}

type ProfileMe = {
  id?: string
  handle: string
  first_name: string | null
  avatar_image: string
}

export function adaptHomecomingPayload(
  payload: BackendHomecomingPayload,
  profile: ProfileMe,
): CeremonyData {
  return {
    user: {
      id: profile.id ?? profile.handle,
      handle: profile.handle,
      displayName: profile.first_name ?? profile.handle,
    },
    proofs: [
      { id: 'destinations', label: 'Destinations', count: payload.destinations.count },
      { id: 'nights',       label: 'Nights',       count: payload.nights.count },
      { id: 'zostels',      label: 'Zostels',      count: payload.zostels.count },
      { id: 'tribe',        label: 'Tribe',        count: payload.tribe.count },
    ],
    zobu: {
      // Per-user baked Zobu; generic fallback if 404 is handled by ZobuParticleForm.
      modelUrl: `https://cdn.zo.xyz/zobu/${profile.handle}.glb`,
    },
  }
}
```

- [ ] **Step 2: Rewrite the page (keeping all current SSR gates)**

```tsx
// apps/website/src/pages/homecoming/index.tsx
import React from 'react'
import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { zoServer, zoPassportServer } from '../../../../../libs/auth/src/utils'
import type { CeremonyData } from '../../components/homecoming/types'
import { CeremonyDataSchema } from '../../components/homecoming/types'
import { DEMO_CEREMONY, ZERO_STATE_CEREMONY } from '../../components/homecoming/data/demo'
import { adaptHomecomingPayload } from '../../components/homecoming/data/adapt'
import {
  REDIRECT_AUTH,
  REDIRECT_ONBOARDING,
  HOMECOMING_ENDPOINT,
  buildHandleHome,
} from '../../components/homecoming/constants'

// The Ceremony component uses window.matchMedia, <Canvas>, and @react-three/*;
// SSR would hydration-mismatch. Pages-Router fix: next/dynamic with ssr:false.
const Ceremony = dynamic(
  () => import('../../components/homecoming/Ceremony').then((m) => m.Ceremony),
  { ssr: false },
)

type Props = { data: CeremonyData; replay: boolean }

export default function HomecomingPage({ data, replay }: Props) {
  return (
    <>
      <Head>
        <title>Homecoming · Zo World</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Ceremony data={data} replay={replay} />
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  // 1. Preview override — non-prod only, bypasses auth + identity + one-time.
  //    /homecoming?preview=1              → demo (populated) ceremony
  //    /homecoming?preview=1&state=zero   → zero-state ceremony
  if (ctx.query.preview === '1' && process.env.NODE_ENV !== 'production') {
    const data = ctx.query.state === 'zero' ? ZERO_STATE_CEREMONY : DEMO_CEREMONY
    CeremonyDataSchema.parse(data)
    return { props: { data, replay: true } }
  }

  // 2. Kill-switch (unless ?replay=1).
  if (
    process.env.NEXT_PUBLIC_HOMECOMING_ENABLED === 'false' &&
    ctx.query.replay !== '1'
  ) {
    return { redirect: { destination: '/passport', permanent: false } }
  }

  // 3. Cookie-forwarded auth.
  const cookie = ctx.req.headers.cookie ?? ''
  const authConfig = { headers: { cookie } }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let profile: any = null
  try {
    const res = await zoServer.get('/api/v1/profile/me/', authConfig)
    profile = res.data
  } catch {
    return { redirect: { destination: REDIRECT_AUTH, permanent: false } }
  }
  if (!profile) {
    return { redirect: { destination: REDIRECT_AUTH, permanent: false } }
  }

  // 4. Identity gate — handle + avatar must be set.
  if (!profile.handle || !profile.avatar_image) {
    return { redirect: { destination: REDIRECT_ONBOARDING, permanent: false } }
  }

  // 5. One-time gate (unless replay).
  const replay = ctx.query.replay === '1'
  if (profile.homecoming_completed_at && !replay) {
    return { redirect: { destination: buildHandleHome(profile.handle), permanent: false } }
  }

  // 6. Payload fetch (matches existing code: direct zoPassportServer call
  //    with cookie, not the client helper — server needs the cookie).
  let payload
  try {
    const res = await zoPassportServer.post(HOMECOMING_ENDPOINT, {}, authConfig)
    payload = res.data
  } catch {
    // Fail-safe: send the user to their passport (matches old behavior, but
    // keyed to handle instead of /passport).
    return { redirect: { destination: buildHandleHome(profile.handle), permanent: false } }
  }

  // 7. Adapt backend payload → CeremonyData and validate.
  const data = adaptHomecomingPayload(payload, profile)
  CeremonyDataSchema.parse(data)

  return { props: { data, replay } }
}
```

- [ ] **Step 3: Verify build compiles**

```bash
npx nx build website 2>&1 | tail -20
```

Expected: clean build. If any orphan import from `components/homecoming/*` remains (e.g., in `components/helpers/home/HeroSection.tsx`), fix it — the old prototype was experimental and its internals don't have legitimate external consumers.

- [ ] **Step 4: Commit**

```bash
git add apps/website/src/pages/homecoming/index.tsx \
        apps/website/src/components/homecoming/data/adapt.ts
git commit -m "feat(homecoming): page preserves SSR gates, adapts payload → CeremonyData"
```

---

### Task 6.6: Prune `lib/homecoming/` (keep `endpoints.ts`, delete the rest)

**Files:**
- **Keep:** `apps/website/src/lib/homecoming/endpoints.ts` — `fetchHomecomingPayload` + `completeHomecoming` are still load-bearing. `CitizenshipCTA` and `CeremonyFallback` import `completeHomecoming`; the SSR page hits the endpoint directly via `zoPassportServer`. Rewriting `endpoints.ts` is unnecessary — its import from the (deleted) old `components/homecoming/types.ts` for `HomecomingPayload` / `HomecomingCompleteResponse` needs to be repointed (see Step 1 below), but the module shape stays.
- **Delete:** `apps/website/src/lib/homecoming/beatTimeline.ts` — obsolete, old prototype's zone definitions
- **Delete:** `apps/website/src/lib/homecoming/fixtures.ts` — replaced by `components/homecoming/data/demo.ts`
- **Delete:** `apps/website/src/lib/homecoming/obeliskPositions.ts` — obsolete, old prototype's obelisk anchor logic
- **Delete:** `apps/website/src/lib/homecoming/rankBands.ts` — obsolete, old prototype's rank UI

- [ ] **Step 1: Rehome the backend types that `endpoints.ts` consumes**

`endpoints.ts` imports `HomecomingPayload` and `HomecomingCompleteResponse` from the (deleted) old types file. Move those two interfaces into `endpoints.ts` itself, since nothing else imports them and the adapter (`data/adapt.ts`) has its own local type for the same payload shape.

Replace the imports at the top of `apps/website/src/lib/homecoming/endpoints.ts`:

```ts
// apps/website/src/lib/homecoming/endpoints.ts
import { zoPassportServer } from '../../../../../libs/auth/src/utils'

// Backend response shapes — kept local to this file since only the adapter
// (components/homecoming/data/adapt.ts) consumes the payload, and it owns
// a structural type for what it needs.
export interface HomecomingPayload {
  handle: string
  first_name: string | null
  avatar_image: string
  citizen_since: number
  starting_xp: number
  total_xp: number
  final_rank: { key: string; label: string; chip_color: string }
  destinations: { count: number; xp: number; caption: string }
  nights:       { count: number; xp: number; caption: string }
  zostels:      { count: number; xp: number; caption: string }
  tribe:        { count: number; xp: number; caption: string }
  has_journey: boolean
}

export interface HomecomingCompleteResponse {
  homecoming_completed_at: string
  total_xp: number
  rank: string
}

export async function fetchHomecomingPayload(): Promise<HomecomingPayload> {
  const { data } = await zoPassportServer.post<HomecomingPayload>('/api/v1/passport/homecoming/')
  return data
}

export async function completeHomecoming(): Promise<HomecomingCompleteResponse> {
  const { data } = await zoPassportServer.post<HomecomingCompleteResponse>(
    '/api/v1/passport/homecoming/complete/',
  )
  return data
}
```

- [ ] **Step 2: Confirm nothing else imports from `lib/homecoming/*` besides `endpoints.ts`**

```bash
grep -rn "from.*lib/homecoming/\(beatTimeline\|fixtures\|obeliskPositions\|rankBands\)" apps/website/src --include="*.tsx" --include="*.ts"
```

Expected: no matches. If any surface, they are orphan references from the old prototype that should have been handled in Task 1.1 — fix now.

- [ ] **Step 3: Delete the obsolete files**

```bash
git rm apps/website/src/lib/homecoming/beatTimeline.ts \
       apps/website/src/lib/homecoming/fixtures.ts \
       apps/website/src/lib/homecoming/obeliskPositions.ts \
       apps/website/src/lib/homecoming/rankBands.ts
```

- [ ] **Step 4: Build**

```bash
npx nx build website 2>&1 | tail -10
```

Expected: clean build.

- [ ] **Step 5: Grep one more time for any remaining stale references**

```bash
grep -rn "from.*components/homecoming\|from.*lib/homecoming" apps/website/src --include="*.tsx" --include="*.ts"
```

Expected: only legitimate imports from inside the new `components/homecoming/` tree plus `endpoints.ts` consumers.

- [ ] **Step 6: Commit**

```bash
git add -A apps/website/src/lib/homecoming
git commit -m "chore(homecoming): prune lib/homecoming prototype files, rehome backend types"
```

---

### Task 6.7: Visual smoke review (manual)

No files — run the dev server and walk through the ceremony in a browser.

- [ ] **Step 1: Start dev server**

```bash
npx nx serve website
```

Opens http://localhost:4202. Because `/homecoming` runs behind real auth in dev as well, use the preview route for initial visual review:

- `http://localhost:4202/homecoming?preview=1` — demo (populated) ceremony, replay=true (no completion write)
- `http://localhost:4202/homecoming?preview=1&state=zero` — zero-state ceremony

Test the real auth path only after preview looks good, and do it against the `staging` branch preview so the one-time flag doesn't clobber your prod account.

- [ ] **Step 2: Walk through the ceremony**

Verify each of the following in order (against `?preview=1`):

1. **Intro** — canvas is initially black, then wireframe edges appear (Mars terrain outline, `\z/` pillars as line silhouettes, portal rings as line rings, pedestal as line cylinder). Grid plane at `y=0` is faintly visible. After ~2s, solid materials morph in and the camera pans from top-down to front-on.
2. **Idle (t=0)** — Mars surface, `\z/` monument front-on with inner pulse breathing. Hover over the monument: pulse intensifies, hover boost is visible. Move cursor away: pulse relaxes.
3. **Scroll** — scroll down slowly. Camera descends, tilts into dust. Red dust volume is visible around the camera.
4. **Proof 1 (~15% scroll)** — a chrome-stone card with "Destinations · 47" rises from below, holds in frame, drifts up and fades. Confirm that proof 1 is actually visible at scroll ≈ 0.15 — if it lands off-zone, the authored-u mapping (Task 1.6a) is wrong; inspect `sampleSpineAt`.
5. **Proofs 2, 3, 4** — same behavior, each new card, each with their label + count.
6. **Portal approach (~55% scroll)** — camera tips to look straight down. 4 concentric rings become visible, pulsing. Bright core at center.
7. **Portal traversal (~62-70% scroll)** — camera passes through the rings. Bloom should wash the frame white briefly.
8. **Chamber reveal (~75% scroll)** — camera lands in the chamber, warm-grey palette. Concentric floor rings + pedestal + ceiling light. Zobu wireframe appears, then particles condense into a figure on the pedestal.
9. **Issuance (~95% scroll)** — "Become a citizen" button fades in at the bottom. Click it — page should navigate to `/@{handle}` (for preview, that's `/@samurai`). Preview mode does NOT write `homecoming_completed_at`, so refreshing `?preview=1` loops cleanly.

- [ ] **Step 3: Check debug overlay**

Navigate to `/homecoming?debug=1&t=0.62`. Camera should jump to the portal-entry pose. Try `t=0.0`, `t=0.4`, `t=1.0`. Verify no errors in console.

- [ ] **Step 4: Verify zero-state path**

Navigate to `/homecoming?preview=1&state=zero`. Scroll through. Proof card faces should show the zero-state strings (`"Destinations · Your first one awaits"` etc.) instead of numeric counts. CTA still renders and navigates normally. Canvas textures can be inspected in browser DevTools if copy looks wrong.

- [ ] **Step 4b: Verify auth + one-time gates (against staging, not prod)**

On the `staging` branch preview (never against prod — see memory `feedback_zozozo_staging_vs_live`):

- Unauthenticated user visits `/homecoming` → redirected to `/zo-auth?next=/homecoming`.
- Authenticated user with no handle or avatar → redirected to `/onboarding?next=/homecoming`.
- Authenticated user with `homecoming_completed_at` set → redirected to `/@{handle}`.
- First-time authenticated user: ceremony renders, clicking CTA calls `/api/v1/passport/homecoming/complete/` (watch network tab), then navigates to `/@{handle}`. Revisiting `/homecoming` now redirects (gate works).
- Adding `?replay=1` to the completed user's URL: ceremony renders again, but CTA does NOT call the complete endpoint (verified in network tab).

- [ ] **Step 5: Capture visual issues as follow-up tasks**

Any visual problems (flickering, material misbehavior, z-fighting, bloom overshoot) go into a follow-up task list, not into this plan. The goal of this step is *engine works end-to-end*, not pixel-perfect.

- [ ] **Step 6: Commit a session note if anything was fixed along the way**

---

### Task 6.8: Playwright smoke test (conditional)

**Gate:** the monorepo does NOT currently have an `apps/website-e2e` project. Only proceed with this task if the e2e scaffold already exists (check via `ls apps/website-e2e 2>/dev/null`). If it does not exist, **skip this task and file a follow-up** titled "Scaffold apps/website-e2e + port Homecoming smoke tests". Do not block the PR on this.

**Files (only if scaffold exists):**
- Create: `apps/website-e2e/src/homecoming.spec.ts` (adjust path to match the scaffold's existing `src/` convention)

- [ ] **Step 1: Confirm scaffold presence**

```bash
ls apps/website-e2e 2>/dev/null && echo "scaffold present" || echo "skip this task"
```

If output is "skip this task", stop here and open a GitHub issue titled as above referencing this plan. Proceed to Task 6.9.

- [ ] **Step 2: Write smoke test**

```ts
// apps/website-e2e/src/homecoming.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Homecoming ceremony', () => {
  test('mounts without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
    await page.goto('/homecoming')
    await page.waitForTimeout(4000)  // wait through intro
    expect(errors, `console errors: ${errors.join('\n')}`).toEqual([])
  })

  test('CTA is reachable via ?t=1.0 and navigates on click', async ({ page }) => {
    await page.goto('/homecoming?debug=1&t=1.0')
    await page.waitForTimeout(2000)
    const cta = page.getByRole('button', { name: /Become a citizen/i })
    await expect(cta).toBeVisible()
    await cta.click()
    await page.waitForURL(/\/passport\/success/)
  })

  test('reduced motion falls back to poster path', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto('/homecoming')
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible()
    await ctx.close()
  })
})
```

- [ ] **Step 3: Run**

```bash
npx nx e2e website-e2e
```

- [ ] **Step 4: Commit**

```bash
git add apps/website-e2e/src/homecoming.spec.ts
git commit -m "test(homecoming): playwright smoke (mount, CTA, reduced-motion)"
```

---

### Task 6.9: Open PR

- [ ] **Step 1: Confirm branch is ready**

```bash
git status
git log --oneline main..HEAD | head -40
```

- [ ] **Step 2: Push + open PR**

```bash
git push -u origin feat/homecoming-ceremony
gh pr create --title "feat(homecoming): scroll-driven 3D ceremony engine" --body "$(cat <<'EOF'
## Summary
- Rewrites the Homecoming ceremony rendering engine as a scroll-driven R3F cinematic with a spinal camera rig
- Single continuous 3D world: Mars exterior, chrome \z/ monument, 4 proof monoliths, stone portal, particle Zobu in a chamber
- Preserves all existing SSR gates: preview override, kill-switch, auth, identity, one-time completion, backend payload fetch
- CTA writes `homecoming_completed_at` and navigates the user to their `/@{handle}` passport page
- Degraded fallback for low-end / reduced-motion / no-WebGL / slow-load / runtime errors

Design spec: `docs/superpowers/specs/2026-04-23-homecoming-ceremony-engine-design.md`
Implementation plan: `docs/superpowers/plans/2026-04-24-homecoming-ceremony-engine.md`

## Test plan
- [ ] `npx nx test website` passes (unit: schema, spine, sampleSpine, beatProgress, getProofCopy)
- [ ] `npx nx e2e website-e2e` passes (mount, CTA navigation, reduced-motion fallback) — *only if website-e2e scaffold exists; otherwise tracked as a follow-up*
- [ ] Visual walkthrough on `http://localhost:4202/homecoming?preview=1` matches Task 6.7 checklist
- [ ] `?debug=1&t=<value>` deep-links work at t=0, 0.3, 0.62, 1.0
- [ ] `?preview=1&state=zero` renders zero-state proof copy
- [ ] Against staging: auth redirect, identity redirect, one-time redirect, completion write all behave per Task 6.7 Step 4b (never test one-time write against prod)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Wrap-up

All 6 chunks landed. The `feat/homecoming-ceremony` branch now contains:

1. Deleted prototype + pruned lib/homecoming (Tasks 1.1, 6.6)
2. Pure-module foundations with tests — including `sampleSpine` for authored-u timing (Chunk 1)
3. Materials and camera infrastructure (Chunk 2)
4. Exterior scene modules (Chunk 3)
5. Proofs, portal, chamber (Chunk 4)
6. Zobu (Chunk 5)
7. HUD, error boundary, load-timeout, fallback, `Ceremony.tsx`, SSR-preserving page, optional Playwright, PR (Chunk 6)

The `/homecoming` route preserves all existing gates (preview, kill-switch, auth, identity, one-time, payload fetch). The CTA writes `homecoming_completed_at` via the existing `/api/v1/passport/homecoming/complete/` endpoint and navigates the user to `/@{handle}`.

**Hand-off notes for the implementer:**
- The 3D modules (Chunks 2–5) rely on visual review, not unit tests. Run `npx nx serve website` and navigate to `/homecoming?debug=1&t=<n>` for isolated beat review.
- Any module that fights R3F's lifecycle (re-creating geometries, material state on hot reload) is the most common failure mode — if something looks wrong, check the `useMemo` dependencies first.
- CDN assets on `cdn.zo.xyz/homecoming/` are assumed to exist per the asset manifest. If they 404 during implementation, the 3D loader will throw and the fallback path will render instead — that's a feature, not a bug, for CI.
