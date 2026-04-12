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
**Touched:** `apps/website/src/components/passport/PassportIdentityCard.tsx` (import + component name only)
**Index:** `apps/website/src/components/passport/index.ts` updated if it re-exports the drawer

**Prop API (unchanged):** `{ open: boolean; onClose: () => void }` — trigger site is the Settings button inside `PassportIdentityCard`, no callsite rewiring required.

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
- Green dot + "Verified" if verified
- Amber dot + "Verify" link that triggers resend-verification mutation (same endpoint as today)

**Same row shape** across wallets (addr), emails, phones, Instagram (handle).

### Add-new pattern (kept from current)

- Dashed-border button at the bottom of each list: `+ Add wallet` / `+ Add email` / `+ Add phone`
- Click → expands into an inline form row (input + `Save` / `Cancel`), not a separate popover
- Same validation / endpoints as today

---

## Sections (top → bottom, single scroll)

Each section: small uppercase label (`text-[11px] text-white/40 tracking-wider uppercase mb-2`), then rows beneath. Gap between sections: `mt-6`.

1. **Profile**
   - Nickname (text)
   - First name (text)
   - Middle name (text)
   - Last name (text)
   - Bio (textarea)
   - Date of birth (date)
   - Gender (select)
   - Body type (select)

2. **Location**
   - Hometown (text)
   - Nationality (select — country list)
   - Address (textarea)
   - Pincode (text)

3. **Cultures**
   - Keep the picker just built (search + toggle-add pills).
   - Restyle pills/search input to use Tailwind `white/*` classes (no `dash-*` tokens).

4. **Wallets**
   - List of `ConnectedItemRow` (each wallet)
   - `+ Add wallet` button

5. **Emails**
   - List of `ConnectedItemRow` (each email, with verification indicator)
   - `+ Add email` button

6. **Phones**
   - List of `ConnectedItemRow` (each phone, with verification indicator)
   - `+ Add phone` button

7. **Socials**
   - Instagram: single `ConnectedItemRow`. If connected → shows handle + `✕` to disconnect. If not → shows `Connect` button in place of the row content.

8. **Founder NFTs** (only rendered if `useMyNfts()` returns items)
   - Read-only grid of NFT cards. Keep existing visual, strip `dash-*` tokens.

---

## Data flow (unchanged)

All hooks and endpoints carry over 1:1 from `SettingsDrawer.tsx`:

- `useProfile()` — current user profile
- `useMutationApi("USERS_ME_UPDATE")` — profile field saves (Profile + Location + Cultures)
- Wallet add / remove / set-primary endpoints — identical calls
- Email add / remove / set-primary / resend-verification endpoints — identical
- Phone add / remove / set-primary / resend-verification endpoints — identical
- `useInstagramConnect()` — Instagram connect/disconnect hook
- `useMyNfts()` — founder NFTs
- `useQueryApi("CAS_CULTURES")` — culture search

No new endpoints. No data-shape changes.

---

## Accessibility

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby="settings-modal-title"`
- Focus trap while open; `Esc` closes; focus restored to the Settings trigger button on close
- All interactive elements reachable by keyboard; `Tab` order top-to-bottom
- Inputs have associated labels (visually uppercase mini-labels double as `<label>` for the input)
- Color is not the only indicator for verification state (dot + text label)
- Touch targets on `ConnectedItemRow` remove/primary buttons are ≥ 32px on mobile

---

## Files

| Action | Path |
|---|---|
| **Create** | `apps/website/src/components/passport/SettingsModal.tsx` |
| **Delete** | `apps/website/src/components/passport/SettingsDrawer.tsx` |
| **Edit** | `apps/website/src/components/passport/PassportIdentityCard.tsx` (rename import + JSX tag) |
| **Edit (if applicable)** | `apps/website/src/components/passport/index.ts` (update re-export if present) |

---

## Success criteria

- Settings opens as a centered GlowCard-style modal on desktop, full-screen sheet on mobile
- All personal-details and location fields are editable inline with identical `EditableRow` behavior
- Wallets / emails / phones / Instagram all use the `ConnectedItemRow` pattern with inline actions (no dropdown menus)
- Zero `dash-*` class references remain in the new component
- Zero behavioral regressions vs. current drawer: every save / add / remove / verify / connect path works identically
- Esc + scrim close, focus trap, `aria-modal` set
- No console errors opening, interacting, or closing the modal
