# Passport Lobby — Desktop Rearrangement

**Date:** 2026-04-20
**Scope:** `apps/website/src/components/passport-lobby/LobbyRoom.tsx`, desktop breakpoint only
**Not in scope:** mobile layout, public visitor view (`PublicPassportView`), any component internals, any new components, any backend/API changes

## Problem

On desktop (`md:` and up) the `zozozo.work/@handle` lobby renders everything in a single centered column — hero card, pedestal, progress bar, active quest card, travelers pill — with the left side completely empty and the right side holding only a narrow icon rail (`SideNavRail` + a faded tiny `NextMilestoneSign`). The layout feels like a mobile column stretched into a wide viewport. The JSDoc comment at `LobbyRoom.tsx:17` already labels the component "Fortnite-style lobby" but it has never actually used the horizontal real estate.

## Goal

Use the empty sides at wide viewports. Keep the center as the stage for the avatar. Keep the architecture identical to today — no new components, no new props, no hook or API changes. Do not regress anything for narrow viewports.

## Non-goals

- No changes to `CitizenCard`, `ActiveQuestCard`, `GhostVisitors`, `NextMilestoneSign`, `TravelersPill`, `SideNavRail`, `TopBar`, `PassesDock`.
- No changes to `PassportLobby.tsx` (slot wiring stays the same; the fixed-position wordmark at `PassportLobby.tsx:115-134` stays untouched — it sits at `bottom-6 left-6 z-20` and is vertically far from the proposed center-anchored left panel, so no collision).
- No changes to the mobile block inside `LobbyRoom.tsx` (lines 23–61 of the current file; it still uses `z-[4]` at line 60 for ghost visitors — that is intentional and unchanged).
- No changes to the public visitor view at `zozozo.work/@handle` for unauthenticated visits or visits to another user's handle.
- No full-body-avatar work (Phase-1 avatar roadmap continues on its own track and lands in the existing hero slot).
- No atmospheric additions (no new particles, parallax, motion).
- No changes to ambient glow blobs in `PassportLobby.tsx:88-113`.

## Design

### Breakpoint strategy

To guarantee no overlap between the new side panels and the centered hero card on narrow laptops, the side panels **only render at `lg:` (Tailwind default: 1024px) and above**. Between `md:` (768px) and `lg:`, the desktop layout stays exactly as it is today — single center column, faded milestone, icon rail on the right, ghost visitors bottom-left. This is intentional:

- `< md` (< 768px) — mobile block (unchanged)
- `md` ≤ width < `lg` (768–1023px) — current single-column desktop layout (unchanged)
- `≥ lg` (≥ 1024px) — new three-region layout

The existing `hidden md:block` wrapper around the desktop block stays. Inside it, we use `hidden lg:block` / `lg:hidden` modifiers on the specific elements being toggled so they only appear in the right breakpoint.

### Region mapping at `lg:` and up

| Region | Today (`md:`+) | Proposed (`lg:`+ only) |
|---|---|---|
| Left panel (absent today) | — | `<aside>` at `absolute left-8 top-32 z-[6]`, fixed `w-[320px]`, renders `ActiveQuestCard` on top and `GhostVisitors` beneath it with `space-y-6`. Wrapper only mounts if at least one of the two slots is non-falsy. |
| Center stage | `CitizenCard` → pedestal SVG → progress bar SVG → `ActiveQuestCard` → `TravelersPill` | `CitizenCard` → pedestal SVG → progress bar SVG → `TravelersPill`. Quest card is **only removed from the center at `lg:`+**. Between `md:` and `lg:` the center stack still includes the quest card (unchanged behavior). |
| Right panel | `SideNavRail` + `NextMilestoneSign` wrapped in `<div className="opacity-60" style={{ width: 44 }}>` | `SideNavRail` + `<div>{nextMilestone}</div>` (plain wrapper preserving the parent `flex-col items-center gap-6` spacing — do NOT remove the wrapper div, just drop the `className="opacity-60"` and the inline `style={{ width: 44 }}`). |
| Ghost visitors bottom-left badge (`absolute left-8 bottom-24 z-[4]`) | present | **at `lg:`+**, hidden via `lg:hidden` (it moves into the left panel). Between `md:` and `lg:` the bottom-left badge remains as today. |

