# Passport Page Revamp Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current profile-editor passport page with a gamified, identity-forward passport experience with passport card, quests, referral tools, and Passport Pro upsell.

**Architecture:** New passport page uses a two-column layout (desktop) / single-column (mobile). Left column is a tall identity card. Right column stacks: Passport Pro card, Quests, Referral, and Why Passport Plus sections. Existing profile editing moves into a settings drawer. All data from existing hooks — no new backend.

**Tech Stack:** Next.js 14 (Pages Router), React 18, Tailwind CSS, existing hooks (`useProfile`, `useMyXp`, `useMyRoles`, `useInstagramConnect`, `useMyNfts`)

**Spec:** `docs/superpowers/specs/2026-04-07-passport-page-revamp-design.md`

**Figma source:** `/tmp/figma-assets/downloaded-assets/Free-component.tsx` (component structure), `/tmp/figma-assets/downloaded-assets/svg-data.ts` (SVG paths), `/tmp/figma-assets/individual-assets/src/assets/` (PNG assets)

---

## File Structure

### New files to create:

| File | Responsibility |
|------|----------------|
| `apps/dashboard/src/components/passport/PassportIdentityCard.tsx` | Left column: avatar, handle, seal, XP, badges, personal info, cultures, travel stats, settings button |
| `apps/dashboard/src/components/passport/PassportProCard.tsx` | Glassmorphic membership upsell card (static UI) |
| `apps/dashboard/src/components/passport/QuestsSection.tsx` | Quest cards (live + submitted states) |
| `apps/dashboard/src/components/passport/QuestCard.tsx` | Individual quest card component |
| `apps/dashboard/src/components/passport/ReferralSection.tsx` | Invite link, copy button, share on IG CTA |
| `apps/dashboard/src/components/passport/WhyPassportPlus.tsx` | Bottom upsell section with benefits list (static UI) |
| `apps/dashboard/src/components/passport/SettingsDrawer.tsx` | Drawer containing all existing profile editing sections |
| `apps/dashboard/src/components/passport/CitizenSeal.tsx` | SVG citizen seal badge |
| `apps/dashboard/src/components/passport/XpProgressBar.tsx` | XP bar with gradient + tier info |
| `apps/dashboard/src/components/passport/RoleBadge.tsx` | Creator/TribeBuilder badge pills |
| `apps/dashboard/src/components/passport/CultureTag.tsx` | Culture interest pill with icon |
| `apps/dashboard/src/components/passport/GlowCard.tsx` | Reusable glassmorphic card with purple glow effects |
| `apps/dashboard/src/components/passport/PassportNav.tsx` | Top nav bar (Quests/Dashboard tabs, IG status, ZoCred) |
| `apps/dashboard/src/components/passport/index.ts` | Barrel export |
| `apps/dashboard/public/passport/culture-music.png` | Music & Entertainment culture icon |
| `apps/dashboard/public/passport/culture-spiritual.png` | Spirituality culture icon |
| `apps/dashboard/public/passport/culture-photography.png` | Photography culture icon |
| `apps/dashboard/public/passport/culture-travel.png` | Travel & Adventure culture icon |
| `apps/dashboard/public/passport/gradient-bar.png` | Orange-to-purple gradient for referral section |
| `apps/dashboard/public/passport/compass-badge.png` | Compass badge for XP section |

### Files to modify:

| File | Change |
|------|--------|
| `apps/dashboard/src/pages/passport.tsx` | Complete rewrite — new layout composing passport components. Existing section components (EditableField, EditableSelect, ProfileHeader, PersonalDetails, LocationDetails, ConnectedWalletsSection, ConnectedEmailsSection, ConnectedPhonesSection, SocialsSection, FounderNftsSection, CulturesSection) move into SettingsDrawer |
| `apps/dashboard/src/utils/font.tsx` | Add Syne + Rubik fonts if not already loaded |

---

## Chunk 1: Assets & Foundation

### Task 1: Copy assets to public directory

**Files:**
- Create: `apps/dashboard/public/passport/` directory + 6 PNG files

