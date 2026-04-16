# Passport Locked-View Rework Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the `/@<handle>` page shown for locked / not-yet-unlocked passports: drop the inviter card and "My unique link" row, replace the single Creator-funnel CTA with two side-by-side buttons ("Unlock your passport" + "Get Pro Passport"), and add a `#pro` scroll anchor on the private `/passport` page so the Pro CTA can deep-link to the upsell card.

**Architecture:** Pure frontend edit in `apps/website`. One component rewrite (`NewUserInvitedView.tsx`), one caller/anchor edit (`passport.tsx`). No new files, no new deps, no backend changes. Reuses existing `useAuth().showLoginModal(redirect, path)` for both buttons so logged-in and logged-out states are handled by the same auth library.

**Tech Stack:** Next.js 14 Pages Router, React 18, Tailwind CSS, inline styles (matching existing file patterns). Zo auth via `libs/auth/`.

**Spec:** `docs/superpowers/specs/2026-04-16-passport-locked-view-rework-design.md`

---

## Chunk 1: Implementation

### Task 1: Create feature branch

**Files:** none

- [ ] **Step 1.1: Branch off main**

Run:
```bash
cd /Users/samuraizan/samuraidojo/zohouse/zo.xyz/mono-front-main
git checkout main
git pull --rebase origin main
git checkout -b feat/passport-locked-view-rework
```

Expected: on a clean feature branch forked from latest `origin/main`.

---

### Task 2: Rewrite NewUserInvitedView.tsx

**Files:**
- Modify: `apps/website/src/components/passport/NewUserInvitedView.tsx` (full rewrite, ~226 → ~110 lines)

The new file keeps: `passportInWalletImg` import, `fixAvatarUrl` import, `useAuth` import, chain-inviter footer + "Already a citizen? Log in" fallback. Drops: `useState` react import, `RoleChip` component, all inviter-*/viewer-* props, `copied`/`setCopied`/`handleCopyLink`/`handleConnectIG`/`displayName`/`viewerLink`/`inviterAvatar`/`viewerAvatar` locals, the top inviter card, the "My unique link" row, the green-C + purple-star icon pair.

- [ ] **Step 2.1: Replace file contents**

Write this exact content to `apps/website/src/components/passport/NewUserInvitedView.tsx`:

```tsx
import React from "react";
import { useAuth } from "@zo/auth";
import passportInWalletImg from "../../assets/passport/passport-in-wallet.png";
import { fixAvatarUrl } from "../../hooks/usePublicPassport";

interface NewUserInvitedViewProps {
  chainInviterHandle?: string | null;
  chainInviterAvatarUrl?: string | null;
}

export function NewUserInvitedView({
  chainInviterHandle,
  chainInviterAvatarUrl,
}: NewUserInvitedViewProps) {
  const { showLoginModal } = useAuth();

  const handleUnlock = () => {
    showLoginModal(undefined, "/passport");
  };

  const handleGetPro = () => {
    showLoginModal(undefined, "/passport#pro");
  };

  const chainAvatar = fixAvatarUrl(chainInviterAvatarUrl || undefined);

  return (
    <div className="flex-1 min-h-screen bg-[#0a0a0f]">
      <div className="max-w-[1440px] mx-auto px-6 pt-8 pb-16">
        <div className="mx-auto" style={{ maxWidth: 392 }}>
          {/* Passport-in-wallet hero illustration */}
          <div className="relative mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={passportInWalletImg.src}
              alt="Your Zo Passport, waiting to be unlocked"
              className="w-full h-auto"
              style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))" }}
            />
          </div>

          {/* CTA card */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-4 mb-8"
            style={{
              background:
                "linear-gradient(145deg, rgba(35,35,45,0.8) 0%, rgba(20,20,28,0.95) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div className="text-center">
              <h3 className="text-white text-[20px] font-semibold leading-tight mb-1.5">
                Your Zo Passport awaits.
              </h3>
              <p className="text-white/60 text-[13px] leading-snug">
                Every citizen gets one. Pro unlocks the full kit.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUnlock}
                className="flex-1 py-3.5 rounded-xl font-semibold text-white text-[14px] transition-all hover:brightness-110"
                style={{
                  background:
                    "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
                  boxShadow: "0 8px 24px rgba(168, 85, 247, 0.35)",
                }}
              >
                Unlock your passport
              </button>
              <button
                onClick={handleGetPro}
                className="flex-1 py-3.5 rounded-xl font-semibold text-[14px] transition-all"
                style={{
                  background: "rgba(212, 175, 55, 0.08)",
                  border: "1px solid rgba(212, 175, 55, 0.45)",
                  color: "#d4af37",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(212, 175, 55, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(212, 175, 55, 0.08)";
                }}
              >
                Get Pro Passport
              </button>
            </div>
          </div>

          {/* Chain inviter footer — who invited the CURRENT viewer */}
          {chainInviterHandle && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-white/40 text-[12px]">Invited by</p>
              <div className="flex items-center gap-2">
                {chainAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={chainAvatar}
                    alt={chainInviterHandle}
                    className="w-10 h-10 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {chainInviterHandle.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-white text-[14px] font-medium">
                  {chainInviterHandle.endsWith(".zo")
                    ? chainInviterHandle
                    : `${chainInviterHandle}.zo`}
                </span>
              </div>
            </div>
          )}

          {/* Fallback: if no chain inviter, still offer a subtle sign-in prompt */}
          {!chainInviterHandle && (
            <div className="text-center mt-2">
              <button
                onClick={() => showLoginModal(undefined, "/passport")}
                className="text-white/50 hover:text-white text-[12px] transition-colors"
              >
                Already a citizen? Log in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewUserInvitedView;
```

