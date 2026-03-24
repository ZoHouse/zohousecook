# Zo Club Page — Design Spec

**Date:** 2026-03-24
**Route:** `/club` (website app)
**Deploy:** zozozo.work/club (staging), zo.xyz/club (production)

## Summary

Replace the current `/club` app-download redirect page with a public, immersive founder showcase. The page tells the story of the Zo World Founder Club through its members — who they are, what they've built, and what's happening right now.

No login required. Fully public. Login CTA leads to `/dashboard`.

## Design Decisions

- **Style:** Matches `/membership` page — pure black `bg-black`, snap-scroll sections, Syne extrabold uppercase headings, Rubik body text at `text-white/40`, `border-zui-stroke rounded-2xl` cards
- **Data source:** Zo API via `useQueryApi` — primarily `WEBTHREE_FOUNDER_NFTS` (same endpoint as `/membership` FounderMemberList), plus `CAS_FOUNDER_TOKENS_STATS` for live count, `BOOKINGS_SEED` for category tags
- **No mobile redirect:** Kill the iOS/Android app store redirect. App download is just a CTA button.
- **Accent color:** `#FFD600` (zui-yellow) primary, `#CFFF50` (zui-neon) for live pulse dots
- **Fonts:** Syne (headings), Rubik (body/labels), Space Grotesk (default)

## Page Sections (snap-scroll)

### 1. Hero — "Vibe Network"
- Full viewport, snap section
- **Background:** VibeNetwork video (same CDN asset as `/membership` page — the iridescent Zo flag)
- **Title:** "VIBE NETWORK" in Syne extrabold uppercase (clamp 80px–200px)
- **Eyebrow:** "ZO WORLD" in Rubik uppercase, `text-white/40`
- **Tagline:** "Join an exclusive club of entrepreneurs, innovators and creators. Access an elite network & 10x yourself." — Rubik, `text-white/40`
- **Stats bar:** 3 live stats from API — Founders count (from `CAS_FOUNDER_TOKENS_STATS`), Total Nights, Events Held
- **Scroll pill:** Same border-radius + dot animation as `/membership`

### 2. Founder Mode — Spotlights
- **Title:** "FOUNDER MODE" in Syne extrabold
- **Featured spotlight:** Split card (visual left / content right)
  - Left: NFT card with animation/gif from `nft-cdn.zo.xyz/founders/{token_ref_id}.gif`, pfp, nickname, twitter handle
  - Right: Tier tag (e.g. "Portal Opener"), name, role, quote, stats (nights, events, XP)
  - Spotlight data: curated from top founders by XP/nights from the API response
- **Marquee:** Horizontal scrolling NFT cards with gradient fade edges (reuse `/membership` `react-fast-marquee` pattern)
  - Cards show NFT animation + pfp overlay + nickname + twitter handle
  - Data: `WEBTHREE_FOUNDER_NFTS` with `limit=100`

### 3. Directory — "All 501"
- **Title:** "ALL {count}" in Syne extrabold (live count from API)
- **Subtitle:** "Founders, VCs, Devs, Influencers, Crypto Degens, Artists, DAOs, Studios & more" (matches `/membership`)
- **Category pills:** Horizontal pill filters from `BOOKINGS_SEED` `founders_tags` — All, Founders, Devs, VCs, Degens, Artists, Influencers, DAOs, Infra, Gaming
- **Grid:** `grid-template-columns: repeat(auto-fill, minmax(166px, 1fr))`, 1px gap with `rgba(255,255,255,0.04)` background
  - Each cell: avatar (pfp or initials), nickname, twitter handle
  - Hover: avatar border turns yellow
- **Load more:** "View all {count} founders →" link
- Data: `WEBTHREE_FOUNDER_NFTS` with pagination

### 4. Leaderboard — "Top Builders"
- **Title:** "TOP BUILDERS" in Syne extrabold
- **Table:** `rounded-2xl` with `border-zui-stroke`
  - Columns: Rank, Founder (avatar + name + role), Nights, Events, XP
  - Rank numbers in `#FFD600`
  - Header row: `text-white/20` uppercase 10px
  - Row hover: `rgba(255,214,0,0.02)`
- **Data:** Sorted by XP from founder API data
- **Mobile:** Collapse to rank + name + XP (hide nights/events columns)

### 5. CTA — "Join the Club"
- **Title:** "JOIN THE CLUB" in Syne extrabold
- **Subtitle:** "Get your Founder Membership. Build from Zo House."
- **Buttons:**
  - Primary (yellow): "Sign In →" → links to `/dashboard`
  - Ghost (outline): "Download Zo Club" → app store links

## Technical Approach

### Files to modify
- `apps/website/src/pages/club.tsx` — replace entire page
- `apps/website/src/components/helpers/club/ZoClub.tsx` — replace with new sections

### Files to create
- `apps/website/src/components/helpers/club/ClubHero.tsx`
- `apps/website/src/components/helpers/club/FounderMode.tsx`
- `apps/website/src/components/helpers/club/FounderDirectory.tsx`
- `apps/website/src/components/helpers/club/Leaderboard.tsx`
- `apps/website/src/components/helpers/club/ClubCTA.tsx`

### Data hooks
- Reuse existing `useQueryApi("WEBTHREE_FOUNDER_NFTS")` pattern from FounderMemberList
- Reuse existing `useQueryApi("BOOKINGS_SEED")` for category tags
- Reuse existing `useQueryApi("CAS_FOUNDER_TOKENS_STATS")` for live founder count
- No new API endpoints needed

### Dependencies
- `react-fast-marquee` (already installed — used by `/membership`)
- Existing `useFadeInOnScroll` hook
- Existing font utilities (`syneClassName`, `rubikClassName`)
- Existing `Button` component
- Existing `cn` utility

### Reuse from membership page
- NFT card rendering pattern (gif/video with pfp overlay)
- NFT CDN URL pattern: `nft-cdn.zo.xyz/founders/{token_ref_id}.gif?w=200`
- Category tag loading from BOOKINGS_SEED
- Marquee with gradient fade edges
- VibeNetwork video URL from CDN

## What's NOT in scope
- Member profile pages (click-through from directory) — future feature
- Real-time WebSocket activity feed — initial version uses API polling or static
- XP calculation engine — uses whatever XP data the API returns
- Search/filter beyond category pills
- Mobile app deep linking
