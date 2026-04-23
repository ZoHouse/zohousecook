---
title: Homecoming Ceremony Engine — Design Spec
date: 2026-04-23
owner: Samurai
status: draft
app: apps/website
branch: feat/homecoming-ceremony
supersedes: apps/website/src/components/homecoming/* (full rewrite)
references:
  - docs/homecoming-igloo-reference-breakdown.md
  - docs/homecoming-igloo-reference-gallery.md
---

# Homecoming Ceremony Engine — Design Spec

The Homecoming ceremony is a scroll-driven 3D cinematic that welcomes a returning citizen to the Zo archive. The user lands on a Mars-like exterior with a chrome `\z/` monument, scrolls to descend through red dust past four proofs of their journey, traverses a pulsating stone portal, lands in a chamber where their Zobu figure resolves on a pedestal, and is prompted to "Become a citizen" — which navigates them to the passport success page.

This document is the design spec for the full 3D engine that runs this sequence. It replaces the current `apps/website/src/components/homecoming/` prototype wholesale.

## 1. Architecture Overview

One React Three Fiber `<Canvas>`, one continuous 3D world, one spinal camera rig driven by scroll. No beat-based scene swapping, no mid-ceremony route changes, no HTML overlays inside the canvas for the proofs. Everything is 3D; the camera is the only thing that moves at engine scale.

```
<CeremonyPage>
  ScrollSpacer (tall div, provides vertical scroll distance)
  <Canvas>  (fixed-position, full viewport)
    <SceneEnvironment>       // fog, lights, sky, palette
    <MarsSurface>            // terrain, dust, ringed planet
    <ZLogoMonument>          // chrome \z/, pulsating, hover
    <LoadingGridline>        // wireframe reveal at mount
    <ProofStack>             // 4 proofs placed vertically
    <PortalStoneRings>       // 4 concentric rings below dust
    <Chamber>                // concentric floor, pedestal
    <ZobuParticleForm>       // wireframe → particles on pedestal
    <CameraRig>              // spine curve, consumes t
    <PostFX>                 // bloom, chromatic wash, grain
  </Canvas>
  <CeremonyHUD>              // tiny pinned HTML chrome
  <CitizenshipCTA>           // HTML button at t >= 0.95
```

The scene graph is structurally static — every component mounts once and lives for the full ceremony. What changes with scroll is the camera's position along the spine curve and each component's local state (opacity, emissive intensity, particle count, rotation) driven by shared `t` progress or by camera proximity.

**Scroll → state flow:**

1. `<ScrollSpacer>` is a tall div (~600vh) that provides vertical scroll distance.
2. A passive scroll listener reads `window.scrollY / (spacer.height - viewport)` and normalizes to `t ∈ [0, 1]`.
3. `useCeremonyProgress()` (zustand) holds `t` and a damped `tLerp` for frame-rate-independent smoothing.
4. `<CameraRig>` reads `tLerp`, samples the spine curve at `u = tLerp`, places the camera.
5. Every other component either reads `t` directly (for its beat envelope) or reads `camera.position` for proximity-based effects.

**Why this architecture:**

- Game-engine coherence — one space, one light model, one palette cross-fade.
- Scroll scrub is trivially smooth — camera position is a pure function of scroll; rewind works automatically.
- Modular at the file level, monolithic at the scene level.
- Follows the Igloo reference's axial motion grammar: push → descend → settle.

## 2. World Layout and Coordinate System

The world is a tall vertical corridor. The camera enters at the top, rides the spine down, and ends just above the chamber floor. All scene elements are placed once in world-space; nothing is translated by scroll. Only the camera moves.

```
y-axis (up)
   ↑
   │   ═══════   y =  0     Mars surface plane + ringed planet in the sky
   │   ┃\z/┃               ZLogoMonument pillars (y = 0 to +8)
   │   ░░░░░░░             red smoke/dust volume begins (y = -5)
   │   ░ [P1] ░   y = -15   Proof 1: Destinations
   │   ░ [P2] ░   y = -35   Proof 2: Nights
   │   ░ [P3] ░   y = -55   Proof 3: Zostels
   │   ░ [P4] ░   y = -75   Proof 4: Tribe
   │   ░░░░░░░             dust thins (y = -95)
   │   ⊙⊙⊙⊙⊙     y = -110   Portal: 4 concentric stone rings
   │   ▓▓▓▓▓▓▓    y = -130   chamber transition (volumetric wash)
   │   ⭕          y = -160   Chamber floor (concentric ringed disc)
   │   👤          y = -155   Pedestal
   │   ◯          y = -150   Zobu particle form
   ↓
```

*Exact numbers are illustrative — spine length and spacing are tuned in-browser during implementation.*

**Proof motion:** each proof sits on the spine's central axis at a fixed anchor `y`. As the camera passes, the proof's local animation plays: it emerges from below its anchor, lerp-fades in, holds at anchor, then lifts upward and fades out as the camera continues down. The *camera descending* plus the *proof rising* produces the bottom-to-top crossing frame motion matching the Igloo reference's ice-specimen grammar.

**Chamber transition:** between `u = 0.55` and `u = 0.70`, fog color and density interpolate from the Mars-warm palette to a warm-grey chamber palette. The camera is physically *inside* the portal rings during this stretch, which become a volumetric tunnel. No cut, no mount/unmount — shader state interpolates continuously.

## 2.5. Intro / Materialization Sequence

Runs on mount, before `t = 0`. A Matrix / Assassin's Creed wireframe reveal that also doubles as the preloader.

```
PHASE A  (0.0–0.6s)   MOUNT — black canvas, preloader kicks off
PHASE B  (0.6–2.0s)   WIREFRAME — top-down camera, all scene geometry
                       visible only as glowing edge lines. Faint grid plane at y=0.
PHASE C  (2.0–3.5s)   MATERIALIZATION — wireframes dissolve into solid materials;
                       camera pans from top-down to front-on.
PHASE D  (3.5s+)      IDLE (t=0) — fully rendered Mars scene, front-on,
                       \z/ monument pulsating. Scroll becomes live.
```

**Mechanism:** a single global shader uniform `uMaterialization ∈ [0, 1]` drives the reveal. Every custom material in the scene has `uMaterialization` injected. `0` = wireframe-only mode (emissive edge lines); `1` = full PBR. Phase B → C tweens the uniform from 0 → 1 with an ease-out over ~1.5s. Camera transform tweens in parallel over the same duration.

**Skip path:** if the user scrolls during Phase B or C, the intro fast-forwards (remaining materialization compresses to ~300ms) and normal scroll-driven `t` takes over.

**Preloader gate:** Phase A waits for `useProgress()` from drei to report geometry loaded. Textures can continue streaming during materialization — they pop in as the surfaces solidify, which reads as thematic.

## 3. Camera Spine and Scroll Mapping

The camera is a point riding two parallel `THREE.CatmullRomCurve3` curves: one for where it is (`positionSpine`), one for where it's looking (`lookAtSpine`). Both are sampled at the same `u ∈ [0, 1]` derived from scroll.

**Waypoint list** (illustrative, tuned during implementation):

| u | pos | lookAt | note |
|---|---|---|---|
| 0.00 | (0, 2, 14) | (0, 3, 0) | idle front-on |
| 0.08 | (0, -2, 10) | (0, -5, 0) | tilt into dust |
| 0.15 | (0, -10, 8) | (0, -15, 0) | approach proof 1 |
| 0.27 | (0, -28, 8) | (0, -35, 0) | approach proof 2 |
| 0.39 | (0, -48, 8) | (0, -55, 0) | approach proof 3 |
| 0.50 | (0, -68, 8) | (0, -75, 0) | approach proof 4 |
| 0.55 | (0, -95, 3) | (0, -110, 0) | tip to top-down |
| 0.62 | (0, -110, 0) | (0, -160, 0) | enter portal |
| 0.70 | (0, -135, 0) | (0, -160, 0) | through rings |
| 0.82 | (0, -150, 2) | (0, -158, 0) | ease off-axis, see Zobu |
| 1.00 | (0.5, -148, 3.5) | (0, -155, 0) | chamber settle |

Curves are built with tension `0.3` to prevent overshooting. Runtime uses `getPointAt()` (arc-length parameterization) so visual speed is even regardless of waypoint density.

**Scroll progress hook** — `useCeremonyProgress`:

```ts
type ProgressStore = {
  t: number              // raw scroll ∈ [0,1]
  tLerp: number          // damped t
  uMaterialization: number
  introDone: boolean
  setT: (t: number) => void
  setIntroDone: () => void
  advanceIntro: (delta: number) => void
}
```

A single passive scroll listener writes `t`. A single `useFrame` in `<CameraRig>` damps `tLerp` toward `t` using `damp(tLerp, target, 8, delta)`. Damping is non-negotiable — raw scroll is stepwise (wheel, touch inertia) and would make the camera feel jittery.

**Camera rig** — one component, pure function:

```tsx
function CameraRig() {
  const camera = useThree(s => s.camera)
  useFrame(() => {
    const u = useCeremonyProgress.getState().tLerp
    positionSpine.getPointAt(u, camera.position)
    const look = lookAtSpine.getPointAt(u, tmpVec3)
    camera.lookAt(look)
  })
  return null
}
```

No beat logic inside the rig. Every other component reads `t` for its own envelope.

**Named zones** (shared constants):

```ts
export const ZONES = {
  idle:             [0.00, 0.05],
  descent:          [0.05, 0.10],
  proof1:           [0.10, 0.22],
  proof2:           [0.22, 0.34],
  proof3:           [0.34, 0.46],
  proof4:           [0.46, 0.55],
  portalApproach:   [0.55, 0.62],
  portalTraversal:  [0.62, 0.70],
  chamberReveal:    [0.70, 0.85],
  issuance:         [0.85, 1.00],
}
```

Helper `beatProgress(t, zone) → [0, 1]` returns 0 before the zone, 0→1 inside it, 1 after. Scene elements use this to drive local animations.

**Intro → scroll handoff:** while `introDone === false`, camera is driven by the intro timeline (separate `useFrame` tweening over ~1.5s). At `introDone = true`, the rig takes over. Intro's end pose equals `positionSpine.getPointAt(0)`, so the handoff is seamless.

**Scroll unlock gate:** during intro, `body { overflow: hidden }` prevents premature scroll. At `introDone`, overflow clears. At `t >= 0.95`, overflow locks again so further scroll can't push past 1.0 into phantom overflow — the CTA button is the only forward action.

**Reverse scroll:** free. Scrolling up reduces `t`, reduces `tLerp`, reverses camera and all envelopes. Everything is a pure function of `t`.

**Mobile input:** touch-drag produces scroll on the spacer div — same code path. iOS rubber-banding is clamped by `clamp(t, 0, 1)`.

## 4. Scene Modules

Each module is a self-contained R3F component that mounts once, lives in the tree for the full ceremony, and drives its local state from `t` or from camera proximity. All modules consume `uMaterialization` during intro and named `ZONES` during scroll.

### `<SceneEnvironment>` — the mood machine

- Owns scene background, fog, ambient + directional lights, palette-interpolation uniforms.
- Per-frame: interpolates fog color + density and key-light color from Mars-warm palette to chamber-warm-grey palette across `portalTraversal → chamberReveal`. No hard switch.
- **Mars palette** (exterior): fog `#c46144` at density `0.035`, key-light `#ffb07a`, ambient `#3a1a12`.
- **Chamber palette** (interior): fog `#d8cfc6` at density `0.06`, key-light `#f3e8dc`, ambient `#1a1a1c`.
- Does *not* own post-processing — that is `<PostFX>`.

### `<MarsSurface>` — terrain + sky

- Large terrain plane with displaced heightmap at `y = 0`, extends ~200 units, disappears under dust past `y = -5`.
- Ringed planet: one billboarded sphere far behind the horizon, parallaxes very slightly with camera position.
- Dust volume: vertical slab from `y = -5` to `y = -95`, `ShaderMaterial` raymarched noise (tier 3) or stacked billboard planes (tier 2/1). Dust thins below `y = -95` so the portal reveal is unoccluded.
- Dust noise scrolls over time regardless of `t` — always alive.
- Mars surface mesh frustum-culls once camera is below `y = -50`.

### `<ZLogoMonument>` — the chrome `\z/` hero

- Three chrome pillar meshes at `y = 0` to `+8`, loaded as `.glb` from cdn.zo.xyz.
- Material: shared `ChromeStoneMaterial` (see section 4.1).
- Pulse: inner emissive intensity = `baseline + sin(phase) * amplitude`. Baseline always on.
- Hover: React state `monumentHovered` driven by `onPointerOver/Out` on a bounding-box proxy mesh. Amplitude and frequency both increase via damped lerp.
- Electric arcs: child `<ArcField>` renders thin lines between random point pairs on the three pillars, positions and opacity animated per frame. Arc frequency increases when hovered.
- Envelope: opacity 1 during `idle` and `descent`, fades to 0 by `t = 0.15` (camera is below it).

### `<LoadingGridline>` — wireframe intro overlay

- For each scene mesh, a parallel `THREE.LineSegments` built from `THREE.EdgesGeometry(mesh.geometry)` with an additive unlit emissive line material.
- Wireframe opacity = `1 - uMaterialization`. Solid meshes fade in with `uMaterialization` on the same uniform.
- A faint grid plane at `y = 0` visible only during wireframe phase.
- Group sets `visible = false` after `introDone = true`; no unmount.

### `<ProofStack>` — the four rising proofs

Owns four `<Proof>` children, one per proof, each pinned to a different `y`.

**`<Proof>` props:** `{ index, zone, data: ProofData, anchorY }`.

**Geometry:** shared chrome-stone monolith (~2m wide) with a flat front face holding a canvas-drawn texture showing label + count. Frame mesh modeled once, reused 4 times.

**Local envelope** against `u = beatProgress(t, zone)`:

- `u < 0`: `y = anchorY - 6`, opacity `0`
- `0 ≤ u < 0.25`: rise to `anchorY`, opacity `0 → 1`
- `0.25 ≤ u < 0.75`: hold at `anchorY`, opacity `1`, slight rotation drift
- `0.75 ≤ u < 1`: rise to `anchorY + 6`, opacity `1 → 0`
- `u ≥ 1`: hidden

**Order:** Destinations (1), Nights (2), Zostels (3), Tribe (4).

### `<PortalStoneRings>` — the aperture

- 4 concentric ring rigs, axis-aligned with the spine's `y`. Outermost to innermost, progressively deeper `y` with decreasing radius, forming a short cylindrical well the camera descends into.
- Each ring is 8–12 fragment pieces (instanced from a single `portal-ring-fragment.glb`), not a solid torus. Visible seams match the carved-stone feel in the reference.
- Material: shared `ChromeStoneMaterial` with the *same* inner emissive pulse as the `\z/` monument. Rings breathe at low baseline from the start — visible glowing hints through the red dust as the camera descends.
- Pulse amplification by proximity: intensity = `baseline + proximity * amplitude` where `proximity` is `camera.position.distanceTo(portal.center)` normalized against a threshold radius.
- Arc-energy web: `ShaderMaterial` plane inside the innermost ring renders crackling energy lines, opacity driven by `portalApproach` progress.
- White-out core: bloom-friendly white emissive disc at the innermost ring's center, intensity spikes sharply during `portalTraversal`, driving the `<PostFX>` bloom to full-frame wash.

### `<Chamber>` — concentric floor + pedestal

- Floor: concentric ring meshes at `y ≈ -160`, each with subtle emissive rim. Matches the reference's radial ring geometry.
- Pedestal: squat cylinder at the center with concentric top grooves, chrome-stone + subtle emissive rim.
- Ambient motes: thin layer of bright particles drifting in the chamber volume.
- Ceiling light ring: bright emissive torus at the chamber's top, contributes to key lighting.
- Visibility is controlled by fog rather than opacity — the chamber is always in the scene, but fog prevents it being seen until the camera descends close.

### `<ZobuParticleForm>` — the identity figure

- Input: Zobu base mesh (`.glb`) from `zohouse/avatar/` pipeline. User's own if `zobu.modelUrl` is available; generic fallback otherwise.
- Rendering: `MeshSurfaceSampler` samples ~20k–40k points on the surface at mount. Points stored in `BufferGeometry` with a custom `ShaderMaterial` rendering round sprites.

**Two-stage reveal:**

1. **Wireframe stage** (first half of `chamberReveal`): same base mesh rendered as `THREE.LineSegments` from `EdgesGeometry`, emissive lines, scrolling UV noise so wires read as loading. Opacity lerps in as camera enters chamber.
2. **Particle stage** (second half): wireframe fades out; point cloud fades in. Points start offset from target positions by random vectors, lerp toward sampled targets — produces the "condensation" read from reference image 7→8.

- At rest: gentle breathing — points oscillate along their normals with low amplitude. Figure is alive while standing still.

### `<PostFX>` — post-processing stack

Via `@react-three/postprocessing`.

- **Bloom:** gentle baseline always. Intensity spikes during `portalApproach → portalTraversal` to produce the white-wash threshold.
- **Chromatic aberration:** subtle always, spikes during portal traversal.
- **Vignette:** gentle always.
- **Grain:** low-amplitude always; ties exterior and chamber into one machine.
- **Tonemapping:** ACES. Exposure bumps up in chamber.
- Disabled on low-end devices (see section 6).

### HUD — rendered as HTML over the canvas

- `<TopLeftLogo>` — pinned `\z/` mark, fades out during chamber.
- `<BottomLeftSound>` — mute toggle for optional audio.
- `<ScrollHint>` — tiny cue at idle, fades by `t > 0.03`.
- `<CitizenshipCTA>` — button at `t ≥ 0.95`, fades in, click → white-bloom wash → navigate to passport success page.

### 4.1. Shared: `ChromeStoneMaterial` factory

The Zo archive's material language. Used by `<ZLogoMonument>` pillars, `<PortalStoneRings>` fragments, `<ProofStack>` frames, chamber pedestal.

```ts
createChromeStoneMaterial({
  albedoUrl,
  normalUrl,
  envMap,
  pulseColor,       // inner emissive color
  pulseBaseline,    // resting emissive intensity
  pulseAmplitude,   // hover/proximity-driven boost
  pulsePhase,       // random offset so instances breathe out of sync
})
```

`MeshPhysicalMaterial` base (metalness `1.0`, roughness `0.15`, `envMapIntensity` `1.4`) with an emissive channel routed through a custom shader extension that adds the inner-pulse term. Every chrome-stone object in the archive reads from the same material factory so visual coherence is guaranteed.

## 5. State and Data Flow

Two kinds of state, clean separation:

1. **Input data** — `CeremonyData` passed as props at mount, does not change during the ceremony.
2. **Runtime state** — zustand stores (`useCeremonyProgress`, `useCeremonyInteraction`) updated per-frame or on events, read imperatively without triggering React re-renders.

### `CeremonyData` contract

```ts
export type ProofData = {
  id: 'destinations' | 'nights' | 'zostels' | 'tribe'
  label: string
  count: number
  accent?: string
}

export type ZobuData = {
  modelUrl: string  // cdn.zo.xyz/zobu/{avatar_id}.glb, or generic fallback
}

export type CeremonyData = {
  user: { id: string; handle: string; displayName: string }
  proofs: ProofData[]   // exactly 4, in brief's order
  zobu: ZobuData
  issuedAt?: string
}
```

### Data flow

```
Zo API (passport endpoint)
  ▼
getServerSideProps ──► CeremonyData ──► <CeremonyPage>
                                           ▼
                                        <Ceremony data={data}>
                                         │       │          │
                                         ▼       ▼          ▼
                                   <ProofStack> <ZobuParticleForm> <CitizenshipCTA>

Runtime (no React re-renders):
  window scroll ─► listener ─► useCeremonyProgress.setT
                                     ▼ (subscribed imperatively)
                     <CameraRig>, every scene module's useFrame
```

**Initial build** hardcodes `DEMO_CEREMONY` in `data/demo.ts`; real fetch is a one-liner swap in `getServerSideProps`.

```ts
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
```

### Runtime stores

`useCeremonyProgress` (hot, per-frame):
- `t`, `tLerp`, `uMaterialization`, `introDone`
- Read by `<CameraRig>`, every beat envelope, `<PostFX>`
- Written by scroll listener and intro timeline

`useCeremonyInteraction` (cold, on events):
- `monumentHovered`, `audioEnabled`, `ctaClicked`
- Read by `<ZLogoMonument>`, `<AudioTrack>`, `<CitizenshipCTA>`
- Written by pointer events and HUD buttons

Two stores because their update frequencies and consumers differ.

### Zero-state handling

New user (counts = 0, possibly no user-baked Zobu):

- All four beats still play — ceremony is the welcome, not a reward for tenure.
- Proof copy shifts when `count === 0`:
  - `destinations: 0` → "Destinations · Your first one awaits"
  - `nights: 0` → "Nights · The archive is listening"
  - `zostels: 0` → "Zostels · 108+ waypoints ready"
  - `tribe: 0` → "Tribe · You are the first signal"
- Zobu: generic fallback loads; subtle chamber HUD note: *"Your Zobu will form as you travel."*
- CTA copy unchanged: "Become a citizen."

Encoded in `getProofCopy(proof: ProofData)`, not in branching beats.

### Committed decisions

1. **Proof visual:** Hybrid — 3D chrome-stone frame + 2D canvas-drawn face texture.
2. **Data source:** Typed `CeremonyData` prop with realistic demo values now; API wiring is a follow-up.
3. **Zobu ownership:** User's own via `modelUrl` with generic fallback.
4. **Device target:** Desktop-first (1440px+); degraded fallback on mobile/low-end.
5. **Audio:** Optional, off by default; single ambient track if we ship with audio. Ships silent if not.
6. **CTA copy:** "Become a citizen."

## 5.5. 3D Asset Manifest

Already available: **chrome `\z/` monument (.glb)**, **idle Zobu (.glb)**.

### Tier 1 — new meshes

| Asset | Format | Budget | Notes |
|---|---|---|---|
| proof-frame monolith | `.glb` | ≤ 8k tris | Chrome-stone frame holding a 2D card face. Instanced 4× with different face textures. |
| portal ring fragment | `.glb` | ≤ 2k tris per piece | One arc segment, placed 8–12 times around the ring axis. Reused across all 4 rings. |
| pedestal | `.glb` | ≤ 3k tris | Chamber pedestal, concentric top grooves. Chrome-stone + subtle emissive rim. |
| Mars terrain | `.glb` or procedural | ≤ 20k tris | Hand-sculpted tile OR procedurally displaced from a heightmap texture. |
| ringed planet | `.glb` or procedural | ≤ 4k tris | Sphere + rings disc. Can be procedural. |

**Verify existing `\z/` monument has:** separable pillar meshes (each pillar animates independently), clean UVs for chrome material, interior cavity or shader channel for inner emissive.

**Verify existing idle Zobu is:** watertight surface, sub-50k tris, static pose.

### Tier 2 — textures and environment maps

| Asset | Format | Notes |
|---|---|---|
| HDRI environment maps | `.hdr` 2k × 1k | Two — Mars-warm exterior, warm-grey chamber. Cross-faded by `<SceneEnvironment>`. |
| chrome-stone albedo / normal / roughness | `.jpg` 2k × 2k | Shared by monument, portal rings, proof frames, pedestal. |
| Mars terrain albedo / normal | `.jpg` 2k × 2k tileable | |
| Mars heightmap | `.png` 2k × 2k R16 | Only if terrain is procedural. |
| ringed planet albedo | `.jpg` 1k × 512 | |
| ringed planet ring texture | `.png` 2k × 128 with alpha | |

### Tier 3 — procedural (no asset files)

Chamber concentric floor rings, chamber ceiling light ring, red dust volume, electric arcs on `\z/`, portal arc-energy web, portal white-out core, proof card faces (canvas-drawn per `ProofData`), wireframe intro lines (via `EdgesGeometry`), wireframe floor grid, Zobu point cloud (via `MeshSurfaceSampler`), Zobu wireframe stage.

### Production shopping list

- [ ] proof-frame monolith `.glb`
- [ ] portal ring fragment `.glb`
- [ ] pedestal `.glb`
- [ ] Mars terrain (heightmap or sculpted)
- [ ] ringed planet (glb or procedural)
- [ ] 2× HDRIs (Mars warm, chamber interior)
- [ ] chrome-stone texture set (albedo + normal + roughness)
- [ ] Mars terrain texture set (albedo + normal ± heightmap)
- [ ] ringed planet textures (body + ring band)
- [ ] verify `\z/` monument has separable pillars + emissive channel
- [ ] verify idle Zobu is watertight + sub-50k tris

**Hosting:** all assets on `cdn.zo.xyz`, never `apps/website/public/` (see memory `feedback_vercel_public_not_served`). Engine loads via `useGLTF('https://cdn.zo.xyz/homecoming/...')`.

## 6. Performance, LOD, and Fallbacks

Target: 60fps on desktop, 30fps minimum on tablet, degraded still-image + CTA on mobile / low-end.

### Device tier detection

`detect-gpu` classifies at mount. Zustand selector — modules read tier and switch complexity without re-mounting.

- Tier 3 (discrete GPU): full stack.
- Tier 2 (mid): bloom + grain only, reduced particle counts, 1k textures/HDRI.
- Tier 1 (integrated / low): no post-FX, billboard dust, 512 textures, 8k Zobu particles.
- Tier 0 (unknown): treat as tier 1.

### Per-module LOD

| Module | Tier 3 | Tier 2 | Tier 1 |
|---|---|---|---|
| `<ZLogoMonument>` | full PBR + arcs | same, ½ arc density | same, no arcs |
| `<MarsSurface>` | 200×200, 200u distance | 100×100, 120u | 50×50, 80u |
| dust volume | raymarched | stacked billboards | same as mid |
| `<ProofStack>` | full PBR | reduced roughness sampling | flat shaded |
| `<PortalStoneRings>` | 48 fragments | 40 | 32 |
| `<ZobuParticleForm>` | 40k points, custom shader | 20k | 8k, default point material |
| `<PostFX>` | bloom + chromatic + grain + vignette | bloom + grain | off |

Bloom is expensive and the first to go. Anything raymarched scales or disappears on tier 1.

### Instancing and memoization

- Portal fragments and proof frames use `InstancedMesh` / drei's `<Instanced>`. One draw call per mesh × 4 rings instead of 48 individual.
- `ChromeStoneMaterial` is shared — one shader program, many instances.
- Zobu point cloud geometry is built once in `useMemo`. Sampler runs in a web worker if available.

### Frame-budget discipline

- One `useFrame` per module; no nesting.
- Zero per-frame allocations — temp `Vector3`/`Euler` hoisted to module scope.
- No trig in hot loops unless one-shot per frame per module.
- `gl.pixelRatio` clamped to `Math.min(window.devicePixelRatio, 1.5)`.
- Post at 75% resolution on tier 2, upscaled.

### Preloader and asset load order

- Phase A: black canvas, invisible status text.
- Phase B: wireframe intro begins as soon as `useProgress` reports geometry ready. Textures stream in during materialization.
- Asset priority:
  1. Mars HDRI + `\z/` glb + chrome-stone textures
  2. Proof-frame glb + face textures
  3. Portal fragment glb + Mars terrain
  4. Chamber HDRI + Zobu glb + pedestal
- 10s load budget ceiling; exceeding it falls back to `<CeremonyFallback>`.

### `<CeremonyFallback>` — no-3D path

Renders when:

- WebGL unavailable
- `prefers-reduced-motion: reduce`
- Device tier 0 AND viewport < 768px
- Preloader exceeds 10s budget
- `<Canvas>` throws (error boundary)

Shows:

- Full-bleed static poster of the idle Mars + `\z/` (pre-rendered at 2880×1800)
- Four proof counts as a vertical stack of 2D cards using the existing design system
- The CTA button ("Become a citizen")
- Tiny note: *"Your ceremony is ready when your device is."*

Nobody is locked out. Low-end phones see a calm poster, their stats, and the CTA. They still become citizens.

### Dev debug overlay

Gated by `?debug=1`. Shows `t`, `tLerp`, active zone, camera pose, draw calls, device tier, LOD settings. Keyboard `[` / `]` step `t` by 0.01, `R` resets to 0, `F` skips to 1. `?t=0.62` deep-links to a specific beat for isolated review.

## 7. Accessibility, Testing, File Structure, Boundaries

### Accessibility

- **Reduced motion:** `<CeremonyFallback>` renders instead of the 3D canvas.
- **Keyboard path:** tab into canvas focuses a hidden anchor; Enter fast-forwards `t` to 1.0 and focuses the CTA.
- **Screen readers:** canvas is `aria-hidden="true"`. A visually-hidden `<section>` alongside announces the narrative linearly: "You have returned to the archive. Four proofs of your journey: 47 Destinations, 112 Nights, 23 Zostels, 184 Tribe. The archive recognizes you. Become a citizen."
- **Focus indicators:** CTA has visible 2px outline on focus.
- **Color contrast:** all HUD text meets WCAG AA against actual backdrops (warmest Mars red, warmest chamber grey).

### Testing strategy

**Unit (Vitest):**

- `beatProgress(t, zone)` exhaustive edge cases
- `damp()` frame-rate independence
- Spine construction — valid `CatmullRomCurve3`, `getPointAt` defined at 0, 0.5, 1
- `getProofCopy(proof)` zero-state branches
- `CeremonyData` zod validator
- Device tier classifier

**Integration (Playwright):**

- Page mounts without crashing on demo data
- Scroll from 0 → 1 never throws
- CTA clickable at `t ≥ 0.95`, navigates to passport success
- Fallback renders with `--disable-gpu`
- Reduced-motion triggers fallback

**Not tested:**

- Visual correctness — humans review visually.
- Frame rate — manual Chrome DevTools during review, not CI.
- Scroll smoothness — subjective, reviewed in browser.

**Review workflow:**

- `?debug=1` overlay for instant beat jumping.
- `?t=0.62` deep-link for isolated beat review.
- No Storybook — engine only makes sense as one continuous scene.

### File structure

```
apps/website/src/
├── pages/
│   └── homecoming/
│       └── index.tsx                 # <CeremonyPage> + getServerSideProps
├── components/
│   └── homecoming/
│       ├── Ceremony.tsx              # <Canvas> wrapper + HUD
│       ├── types.ts                  # CeremonyData, ProofData, ZobuData
│       ├── data/
│       │   └── demo.ts               # DEMO_CEREMONY
│       ├── copy/
│       │   └── getProofCopy.ts
│       ├── state/
│       │   ├── useCeremonyProgress.ts
│       │   └── useCeremonyInteraction.ts
│       ├── hooks/
│       │   ├── useScrollListener.ts
│       │   ├── useIntroTimeline.ts
│       │   ├── useDeviceTier.ts
│       │   └── useBeatProgress.ts
│       ├── canvas/
│       │   ├── CameraRig.tsx
│       │   ├── SceneEnvironment.tsx
│       │   ├── MarsSurface.tsx
│       │   ├── ZLogoMonument.tsx
│       │   ├── LoadingGridline.tsx
│       │   ├── ProofStack.tsx
│       │   ├── Proof.tsx
│       │   ├── PortalStoneRings.tsx
│       │   ├── Chamber.tsx
│       │   ├── ZobuParticleForm.tsx
│       │   └── PostFX.tsx
│       ├── materials/
│       │   ├── ChromeStoneMaterial.ts
│       │   └── DustShader.ts
│       ├── spine/
│       │   ├── waypoints.ts
│       │   ├── zones.ts
│       │   └── buildSpine.ts
│       ├── hud/
│       │   ├── TopLeftLogo.tsx
│       │   ├── BottomLeftSound.tsx
│       │   ├── ScrollHint.tsx
│       │   └── CitizenshipCTA.tsx
│       └── fallback/
│           └── CeremonyFallback.tsx
└── __tests__/
    └── homecoming/
        ├── beatProgress.test.ts
        ├── spine.test.ts
        ├── getProofCopy.test.ts
        └── schema.test.ts
```

Replaces the existing `apps/website/src/components/homecoming/*` wholesale. Scroll is driven by the spacer div inside `Ceremony.tsx`; there is no separate `ScrollRail`.

### Explicit non-goals

- No per-user Zobu trait compositing in this engine — `ZobuData.modelUrl` comes pre-baked.
- No passport rendering inside the canvas — CTA navigates out.
- No multiplayer / live telemetry — solo ceremony.
- No i18n in v1.
- No mobile 3D parity — mobile gets fallback.
- No audio in v1 unless a track is ready.
- No A/B variants.

### Open items carried into the implementation plan

1. Spine waypoint tuning — illustrative numbers here; tuned in-browser.
2. Audio track source/duration if shipped in v1.
3. Fallback poster image — requires a frozen scene to screenshot from.
4. Final passport success route URL (`/passport/success`, `/@handle`, or other — see `project_passport_is_home`).
5. Copy review on zero-state proof strings.

## Summary of locked decisions

1. Full rewrite of `apps/website/src/components/homecoming/`.
2. Single R3F canvas, spinal camera rig, scroll drives `t ∈ [0, 1]`.
3. Intro: wireframe matrix → materialization → Mars idle.
4. Timeline: idle → descent → 4 proofs → portal approach → traversal → chamber → issuance.
5. Shared `ChromeStoneMaterial` + pulse across `\z/` monument and portal ring fragments.
6. Hybrid proofs (3D frame + 2D card face), zero-state copy, demo data now → real data later.
7. Zobu particle form from user's `.glb` with generic fallback.
8. CTA "Become a citizen" at `t ≥ 0.95` → navigate to passport success page.
9. Degraded fallback for low-end / reduced-motion / no-WebGL.
10. File structure replaces the existing 13-file canvas/ entirely.
