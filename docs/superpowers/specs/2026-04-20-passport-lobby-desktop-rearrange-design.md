# Passport Lobby — Desktop Rearrangement

**Date:** 2026-04-20
**Scope:** `apps/website/src/components/passport-lobby/LobbyRoom.tsx`, desktop breakpoint only
**Not in scope:** mobile layout, public visitor view (`PublicPassportView`), any component internals, any new components, any backend/API changes

## Problem

On desktop (`md:` and up) the `zozozo.work/@handle` lobby renders everything in a single centered column — hero card, pedestal, progress bar, active quest card, travelers pill — with the left side completely empty and the right side holding only a narrow icon rail (`SideNavRail` + a faded tiny `NextMilestoneSign`). The layout feels like a mobile column stretched into a wide viewport. The comment on `LobbyRoom.tsx:63` already labels this block "Fortnite-style lobby" but it has never actually used the horizontal real estate.

## Goal

Use the empty sides. Keep the center as the stage for the avatar. Keep the architecture identical to today — no new components, no new props, no hook or API changes.

## Non-goals

- No changes to `CitizenCard`, `ActiveQuestCard`, `GhostVisitors`, `NextMilestoneSign`, `TravelersPill`, `SideNavRail`, `TopBar`, `PassesDock`.
- No changes to `PassportLobby.tsx` (slot wiring stays the same).
- No changes to the mobile block inside `LobbyRoom.tsx` (lines 23–61 of the current file).
- No changes to the public visitor view at `zozozo.work/@handle` for unauthenticated or other-user visits.
- No full-body-avatar work (Phase-1 avatar roadmap continues on its own track and lands in the existing hero slot).
- No atmospheric additions (no new particles, parallax, motion).

## Design

### Region mapping on desktop

| Region | Today | Proposed |
|---|---|---|
| Left panel (empty today) | nothing | `ActiveQuestCard` on top, `GhostVisitors` below it, stacked vertically |
| Center stage | `CitizenCard` → pedestal SVG → progress bar SVG → `ActiveQuestCard` → `TravelersPill` | `CitizenCard` → pedestal SVG → progress bar SVG → `TravelersPill` (quest card removed from here) |
| Right panel | `SideNavRail` + faded `NextMilestoneSign` (width 44, `opacity-60`) | `SideNavRail` + `NextMilestoneSign` at full opacity, no width clamp |

Ghost visitors stops being a bottom-left floating badge and moves into the left panel under the quest card. This removes the current `absolute left-8 bottom-24` placement in favor of living inside the panel.

### Layout mechanics

The desktop block of `LobbyRoom.tsx` (the `hidden md:block` container) stays a positioned `relative` container with the existing room-perspective backdrop, floor spotlight glow, and ambient glows unchanged. Add two absolutely-positioned side panels:

- **Left panel:** `absolute left-8 top-1/2 -translate-y-1/2 z-[6]`, width around `320px` (wide enough for the existing quest card's readable layout; the quest card sets its own width so this is mostly a container). Vertical stack with a gap (`space-y-6`). Contains `{activeQuest}` then `{ghostVisitors}`.
- **Right panel (replacing the current right-edge side-nav container):** same position as today (`absolute top-1/2 right-6 -translate-y-1/2 z-[10]`), same vertical stack, but drop the `opacity-60` and the hardcoded `width: 44` around `NextMilestoneSign`.

The center stage container keeps its current `relative z-[5] flex flex-col items-center justify-center pt-[80px]` wrapper and its `minHeight: 'calc(100vh - 260px)'` rule. The only edit inside it: remove the `{activeQuest && <div className="mt-6">{activeQuest}</div>}` line — quest now lives on the left. `TravelersPill` stays beneath the pedestal/progress-bar.

The existing `<div className="absolute left-8 bottom-24 z-[4]">{ghostVisitors}</div>` block is removed (ghost visitors are now inside the left panel).

### Slot contract

`LobbyRoomProps` is unchanged:

```ts
interface LobbyRoomProps {
  sideNav: ReactNode;
  hero: ReactNode;
  ghostVisitors: ReactNode;
  nextMilestone: ReactNode;
  travelersPill: ReactNode;
  activeQuest?: ReactNode;
}
```

`PassportLobby.tsx` still passes the same slots in the same way. All desktop rearrangement happens inside `LobbyRoom.tsx`'s desktop block.

### Z-index ordering (desktop)

Unchanged from today except the left panel slotting in at `z-[6]`:

- `z-[4]` — (no longer used; the ghost-visitors absolute placement goes away)
- `z-[5]` — center stage (hero/pedestal/progress/travelers)
- `z-[6]` — **new** left panel (quest + ghost visitors)
- `z-[10]` — right side nav + next milestone

Modal layers (`MapModal`, `SettingsModal`, `InstagramConnectModal`, `ShareModal`, `ProUpsellModal`) are rendered outside `LobbyRoom` and remain above everything.

### Breakpoint behaviour

No change to the `md` breakpoint. Below `md`, the existing mobile block renders unchanged. At `md` and up, the new three-region layout renders.

## Success criteria

Starting `npx nx serve website` on port 4202 and visiting `http://localhost:4202/@<handle>` while logged in as that handle:

1. Desktop viewport (≥ `md` = 768px): active quest card sits on the left with ghost visitors beneath it; side nav rail + next-milestone sign on the right (milestone is no longer tiny/faded); hero card + pedestal + progress bar + travelers pill centered; the left and right sides of the viewport feel used, not empty.
2. Mobile viewport (< 768px): layout is identical to today — quest card remains inside the center stack, ghost visitors remain bottom-left, side nav unchanged.
3. Visiting `http://localhost:4202/@someone-else` shows `PublicPassportView` unchanged.
4. Visiting an unauthed state (logged-out `@<handle>`) shows `PublicPassportView` unchanged.
5. No console warnings about layout shift, no hydration errors.
6. All existing modals (Map, Settings, IG Connect, Share, Pro upsell) open and cover the layout as before.

## Rollout

1. Local: dev server, verify the desktop + mobile screenshots, verify public view untouched.
2. Commit to a branch (not `main`, not `staging`), open a small PR.
3. Review, merge to `main` — auto-deploys to `zozozo.work` live (prod, per memory `feedback_zozozo_staging_vs_live.md`).

## Rollback

The entire change lives in one file (`LobbyRoom.tsx`, desktop block). Revert the commit.

## Out-of-scope follow-ups captured for later

- Public visitor view (`/@handle` while logged out or as another user) still stacks vertically on desktop — same "empty sides" problem. Addressed in a separate spec ("@handle public view desktop").
- Full-body 2D Zobu avatar integration in the hero slot — tracked under the Phase-1 avatar roadmap; independent of this rearrangement.
- Deeper "Fortnite" atmosphere (ambient motion, parallax, light shifts) — deferred.
- Mobile rearrangement — explicitly out of scope; deferred.
