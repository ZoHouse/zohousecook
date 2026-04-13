# Passport Settings Modal — Design Spec

**Date:** 2026-04-11
**Scope:** `apps/website` (zozozo.work `/passport`)
**Replaces:** `apps/website/src/components/passport/SettingsDrawer.tsx`
**Owner:** Samurai

---

## Goal

Replace the right-side passport settings drawer with a **center glass-morphism modal** that matches the new passport page aesthetic (GlowCard-style). Every profile field becomes editable inline with a single, consistent row pattern. Connected items (wallets, emails, phones, Instagram) drop the `⋯` dropdown menu in favor of inline action buttons on the row.

Purely a UI rebuild — no API, hook, or data-model changes.

---

## Out of scope

- Avatar / profile-picture upload (stays as-is, not added to the modal).
- Changes to the dashboard app's copy at `apps/dashboard/src/components/passport/SettingsDrawer.tsx`. Mirror later once website version is validated.
- Any backend endpoint changes. All `useMutationApi` / `useQueryApi` calls are preserved verbatim.

---

## Architecture

**New component:** `apps/website/src/components/passport/SettingsModal.tsx`
**Deleted:** `apps/website/src/components/passport/SettingsDrawer.tsx`
**Mount site (touched):** `apps/website/src/pages/passport.tsx` — the `<SettingsDrawer isOpen={...} onClose={...} />` render lives here (line ~85), not in `PassportIdentityCard`. `PassportIdentityCard` only raises `onOpenSettings` up to the page. Rename import + JSX tag to `SettingsModal`.
**Index:** `apps/website/src/components/passport/index.ts` updated if it re-exports.

**Prop API (preserved):** `{ isOpen: boolean; onClose: () => void }` — keep the existing name so the callsite stays a pure rename.

---

## Modal shell

- **Root:** `fixed inset-0 z-50 flex items-center justify-center p-4`
- **Scrim:** `bg-black/70 backdrop-blur-sm`, click closes
- **Container:** reuses the existing `GlowCard` component
  - `rounded-[24px] backdrop-blur-[48px]`
  - Dark gradient background (`linear-gradient(135deg, rgba(41,41,41,0.8), rgba(0,0,0,0.8))`)
  - Inner glow (`inset 0px -1px 24px rgba(255,255,255,0.4)`)
- **Width:** `w-full max-w-[640px]`
- **Height:** `max-h-[85vh]`, internal scroll on the body
- **Header (sticky top):** `flex items-center justify-between px-5 py-4 border-b border-white/10` — "Settings" title (left), `✕` close button (right)
- **Compact profile strip** (just below header, not sticky): small avatar (40–48px) + nickname / name + Founder badge (if applicable) + membership tier pill. Single row, `px-5 py-3 border-b border-white/10`. Identity cue — not editable here. Avatar intentionally not editable per scope.
- **Body:** `overflow-y-auto px-5 py-4`, sections separated by a section label + rows beneath. No inner boxed subcards.

**Mobile (`< sm`):**
- Full-screen sheet: `h-[100dvh] max-h-none w-full rounded-none`
- Optional rounded-top-24px if it reads as a bottom sheet

