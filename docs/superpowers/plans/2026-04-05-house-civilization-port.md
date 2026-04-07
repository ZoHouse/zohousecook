# Port Civilization to /house Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old `/house` page in the zo.xyz website app with the new Civilization landing page from `zo-civilisation/`.

**Architecture:** Copy all civilization components and assets into `apps/website/src/components/helpers/house/` (replacing old components). Adapt from App Router (`"use client"` + `motion/react`) to Pages Router (`framer-motion`). The page uses framer-motion (already in monorepo), Tailwind (already in monorepo), and no external deps beyond what exists.

**Tech Stack:** Next.js 14 Pages Router, React 18, Tailwind CSS 3, framer-motion 11

---

## File Structure

### Delete (old house components)
- `apps/website/src/components/helpers/house/ApplyCTA.tsx`
- `apps/website/src/components/helpers/house/CultureSection.tsx`
- `apps/website/src/components/helpers/house/Economics.tsx`
- `apps/website/src/components/helpers/house/FounderStack.tsx`
- `apps/website/src/components/helpers/house/HouseHero.tsx`
- `apps/website/src/components/helpers/house/HouseStats.tsx`
- `apps/website/src/components/helpers/house/Program.tsx`
- `apps/website/src/components/helpers/house/Properties.tsx`
- `apps/website/src/components/helpers/house/SacredPillars.tsx`
- `apps/website/src/components/helpers/house/WhatIsZoHouses.tsx`
- `apps/website/src/components/helpers/house/index.ts`

### Create (new civilization components)
- `apps/website/src/components/helpers/house/BlurFade.tsx` — scroll-triggered fade animation
- `apps/website/src/components/helpers/house/HyperText.tsx` — text scramble animation
- `apps/website/src/components/helpers/house/TextReveal.tsx` — scroll-progress text reveal
- `apps/website/src/components/helpers/house/MissionHouses.tsx` — horizontal scroll houses
- `apps/website/src/components/helpers/house/ZoRadioPill.tsx` — inline radio player (from dashboard)
- `apps/website/src/components/helpers/house/MobileWaitlistBar.tsx` — sticky bottom CTA
- `apps/website/src/components/helpers/house/FrequencyGate.tsx` — "tap to tune in" gate
- `apps/website/src/components/helpers/house/LoadingScreen.tsx` — Imagine/Build/Ship loader
- `apps/website/src/components/helpers/house/HouseWrapper.tsx` — orchestrates gate → loading → page
- `apps/website/src/components/helpers/house/house.css` — civilization-specific styles
- `apps/website/src/components/helpers/house/index.ts` — re-exports

### Modify
- `apps/website/src/pages/house.tsx` — replace with new civilization page
- `apps/website/src/config/navigationLinks.ts` — update house nav links

### Assets (copy to `apps/website/public/house/`)
- `hero-video.mp4`, `hero.webp`, `globe.webp`
- `dinner.webp`, `demoday.webp`, `mentor.webp`
- `dubai.webp`, `singapore.webp`, `sf.webp`
- `zo-blr.webp`, `zo-krm.webp`
- `pfp1.webp`, `pfp2.webp`, `pfp3.webp`

---

## Chunk 1: Assets & UI Primitives

### Task 1: Copy static assets

**Files:**
- Create: `apps/website/public/house/*.webp`, `apps/website/public/house/hero-video.mp4`

- [ ] **Step 1: Create house assets directory and copy files**

```bash
mkdir -p apps/website/public/house
cp zo-civilisation/public/*.webp apps/website/public/house/
cp zo-civilisation/public/hero-video.mp4 apps/website/public/house/
```

- [ ] **Step 2: Verify files**

```bash
ls apps/website/public/house/
```

Expected: 14 webp files + 1 mp4

- [ ] **Step 3: Commit**

```bash
git add apps/website/public/house/
git commit -m "assets: add civilization house images and video"
```

### Task 2: Create BlurFade component

**Files:**
- Create: `apps/website/src/components/helpers/house/BlurFade.tsx`

- [ ] **Step 1: Create BlurFade**