- [ ] **Step 2.2: Type-check this app only**

Run:
```bash
npx tsc --noEmit -p apps/website/tsconfig.json
```

Expected: exit 0, no errors. (If `tsc` complains about the caller still passing dead props, that means Task 3 hasn't run yet — that's fine, leave it for now; the follow-up step in Task 3 will clear it.)

---

### Task 3: Update caller + add #pro scroll anchor in passport.tsx

**Files:**
- Modify: `apps/website/src/pages/passport.tsx:211-219` (trim dead props)
- Modify: `apps/website/src/pages/passport.tsx:291` (wrap `<PassportProCard />` in `<section id="pro" className="scroll-mt-16">`)

- [ ] **Step 3.1: Trim dead props from NewUserInvitedView caller**

Open `apps/website/src/pages/passport.tsx`. Find the block at lines 211–219:

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
```

Replace with:

```tsx
{showNewUserInvited ? (
  <NewUserInvitedView />
) : (
```

- [ ] **Step 3.2: Add scroll-target section wrapper around PassportProCard**

Find `<PassportProCard />` at line 291. Replace the line with:

```tsx
<section id="pro" className="scroll-mt-16">
  <PassportProCard />
</section>
```

(Indentation to match the surrounding block. Do not change any other sibling.)

- [ ] **Step 3.3: Type-check + build both affected concerns**

Run:
```bash
npx tsc --noEmit -p apps/website/tsconfig.json
```

Expected: exit 0, no errors.

Then run:
```bash
npx nx build website
```

Expected: build Green, no errors. Any warnings about unused imports in neighbouring files are pre-existing and not this task's responsibility.

---

### Task 4: Manual smoke test on local dev server

**Files:** none — validation only.

- [ ] **Step 4.1: Start the website dev server**

Run (in a dedicated terminal):
```bash
npx nx serve website
```

Expected: server up at `http://localhost:4202`.

- [ ] **Step 4.2: Locked-view render check**

Visit `http://localhost:4202/@erum` (or any handle the backend 404s on).

Expected:
- No top "E / erum" card.
- No "My unique link" row.
- Passport-in-wallet illustration is the top visual.
- CTA card shows: headline "Your Zo Passport awaits.", sub "Every citizen gets one. Pro unlocks the full kit.", then two equal buttons side-by-side: "Unlock your passport" (purple→pink gradient) and "Get Pro Passport" (gold outline).
- Footer shows "Already a citizen? Log in" link (no chain-inviter data threaded).

- [ ] **Step 4.3: Unlock CTA routing**

Click "Unlock your passport".
Expected: login modal opens. After completing auth, the user lands on `/passport`. Note: if the tester is already logged in and has their own passport, `passport.tsx` will auto-bounce them from `/passport` to `/@<their-own-handle>` via the `useEffect` at roughly line 176–180 — this is existing behaviour and not a regression.

- [ ] **Step 4.4: Pro CTA routing and scroll anchor**

Back on `/@erum`. Click "Get Pro Passport".
Expected: login modal opens. After completing auth, the user lands on `/passport` and the page auto-scrolls so the `PassportProCard` upsell is visible at the top of the viewport (within `4rem / 64px` of the top edge).

If already logged in: the click routes directly to `/passport#pro` and the page opens scrolled to the Pro card.

- [ ] **Step 4.5: Regression check on unlocked passport**

Visit `http://localhost:4202/@samurai` (a handle with real backend data).
Expected: the regular `PublicPassportView` renders as before. No visible change vs current production. `og:*` meta tags still composed.

- [ ] **Step 4.6: Mobile viewport check**

Open Chrome DevTools → responsive mode → set viewport to `375 × 812` (iPhone 13).
Reload `/@erum`.
Expected:
- Both CTA buttons still side-by-side inside the card, no overflow.
- Each button tap target ≥ 44px (`py-3.5` + `text-[14px]` yields ~48px height).
- No horizontal scroll.

---

### Task 5: Commit + push

**Files:** all from Tasks 2 + 3.

- [ ] **Step 5.1: Review diff**

Run:
```bash
git status
git diff apps/website/src/components/passport/NewUserInvitedView.tsx apps/website/src/pages/passport.tsx
```

Expected: two files touched. `NewUserInvitedView.tsx` shows a large deletion + smaller replacement. `passport.tsx` shows the caller trim + section wrapper.

- [ ] **Step 5.2: Commit**

Run:
```bash
git add apps/website/src/components/passport/NewUserInvitedView.tsx apps/website/src/pages/passport.tsx
git commit -m "$(cat <<'EOF'
feat(passport): simplify locked-view + dual CTA

Rework NewUserInvitedView so the passport-in-wallet illustration
is the hero, with a new CTA block asking visitors to either
unlock their passport or go straight to the Pro upsell.

Changes:
- Drop the top inviter card (E / handle) — redundant with URL bar.
- Drop "My unique link" row — the viewer has no link until they
  unlock their own passport.
- Replace single "Connect Professional account" CTA with two
  equal side-by-side buttons: "Unlock your passport" (gradient)
  routes to /passport; "Get Pro Passport" (gold outline) routes
  to /passport#pro.
- New headline "Your Zo Passport awaits." with sub "Every citizen
  gets one. Pro unlocks the full kit."
- Wrap PassportProCard in <section id="pro" scroll-mt-16> so the
  hash anchor scrolls the Pro upsell into view with room under
  the nav.
- Strip dead props + RoleChip helper + useState import from
  NewUserInvitedView. Interface collapses to chainInviter* only.
- Caller in passport.tsx trimmed to <NewUserInvitedView />.

Spec: docs/superpowers/specs/2026-04-16-passport-locked-view-rework-design.md
EOF
)"
```

- [ ] **Step 5.3: Push the branch**

Run:
```bash
git push -u origin feat/passport-locked-view-rework
```

Expected: branch pushed, Vercel preview build triggered on the `zozozo-website` project.

- [ ] **Step 5.4: Smoke-test the Vercel preview**

Wait for Vercel preview URL (visible in the `gh pr` check output or the Vercel dashboard). Repeat the manual checks from Task 4 against the preview URL, not local, to confirm production parity.

---

### Task 6: Open PR

- [ ] **Step 6.1: Create PR**

Run:
```bash
gh pr create --title "feat(passport): simplify locked-view + dual CTA" --body "$(cat <<'EOF'
## Summary
- Simplifies the `/@<handle>` landing for locked / not-yet-unlocked passports.
- Removes the top inviter card and the "My unique link" row.
- Adds two side-by-side CTAs: "Unlock your passport" → `/passport`, "Get Pro Passport" → `/passport#pro`.
- Adds a scroll anchor (`id="pro"`) on the `PassportProCard` inside `/passport` so the Pro deep-link works.

## Test plan
- [x] Local smoke test: `/@erum` renders new layout, both CTAs route correctly.
- [x] Local smoke test: `/@samurai` still renders `PublicPassportView` (no regression).
- [x] `npx tsc --noEmit -p apps/website/tsconfig.json` clean.
- [x] `npx nx build website` green.
- [ ] Vercel preview smoke test matches local behavior.
- [ ] Mobile viewport (375px): buttons side-by-side, no overflow.

Spec: `docs/superpowers/specs/2026-04-16-passport-locked-view-rework-design.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL returned. Paste into the session so Samurai can review.

---

## Done criteria

1. `/@<locked-handle>` renders the new layout on Vercel preview and matches the spec's visual layout.
2. Both CTAs route as specified (unlock → `/passport`, pro → `/passport#pro` with auto-scroll).
3. Unlocked passports (`/@samurai`) unchanged.
4. TypeScript clean, build green, PR opened, preview verified.
5. Out-of-scope items from the spec (chain-inviter plumbing, Razorpay wiring, PostHog events) remain deferred — do NOT add them in this PR.
