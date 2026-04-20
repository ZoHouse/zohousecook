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
- No changes to `PassportLobby.tsx` (slot wiring stays the same; the fixed-position wordmark at `PassportLobby.tsx:115-134` stays untouched — it sits at `bottom-6 left-6 z-20 pointer-events-none`, horizontally overlapping the left panel's column but visually subtle and click-transparent; on tall-state quest on a short viewport (~1024×700) the aside's bottom may reach the wordmark's vertical band and they will render stacked — the wordmark is `pointer-events-none` and opacity-subtle, so this is an acceptable visual cohabitation, not a collision).
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
| Right panel | `SideNavRail` + `NextMilestoneSign` wrapped in `<div className="opacity-60" style={{ width: 44 }}>` | `SideNavRail` + `<div className="opacity-60 w-11 lg:opacity-100 lg:w-auto">{nextMilestone}</div>` — at `md:` to `lg:-1px` keeps today's faded 44px look exactly (via Tailwind `opacity-60 w-11`); at `lg:+` drops the fade and width clamp. Inline `style={{ width: 44 }}` is removed because inline styles can't be responsive — `w-11` (2.75rem = 44px) is the Tailwind equivalent. Wrapper div preserved so the parent `flex-col items-center gap-6` spacing still applies. |
| Ghost visitors bottom-left badge (`absolute left-8 bottom-24 z-[4]`) | present | **at `lg:`+**, hidden via `lg:hidden` (it moves into the left panel). Between `md:` and `lg:` the bottom-left badge remains as today. |

### Layout mechanics

The desktop block (`hidden md:block`, current lines 63–123) stays a positioned `relative` container with the existing room-perspective backdrop, floor spotlight glow, and ambient glows unchanged.

**Left panel (new, `lg:`+ only):**

```
<aside className="hidden lg:block absolute left-8 top-32 z-[6] w-[320px] space-y-6">
  {activeQuest}
  {ghostVisitors}
</aside>
```

No mount guard — both slots are always passed as truthy React nodes by `PassportLobby.tsx`. Empty-state visual behavior is covered in the "Empty-state handling" section below.

- Width clamp (`w-[320px]`) prevents the panel from growing to arbitrary widths and colliding with center at borderline viewports.
- Top-anchored (`top-32`, 128px from top below the TopBar) rather than vertically centered, so tall quest card states (long description, multi-line CTA, error state) extend downward rather than pushing off-screen on short (≤ ~700px-height) viewports.
- The ambient purple glow blob at `PassportLobby.tsx:88-100` (auto z-index = 0, `pointer-events-none`, blurred 100px) sits directly behind this panel's rectangle; that's the intended visual (panel content reads on top of a soft purple haze). The `z-[6]` on the panel puts it above the glow blob.

**Center stage (edit inside the existing center wrapper, not replaced):**

- Keep the existing `relative z-[5] flex flex-col items-center justify-center pt-[80px]` wrapper and its `minHeight: 'calc(100vh - 260px)'` rule.
- Change the quest card line (current line 117) from `{activeQuest && <div className="mt-6">{activeQuest}</div>}` to `{activeQuest && <div className="mt-6 lg:hidden">{activeQuest}</div>}` so the quest card stays in the center column at `md:` through `lg:-1px`, and only disappears from the center at `lg:` and up (where it's taken over by the left panel).
- Travelers pill stays beneath the pedestal/progress-bar (line 118, unchanged).

**Right panel (edit in place, current lines 103–106):**

- Current: `<div className="absolute top-1/2 right-6 -translate-y-1/2 z-[10] flex flex-col items-center gap-6"> {sideNav} <div className="opacity-60" style={{ width: 44 }}>{nextMilestone}</div> </div>`
- Change: swap the inner wrapper for `<div className="opacity-60 w-11 lg:opacity-100 lg:w-auto">{nextMilestone}</div>`. At `md:` to `lg:-1px` it renders identically to today (opacity 60%, 44px wide via `w-11`). At `lg:+` both classes clear, matching the new three-region layout. The outer wrapper (position, z-index, flex layout) is untouched.

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

- `PassportLobby.tsx` always passes a `<GhostVisitors />` element into the `ghostVisitors` slot regardless of whether the component renders anything visible, so at the spec's level the `ghostVisitors` prop is always a truthy React node. A JS-level truthiness guard on the props would never fire and is not useful. The left panel `<aside>` therefore always mounts at `lg:+`.
- `GhostVisitors` itself today renders nothing visible when it has no data (its height collapses to 0). Tailwind's `space-y-6` only adds a 24px gap between sibling children with non-zero rendered height, so a zero-height `GhostVisitors` beneath the quest card contributes no stray margin. The practical outcome: a user with no ghost visitors sees the quest card sitting alone at top-32 with no visual gap below it.
- `activeQuest?: ReactNode` is optional at the type level but `PassportLobby.tsx` always passes `<ActiveQuestCard onTap={handleQuestTap} />`. If the prop is ever genuinely undefined (different caller in the future), the aside's first slot is empty and `space-y-6` above `ghostVisitors` still contributes nothing; the panel would show only ghost visitors if any — acceptable.

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