Port from `zo-civilisation/src/components/ui/blur-fade.tsx`. Changes:
- Remove `"use client"` directive (Pages Router doesn't use it)
- Change `from "motion/react"` to `from "framer-motion"`
- Remove `cn()` dependency — use plain string concatenation

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/helpers/house/BlurFade.tsx
git commit -m "feat(house): add BlurFade animation component"
```

### Task 3: Create HyperText component

**Files:**
- Create: `apps/website/src/components/helpers/house/HyperText.tsx`

- [ ] **Step 1: Create HyperText**

Port from `zo-civilisation/src/components/ui/hyper-text.tsx`. Changes:
- Remove `"use client"`
- Change `from "motion/react"` to `from "framer-motion"`
- Replace `cn()` with template literal: `` `overflow-hidden ${className || ""}` ``

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/helpers/house/HyperText.tsx
git commit -m "feat(house): add HyperText scramble component"
```

### Task 4: Create TextReveal component

**Files:**
- Create: `apps/website/src/components/helpers/house/TextReveal.tsx`

- [ ] **Step 1: Create TextReveal**

Port from `zo-civilisation/src/components/ui/text-reveal.tsx`. Changes:
- Remove `"use client"`
- Change `from "motion/react"` to `from "framer-motion"`
- Replace `cn()` with template literals

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/helpers/house/TextReveal.tsx
git commit -m "feat(house): add TextReveal scroll component"
```

---

## Chunk 2: House-Specific Components

### Task 5: Create MissionHouses horizontal scroll

**Files:**
- Create: `apps/website/src/components/helpers/house/MissionHouses.tsx`

- [ ] **Step 1: Create MissionHouses**

Port from `zo-civilisation/src/components/mission-houses.tsx`. Changes:
- Remove `"use client"`
- Change `from "framer-motion"` (already correct import)
- Update image paths: `/zo-blr.webp` → `/house/zo-blr.webp`

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/helpers/house/MissionHouses.tsx
git commit -m "feat(house): add MissionHouses horizontal scroll"
```

### Task 6: Create ZoRadioPill

**Files:**
- Create: `apps/website/src/components/helpers/house/ZoRadioPill.tsx`

- [ ] **Step 1: Create ZoRadioPill**

Port from `zo-civilisation/src/components/zo-radio-pill.tsx`. Changes:
- Remove `"use client"`
- Remove `useRadioAutoplay` import/usage (monorepo doesn't have the frequency gate context)
- Remove `autoStarted` ref and autoplay effect
- Keep the YouTube IFrame API pattern (same as dashboard's `ZoRadioPill.tsx`)

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/helpers/house/ZoRadioPill.tsx
git commit -m "feat(house): add ZoRadioPill inline radio player"
```

### Task 7: Create FrequencyGate and LoadingScreen

**Files:**
- Create: `apps/website/src/components/helpers/house/FrequencyGate.tsx`
- Create: `apps/website/src/components/helpers/house/LoadingScreen.tsx`

- [ ] **Step 1: Create FrequencyGate**

Port from `zo-civilisation/src/components/frequency-gate.tsx`. Changes:
- Remove `"use client"`
- Change `from "framer-motion"` (keep as-is, already correct)

- [ ] **Step 2: Create LoadingScreen**

Port from `zo-civilisation/src/components/loading-screen.tsx`. Changes:
- Remove `"use client"`
- Already uses `framer-motion` import

- [ ] **Step 3: Commit**

```bash
git add apps/website/src/components/helpers/house/FrequencyGate.tsx apps/website/src/components/helpers/house/LoadingScreen.tsx
git commit -m "feat(house): add FrequencyGate and LoadingScreen"
```

### Task 8: Create HouseWrapper (orchestrator)

**Files:**
- Create: `apps/website/src/components/helpers/house/HouseWrapper.tsx`

- [ ] **Step 1: Create HouseWrapper**

This replaces `app-wrapper.tsx` from civilization. It orchestrates: gate → loading → page reveal + radio autoplay.

```tsx
import React, { createContext, useContext, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FrequencyGate } from "./FrequencyGate";
import { LoadingScreen } from "./LoadingScreen";

const RadioAutoplayContext = createContext(false);
export function useRadioAutoplay() { return useContext(RadioAutoplayContext); }

export function HouseWrapper({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"gate" | "loading" | "ready">("gate");
  const [radioAutoplay, setRadioAutoplay] = useState(false);

  const handleTuneIn = () => {
    setRadioAutoplay(true);
    setPhase("loading");
  };

  const handleLoadingComplete = () => {
    setPhase("ready");
  };

  return (
    <RadioAutoplayContext.Provider value={radioAutoplay}>
      <AnimatePresence mode="wait">
        {phase === "gate" && <FrequencyGate key="gate" onTuneIn={handleTuneIn} />}
        {phase === "loading" && <LoadingScreen key="loading" onComplete={handleLoadingComplete} />}
      </AnimatePresence>
      <div style={{ opacity: phase === "ready" ? 1 : 0, transition: "opacity 0.5s ease-out" }}>
        {children}
      </div>
    </RadioAutoplayContext.Provider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/helpers/house/HouseWrapper.tsx
git commit -m "feat(house): add HouseWrapper gate/loading orchestrator"
```

### Task 9: Create MobileWaitlistBar

**Files:**
- Create: `apps/website/src/components/helpers/house/MobileWaitlistBar.tsx`

- [ ] **Step 1: Create MobileWaitlistBar**

Port from `zo-civilisation/src/components/mobile-waitlist-bar.tsx`. Changes:
- Remove `"use client"`
- Remove Zo auth integration for now (monorepo already has auth via `libs/auth/`)
- Simplify to just show email input + "tune in" button (auth can be wired later)

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/helpers/house/MobileWaitlistBar.tsx
git commit -m "feat(house): add MobileWaitlistBar sticky CTA"
```

---

## Chunk 3: CSS, Index, Page & Cleanup

### Task 10: Create house.css

**Files:**
- Create: `apps/website/src/components/helpers/house/house.css`

- [ ] **Step 1: Extract civilization-specific CSS**

Pull only the custom classes from `zo-civilisation/src/app/globals.css` that the house page needs. NOT the full theme — just:

```css
.section-padding { padding-top: 8rem; padding-bottom: 8rem; }
.lume-section { background: radial-gradient(circle at center, rgba(71,71,71,0.15) 0%, rgba(0,0,0,0) 70%); }
.hero-text-shadow { text-shadow: 0 4px 24px rgba(0,0,0,0.5); }
.liquid-glass { background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/helpers/house/house.css
git commit -m "feat(house): add house-specific CSS"
```

### Task 11: Create index.ts re-exports

**Files:**
- Create: `apps/website/src/components/helpers/house/index.ts`

- [ ] **Step 1: Write index**

```ts
export { BlurFade } from "./BlurFade";
export { HyperText } from "./HyperText";
export { TextReveal } from "./TextReveal";
export { MissionHouses } from "./MissionHouses";
export { ZoRadioPill } from "./ZoRadioPill";
export { MobileWaitlistBar } from "./MobileWaitlistBar";
export { HouseWrapper, useRadioAutoplay } from "./HouseWrapper";
// Keep ZoRadio for backward compat if other pages reference it
export { default as ZoRadio } from "./ZoRadio";
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/components/helpers/house/index.ts
git commit -m "feat(house): add index re-exports"
```

### Task 12: Delete old house components

**Files:**
- Delete: All old files in `apps/website/src/components/helpers/house/` EXCEPT `ZoRadio.tsx` (used by hero page)

- [ ] **Step 1: Remove old components**

```bash
rm apps/website/src/components/helpers/house/ApplyCTA.tsx
rm apps/website/src/components/helpers/house/CultureSection.tsx
rm apps/website/src/components/helpers/house/Economics.tsx
rm apps/website/src/components/helpers/house/FounderStack.tsx
rm apps/website/src/components/helpers/house/HouseHero.tsx
rm apps/website/src/components/helpers/house/HouseStats.tsx
rm apps/website/src/components/helpers/house/Program.tsx
rm apps/website/src/components/helpers/house/Properties.tsx
rm apps/website/src/components/helpers/house/SacredPillars.tsx
rm apps/website/src/components/helpers/house/WhatIsZoHouses.tsx
```

- [ ] **Step 2: Commit**

```bash
git add -A apps/website/src/components/helpers/house/
git commit -m "refactor(house): remove old house components"
```

### Task 13: Replace house.tsx page

**Files:**
- Modify: `apps/website/src/pages/house.tsx`

- [ ] **Step 1: Rewrite house.tsx**

Replace the entire page with the civilization layout. Key changes from the standalone version:
- All image paths prefixed with `/house/` (e.g., `/house/hero-video.mp4`)
- Import `framer-motion` instead of `motion/react`
- Use `font-serif italic` instead of `font-[family-name:var(--font-headline)]` (the monorepo doesn't have Instrument Serif — use the existing serif font or add it)
- Wrap in `HouseWrapper` for frequency gate → loading → page flow
- Import house.css at the top
- Use `next/image` (same as civilization, already available)
- Keep MetaTags from the old page for SEO

- [ ] **Step 2: Build test**

```bash
npx nx build website
```

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/website/src/pages/house.tsx
git commit -m "feat(house): replace /house with Civilization landing page"
```

### Task 14: Add Instrument Serif font

**Files:**
- Modify: `apps/website/src/pages/_app.tsx` or `apps/website/src/pages/_document.tsx`

- [ ] **Step 1: Add Google Fonts link for Instrument Serif**

Add to `_document.tsx` head:
```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
```

Or use `next/font/google` if the monorepo supports it.

- [ ] **Step 2: Commit**

```bash
git add apps/website/src/pages/_document.tsx
git commit -m "feat(house): add Instrument Serif font"
```

### Task 15: Final build & push

- [ ] **Step 1: Full build**

```bash
npx nx build website
```

- [ ] **Step 2: Push**

```bash
git push origin main
```
