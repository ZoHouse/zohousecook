# Passport Locked View Rework — Design

**Date:** 2026-04-16
**Component:** `apps/website/src/components/passport/NewUserInvitedView.tsx`
**Route:** `zozozo.work/@<handle>` when the viewed passport is locked / has no data
**Status:** Ready for implementation plan

## Context

When a visitor lands on `/@<handle>` for a user who has not yet unlocked their passport (backend returns 404 or empty/locked state), `apps/website/src/pages/passport.tsx` renders `NewUserInvitedView` instead of `PublicPassportView`. The current design (shipped in PR #15 on 2026-04-15) shows:

1. A dark card with the viewed user's initial + name + role chip (e.g., "E / erum")
2. A "My unique link / zo.xyz/@you" row that copies a placeholder URL
3. The passport-in-wallet hero illustration
4. A CTA card titled "Start your Creator Journey and Earn on Views" with a single gradient button "Connect Professional account"
5. Optional chain-inviter footer; fallback "Already a citizen? Log in"

The user (Samurai) flagged two issues and one CTA mismatch:

- **Top card (E / erum) is noise.** It repeats content already in the URL bar and adds visual weight for no functional purpose.
- **"My unique link" is misleading.** The viewer's unique link does not exist until they unlock their passport — showing `zo.xyz/@you` as a placeholder is confusing.
- **CTA is off-strategy.** "Connect Professional account" is creator-funnel language. On a locked-passport landing, the primary asks are "Unlock your passport" (sign up / log in → create citizen passport) and "Get Pro Passport" (upgrade to the paid tier). Creator flow belongs inside `/passport` once unlocked.

## Goals

- Simplify the locked-passport landing so the passport-in-wallet image is the visual hero.
- Offer the two correct next actions for a logged-out or locked visitor: unlock a passport, or go straight to the Pro upsell.
- Preserve chain-invite attribution when present (`chainInviterHandle`) so referral context is not lost.
- No regressions on /@handle routes that hit the unlocked `PublicPassportView` branch — this rework only touches `NewUserInvitedView` and its sole caller.

## Non-Goals

- Wiring Razorpay or any Pro payment flow. That is DV's scope; this rework only routes the Pro CTA to the existing `PassportProCard` upsell inside `/passport`.
- Touching `PublicPassportView`, `PassportPitch`, or any unlocked-passport surface.
- Backend changes. `NewUserInvitedView` renders only when the backend returns no passport data or a locked state; backend contract is unchanged.
- Logging of locked-view events (can be added later once PostHog `activity_logging` PR #22 patterns are extended to this view).

## Current State

### File: `apps/website/src/components/passport/NewUserInvitedView.tsx`

226-line component. Interface accepts 10 props (many dead after rework):

```ts
interface NewUserInvitedViewProps {
  inviterHandle: string;
  inviterDisplayName?: string | null;
  inviterAvatarUrl?: string | null;
  inviterRoleLabel?: string | null;
  viewerHandle?: string | null;
  viewerAvatarUrl?: string | null;
  viewerDisplayName?: string | null;
  viewerRoleLabel?: string | null;
  chainInviterHandle?: string | null;
  chainInviterAvatarUrl?: string | null;
}
```

Renders (in order): inviter card → "My unique link" row → passport-in-wallet image → Creator Journey CTA card → chain-inviter footer OR "Already a citizen? Log in" fallback.

### Sole caller: `apps/website/src/pages/passport.tsx` line 211–219

```tsx
{showNewUserInvited ? (
  <NewUserInvitedView
    inviterHandle={urlHandle}
    inviterDisplayName={og?.title?.split(" · ")[0] || null}
    inviterAvatarUrl={og?.image || null}
    viewerHandle={profile?.custom_nickname || profile?.nickname || null}
    viewerDisplayName={profile?.full_name || profile?.first_name || null}
    viewerAvatarUrl={profile?.avatar?.image || profile?.pfp_image || null}
  />
) : (
  <PublicPassportView ... />
)}
```

Chain-inviter props are not currently populated by the caller. The fallback "Already a citizen? Log in" branch always renders.

### Pro upsell anchor target: `apps/website/src/pages/passport.tsx` line 291

`<PassportProCard />` is rendered inside the logged-in passport page. It has no DOM id, so `/passport#pro` currently does nothing.

## New Design

### Visual layout (top → bottom, ~392px max column width, unchanged)

```
┌────────────────────────────────────────┐
│                                        │
│    [passport-in-wallet hero image]     │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │   Your Zo Passport awaits.       │ │
│  │   Every citizen gets one.        │ │
│  │   Pro unlocks the full kit.      │ │
│  │                                  │ │
│  │  ┌────────────┐ ┌────────────┐   │ │
│  │  │  Unlock    │ │  Get Pro   │   │ │
│  │  │  your      │ │  Passport  │   │ │
│  │  │  passport  │ │            │   │ │
│  │  └────────────┘ └────────────┘   │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Invited by <chain-handle>             │
│  (or) "Already a citizen? Log in"      │
│                                        │
└────────────────────────────────────────┘
```

### Changes vs current

| Section | Current | New |
|---|---|---|
| Top inviter card (E / erum / role chip) | Shown | **Removed** |
| "My unique link" + copy button | Shown | **Removed** |
| Passport-in-wallet hero image | Shown | Kept (unchanged) |
| CTA card header icons (green C, purple star) | Shown | **Removed** |
| CTA card headline | "Start your Creator Journey and Earn on Views" | "Your Zo Passport awaits." |
| CTA card subheadline | (none) | "Every citizen gets one. Pro unlocks the full kit." |
| CTA buttons | 1 button: "Connect Professional account" (purple→pink gradient) | 2 side-by-side equal buttons: "Unlock your passport" (primary gradient), "Get Pro Passport" (secondary, outlined with subtle gold tint) |
| Chain-inviter footer | Kept when `chainInviterHandle` is set | Kept (unchanged) |
| Fallback "Already a citizen? Log in" | Kept when no chain inviter | Kept (unchanged) |

### Copy (exact strings)

- Headline: `Your Zo Passport awaits.`
- Subheadline: `Every citizen gets one. Pro unlocks the full kit.`
- Primary button: `Unlock your passport`
- Secondary button: `Get Pro Passport`
- Chain-inviter footer label: `Invited by` (unchanged)
- Fallback link: `Already a citizen? Log in` (unchanged)

### Button styling

- **Container:** `<div className="flex gap-3">` with both buttons as `flex-1`.
- **Primary ("Unlock your passport"):** Keeps the existing gradient style — `linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)`, white text, `font-semibold`, `rounded-xl`, `py-3.5`, `text-[14px]`, hover `brightness-110`, shadow `0 8px 24px rgba(168, 85, 247, 0.35)`.
- **Secondary ("Get Pro Passport"):** Outlined with a subtle gold tint to echo the Pro/gold tier pill. `border: 1px solid rgba(212, 175, 55, 0.45)`, `background: rgba(212, 175, 55, 0.08)`, text color `#d4af37`, same `rounded-xl`, `py-3.5`, `text-[14px]`, `font-semibold`. Hover: `background: rgba(212, 175, 55, 0.15)`.
- Both buttons must have a `44px`-equivalent touch target — `py-3.5` + `text-[14px]` already yields ~48px height, OK for mobile.

### Routing

Both buttons use the existing `useAuth().showLoginModal(undefined, <redirect>)` pattern, which handles both logged-out (opens login modal, redirects after auth) and logged-in (routes directly) visitors.

| Button | Handler | Redirect target |
|---|---|---|
| Unlock your passport | `showLoginModal(undefined, "/passport")` | `/passport` (own private passport — onboarding or populated view) |
| Get Pro Passport | `showLoginModal(undefined, "/passport#pro")` | `/passport` with hash anchor to scroll to the Pro upsell card |

### Pro anchor target (in `passport.tsx`)

Wrap the existing `<PassportProCard />` (line 291) in a `<section id="pro" className="scroll-mt-16">` so the `#pro` hash scrolls the card into view with a 64px top offset (enough to clear the sticky nav). `scroll-mt-16` is Tailwind's `scroll-margin-top: 4rem`. This is the only change needed to `passport.tsx` beyond the caller prop cleanup.

### Props cleanup

`NewUserInvitedViewProps` collapses to:

```ts
interface NewUserInvitedViewProps {
  chainInviterHandle?: string | null;
  chainInviterAvatarUrl?: string | null;
}
```

All inviter-* and viewer-* props are removed. The `fixAvatarUrl` import stays (still used by the chain-inviter footer). The `useState` for the "Copied!" indicator is removed (no copy button). `passportInWalletImg` import is unchanged.

### Caller update (`passport.tsx` line 211–219)

```tsx
{showNewUserInvited ? (
  <NewUserInvitedView />
) : (
  <PublicPassportView ... />
)}
```

All dead props dropped. No new props added — chain-inviter data is not currently threaded through `passport.tsx` and is out of scope for this rework. The fallback "Already a citizen? Log in" branch inside `NewUserInvitedView` will continue to render until chain-inviter plumbing is added in a future change.

## Implementation Surface

### Files changed

1. `apps/website/src/components/passport/NewUserInvitedView.tsx` — rewrite (strip props, remove top card + unique-link row + icon pair, replace headline/sub/CTAs, keep hero image + footer branches). Estimated net −120 lines.
2. `apps/website/src/pages/passport.tsx` — two edits:
   - Line 211–219: trim dead props from the `<NewUserInvitedView />` invocation.
   - Around line 291: wrap `<PassportProCard />` in `<section id="pro" className="scroll-mt-16">`.

### No new files, no new dependencies

All styling is Tailwind + inline `style` (matches existing pattern in the file). No icons or images added or removed (passport-in-wallet hero stays; the two decorative circle icons above the old headline are dropped — they were inline SVG and a single letter, no imports).

## Verification

- **TypeScript clean** — `npx tsc --noEmit -p apps/website/tsconfig.json`
- **Build green** — `npx nx build website`
- **Manual smoke test on zozozo.work preview:**
  1. Visit `/@erum` (currently 404 on backend — triggers `showNewUserInvited`). Expect new layout: hero image → new CTA block → "Already a citizen? Log in".
  2. Click "Unlock your passport" → login modal appears → after login, lands on `/passport`.
  3. Click "Get Pro Passport" → login modal appears → after login, lands on `/passport`, auto-scrolls to Pro upsell card (id=pro).
  4. Visit `/@samurai` (unlocked) — confirm `PublicPassportView` branch still renders, no regression.
  5. Mobile viewport (375px): two buttons still fit side-by-side; touch targets ≥44px.
- **OG tags unchanged** — the `getServerSideProps` path in `passport.tsx` that composes og tags is untouched; WhatsApp/Twitter unfurl still works for locked handles.

## Risks & Mitigations

- **Risk:** Someone is relying on the `/@erum` page to visually tell a passer-by "this is erum's page" via the top card. **Mitigation:** The URL bar (`zozozo.work/@erum`) and the og:title already communicate the handle. The card is redundant; removing it is intentional.
- **Risk:** `/passport#pro` hash scroll does not work if the Pro card is rendered lazily or after a data fetch. **Mitigation:** `PassportProCard` is a static upsell card (no async dependency), renders on first paint. `scroll-mt-16` accounts for sticky nav.
- **Risk:** Chain-inviter attribution is lost. **Mitigation:** The footer branch is preserved; wiring the data through `passport.tsx` can happen in a follow-up without re-touching this component.
- **Risk:** Gold secondary-button tint reads as "low-contrast disabled" rather than "premium". **Mitigation:** Use `#d4af37` for text (WCAG AA against black background at 14px semibold), not a washed-out gold. If QA rejects the tint, fall back to plain white outline.

## Rollout

- Single PR against `main`. No feature flag — locked-passport landing is already the default for users without passports, so this is a pure visual rework with the same render gate.
- Preview deploy on Vercel → manual smoke test → merge.

## Open Follow-Ups (Out of Scope)

- Thread `chainInviterHandle` / `chainInviterAvatarUrl` through `passport.tsx` from the referrer capture hook (`useCaptureReferrer`) so the footer actually renders attribution instead of always falling back to "Already a citizen? Log in".
- Wire Razorpay directly from the Pro CTA once DV's payment flow ships; currently it just scrolls to the upsell card.
- Add PostHog `locked_passport_view` + `unlock_cta_click` + `pro_cta_click` events once activity logging patterns (PR #22) are extended to this view.
