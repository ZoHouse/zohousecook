# Passport Page Revamp — Design Spec

**Date:** 2026-04-07  
**Author:** Samurai + Claude  
**Status:** Draft

---

## Goal

Replace the current profile-editor-style passport page with a gamified, identity-forward passport experience matching the Figma designs. The new page shows the user's Zo World identity, quests, referral tools, and Passport Pro upsell — with profile editing accessible via a settings button.

## Non-goals

- Passport Pro payment/subscription (static UI only, wired later)
- Leaderboard backend (static UI only, link placeholder)
- Quest submission/review system (display only for now)
- Full quest engine

---

## Layout (Desktop)

Two-column layout on a dark background:

```
┌─────────────────────────────────────────────────────────────┐
│  Zo World logo    Quests | Dashboard    IG Status   ZoCred  │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  PASSPORT    │  Passport Pro Membership Card                │
│  CARD        │  (glassmorphic, ₹499/month, benefits)       │
│              │  [Become a Member] → coming soon             │
│  - Avatar    │                                              │
│  - Handle    ├──────────────────────────────────────────────┤
│  - Seal      │                                              │
│  - XP bar    │  Quests Section                              │
│  - Badges    │  - Live Quest card (timer, reward)           │
│  - DOB       │  - Submitted Quest card (awaiting review)    │
│  - Gender    │                                              │
│  - Homecity  ├──────────────────────────────────────────────┤
│  - Nationality│                                             │
│  - Cultures  │  Referral Section                            │
│  - Travel    │  "Invite friends... earn 7%"                 │
│    Stats     │  zo.xyz/@handle [Copy]                       │
│  - Badges    │  [Share on Instagram]                        │
│              │                                              │
│  [Settings]  ├──────────────────────────────────────────────┤
│              │                                              │
│              │  Why Passport Plus?                           │
│              │  (glassmorphic card, benefits list,           │
│              │   [Become a Member] → coming soon)            │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

Mobile: single column, passport card on top, then quests/referral/passport pro stacked below.

---

## Sections

### 1. Top Navigation Bar

- Zo World logo (left)
- Tabs: **Quests** (active) | **Dashboard** (links to `/dashboard`)
- Instagram connection status: yellow "Not Connected" badge or green "Connected @username"
- Zo Cred score pill (purple pill with score number)
- Profile avatar + handle (right)

Uses existing `DashboardHeader` pattern but adapted for passport page context.

### 2. Passport Card (Left Column)

A tall glassmorphic card with dark gradient background and subtle inner shadow/glow.

**Contents (top to bottom):**

- **Avatar** — 128px rounded square, user's Zobu avatar (`profile.avatar.image` or `profile.pfp_image`)
- **Citizen Seal** — circular badge with "Citizen of Zo World" text, star emblem, "SINCE {year}" at bottom. Rotated slightly. Positioned overlapping the avatar area.
- **Handle** — e.g. "Zupernova.zo" in Syne font, 24px
- **XP Section:**
  - Compass badge icon + XP count (e.g. "24,890 XP") + rank title (e.g. "WANDERER") in teal
  - XP progress bar (gradient: teal-to-green) with remaining XP text ("4500 XP to next Tier")
  - "Leaderboard" link (lime green, right-aligned) → links to `/leaderboard`
- **Role Badges** — horizontal pills:
  - Creator badge (purple gradient, star icon)
  - TribeBuilder badge (gold gradient, star icon)
- **Personal Info** — compact label:value rows:
  - DOB: "12 May"
  - GENDER: "M"
  - HOMECITY: "Mumbai"
  - NATIONALITY: "Indian"
- **Cultures** — wrapped tags with category illustrations:
  - Music & Entertainment (guitar icon)
  - Spirituality (spiritual face icon)
  - Photography (camera icon)
  - Travel (passport icon)
- **Travel Stats** — two compact cards side by side:
  - Destinations Explored: count
  - Zostels Unlocked: count
- **Badges** — section header (badge icons for unlocked destinations, e.g. Wayanad coin)
- **Settings Button** — at bottom, opens profile editing drawer

**Card styling:**
- `backdrop-blur-[48px]`
- `bg-gradient-to-b from-[rgba(41,41,41,0.8)] to-[rgba(0,0,0,0.8)]`
- Inner shadow: `inset 0px -1.07px 24px 0px rgba(255,255,255,0.4)`
- Rounded: `24px`

### 3. Passport Pro Membership Card

Glassmorphic card with purple glow effects (star shape, circles).

**Contents:**
- Title: "Passport Pro" (24px, Syne Bold, color: #540967)
- Subtitle: "Earn rewards, monetize content, and build your travel identity."
- Price: "₹ 499 /month" (Syne Bold, #111)
- Benefits checklist (2 columns):
  - Daily Bed Drops & Bounties ✓
  - Get paid for views on participating posts ✓
  - Share your Passport and earn 7% on every referral booking for 1 year ✓
  - Unlock Passport profile, XP & leaderboard ✓
- "Check all benefits" link (white, medium)
- **[Become a Member]** button → shows "Coming Soon" toast for now

**Card styling:**
- Gradient: `linear-gradient(-55deg, rgba(28,0,51,0.2), rgba(149,13,255,0.2))`
- Blurred decorative circles (purple glow) positioned at corners
- Star shape SVG overlay with purple glow filter
- Inner shadow layers

### 4. Quests Section

Header: "Quests" (20px, Rubik Medium, #111 on light / white on dark)

**Quest Card (Live):**
- Dark glassmorphic card, rounded-24px
- Purple accent square with IG icon (left)
- Quest title: "Create a Reel on: Why I'd choose Zostel Pahalgam for my next trip" (20px)
- Reward: "200 Zo Cred" (purple, right)
- Tags: "Creator Quest: REEL" pill (bg-[#4a2274]) + "Live Quest 12h 14m" pill with countdown

**Quest Card (Submitted):**
- Similar dark card
- Quest title
- Tags: "Creator Quest: REEL" pill + "Submitted — Awaiting review from HQ" (orange text)

### 5. Referral Section

Two stacked cards:

**Top card (glassmorphic, rounded-tl-16 rounded-tr-16):**
- Text: "Invite friends to unlock their Passport with your link and earn 7% on every booking they make for up to 1 year"
- Zo Link pill: "Your Zo Link" label + `zo.xyz/@{handle}` + [Copy] button
- "How it Works?" link below

**Bottom card (gradient bar, rounded-bl-16 rounded-br-16):**
- Orange-to-purple gradient background (`frame-1171280065.png`)
- IG icon + "Share your Passport on Instagram" text
- Clicking triggers Instagram share flow

### 6. Why Passport Plus? Section

Header: "Why Passport Plus?" (32px, Rubik Medium)

Large glassmorphic card (487px height) with purple glow effects.

**Left side:**
- Title: "Unlock Revenue with Zostel Passport Plus" (42px, Syne Bold, glowing text effect)
- Price: "₹ 499 /month"
- Benefits section (dimmed, opacity-10 — teaser):
  - Star icon + "Benefits" header
  - "Daily quests, real rewards" card
  - "Affiliate link" card

**Right side:**
- "Member Perks" header (16px)
- 5 benefit items with green check icons:
  - Daily Creator Bed Drops & Bounties
  - Monetize views on Instagram content
  - Your Invited Guests get 10% discounts on first booking
  - Build your Passport profile with avatar, stamps, XP, and leaderboard
  - Share your Passport, build your network, and earn 7% commission on bookings for 1 year — live from 30 April
- **[Become a Member]** button → "Coming Soon" toast

---

## Settings Drawer

Triggered by settings button on the passport card. Slides in from the right as a drawer/panel.

Contains the existing profile editing functionality moved from the current passport page:
- Personal Details (nickname, name, bio, DOB, gender, body type)
- Location (hometown, nationality, address)
- Contact (email, phone, emergency contact)
- Socials (Twitter, Discord, Telegram, Instagram connect)
- Wallets
- ID verification

Reuses existing `EditableField`, `EditableSelect`, and section components from the current `passport.tsx`.

---

## Data Sources

| Data | Source | Hook |
|------|--------|------|
| Profile (name, avatar, DOB, city, etc.) | Zo API | `useProfile()` |
| XP, rank, travel stats | Zo API | `useMyXp()` |
| Roles (Creator, TribeBuilder) | Zo API | `useMyRoles()` |
| Instagram connection | Supabase | `useInstagramConnect()` |
| NFTs/membership | Zo API | `useMyNfts()` |
| Zo Cred score | Zo API | from profile or dedicated endpoint |
| Cultures | Zo API | from `profile.culture` |

No new backend endpoints needed. All data comes from existing hooks.

---

## Assets

From Figma export, stored in `apps/dashboard/public/passport/`:

| Asset | File | Usage |
|-------|------|-------|
| Music & Entertainment | `culture-music.png` | Culture tag icon |
| Spirituality | `culture-spiritual.png` | Culture tag icon |
| Photography | `culture-photography.png` | Culture tag icon |
| Travel & Adventure | `culture-travel.png` | Culture tag icon |
| Gradient bar | `gradient-bar.png` | Referral share section bg |
| Compass badge | `compass-badge.png` | XP section icon |

SVG assets (citizen seal, badges, glow effects) are inlined from the Figma component code (`svg-data.ts` and `Free-component.tsx`).

---

## Component Structure

```
apps/dashboard/src/pages/passport.tsx          — Page component (slim, composes sections)
apps/dashboard/src/components/passport/
  ├── PassportLayout.tsx                       — Two-column desktop / single-column mobile
  ├── PassportIdentityCard.tsx                 — Left column passport card
  ├── PassportProCard.tsx                      — Membership upsell card (static)
  ├── QuestsSection.tsx                        — Quest cards
  ├── ReferralSection.tsx                      — Invite link + share CTA
  ├── WhyPassportPlus.tsx                      — Bottom upsell section (static)
  ├── SettingsDrawer.tsx                       — Profile editing (reuses existing components)
  ├── CitizenSeal.tsx                          — SVG seal component
  ├── XpProgressBar.tsx                        — XP bar with gradient
  ├── RoleBadge.tsx                            — Creator/TribeBuilder badge pills
  ├── CultureTag.tsx                           — Culture interest pill with icon
  └── QuestCard.tsx                            — Individual quest card