- [ ] **Step 1: Create passport assets directory and copy files**

```bash
mkdir -p apps/dashboard/public/passport
cp /tmp/figma-assets/individual-assets/src/assets/473f29edad94d6467318a725b8276a98d970c43d.png apps/dashboard/public/passport/culture-music.png
cp /tmp/figma-assets/individual-assets/src/assets/db489d1df2e251f7e91bd9a042e0d91ed5b0805b.png apps/dashboard/public/passport/culture-spiritual.png
cp /tmp/figma-assets/individual-assets/src/assets/587ca5ecea260e51c28b6a32545ab88a6995a134.png apps/dashboard/public/passport/culture-photography.png
cp /tmp/figma-assets/individual-assets/src/assets/6f61df0668c3518c7d973c2ae49309e126021b73.png apps/dashboard/public/passport/culture-travel.png
cp /tmp/figma-assets/individual-assets/src/assets/b33982ca93cbbea60b4f9121ca46fa57dad54509.png apps/dashboard/public/passport/gradient-bar.png
cp /tmp/figma-assets/individual-assets/src/assets/d17c14be2b83c76adee4ed6b0714a5fed69f9030.png apps/dashboard/public/passport/compass-badge.png
```

- [ ] **Step 2: Verify files exist**

```bash
ls -la apps/dashboard/public/passport/
```
Expected: 6 PNG files

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/public/passport/
git commit -m "feat(passport): add Figma design assets for passport page revamp"
```

### Task 2: Add fonts

**Files:**
- Modify: `apps/dashboard/src/utils/font.tsx`

- [ ] **Step 1: Check current fonts**

Read `apps/dashboard/src/utils/font.tsx` to see what's loaded.

- [ ] **Step 2: Add Syne and Rubik if missing**

Add to the font file:
```typescript
import { Space_Grotesk, Syne, Rubik } from "next/font/google";

export const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-syne",
});

export const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-rubik",
});
```

Check if they need to be applied in `_app.tsx` or if CSS variables are sufficient.

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/src/utils/font.tsx
git commit -m "feat(passport): add Syne and Rubik fonts"
```

### Task 3: Create GlowCard reusable component

**Files:**
- Create: `apps/dashboard/src/components/passport/GlowCard.tsx`

- [ ] **Step 1: Create the component**

```typescript
import React from "react";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "purple";
  onClick?: () => void;
}

export function GlowCard({ children, className = "", variant = "default", onClick }: GlowCardProps) {
  const bg = variant === "purple"
    ? "background-image: linear-gradient(-55deg, rgba(28,0,51,0.2), rgba(149,13,255,0.2)), linear-gradient(180deg, rgba(41,41,41,0.2) 14%, rgba(0,0,0,0.2) 100%)"
    : "background-image: linear-gradient(180deg, rgba(41,41,41,0.8) 14%, rgba(0,0,0,0.8) 100%)";

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] ${className}`}
      style={{ backdropFilter: "blur(48px)" }}
      onClick={onClick}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-[24px]"
        style={{ [bg.split(":")[0]]: bg.split(": ")[1] }}
      />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-1px_24px_0px_rgba(255,255,255,0.4)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/dashboard/src/components/passport/GlowCard.tsx
git commit -m "feat(passport): add GlowCard glassmorphic component"
```

---

## Chunk 2: Left Column — Passport Identity Card

### Task 4: Create CitizenSeal component

**Files:**
- Create: `apps/dashboard/src/components/passport/CitizenSeal.tsx`

- [ ] **Step 1: Create the component**

Extract the citizen seal SVG from `Free-component.tsx` Group5 component (lines 1456-1503). This is the circular badge with "Citizen of Zo World" text, star emblem, and "SINCE {year}". Copy the SVG path data from `svg-data.ts` for the paths referenced (`p397dc480`, `p14223300`, `p4cec800`, `p5b7af71`).

The component accepts a `year` prop for the "SINCE" text and renders the seal at ~95px.

- [ ] **Step 2: Commit**

### Task 5: Create XpProgressBar component

**Files:**
- Create: `apps/dashboard/src/components/passport/XpProgressBar.tsx`

- [ ] **Step 1: Create the component**

```typescript
interface XpProgressBarProps {
  xp: number;
  xpToNextTier: number;
  rankTitle: string;
}