### Layout mechanics

The desktop block (`hidden md:block`, current lines 63–123) stays a positioned `relative` container with the existing room-perspective backdrop, floor spotlight glow, and ambient glows unchanged.

**Left panel (new, `lg:`+ only):**

```
<aside
  className="hidden lg:block absolute left-8 top-32 z-[6] w-[320px] space-y-6"
  // conditional: render this aside only if activeQuest or ghostVisitors is non-null
>
  {activeQuest}
  {ghostVisitors}
</aside>
```

- Width clamp (`w-[320px]`) prevents the panel from growing to arbitrary widths and colliding with center at borderline viewports.
- Top-anchored (`top-32`, 128px from top below the TopBar) rather than vertically centered, so tall quest card states (long description, multi-line CTA, error state) extend downward rather than pushing off-screen on short (≤ ~700px-height) viewports.
- The ambient purple glow blob at `PassportLobby.tsx:88-100` (auto z-index = 0, `pointer-events-none`, blurred 100px) sits directly behind this panel's rectangle; that's the intended visual (panel content reads on top of a soft purple haze). The `z-[6]` on the panel puts it above the glow blob.

**Center stage (edit inside the existing center wrapper, not replaced):**

- Keep the existing `relative z-[5] flex flex-col items-center justify-center pt-[80px]` wrapper and its `minHeight: 'calc(100vh - 260px)'` rule.
- Change the quest card line (current line 117) from `{activeQuest && <div className="mt-6">{activeQuest}</div>}` to `{activeQuest && <div className="mt-6 lg:hidden">{activeQuest}</div>}` so the quest card stays in the center column at `md:` through `lg:-1px`, and only disappears from the center at `lg:` and up (where it's taken over by the left panel).
- Travelers pill stays beneath the pedestal/progress-bar (line 118, unchanged).

**Right panel (edit in place, current lines 103–106):**

- Current: `<div className="absolute top-1/2 right-6 -translate-y-1/2 z-[10] flex flex-col items-center gap-6"> {sideNav} <div className="opacity-60" style={{ width: 44 }}>{nextMilestone}</div> </div>`
- Change: swap the inner `<div className="opacity-60" style={{ width: 44 }}>{nextMilestone}</div>` for a plain `<div>{nextMilestone}</div>` (preserve the wrapper so the parent `gap-6` still applies uniformly). At `md:` to `lg:-1px` this means the milestone goes from faded-tiny to full — that is an acceptable side-effect of this change and part of the "fill the sides" goal.

**Ghost visitors bottom-left badge (current lines 121–122):**

- Change `<div className="absolute left-8 bottom-24 z-[4]">{ghostVisitors}</div>` to `<div className="absolute left-8 bottom-24 z-[4] lg:hidden">{ghostVisitors}</div>` — stays for `md:` through `lg:-1px`, hidden at `lg:+` where it's moved into the left panel.

### Slot contract

`LobbyRoomProps` is unchanged:

```ts
interface LobbyRoomProps {
  sideNav: ReactNode;
  hero: ReactNode;
  ghostVisitors: ReactNode;
  nextMilestone: ReactNode;
  travelersPill: ReactNode;
  activeQuest?: ReactNode;  // optional today, stays optional
}
```

`PassportLobby.tsx` still passes the same slots in the same way. All rearrangement happens inside `LobbyRoom.tsx`'s desktop block.

### Z-index ordering

Desktop block (`md:`+):
- `z-[4]` — ghost-visitors bottom-left badge (present at `md:`/`lg:-1px`, hidden at `lg:+`)
- `z-[5]` — center stage (hero/pedestal/progress/travelers, and quest card at `md:`/`lg:-1px`)
- `z-[6]` — **new** left panel (quest + ghost visitors, `lg:+` only)
- `z-[10]` — right side nav rail + next-milestone (both `md:`+)

Mobile block (`< md`): unchanged. `z-[4]`, `z-[5]`, `z-[10]` still used exactly as today.

Modal layers (`MapModal`, `SettingsModal`, `InstagramConnectModal`, `ShareModal`, `ProUpsellModal`) render outside `LobbyRoom` and remain above everything.

### Empty-state handling

- `activeQuest?: ReactNode` is optional (undefined is legal). If `activeQuest` is falsy AND `ghostVisitors` renders null/fragment, do NOT mount the `<aside>` wrapper — otherwise `space-y-6` produces an orphan 24px gap and the panel appears as mysterious empty space. Concrete gate: render the aside only when `activeQuest || ghostVisitors` is truthy (approximates "something was passed" — `GhostVisitors` always returns an element but `activeQuest` may be undefined; practically the aside will almost always render, but the guard prevents a broken-looking panel if upstream ever passes both as null).
- `GhostVisitors` today renders a small element when there are visitors and otherwise renders nothing visible. Its height collapses to 0 in that case — `space-y-6` only applies spacing when there are 2+ non-zero-height children, so a hidden/empty `GhostVisitors` under the quest card doesn't add stray margin.

## Success criteria

Running `npx nx serve website` on port 4202 and visiting `http://localhost:4202/@<handle>` while logged in as that handle:

1. **Viewport = 1440px (wide desktop):** active quest card sits on the left at `w-[320px]` anchored near the top (`top-32`), ghost visitors sit directly beneath it; side-nav rail + next-milestone (no longer faded or width-clamped) sit on the right, vertically centered; hero card + pedestal + progress bar + travelers pill centered with breathing room on both sides; the left and right sides of the viewport feel occupied, not empty.
2. **Viewport = 1024px (exactly `lg`):** same three-region layout as 1440px, just tighter.
3. **Viewport = 900px (between `md` and `lg`):** layout is identical to today — quest card inside the center stack, faded tiny milestone on the right, ghost visitors bottom-left. No side panel, no overlap.
4. **Viewport = 768px (exactly `md`):** same as 900px — current desktop layout, unchanged.
5. **Viewport = 375px (mobile):** identical to today — mobile block renders, quest in center stack, ghost visitors bottom-left.
6. Visiting `http://localhost:4202/@someone-else` shows `PublicPassportView` unchanged at every viewport.
7. No console warnings about layout shift, no hydration errors, no React key warnings.
8. All modals (Map, Settings, IG Connect, Share, Pro upsell) open and cover the layout as before at every viewport.
9. With the quest card in an artificially tall state (simulate via devtools by increasing its height to 800px), the left panel content extends downward from `top-32` and does not push off-screen on a 1024×768 viewport (short laptop). It may scroll-clip below the fold — that is acceptable.

## Rollout

zozozo.work has no separate staging: `main` pushes deploy directly to the live site used by the team and real users.

1. Local dev: run `npx nx serve website`, verify all 5 viewport cases above + the tall-state simulation.
2. Commit to this branch (`feat/passport-lobby-desktop-rearrange`), open a small PR against `main`.
3. Review, merge — auto-deploys to live `zozozo.work`.

**Rollback triggers (merged commit should be reverted if any of these are observed):**
- Hero card visibly overlapping the left panel at any viewport ≥ 1024px.
- Mobile or 768–1023px layout visibly different from today.
- Modal covers broken (Map/Settings/Share sits below the left panel instead of above everything).
- Console hydration error on the lobby route.

**Rollback mechanism:** revert the merge commit. The entire change is one file (`LobbyRoom.tsx`), ~15 lines of diff.

## Out-of-scope follow-ups captured for later

- Public visitor view (`/@handle` while logged out or as another user) still stacks vertically on desktop — same "empty sides" problem. Addressed in a separate spec ("@handle public view desktop").
- Full-body 2D Zobu avatar integration in the hero slot — tracked under the Phase-1 avatar roadmap; independent of this rearrangement.
- Deeper "Fortnite" atmosphere (ambient motion, parallax, light shifts, repositioning glow blobs behind panels) — deferred.
- Mobile rearrangement — explicitly out of scope; deferred.
- 768–1023px "narrow desktop" rearrangement — explicitly deferred; this spec leaves that range at today's behavior.