```

---

## Fonts

The design uses:
- **Syne** (Bold) — headings, handle, prices
- **Rubik** (Regular, Medium) — body text, labels, buttons
- **Futura PT/Std** (Bold) — labels (DOB, GENDER, etc.), XP text

Check if these are already loaded in the dashboard app. If not, add via `next/font` or `@import`.

---

## Styling Notes

- Dark theme throughout — matches existing dashboard tokens
- Glassmorphic cards: `backdrop-blur-[48px]` + gradient backgrounds + inner shadows
- Purple glow effects use SVG filters with `feGaussianBlur` and purple color matrices
- Green check icons for benefit lists: `#54B835` fill inside `#2b3228` circle
- Accent colors: purple (#950DFF, #4a2274), teal (#52BDA9, #65C6B3), lime (#CFFF50), orange for warnings
- Text hierarchy: white for primary, `rgba(255,255,255,0.55)` for labels, `rgba(255,255,255,0.44)` for secondary

---

## Mobile Considerations

- Single column layout
- Passport card becomes full-width, shorter (scrollable)
- All sections stack vertically
- Settings drawer becomes full-screen modal on mobile
- Touch targets: 44px minimum
- Quest cards become full-width

---

## What This Does NOT Include

- Payment integration for Passport Pro (buttons show "Coming Soon")
- Quest creation/submission backend
- Quest timer backend (static display)
- Leaderboard page changes (just links to existing `/leaderboard`)
- Avatar editor
- Passport sharing/screenshot generation