**Behavior:**
- `Esc` closes, scrim click closes, focus returns to the trigger button
- Body scroll locked while open
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` on title
- Focus trap inside the modal while open

**What's removed from the current file:**
- Inline `GlassCard` and `ZoSpinner` helpers (use plain Tailwind + simple inline spinner SVG).
- All `dash-*` zud tokens (`dash-bg-solid`, `dash-border`, `dash-accent`, `dash-text-*`, `rounded-dash-*`, `shadow-dash-card`) — replaced with Tailwind `white/*` opacity utilities so nothing carries the old zui look.

---

## Row patterns

Every row in the modal uses one of two patterns.

### EditableRow

Replaces today's `EditableField` and `EditableSelect`.

**Collapsed (default):**
```
LABEL                              value text            [Edit]
```
- Label: `text-[10px] uppercase tracking-wider text-white/40`
- Value: `text-sm text-white/90`
- Empty state: italic `"Not set"` in `text-white/40`
- `Edit` button: small, `text-[10px]` with `border border-white/10`, right-aligned

**Editing:**
```
LABEL
[input.........................] [Save] [Cancel]
```
- Input: `bg-white/5 border border-white/15 rounded-md px-2 py-1 text-sm`
- Enter saves, Esc cancels
- `Save` disabled during save, shows small spinner
- On error: stay in edit mode, show inline error text below input

**Variants via `type` prop:**
- `text` (default) — single-line input
- `textarea` — auto-grows for bio
- `select` — dropdown, takes `options: { value, label }[]`
- `date` — HTML date input

**Row divider:** `border-b border-white/5`, no divider on the last row of a section.

**Save callback:** single `onSave(field: string, value: string) => Promise<void>` — all profile fields route through one `useMutationApi("USERS_ME_UPDATE")` call (same endpoint as today's drawer).

### ConnectedItemRow

Replaces today's `ItemMenu` dropdown pattern. Used for wallets, emails, phones, Instagram.

**Layout:**
```
[icon] primary label                    [PRIMARY] or [Make primary]   [✕]
       secondary line (address / status)
```

- `[icon]`: small circular icon (wallet chip / envelope / phone / brand logo)
- Primary label: `text-sm text-white/90`
- Secondary: `text-[11px] text-white/50` — wallet address (truncated `0x1234…abcd`), verification status, etc.
- `[PRIMARY]` pill: green, `bg-green-500/20 text-green-400 px-2 py-0.5 text-[10px] uppercase rounded-full` — shown when `is_primary === true`
- `Make primary`: plain inline text button (`text-[11px] text-white/60 hover:text-white`) when not primary
- `✕` remove: small icon button, `w-7 h-7 text-white/40 hover:text-white`. Desktop: visible on row hover/focus. Mobile: always visible. Disabled when item is primary.

**Confirm-on-remove:**
- Click `✕` → row shifts to red tint (`bg-red-500/10`), buttons swap to `[Remove]` / `[Cancel]` inline. No separate confirm modal.

**Verification indicator** (emails / phones):
- Green dot + "Verified" if `verified === true`
- Amber dot + "Unverified" label if not — **status only, no action**. No resend-verification endpoint exists in the current codebase, so no "Verify" link is wired.

**Same row shape** across wallets (addr), emails, phones, Instagram (handle), other socials.

### Add-new pattern

- **`+ Add email`** — dashed-border button at the bottom of the emails list. Click → inline form row (input + `Save` / `Cancel`). Wired to `AUTH_USER_EMAIL_CREATE` (exists today).
- **`+ Add wallet`** — **dropped.** No wallet-create endpoint exists in the codebase; today's button is display-only. Wallets list is view / set-primary / remove only. Connecting a new wallet is handled elsewhere (web3 provider flow on the main dApp), out of scope for this modal.
- **`+ Add phone`** — **dropped.** No mobile-create endpoint exists today (only PUT/DELETE). Phones list is view / set-primary / remove only.

---

## Sections (top → bottom, single scroll)

Each section: small uppercase label (`text-[11px] text-white/40 tracking-wider uppercase mb-2`), then rows beneath. Gap between sections: `mt-6`.

1. **Profile**
   - Nickname (text) — field key `custom_nickname`
   - First name (text) — field key `first_name`
   - Middle name (text) — field key `middle_name`
   - Last name (text) — field key `last_name`
   - Bio (textarea) — field key `bio`
   - Date of birth (date) — field key `date_of_birth`
   - Gender (select) — field key `gender`
   - Body type (select) — field key `body_type`

   Note: `custom_nickname` and `first_name` are distinct fields; the UI shows both as separate editable rows.

2. **Location**
   - Hometown (text) — field key `place_name` (not `hometown`)
   - Nationality (select) — field key `country`. **Editable** in the new modal (today's drawer leaves it `disabled`). Options come from `useQueryApi("CAS_COUNTRIES")` (`libs/auth/src/endpoints/cas.ts:85`). Before coding, inspect the `CAS_COUNTRIES` response payload to determine the exact shape (ISO-2 code, slug, or object id) and confirm what value `USERS_ME_UPDATE` accepts for `country` — pin the save shape in the implementation plan, not at runtime.
   - Address (textarea) — field key `address`
   - Pincode (text) — field key `pincode`

3. **Cultures**
   - Keep the picker just built (search + toggle-add pills).
   - Restyle pills/search input to use Tailwind `white/*` classes (no `dash-*` tokens).

4. **Wallets**
   - List of `ConnectedItemRow` (each wallet — set primary / remove).
   - No `+ Add wallet` button (see Add-new pattern note).

5. **Emails**
   - List of `ConnectedItemRow` (each email, with verified / unverified badge).
   - `+ Add email` button (wired to `AUTH_USER_EMAIL_CREATE`).

6. **Phones**
   - List of `ConnectedItemRow` (each phone, with verified / unverified badge).
   - No `+ Add phone` button (see Add-new pattern note).

7. **Socials**
   - **Instagram:** `ConnectedItemRow`. Connected → shows handle + `✕` to disconnect. Not connected → row shows `Connect` button in place of the value. Uses `useInstagramConnect()`.
   - **ENS, Twitter, Telegram, Discord:** each rendered as a read-only `ConnectedItemRow` when the corresponding field is present on `profile.socials` / `profile.ens_nickname`. Verified badge shown if applicable. No edit/disconnect in this modal — display only, matching today's drawer. Hidden when the field is empty.

8. **Founder NFTs** (only rendered if `useMyNfts()` returns items)
   - Read-only grid of NFT cards. Keep existing visual, strip `dash-*` tokens.

---

## Data flow

All hooks and endpoints are imported from `@zo/auth`. Compared to today's drawer:

- **Profile / Location / Cultures saves:** preserve whatever the current `SettingsDrawer.tsx` uses verbatim — do not reinvent. Today's drawer calls `useMutationApi("USERS_ME_UPDATE")` directly; if a higher-level `useProfile().updateProfile` wrapper exists in `@zo/auth`, either is acceptable, but keep the same call the drawer uses today so no regression is introduced.
- `useProfile()` from `@zo/auth` — read current user profile.
- `useMutationApi(...)` from `@zo/auth` — for wallet / email add-remove-setPrimary mutations:
  - Wallets: `AUTH_USER_WEB3_WALLETS` (PUT set-primary, DELETE remove)
  - Emails: `AUTH_USER_EMAILS` (PUT set-primary, DELETE remove) + `AUTH_USER_EMAIL_CREATE` (POST add)
  - Phones: `AUTH_USER_MOBILES` (PUT set-primary, DELETE remove) — no create
- `useQueryApi("CAS_CULTURES")` — culture search (used by existing picker).
- `useQueryApi("CAS_COUNTRIES")` — **new usage** for nationality dropdown (endpoint already exists at `libs/auth/src/endpoints/cas.ts:85`, just not called from the drawer today).
- `useInstagramConnect()` — Instagram connect/disconnect.
- `useMyNfts()` — founder NFTs.

**No new backend endpoints.** `CAS_COUNTRIES` is pre-existing. No resend-verify calls. No wallet-create. No phone-create.

---

## Accessibility

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby="settings-modal-title"`
- Focus trap while open; `Esc` closes; focus restored to the Settings trigger button on close
- All interactive elements reachable by keyboard; `Tab` order top-to-bottom
- Inputs have associated labels (visually uppercase mini-labels double as `<label>` for the input)
- Color is not the only indicator for verification state (dot + text label)
- Touch targets on `ConnectedItemRow` remove/primary buttons are ≥ 32px on mobile

**Focus-trap utility:** the codebase does not currently have a focus-trap primitive. Options: (a) add `focus-trap-react` as a new dependency, (b) roll a minimal one (Tab / Shift+Tab wrapping, ~20 lines). Decide during implementation; `focus-trap-react` is the safer call.

---

## Files

| Action | Path |
|---|---|
| **Create** | `apps/website/src/components/passport/SettingsModal.tsx` |
| **Delete** | `apps/website/src/components/passport/SettingsDrawer.tsx` |
| **Edit** | `apps/website/src/pages/passport.tsx` — rename import + JSX tag from `SettingsDrawer` to `SettingsModal`. Prop API (`isOpen`, `onClose`) unchanged. |
| **Edit (if applicable)** | `apps/website/src/components/passport/index.ts` — update re-export if the drawer is re-exported there. |
| **(Possibly) add dependency** | `focus-trap-react` in `apps/website/package.json` if chosen for focus management. |

---

## Success criteria

- Settings opens as a centered GlowCard-style modal on desktop, full-screen sheet on mobile
- All personal-details and location fields are editable inline with identical `EditableRow` behavior
- Wallets / emails / phones / Instagram all use the `ConnectedItemRow` pattern with inline actions (no dropdown menus)
- Zero `dash-*` class references remain in the new component
- Zero behavioral regressions vs. current drawer: every save / add / remove / verify / connect path works identically
- Esc + scrim close, focus trap, `aria-modal` set
- No console errors opening, interacting, or closing the modal
