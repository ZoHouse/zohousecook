# Passport Lobby Desktop Rearrange — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use the empty left and right sides of the `zozozo.work/@handle` lobby on wide desktop (`lg:`+ / ≥1024px) by moving the active quest card + ghost visitors into a new left panel and un-fading the next-milestone sign on the right. Narrower viewports stay identical to today.

**Architecture:** Single-file edit inside `apps/website/src/components/passport-lobby/LobbyRoom.tsx`. Four small JSX changes inside the existing `hidden md:block` desktop block — add one new `<aside>` (left panel), add `lg:hidden` to the center-column quest card and bottom-left ghost-visitors badge (so they disappear at `lg:+` where the left panel takes over), swap the milestone wrapper's inline style + class for responsive Tailwind classes. Zero new components, zero new props, zero API work. Mobile block untouched.

**Tech Stack:** Next.js 14 (Pages Router), React 18, TypeScript, Tailwind CSS (no arbitrary viewport customization — uses default `md:` = 768px, `lg:` = 1024px).

**Spec reference:** `docs/superpowers/plans/../specs/2026-04-20-passport-lobby-desktop-rearrange-design.md`

---

## File Structure

**Modify (one file, ~15 line diff):**
- `apps/website/src/components/passport-lobby/LobbyRoom.tsx` — desktop block only (lines 63–123). Four hunks:
  1. Inside center-stage flex-col: add `lg:hidden` to the quest-card wrapper so center-column quest hides at `lg:+`.
  2. On the bottom-left ghost-visitors badge wrapper: add `lg:hidden` so the badge hides at `lg:+`.
  3. On the right-panel milestone wrapper: replace `className="opacity-60"` + `style={{ width: 44 }}` with `className="opacity-60 w-11 lg:opacity-100 lg:w-auto"` (inline style removed; responsive Tailwind equivalent).
  4. Add a new `<aside>` left panel element inside the desktop block: `hidden lg:block absolute left-8 top-32 z-[6] w-[320px] space-y-6` containing `{activeQuest}` then `{ghostVisitors}`.

**Do not touch:**
- Mobile block inside the same file (lines 23–61).
- `PassportLobby.tsx` (slot wiring), `CitizenCard`, `ActiveQuestCard`, `GhostVisitors`, `NextMilestoneSign`, `TravelersPill`, `SideNavRail`, `TopBar`, `PassesDock`, `HeroStage`.
- `passport.tsx` page, `next.config.js`.

**Tests:** No automated tests added. Responsive layout behavior isn't unit-testable via React Testing Library (it doesn't simulate viewport media queries) and the repo has no visual-regression infra. Verification is manual viewport-by-viewport per spec success criteria, executed in Task 2.

---

## Chunk 1: Edit LobbyRoom.tsx

### Task 1: Apply the four JSX edits in LobbyRoom.tsx

**Files:**
- Modify: `apps/website/src/components/passport-lobby/LobbyRoom.tsx:103-122`

- [ ] **Step 1: Re-read the current desktop block to anchor line numbers**

Run: open `apps/website/src/components/passport-lobby/LobbyRoom.tsx` and confirm:
- Line 63 is `{/* DESKTOP: immersive Fortnite-style lobby */}`
- Lines 103–106 are the right-panel `<div className="absolute top-1/2 right-6 ...">` block containing the milestone wrapper
- Line 117 is the center-stage `{activeQuest && <div className="mt-6">{activeQuest}</div>}`
- Lines 121–122 are the bottom-left ghost-visitors wrapper `<div className="absolute left-8 bottom-24 z-[4]">{ghostVisitors}</div>`

Expected: all four anchor points match. If any drift (file edited since spec was written), STOP and surface the drift before proceeding.

- [ ] **Step 2: Edit hunk 1 — center-stage quest card gets `lg:hidden`**

Change:
```tsx
{activeQuest && <div className="mt-6">{activeQuest}</div>}
```
to:
```tsx
{activeQuest && <div className="mt-6 lg:hidden">{activeQuest}</div>}
```

Rationale: at `lg:+` the left panel renders the quest; the center column must not also render it.

- [ ] **Step 3: Edit hunk 2 — bottom-left ghost-visitors badge gets `lg:hidden`**