export function XpProgressBar({ xp, xpToNextTier, rankTitle }: XpProgressBarProps) {
  const total = xp + xpToNextTier;
  const progress = total > 0 ? (xp / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* XP + Rank */}
      <div className="flex items-center gap-3">
        <img src="/passport/compass-badge.png" alt="XP" className="w-[43px] h-[43px] rounded-xl border-2 border-[#71c8b6]" />
        <div>
          <p className="font-bold text-white text-sm uppercase tracking-wide">{xp.toLocaleString()} XP</p>
          <p className="text-[#52bda9] text-sm font-bold uppercase tracking-wide">{rankTitle}</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center w-full">
          <div className="h-[5px] rounded-full" style={{
            width: `${progress}%`,
            backgroundImage: "linear-gradient(90deg, #C6FFF3, #76D8C3, #FBFFFE, #3F8174, #1E574B, #38A08A)"
          }} />
          <div className="flex-1 h-[5px] bg-[#d9d9d9] opacity-30" />
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] text-white/55 tracking-wider">{xpToNextTier.toLocaleString()} XP to next Tier</span>
          <a href="/leaderboard" className="text-[12px] text-[#cfff50] tracking-wider">Leaderboard</a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

### Task 6: Create RoleBadge component

**Files:**
- Create: `apps/dashboard/src/components/passport/RoleBadge.tsx`

- [ ] **Step 1: Create the component**

Two badge variants: Creator (purple) and TribeBuilder (gold). Each has a star icon SVG and label text. Extract SVG paths from Figma component for the badge stars.

```typescript
interface RoleBadgeProps {
  type: "creator" | "tribebuilder";
}

export function RoleBadge({ type }: RoleBadgeProps) {
  const isCreator = type === "creator";
  const bg = isCreator
    ? "linear-gradient(106deg, #fff 16%, #e7c9ff 73%, #daacff 99%)"
    : "linear-gradient(115deg, #fff 16%, #ffeec9 73%, #ffe6ac 99%)";
  const textColor = isCreator ? "text-[#950dff]" : "text-[#e39406]";
  const label = isCreator ? "Creator" : "TribeBUILDER";
  // Star SVG inline (simplified from Figma)
  const starColor = isCreator ? "#950DFF" : "#E39406";
  const strokeColor = isCreator ? "#6A1FA4" : "#6E4F16";

  return (
    <div className="flex gap-1 items-center p-2 rounded-xl" style={{ backgroundImage: bg }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l2.4 7.2H22l-6 4.8L18.4 22 12 17.2 5.6 22l2.4-7.8-6-4.8h7.6L12 2z"
          fill={starColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        <text x="12" y="14" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">
          {isCreator ? "C" : "T"}
        </text>
      </svg>
      <span className={`font-bold text-xs uppercase tracking-wider ${textColor}`}>{label}</span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

### Task 7: Create CultureTag component

**Files:**
- Create: `apps/dashboard/src/components/passport/CultureTag.tsx`

- [ ] **Step 1: Create the component**

```typescript
const CULTURE_ICONS: Record<string, string> = {
  "music": "/passport/culture-music.png",
  "music & entertainment": "/passport/culture-music.png",
  "spiritual": "/passport/culture-spiritual.png",
  "spirituality": "/passport/culture-spiritual.png",
  "photography": "/passport/culture-photography.png",
  "travel": "/passport/culture-travel.png",
  "travel & adventure": "/passport/culture-travel.png",
};

interface CultureTagProps {
  name: string;
  icon?: string;
}