Change:
```tsx
<div className="absolute left-8 bottom-24 z-[4]">{ghostVisitors}</div>
```
to:
```tsx
<div className="absolute left-8 bottom-24 z-[4] lg:hidden">{ghostVisitors}</div>
```

Rationale: at `lg:+` the left panel renders ghost visitors inline beneath the quest card; the floating bottom-left badge must not also render.

- [ ] **Step 4: Edit hunk 3 — right-panel milestone wrapper swaps to responsive classes**

Change:
```tsx
<div className="opacity-60" style={{ width: 44 }}>{nextMilestone}</div>
```
to:
```tsx
<div className="opacity-60 w-11 lg:opacity-100 lg:w-auto">{nextMilestone}</div>
```

Rationale: inline styles can't be responsive. `w-11` (2.75rem = 44px) is the Tailwind equivalent of `width: 44`. At `md:` through `lg:-1px` the milestone renders identically to today (opacity 60%, 44px wide). At `lg:+` both utility classes are overridden so the milestone shows at full opacity and natural width.

- [ ] **Step 5: Edit hunk 4 — insert the new left `<aside>` panel**

Insert a new JSX element inside the desktop block (`hidden md:block` container), just before the closing `</div>` of that container (so it's a sibling of the center stage and the right-panel wrapper). The exact insertion point: after the current ghost-visitors bottom-left line (which is now `lg:hidden`-gated in Step 3), before the closing tag of the desktop block.

Insert:
```tsx
{/* HUD: Left panel — quest + ghost visitors, lg:+ only. */}
<aside className="hidden lg:block absolute left-8 top-32 z-[6] w-[320px] space-y-6">
  {activeQuest}
  {ghostVisitors}
</aside>
```

Rationale:
- `hidden lg:block` — only renders at ≥ 1024px.
- `absolute left-8 top-32` — 32px from left edge, 128px from top (below TopBar).
- `z-[6]` — above center stage (`z-[5]`), below right-panel `z-[10]` and all modals.
- `w-[320px]` — hard width clamp to prevent overlap with centered hero card at viewports like 1024–1200px.
- `space-y-6` — 24px gap between quest card and ghost visitors if both have non-zero rendered height.

- [ ] **Step 6: Verify the edit — re-read the modified file**

Open `apps/website/src/components/passport-lobby/LobbyRoom.tsx` and confirm:
1. The four hunks are all present.
2. The mobile block (`md:hidden`, lines 23–61 before edit) is byte-identical to before.
3. The desktop block still opens with `hidden md:block relative` and closes with a matching `</div>`.
4. No stray leftovers (duplicate quest render, old `style={{ width: 44 }}`).

Expected: file renders syntactically valid JSX, all four hunks applied exactly.

- [ ] **Step 7: Commit the code change**

```bash
git add apps/website/src/components/passport-lobby/LobbyRoom.tsx
git commit -m "feat(passport-lobby): fill empty sides on wide desktop

Rearrange the zozozo.work/@handle lobby at lg:+ (≥ 1024px):
- New left <aside> holds ActiveQuestCard + GhostVisitors
- Center quest card hides at lg:+ (lg:hidden)
- Bottom-left ghost visitors badge hides at lg:+ (lg:hidden)
- Right-panel milestone un-fades and un-clamps at lg:+ via
  responsive Tailwind (opacity-60 w-11 lg:opacity-100 lg:w-auto)

Mobile (< md) and narrow-desktop (md to lg:-1px) layouts are
byte-identical to today. Zero new components, zero new props,
zero API work.

Spec: docs/superpowers/specs/2026-04-20-passport-lobby-desktop-rearrange-design.md"
```

---

## Chunk 2: Verify in dev server

### Task 2: Run dev server and verify all 5 viewports + tall-state

**Context:** `apps/website` is the NX app that renders `/@handle` (rewritten to `/passport`). Dev server runs on port 4202.

- [ ] **Step 1: Start the website dev server**

Run: `cd /tmp/zhc-lobby-rearrange && npx nx serve website`

Expected: after ~15–30s, output includes `ready - started server on 0.0.0.0:4202, url: http://localhost:4202`.

If build errors: STOP, report, fix syntax.

- [ ] **Step 2: Log in and open your own lobby**

In a browser, open `http://localhost:4202/@<your-handle>` (e.g. `http://localhost:4202/@samurai`). Log in if prompted.

Expected: passport lobby renders (avatar card, pedestal, quest, travelers).

- [ ] **Step 3: Verify 1440px viewport (wide desktop)**

Resize browser or use DevTools Device toolbar → set width to 1440.

Expected:
- Left side: active quest card at `left: 32px, top: 128px`, `width: 320px`. Ghost visitors directly beneath quest card (if any visitors) OR collapsed zero-height (if none).
- Center: hero card + pedestal + progress bar + travelers pill (NO quest card here).
- Right side: side-nav rail + full-opacity milestone sign (not faded, not clamped to 44px).
- No console errors.

If fail: report which region is wrong.

- [ ] **Step 4: Verify 1024px viewport (exactly `lg`)**

Resize to 1024. Expected: same three-region layout as 1440, just tighter. No overlap between left panel (`left: 32 + 320 = 352px` right edge) and hero card (centered, typically ~400px wide starting around `(1024 - 400) / 2 = 312px`). The left panel right edge at 352 and hero start at 312 — WAIT, that's 40px of overlap.

**If overlap observed at 1024px:** STOP. The spec assumed this would be clear but hero card width was an unverified assumption. Report the measurement. Options will be: (a) widen breakpoint to `xl:` (1280px), (b) narrow left panel `w-[280px]`, (c) narrow hero card. Do NOT silently "fix" — surface to plan writer.

- [ ] **Step 5: Verify 900px viewport (between `md` and `lg`)**

Resize to 900. Expected: identical to today — center column stack (hero → pedestal → progress → quest → travelers), faded tiny milestone on right, ghost visitors bottom-left. No `<aside>` visible.

Open DevTools → Elements, search for `class="*lg:block*"` — confirm the `<aside>` exists in DOM but has `display: none` at this width.

- [ ] **Step 6: Verify 768px viewport (exactly `md`)**

Resize to 768. Expected: same as 900px. Desktop block still rendering, mobile block still hidden.

- [ ] **Step 7: Verify 375px viewport (mobile)**

Resize to 375. Expected: mobile block renders, quest in center stack, ghost visitors bottom-left. Desktop block hidden.

- [ ] **Step 8: Verify public visitor view unchanged**

In an incognito window (no auth), open `http://localhost:4202/@<someone-else's-handle>`.

Expected: `PublicPassportView` renders as before. This does NOT use `LobbyRoom`, so no visual change.

- [ ] **Step 9: Tall-state simulation**

Back on your own lobby at 1440px, open DevTools → Elements → find the `ActiveQuestCard` inside the new `<aside>` → use Styles panel to inject a temporary `height: 800px` on it.

Expected at 1024×768 (resize to simulate short laptop): quest card extends downward from `top: 128px`. May scroll-clip below the fold — acceptable per spec.

Remove the injected height.

- [ ] **Step 10: Open all modals and confirm z-index**

On the lobby: click the Map icon in the side-nav → `MapModal` should cover the entire layout including the left panel.

Click settings / share / any upsell that's reachable → confirm each modal renders above the left panel (no portion of the `<aside>` peeking through).

Expected: all modals cover everything.

- [ ] **Step 11: Stop the dev server**

`Ctrl+C` in the terminal running `npx nx serve website`.

- [ ] **Step 12: If all viewports passed, push the branch**

```bash
cd /tmp/zhc-lobby-rearrange
git push -u origin feat/passport-lobby-desktop-rearrange
```

Expected: push succeeds. Branch tracks origin.

- [ ] **Step 13: Report completion to Samurai**

Text summary: which viewports you verified, whether all passed, any surprises encountered.

If all 5 viewports green: ready for PR against main (auto-deploys to live zozozo.work on merge).

If any viewport failed: DO NOT open the PR. Report the failure mode and surface to Samurai.

---

## Notes for the executing agent

- This is a live-site change. zozozo.work has no separate staging — `main` auto-deploys. The PR review is the only checkpoint before real users see it.
- Do NOT merge without Samurai's explicit OK even if all viewports pass locally.
- Rollback is `git revert <merge-sha>` — the entire change is 15 lines in one file.
- If you hit the 1024px overlap described in Chunk 2 Step 4, DO NOT silently widen the breakpoint or narrow the panel. Spec is a contract; breaking it is a re-brainstorm, not a solo decision.