export function CultureTag({ name, icon }: CultureTagProps) {
  const src = icon || CULTURE_ICONS[name.toLowerCase()] || undefined;

  return (
    <div className="bg-[#202020] flex gap-1 items-center px-2 py-1 rounded-2xl">
      {src && <img src={src} alt={name} className="w-6 h-6 object-cover" />}
      <span className="text-xs text-white tracking-wider">{name}</span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

### Task 8: Create PassportIdentityCard

**Files:**
- Create: `apps/dashboard/src/components/passport/PassportIdentityCard.tsx`

- [ ] **Step 1: Create the component**

This is the tall left-column card. It composes CitizenSeal, XpProgressBar, RoleBadge, CultureTag, and personal info rows. It receives all data via props from the page.

Structure (top to bottom):
1. Avatar (128px rounded-xl) + CitizenSeal (overlapping top-right)
2. Handle text (Syne, 24px)
3. XpProgressBar
4. Role badges row (Creator, TribeBuilder)
5. Personal info rows (DOB, Gender, Homecity, Nationality) — label in uppercase 10px white/55, value in 12px white
6. Cultures section — "CULTURES" label + wrapped CultureTag pills
7. Travel Stats — two side-by-side cards ("Destinations Explored", "Zostels Unlocked")
8. Badges section — "BADGES" label + destination coins (from profile achievements)
9. Settings button (bottom, full width)

Card styling: GlowCard with dark variant, 765px height on desktop, auto on mobile.

Props: `profile`, `myXp`, `roles`, `onOpenSettings`

- [ ] **Step 2: Commit**

---

## Chunk 3: Right Column — Content Sections

### Task 9: Create PassportNav component

**Files:**
- Create: `apps/dashboard/src/components/passport/PassportNav.tsx`

- [ ] **Step 1: Create the component**

Top bar with:
- Tabs: "Quests" (active, white) | "Dashboard" (opacity-40, links to `/`)
- Instagram status pill: yellow "Not Connected" with IG icon, or green with @username
- Zo Cred score pill (purple bg, white text)

Uses `useInstagramConnect` hook for IG status.

- [ ] **Step 2: Commit**

### Task 10: Create PassportProCard

**Files:**
- Create: `apps/dashboard/src/components/passport/PassportProCard.tsx`

- [ ] **Step 1: Create the component**

Glassmorphic card with purple glow effects. Static UI only.

Content:
- "Passport Pro" title (#540967, Syne Bold 24px)
- "Earn rewards, monetize content..." subtitle
- "₹ 499 /month" price
- Benefits checklist (2-column): 4 items with green check icons
- "Check all benefits" link
- "Become a Member" button → `toast("Coming Soon")`

Purple glow decorative circles positioned at top-left and right using SVG with blur filters (simplified from Figma).

- [ ] **Step 2: Commit**

### Task 11: Create QuestCard and QuestsSection

**Files:**
- Create: `apps/dashboard/src/components/passport/QuestCard.tsx`
- Create: `apps/dashboard/src/components/passport/QuestsSection.tsx`

- [ ] **Step 1: Create QuestCard**

Props: `title`, `reward`, `type` ("reel" | "post"), `status` ("live" | "submitted" | "completed"), `timeRemaining?`, `platform` ("instagram")

Dark glassmorphic card with:
- Platform icon (IG gradient square, left)
- Quest title (20px, white)
- Reward text (purple, right) — only shown for live quests
- Status tags: "Creator Quest: REEL" pill + status-specific pill:
  - Live: purple bg, "Live Quest {time}" with countdown
  - Submitted: amber bg, "Submitted — Awaiting review from HQ" in orange

- [ ] **Step 2: Create QuestsSection**

Section header "Quests" (20px, Rubik Medium). Renders array of QuestCard components. For now, hardcoded sample quests since there's no quest backend yet:

```typescript
const SAMPLE_QUESTS = [
  { title: "Create a Reel on: Why I'd choose Zostel Pahalgam for my next trip", reward: "200 Zo Cred", type: "reel", status: "live", timeRemaining: "12h 14m" },
  { title: "Why I'd choose Zostel Pahalgam for my next trip", type: "reel", status: "submitted" },
];
```

- [ ] **Step 3: Commit**

### Task 12: Create ReferralSection

**Files:**
- Create: `apps/dashboard/src/components/passport/ReferralSection.tsx`

- [ ] **Step 1: Create the component**

Two stacked cards:

**Top card** (rounded-tl-2xl rounded-tr-2xl, glassmorphic):
- Invite text: "Invite friends to unlock their Passport with your link and earn 7% on every booking they make for up to 1 year"
- Zo Link pill: dark bg rounded-full, "Your Zo Link" label + `zo.xyz/@{handle}` + "Copy" button
- "How it Works?" link below

**Bottom card** (rounded-bl-2xl rounded-br-2xl):
- Background: gradient-bar.png
- IG icon + "Share your Passport on Instagram" text
- Full width, centered content

Props: `handle` (string for the zo.xyz/@handle link)

Copy button uses `navigator.clipboard.writeText()` + `toast.success("Link copied!")`.

- [ ] **Step 2: Commit**

### Task 13: Create WhyPassportPlus

**Files:**
- Create: `apps/dashboard/src/components/passport/WhyPassportPlus.tsx`

- [ ] **Step 1: Create the component**

Section header: "Why Passport Plus?" (32px, Rubik Medium, white)

Large glassmorphic card (purple variant) with:

**Left side:**
- Glowing title: "Unlock Revenue with Zostel Passport Plus" (42px, Syne Bold, with purple text-shadow glow effect)
- Price: "₹ 499 /month" (24px, Syne Bold, #d2cfd4)
- Benefits teaser (dimmed, opacity-10): star icon + "Benefits" + two small cards

**Right side:**
- "Member Perks" header (16px, white)
- 5 benefit items with green check icons (#54B835 in #2b3228 circles):
  - Daily Creator Bed Drops & Bounties
  - Monetize views on Instagram content
  - Your Invited Guests get 10% discounts on first booking
  - Build your Passport profile with avatar, stamps, XP, and leaderboard
  - Share your Passport, build your network, earn 7% commission — live from 30 April

**Bottom right:**
- "Become a Member" button (white/80 bg, #111 text, 56px height) → `toast("Coming Soon")`

Purple glow SVG decorations (circles + star shape) positioned behind content.

- [ ] **Step 2: Commit**

---

## Chunk 4: Settings Drawer & Page Assembly

### Task 14: Create SettingsDrawer

**Files:**
- Create: `apps/dashboard/src/components/passport/SettingsDrawer.tsx`

- [ ] **Step 1: Create the component**

Drawer that slides in from the right. Contains all existing profile editing sections extracted from current `passport.tsx`:

- PersonalDetails
- LocationDetails
- ConnectedWalletsSection
- ConnectedEmailsSection
- ConnectedPhonesSection
- SocialsSection
- FounderNftsSection
- CulturesSection

Props: `isOpen: boolean`, `onClose: () => void`

Implementation:
- Fixed overlay with dark backdrop (`bg-black/60`)
- Drawer panel: `fixed right-0 top-0 h-full w-[480px] max-w-full bg-dash-bg-solid overflow-y-auto`
- Slide-in animation via Tailwind `translate-x` + `transition-transform`
- Close button (X) at top right
- Title: "Settings" at top
- All section components rendered vertically inside the drawer
- On mobile: full width

Move the section components (EditableField, EditableSelect, ItemMenu, ProfileHeader, PersonalDetails, LocationDetails, ConnectedWalletsSection, ConnectedEmailsSection, ConnectedPhonesSection, SocialsSection, FounderNftsSection, CulturesSection) out of `passport.tsx` into `SettingsDrawer.tsx`. These are internal to the drawer and don't need separate files since they're small and only used here.

- [ ] **Step 2: Commit**

### Task 15: Create barrel export

**Files:**
- Create: `apps/dashboard/src/components/passport/index.ts`

- [ ] **Step 1: Create barrel export**

```typescript
export { PassportIdentityCard } from "./PassportIdentityCard";
export { PassportProCard } from "./PassportProCard";
export { QuestsSection } from "./QuestsSection";
export { QuestCard } from "./QuestCard";
export { ReferralSection } from "./ReferralSection";
export { WhyPassportPlus } from "./WhyPassportPlus";
export { SettingsDrawer } from "./SettingsDrawer";
export { PassportNav } from "./PassportNav";
export { GlowCard } from "./GlowCard";
export { CitizenSeal } from "./CitizenSeal";
export { XpProgressBar } from "./XpProgressBar";
export { RoleBadge } from "./RoleBadge";
export { CultureTag } from "./CultureTag";
```

- [ ] **Step 2: Commit**

### Task 16: Rewrite passport.tsx page

**Files:**
- Modify: `apps/dashboard/src/pages/passport.tsx` (complete rewrite)

- [ ] **Step 1: Rewrite the page**

The new passport.tsx is slim — it composes the passport components:

```typescript
import React, { ReactElement, useState } from "react";
import { useProfile } from "@zo/auth";
import { DashboardHeader } from "../components/dashboard";
import {
  PassportIdentityCard, PassportProCard, QuestsSection,
  ReferralSection, WhyPassportPlus, SettingsDrawer, PassportNav,
} from "../components/passport";
import { useMyXp } from "../hooks/useMyXp";
import { useMyRoles } from "../hooks/useMyRoles";
import type { NextPageWithLayout } from "./_app";

const PassportPage: NextPageWithLayout = () => {
  const { profile, isLoading } = useProfile();
  const { myXp } = useMyXp();
  const { roles } = useMyRoles();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handle = profile?.custom_nickname?.replace(".zo", "") || profile?.nickname || "";

  if (isLoading) {
    return <div className="flex-1 min-h-screen bg-[#111] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
    </div>;
  }

  return (
    <div className="flex-1 min-h-screen bg-[#111]">
      {/* Top nav */}
      <PassportNav />

      {/* Main content */}
      <div className="max-w-[1280px] mx-auto px-4 pt-6 pb-32">
        {/* Desktop: two columns */}
        <div className="flex gap-6">
          {/* Left column — Passport Card */}
          <div className="hidden xl:block w-[354px] flex-shrink-0">
            <PassportIdentityCard
              profile={profile}
              myXp={myXp}
              roles={roles}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </div>

          {/* Right column — Content */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">
            {/* Mobile passport card */}
            <div className="xl:hidden">
              <PassportIdentityCard
                profile={profile}
                myXp={myXp}
                roles={roles}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            </div>

            <PassportProCard />
            <QuestsSection />
            <ReferralSection handle={handle} />
            <WhyPassportPlus />
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <DashboardHeader />

      {/* Settings drawer */}
      <SettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

PassportPage.getLayout = (page: ReactElement) => page;
export default PassportPage;
```

- [ ] **Step 2: Build check**

```bash
cd /Users/samuraizan/samuraidojo/zohouse/zo.xyz/mono-front-main
npx nx build dashboard
```

Expected: Build passes

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/src/pages/passport.tsx apps/dashboard/src/components/passport/
git commit -m "feat(passport): complete passport page revamp with identity card, quests, referral, and Passport Pro"
```

---

## Chunk 5: Polish & Deploy

### Task 17: Visual QA and fixes

- [ ] **Step 1: Start dev server and visually compare with Figma**

```bash
npx nx serve dashboard
```

Open `http://localhost:4203/dashboard/passport` and compare each section with the Figma screenshot at `/tmp/figma-assets/downloaded-assets/figma-design-screenshot.png`.

- [ ] **Step 2: Fix any visual discrepancies** (spacing, colors, font sizes, glow effects)

- [ ] **Step 3: Test mobile layout** — resize to mobile width, verify single-column stacking

- [ ] **Step 4: Test settings drawer** — open/close, verify all editing sections work

- [ ] **Step 5: Commit fixes**

### Task 18: Deploy

- [ ] **Step 1: Build**

```bash
npx nx build dashboard
```

- [ ] **Step 2: Deploy to Vercel**

```bash
npx vercel --prod
```

- [ ] **Step 3: Verify on zozozo.work/passport**

Test the Vercel rewrite added earlier. Verify `/passport` loads the dashboard passport page.

- [ ] **Step 4: Final commit if any fixes needed**
