# Passport Settings Modal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the zud-styled right-side `SettingsDrawer` on `zozozo.work/passport` with a center glass-morphism `SettingsModal` that uses `GlowCard`, makes every profile/location field editable, and collapses the wallet/email/phone/Instagram `⋯` dropdowns into inline action buttons.

**Architecture:** Single new file `SettingsModal.tsx` exporting one component with the same prop API (`{ isOpen, onClose }`) as the drawer. Internally the modal composes a shell (scrim + `GlowCard` container + header + compact profile strip + scrollable body) plus section subcomponents (Profile, Location, Cultures, Wallets, Emails, Phones, Socials, NFTs). Two shared row primitives — `EditableRow` and `ConnectedItemRow` — replace every bespoke field and item pattern from the drawer. All `dash-*` zud tokens are dropped; styling is plain Tailwind white/opacity classes. No backend or hook changes.

**Tech Stack:** Next.js 14 (Pages Router) + React 18 + TypeScript, Tailwind CSS, `@zo/auth` hooks (`useAuth`, `useProfile`, `useQueryApi`, `useMutationApi`), existing `GlowCard` component, existing `useInstagramConnect` / `useMyNfts` hooks. Optional `focus-trap-react` dependency.

**Spec:** `docs/superpowers/specs/2026-04-11-passport-settings-modal-design.md`

---

## File map

| Action | Path | Purpose |
|---|---|---|
| **Create** | `apps/website/src/components/passport/SettingsModal.tsx` | New modal component; holds shell + all section subcomponents inline (same structure as today's drawer but restyled) |
| **Edit** | `apps/website/src/pages/passport.tsx` | Swap import + JSX tag from `SettingsDrawer` → `SettingsModal` (lines 10, 85) |
| **Edit** | `apps/website/src/components/passport/index.ts` | Replace `SettingsDrawer` re-export (line 13) with `SettingsModal` |
| **Delete** | `apps/website/src/components/passport/SettingsDrawer.tsx` | Old 855-line drawer |
| **(Optional) Edit** | `apps/website/package.json` | Add `focus-trap-react` if chosen |

**One-file design rationale:** The current drawer keeps everything in one file (855 lines, 10 inline subcomponents). The new modal has the same shape (one shell + ~8 section functions + 2 shared primitives). Keeping it in one file preserves parity with the established passport codebase pattern, and the file will come in around 650–750 lines. If it ever grows beyond that, splitting by section is straightforward.

---

## Working notes for the implementer

- **Read the spec first.** It nails down every field mapping, endpoint, row pattern, and mobile behavior. This plan assumes you have it open.
- **No TDD** — this app (`apps/website`) has no component-test setup for the passport area. The verification gate per task is `npx nx build website` (must succeed) + browser check on `localhost:4202/passport`. A Next dev server running throughout is the right setup.
- **Commit after every task.** The plan ends with a final "delete old file" step; until then, `SettingsDrawer.tsx` stays on disk as a reference you can crib from.
- **No behavioral regressions.** Before changing any section, re-read the matching function in the current `SettingsDrawer.tsx` and carry its hook calls over verbatim (same endpoint names, same payload shapes). Only the rendering changes.
- **Strip every `dash-*` token.** Grep your new file at the end for `dash-` and `rounded-dash-` — zero matches allowed.
- **Don't touch** `apps/dashboard/src/components/passport/SettingsDrawer.tsx`. Different app, different deploy, out of scope.

Run the dev server once up front and leave it running:

```bash
npx nx serve website
# visits /passport on localhost:4202
```

---

## Task 1: Scaffold `SettingsModal.tsx` shell

**Purpose:** Stand up the empty modal with scrim, `GlowCard` container, sticky header, close button, scroll body, and desktop/mobile responsive shape. No sections yet.

**Files:**
- Create: `apps/website/src/components/passport/SettingsModal.tsx`
- Edit: `apps/website/src/pages/passport.tsx`
- Edit: `apps/website/src/components/passport/index.ts`

- [ ] **Step 1: Create `SettingsModal.tsx` with shell only**

> **Import style convention for this file:** import React as the default plus commonly used hooks by name: `import React, { useEffect, useState, useMemo, useCallback } from "react";`. Inside the component bodies, use the bare hook names (e.g., `useState(...)` not `useState(...)`). Later tasks assume this.

```tsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import GlowCard from "./GlowCard";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // Lock body scroll + Esc-to-close while open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-4"
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}
      <GlowCard
        className="relative w-full max-w-[640px] h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:rounded-[24px] rounded-none flex flex-col overflow-hidden"
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <h2 id="settings-modal-title" className="text-lg font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 4L4 12M4 4l8 8" />
            </svg>
          </button>
        </div>

        {/* Scroll body — sections will land here in later tasks */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm text-white/40">Sections go here.</p>
        </div>
      </GlowCard>
    </div>
  );
}

export default SettingsModal;
```

- [ ] **Step 2: Update `apps/website/src/components/passport/index.ts`**

Replace line 13 (`export { SettingsDrawer } from "./SettingsDrawer";`) with:

```ts
export { SettingsModal } from "./SettingsModal";
```

Keep `SettingsDrawer` out of the barrel from now on. The file stays on disk (for reference) until the final task.

- [ ] **Step 3: Wire `pages/passport.tsx` to the new modal**

In `apps/website/src/pages/passport.tsx`:

- Change line 10 from `import { SettingsDrawer } from "../components/passport/SettingsDrawer";` to:

```ts
import { SettingsModal } from "../components/passport/SettingsModal";
```

- Change the JSX at line 85 from `<SettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />` to:

```tsx
<SettingsModal
  isOpen={settingsOpen}
  onClose={() => setSettingsOpen(false)}
/>
```

- [ ] **Step 4: Build**

Run: `npx nx build website`
Expected: build succeeds.

- [ ] **Step 5: Browser check**

Open `http://localhost:4202/passport`, click the settings button on the passport card, confirm:
- Modal opens centered on desktop, full-screen on mobile viewport (`⌘⇧M` responsive mode in Chrome)
- Scrim dims the page, clicking it closes the modal
- `Esc` closes the modal
- Close button closes the modal
- Body scroll is locked while open
- No console errors

- [ ] **Step 6: Commit**

```bash
git add apps/website/src/components/passport/SettingsModal.tsx \
        apps/website/src/components/passport/index.ts \
        apps/website/src/pages/passport.tsx
git commit -m "feat(website/passport): scaffold SettingsModal shell"
```

---

## Task 2: Shared row primitives

**Purpose:** Add the two reusable row components (`EditableRow`, `ConnectedItemRow`) plus a tiny `SectionHeader` inside `SettingsModal.tsx`. These carry the glass-morphism look and are reused by every section.

**Files:**
- Modify: `apps/website/src/components/passport/SettingsModal.tsx`

- [ ] **Step 1: Add a local `Spinner` + avatar URL helper at the top of the file (above the component)**

```tsx
function Spinner({ size = 16 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-white/20 border-t-white"
      style={{ width: size, height: size }}
    />
  );
}

function fixAvatarUrl(url?: string): string | undefined {
  if (!url || url.length === 0) return undefined;
  if (url.startsWith("ipfs://")) return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  return url.replace("static.cdn.zo.xyz", "proxy.cdn.zo.xyz");
}

function formatAddress(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
```

- [ ] **Step 2: Add `SectionHeader`**

```tsx
function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2 mt-6 first:mt-0">
      <h3 className="text-[11px] font-medium text-white/40 uppercase tracking-wider">{title}</h3>
      {right}
    </div>
  );
}
```

- [ ] **Step 3: Add `EditableRow`**

Supports `text | textarea | date | select`. Saves via the `onSave` callback supplied by the section. Enter saves, Esc cancels. Empty value renders an italic "Not set".

```tsx
type EditableRowType = "text" | "textarea" | "date" | "select";

interface EditableRowProps {
  label: string;
  value: string;
  field: string;
  type?: EditableRowType;
  options?: { value: string; label: string }[];
  disabled?: boolean;
  onSave: (field: string, value: string) => Promise<void>;
  displayValue?: string; // override the read-mode display (used for selects)
}

function EditableRow({
  label, value, field, type = "text", options, disabled = false, onSave, displayValue,
}: EditableRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(field, draft);
      setEditing(false);
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => { setDraft(value); setError(null); setEditing(false); };

  const shown = displayValue ?? value;

  return (
    <div className="py-3 border-b border-white/5 last:border-b-0">
      <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{label}</p>
      {editing ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-stretch gap-2">
            {type === "textarea" ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") cancel(); }}
                autoFocus
                rows={3}
                className="flex-1 bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/30 resize-y"
              />
            ) : type === "select" ? (
              <select
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
                className="flex-1 bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/30"
              >
                <option value="">Not set</option>
                {options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={type}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") cancel();
                }}
                autoFocus
                className="flex-1 bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/30"
              />
            )}
            <button
              onClick={commit}
              disabled={saving}
              className="px-3 text-[11px] font-medium bg-white text-black rounded-md hover:bg-white/90 disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <Spinner size={12} /> : "Save"}
            </button>
            <button
              onClick={cancel}
              disabled={saving}
              className="px-3 text-[11px] text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-white/90 min-w-0 break-words flex-1">
            {shown ? shown : <span className="italic text-white/40">Not set</span>}
          </p>
          {!disabled && (
            <button
              onClick={() => { setDraft(value); setEditing(true); }}
              className="px-2 py-1 text-[10px] text-white/60 hover:text-white border border-white/10 hover:border-white/25 rounded-md transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add `ConnectedItemRow`**

Supports primary pill / make-primary inline action, confirm-on-remove, optional verification dot, optional custom icon.

```tsx
interface ConnectedItemRowProps {
  icon: React.ReactNode;            // small circular icon content
  iconBg?: string;                  // optional gradient / color class for icon bg
  primary: string;                  // main label (e.g., email address, wallet short)
  secondary?: string;               // sub-label (e.g., full wallet, "Verified", "Unverified")
  isPrimary?: boolean;
  verified?: boolean;
  showVerification?: boolean;       // render the "Verified"/"Unverified" badge row
  onMakePrimary?: () => void;
  onRemove?: () => void;
}

function ConnectedItemRow({
  icon, iconBg = "bg-white/10", primary, secondary, isPrimary,
  verified, showVerification, onMakePrimary, onRemove,
}: ConnectedItemRowProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={`group flex items-center gap-3 py-3 border-b border-white/5 last:border-b-0 ${confirming ? "bg-red-500/10 -mx-2 px-2 rounded-md" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 truncate">{primary}</p>
        {(secondary || showVerification) && (
          <div className="flex items-center gap-2 mt-0.5">
            {showVerification && (
              <span className="flex items-center gap-1 text-[11px]">
                <span className={`w-1.5 h-1.5 rounded-full ${verified ? "bg-green-400" : "bg-amber-400"}`} />
                <span className={verified ? "text-green-400" : "text-amber-400"}>
                  {verified ? "Verified" : "Unverified"}
                </span>
              </span>
            )}
            {secondary && <span className="text-[11px] text-white/50 truncate">{secondary}</span>}
          </div>
        )}
      </div>

      {confirming ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { onRemove?.(); setConfirming(false); }}
            className="px-2 py-1 text-[11px] bg-red-500 text-white rounded-md hover:bg-red-400"
          >
            Remove
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-2 py-1 text-[11px] text-white/60 hover:text-white"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {isPrimary ? (
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-green-500/20 text-green-400 rounded-full">
              Primary
            </span>
          ) : (
            onMakePrimary && (
              <button
                onClick={onMakePrimary}
                className="text-[11px] text-white/60 hover:text-white"
              >
                Make primary
              </button>
            )
          )}
          {onRemove && !isPrimary && (
            <button
              onClick={() => setConfirming(true)}
              aria-label="Remove"
              className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 3L3 9M3 3l6 6" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Build**

Run: `npx nx build website`
Expected: build succeeds (primitives are defined but not yet used anywhere outside the file — they should still compile).

- [ ] **Step 6: Commit**

```bash
git add apps/website/src/components/passport/SettingsModal.tsx
git commit -m "feat(website/passport): add EditableRow + ConnectedItemRow primitives"
```

---

## Task 3: Profile section

**Purpose:** Render the 8 personal fields (Nickname, First/Middle/Last, Bio, DOB, Gender, Body type) using `EditableRow`. Save via `useProfile().updateProfile` — identical to today's drawer.

**Files:**
- Modify: `apps/website/src/components/passport/SettingsModal.tsx`

- [ ] **Step 1: Add imports at the top of the file**

```tsx
import { useAuth, useProfile, useMutationApi, useQueryApi } from "@zo/auth";
import { useMyNfts } from "../../hooks/useMyNfts";
import useInstagramConnect from "../../hooks/useInstagramConnect";
```

- [ ] **Step 2: Add the `ProfileSection` component above the `SettingsModal` export**

```tsx
function ProfileSection() {
  const { profile, updateProfile, refetchProfile } = useProfile();

  const handleSave = useCallback(async (field: string, value: string) => {
    await new Promise<void>((resolve, reject) => {
      updateProfile(
        { data: { [field]: value } },
        {
          onSuccess: () => { refetchProfile(); resolve(); },
          onError: (err: unknown) => reject(err),
        }
      );
    });
  }, [updateProfile, refetchProfile]);

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "non-binary", label: "Non-binary" },
    { value: "other", label: "Other" },
  ];
  const bodyTypeOptions = [
    { value: "bro", label: "Bro" },
    { value: "bae", label: "Bae" },
    { value: "they", label: "They" },
  ];

  const genderLabel = genderOptions.find((o) => o.value === profile?.gender)?.label || "";
  const bodyLabel = bodyTypeOptions.find((o) => o.value === profile?.body_type)?.label || "";

  return (
    <section>
      <SectionHeader title="Profile" />
      <EditableRow label="Nickname" value={profile?.custom_nickname || ""} field="custom_nickname" onSave={handleSave} />
      <EditableRow label="First name" value={profile?.first_name || ""} field="first_name" onSave={handleSave} />
      <EditableRow label="Middle name" value={profile?.middle_name || ""} field="middle_name" onSave={handleSave} />
      <EditableRow label="Last name" value={profile?.last_name || ""} field="last_name" onSave={handleSave} />
      <EditableRow label="Bio" value={profile?.bio || ""} field="bio" type="textarea" onSave={handleSave} />
      <EditableRow label="Date of birth" value={profile?.date_of_birth || ""} field="date_of_birth" type="date" onSave={handleSave} />
      <EditableRow label="Gender" value={profile?.gender || ""} field="gender" type="select" options={genderOptions} displayValue={genderLabel} onSave={handleSave} />
      <EditableRow label="Body type" value={profile?.body_type || ""} field="body_type" type="select" options={bodyTypeOptions} displayValue={bodyLabel} onSave={handleSave} />
    </section>
  );
}
```

- [ ] **Step 3: Render `<ProfileSection />` in the modal body**

Replace the placeholder `<p className="text-sm text-white/40">Sections go here.</p>` inside the scroll body with `<ProfileSection />`.

- [ ] **Step 4: Build**

Run: `npx nx build website`
Expected: build succeeds.

- [ ] **Step 5: Browser check**

On `localhost:4202/passport`:
- Open the modal. "PROFILE" label shows at the top.
- Every row renders with its current value (or "Not set" in italic grey).
- Click `Edit` on Nickname → input appears, change value, `Enter` or `Save` → row updates.
- `Esc` cancels edit. `Cancel` button cancels.
- Try Bio (textarea should grow), DOB (native date picker), Gender + Body type (dropdowns).
- No console errors. Reload and confirm values persisted.

- [ ] **Step 6: Commit**

```bash
git add apps/website/src/components/passport/SettingsModal.tsx
git commit -m "feat(website/passport): Profile section in SettingsModal"
```

---

## Task 4: Location section (with nationality editable via `CAS_COUNTRIES`)

**Purpose:** Render Hometown / Nationality / Address / Pincode. Nationality becomes editable — pull options from `useQueryApi("CAS_COUNTRIES")`. Pin the save shape by inspecting live response the first time the modal opens.

**Files:**
- Modify: `apps/website/src/components/passport/SettingsModal.tsx`

- [ ] **Step 1: Pin the `CAS_COUNTRIES` response + save shape (do NOT skip)**

This step is a hard gate. Do not write Step 2 code until you have real answers for all three questions below. The current drawer keeps `country` `disabled` for a reason (no one pinned it), and guessing here will produce a silent 400 on save.

Procedure:

1. Open the passport page on the running dev server (`localhost:4202/passport`) while logged in.
2. In the browser devtools Network tab, filter for `countries`. If no call has been made yet, paste this in the console:

   ```ts
   fetch("/api/v1/cas/countries/", { credentials: "include" }).then((r) => r.json()).then(console.log);
   ```

   Write down the shape of **one** country entry. Look for the primary id field — usually `id`, `iso_code`, `code`, or `slug`.

3. In the console, inspect `profile.country` from the React tree (or log it from a temporary `console.log` in `ProfileSection`). Note the shape — likely `{ id, name, iso_code }` or similar.

4. Try the save, from the console or a temporary test button:

   ```ts
   // Replace <VALUE> with id, then iso_code, then name if earlier ones 400
   updateProfile({ data: { country: "<VALUE>" } }, { onSuccess: (d) => console.log("ok", d), onError: (e) => console.log("err", e) });
   ```

   Keep trying until one value succeeds **and** reloading the page shows the new country. That is the save shape.

Record the three answers in a scratch note — you'll need them in Step 2:

1. `CAS_COUNTRIES` returns: each country has fields _______, primary id field is _______
2. `profile.country` shape today: _______
3. `USERS_ME_UPDATE` accepts `country` as: _______ (string id / iso code / full object / something else)

**If you cannot confirm the save shape in under 15 minutes:** stop and leave Nationality read-only (pass `disabled` to `EditableRow`, keep the display label). Raise this as a ticket for the backend/auth team. Do not ship a silently-broken editor.

- [ ] **Step 2: Add `LocationSection`**

Assuming the response contains a list of `{ id, name }` (adjust keys to match what you found in step 1):

```tsx
function LocationSection() {
  const { isLoggedIn } = useAuth();
  const { profile, updateProfile, refetchProfile } = useProfile();
  const { data: countriesData } = useQueryApi(
    "CAS_COUNTRIES",
    { enabled: isLoggedIn === true },
    "",
    ""
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countries: any[] = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (countriesData as any)?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.results)) return raw.results;
    if (Array.isArray(raw?.countries)) return raw.countries;
    return [];
  }, [countriesData]);

  const countryOptions = useMemo(
    () =>
      countries
        // Adjust keys here based on real shape discovered in Step 1
        .map((c) => ({ value: String(c.id ?? c.iso_code ?? c.code), label: c.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [countries]
  );

  const currentCountryValue = profile?.country
    ? String(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile.country as any).id ?? (profile.country as any).iso_code ?? (profile.country as any).code ?? ""
      )
    : "";
  const currentCountryLabel = profile?.country?.name || "";

  const handleSave = useCallback(async (field: string, value: string) => {
    await new Promise<void>((resolve, reject) => {
      updateProfile(
        { data: { [field]: value } },
        {
          onSuccess: () => { refetchProfile(); resolve(); },
          onError: (err: unknown) => reject(err),
        }
      );
    });
  }, [updateProfile, refetchProfile]);

  return (
    <section>
      <SectionHeader title="Location" />
      <EditableRow label="Hometown" value={profile?.place_name || ""} field="place_name" onSave={handleSave} />
      <EditableRow
        label="Nationality"
        value={currentCountryValue}
        displayValue={currentCountryLabel}
        field="country"
        type="select"
        options={countryOptions}
        onSave={handleSave}
      />
      <EditableRow label="Address" value={profile?.address || ""} field="address" type="textarea" onSave={handleSave} />
      <EditableRow label="Pincode" value={profile?.pincode || ""} field="pincode" onSave={handleSave} />
    </section>
  );
}
```

- [ ] **Step 3: Render `<LocationSection />` after `<ProfileSection />`**

- [ ] **Step 4: Build**

Run: `npx nx build website`
Expected: build succeeds.

- [ ] **Step 5: Browser check**

- Hometown / Address / Pincode edit like Profile fields.
- Nationality dropdown lists countries. Change country → Save → reload page → new country persists. If save errors, re-check the `country` payload shape from Step 1.

- [ ] **Step 6: Commit**

```bash
git add apps/website/src/components/passport/SettingsModal.tsx
git commit -m "feat(website/passport): Location section with editable nationality"
```

---

## Task 5: Cultures section

**Purpose:** Port the existing picker from `SettingsDrawer.tsx:652` — same behavior, stripped of `dash-*` tokens.

**Files:**
- Modify: `apps/website/src/components/passport/SettingsModal.tsx`

- [ ] **Step 1: Add `CulturesSection` (ported from drawer, restyled)**

```tsx
function CulturesSection() {
  const { isLoggedIn } = useAuth();
  const { profile, updateProfile, refetchProfile } = useProfile();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cultures: any[] = profile?.cultures || [];
  const selectedKeys = useMemo(() => new Set(cultures.map((c) => c.key)), [cultures]);

  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const searchQuery = search.trim() ? `search=${encodeURIComponent(search.trim())}` : "";
  const { data: allCulturesData, isLoading } = useQueryApi(
    "CAS_CULTURES",
    { enabled: isLoggedIn === true && picking },
    "",
    searchQuery
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const available: any[] = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (allCulturesData as any)?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.results)) return raw.results;
    if (Array.isArray(raw?.cultures)) return raw.cultures;
    return [];
  }, [allCulturesData]);

  const saveCultures = (nextKeys: string[]) => {
    setSaving(true);
    updateProfile(
      { data: { cultures: nextKeys } },
      {
        onSuccess: () => { refetchProfile(); setSaving(false); },
        onError: () => setSaving(false),
      }
    );
  };

  const handleRemove = (key: string) => {
    saveCultures(cultures.filter((c) => c.key !== key).map((c) => c.key));
  };

  const handleToggle = (key: string) => {
    if (selectedKeys.has(key)) {
      saveCultures(Array.from(selectedKeys).filter((k) => k !== key));
    } else {
      saveCultures([...Array.from(selectedKeys), key]);
    }
  };

  const pillSelected =
    "flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/10 border-white/30 text-white";
  const pillIdle =
    "flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/5 border-white/10 hover:border-white/25 text-white/80";

  return (
    <section>
      <SectionHeader title="Cultures" right={saving ? <Spinner size={12} /> : null} />

      {cultures.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {cultures.map((c) => (
            <div key={c.key} className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
              {c.icon && <img src={fixAvatarUrl(c.icon)} alt={c.name} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />}
              <span className="text-xs text-white/90">{c.name}</span>
              <button
                onClick={() => handleRemove(c.key)}
                aria-label={`Remove ${c.name}`}
                className="w-4 h-4 flex items-center justify-center rounded-full text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors md:opacity-0 md:group-hover:opacity-100 opacity-100"
              >
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <path d="M6.5 1.5L1.5 6.5M1.5 1.5L6.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/40 italic">No cultures selected yet — tap + to add</p>
      )}

      {!picking ? (
        <button
          onClick={() => setPicking(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white border border-dashed border-white/15 hover:border-white/30 rounded-md transition-colors"
        >
          <span>+</span> Add cultures
        </button>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cultures..."
            className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/40"
          />
          <div className="max-h-[240px] overflow-y-auto -mx-1 px-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner size={20} />
              </div>
            ) : available.length === 0 ? (
              <p className="text-xs text-white/40 italic text-center py-4">
                {search ? "No cultures found" : "No cultures available"}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {available.map((c) => {
                  const isSelected = selectedKeys.has(c.key);
                  return (
                    <button
                      key={c.key}
                      onClick={() => handleToggle(c.key)}
                      disabled={saving}
                      className={`${isSelected ? pillSelected : pillIdle} transition-colors disabled:opacity-50`}
                    >
                      {c.icon && <img src={fixAvatarUrl(c.icon)} alt="" className="w-4 h-4 object-contain flex-shrink-0" referrerPolicy="no-referrer" />}
                      <span className="text-xs whitespace-nowrap">{c.name}</span>
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            onClick={() => { setPicking(false); setSearch(""); }}
            className="w-full px-3 py-2 text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/25 rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Render `<CulturesSection />` after `<LocationSection />`**

- [ ] **Step 3: Build**

Run: `npx nx build website`
Expected: build succeeds.

- [ ] **Step 4: Browser check**

- Currently-selected cultures render as pills.
- "+ Add cultures" opens the picker. Type to search. Toggle pills — selected state updates, saves persist on reload.
- No `dash-*` classes remain in the Cultures section (grep the file: `grep 'dash-' apps/website/src/components/passport/SettingsModal.tsx` → should return nothing from Cultures code).

- [ ] **Step 5: Commit**

```bash
git add apps/website/src/components/passport/SettingsModal.tsx
git commit -m "feat(website/passport): Cultures picker in SettingsModal"
```

---

## Task 6: Wallets section (list, set-primary, remove — no add)

**Purpose:** Render the connected wallets list using `ConnectedItemRow`. No `+ Add wallet` button (spec decision — no create endpoint).

**Files:**
- Modify: `apps/website/src/components/passport/SettingsModal.tsx`

- [ ] **Step 1: Add `WalletsSection`**

```tsx
function WalletsSection() {
  const { isLoggedIn } = useAuth();
  const { refetchProfile } = useProfile();
  const { data: userWallets, isLoading, refetch } = useQueryApi(
    "AUTH_USER_WEB3_WALLETS", { enabled: isLoggedIn === true }, "", ""
  );
  const { mutate: updateWallet } = useMutationApi("AUTH_USER_WEB3_WALLETS", {}, "", "PUT");
  const { mutate: deleteWallet } = useMutationApi("AUTH_USER_WEB3_WALLETS", {}, "", "DELETE");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wallets: any[] = (userWallets as any)?.data?.web3_wallets || [];

  const setPrimary = (addr: string) => {
    updateWallet(
      { data: { wallet_address: addr, primary: true } },
      { onSuccess: () => { refetch(); refetchProfile(); } }
    );
  };
  const remove = (addr: string) => {
    deleteWallet(
      { data: { wallet_address: addr } },
      { onSuccess: () => { refetch(); refetchProfile(); } }
    );
  };

  return (
    <section>
      <SectionHeader title="Wallets" />
      {isLoading ? (
        <div className="flex items-center justify-center py-4"><Spinner size={20} /></div>
      ) : wallets.length === 0 ? (
        <p className="text-sm text-white/40 italic py-2">No wallets connected</p>
      ) : (
        wallets.map((w) => (
          <ConnectedItemRow
            key={w.wallet_address}
            icon="W"
            primary={formatAddress(w.wallet_address)}
            secondary={w.wallet_address}
            isPrimary={!!w.primary}
            onMakePrimary={() => setPrimary(w.wallet_address)}
            onRemove={() => remove(w.wallet_address)}
          />
        ))
      )}
    </section>
  );
}
```

- [ ] **Step 2: Render `<WalletsSection />` after `<CulturesSection />`**

- [ ] **Step 3: Build**

Run: `npx nx build website`
Expected: build succeeds.

- [ ] **Step 4: Browser check**

- Wallets list renders. Primary wallet shows green "Primary" pill, no `✕` button.
- Non-primary wallets show "Make primary" inline link and `✕` on hover (mobile: always visible).
- Click `✕` → row turns red with "Remove" / "Cancel" → "Cancel" restores, "Remove" deletes.
- Click "Make primary" → it becomes primary, old primary now has "Make primary" / `✕` visible.

- [ ] **Step 5: Commit**

```bash
git add apps/website/src/components/passport/SettingsModal.tsx
git commit -m "feat(website/passport): Wallets section in SettingsModal"
```

---

## Task 7: Emails section (list + add)

**Purpose:** Emails list with add form at the bottom (the one connected-item category that has a create endpoint, `AUTH_USER_EMAIL_CREATE`).

**Files:**
- Modify: `apps/website/src/components/passport/SettingsModal.tsx`

- [ ] **Step 1: Add `EmailsSection`**

```tsx
function EmailsSection() {
  const { isLoggedIn } = useAuth();
  const { refetchProfile } = useProfile();
  const { data: userEmails, isLoading, refetch } = useQueryApi(
    "AUTH_USER_EMAILS", { enabled: isLoggedIn === true }, "", ""
  );
  const { mutate: updateEmail } = useMutationApi("AUTH_USER_EMAILS", {}, "", "PUT");
  const { mutate: deleteEmail } = useMutationApi("AUTH_USER_EMAILS", {}, "", "DELETE");
  const { mutate: createEmail } = useMutationApi("AUTH_USER_EMAIL_CREATE");

  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emails: any[] = (userEmails as any)?.data?.emails || [];

  const setPrimary = (addr: string) => {
    updateEmail(
      { data: { email_address: addr, primary: true } },
      { onSuccess: () => { refetch(); refetchProfile(); } }
    );
  };
  const remove = (addr: string) => {
    deleteEmail(
      { data: { email_address: addr } },
      { onSuccess: () => { refetch(); refetchProfile(); } }
    );
  };
  const add = () => {
    if (!newEmail || !newEmail.includes("@")) { setAddError("Enter a valid email"); return; }
    setAddLoading(true);
    createEmail(
      { data: { email_address: newEmail } },
      {
        onSuccess: () => { refetch(); setAdding(false); setNewEmail(""); setAddError(""); setAddLoading(false); },
        onError: () => { setAddError("Failed to add email"); setAddLoading(false); },
      }
    );
  };

  return (
    <section>
      <SectionHeader title="Emails" />
      {isLoading ? (
        <div className="flex items-center justify-center py-4"><Spinner size={20} /></div>
      ) : emails.length === 0 ? (
        <p className="text-sm text-white/40 italic py-2">No emails connected</p>
      ) : (
        emails.map((e) => (
          <ConnectedItemRow
            key={e.email_address}
            icon="@"
            primary={e.email_address}
            showVerification
            verified={!!e.verified}
            isPrimary={!!e.primary}
            onMakePrimary={() => setPrimary(e.email_address)}
            onRemove={() => remove(e.email_address)}
          />
        ))
      )}

      {adding ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-stretch gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); setAddError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") { setAdding(false); setNewEmail(""); setAddError(""); } }}
              placeholder="email@example.com"
              autoFocus
              className="flex-1 bg-white/5 border border-white/15 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/40"
            />
            <button
              onClick={add}
              disabled={addLoading}
              className="px-3 text-[11px] bg-white text-black rounded-md hover:bg-white/90 disabled:opacity-60 flex items-center gap-2"
            >
              {addLoading ? <Spinner size={12} /> : "Add"}
            </button>
            <button
              onClick={() => { setAdding(false); setNewEmail(""); setAddError(""); }}
              className="px-3 text-[11px] text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </div>
          {addError && <p className="text-[11px] text-red-400">{addError}</p>}
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white border border-dashed border-white/15 hover:border-white/30 rounded-md transition-colors"
        >
          <span>+</span> Add email
        </button>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Render `<EmailsSection />` after `<WalletsSection />`**

- [ ] **Step 3: Build**

Run: `npx nx build website`
Expected: build succeeds.

- [ ] **Step 4: Browser check**

- Emails list with `Verified` (green dot) / `Unverified` (amber dot) state.
- `Make primary` / `✕` work.
- `+ Add email` expands inline form, submit, new email appears in list.
- Invalid email shows red error.

- [ ] **Step 5: Commit**

```bash
git add apps/website/src/components/passport/SettingsModal.tsx
git commit -m "feat(website/passport): Emails section with add flow"
```

---

## Task 8: Phones section (list, set-primary, remove — no add)

**Purpose:** Phones list with same row pattern. No add button.

**Files:**
- Modify: `apps/website/src/components/passport/SettingsModal.tsx`

- [ ] **Step 1: Add `PhonesSection`**

```tsx
function PhonesSection() {
  const { isLoggedIn } = useAuth();
  const { refetchProfile } = useProfile();
  const { data: userMobiles, isLoading, refetch } = useQueryApi(
    "AUTH_USER_MOBILES", { enabled: isLoggedIn === true }, "", ""
  );
  const { mutate: updateMobile } = useMutationApi("AUTH_USER_MOBILES", {}, "", "PUT");
  const { mutate: deleteMobile } = useMutationApi("AUTH_USER_MOBILES", {}, "", "DELETE");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mobiles: any[] = (userMobiles as any)?.data?.mobiles || [];

  const setPrimary = (number: string, code: string) => {
    updateMobile(
      { data: { mobile_number: number, mobile_country_code: code, primary: true } },
      { onSuccess: () => { refetch(); refetchProfile(); } }
    );
  };
  const remove = (number: string, code: string) => {
    deleteMobile(
      { data: { mobile_number: number, mobile_country_code: code } },
      { onSuccess: () => { refetch(); refetchProfile(); } }
    );
  };

  return (
    <section>
      <SectionHeader title="Phones" />
      {isLoading ? (
        <div className="flex items-center justify-center py-4"><Spinner size={20} /></div>
      ) : mobiles.length === 0 ? (
        <p className="text-sm text-white/40 italic py-2">No phone numbers connected</p>
      ) : (
        mobiles.map((m) => (
          <ConnectedItemRow
            key={`${m.mobile_country_code}-${m.mobile_number}`}
            icon="#"
            primary={`+${m.mobile_country_code} ${m.mobile_number}`}
            showVerification
            verified={!!m.verified}
            isPrimary={!!m.primary}
            onMakePrimary={() => setPrimary(m.mobile_number, m.mobile_country_code)}
            onRemove={() => remove(m.mobile_number, m.mobile_country_code)}
          />
        ))
      )}
    </section>
  );
}
```

- [ ] **Step 2: Render `<PhonesSection />` after `<EmailsSection />`**

- [ ] **Step 3: Build**

Run: `npx nx build website`
Expected: build succeeds.

- [ ] **Step 4: Browser check**

- Phones list + verification badges.
- Make primary / remove behave identically to emails (minus the add button).

- [ ] **Step 5: Commit**

```bash
git add apps/website/src/components/passport/SettingsModal.tsx
git commit -m "feat(website/passport): Phones section in SettingsModal"
```

---

## Task 9: Socials section (Instagram editable + ENS/Twitter/Telegram/Discord read-only)

**Purpose:** One `ConnectedItemRow` per social. Instagram is the only one with a connect/disconnect action; the others render when present, with verified dot if applicable.

**Files:**
- Modify: `apps/website/src/components/passport/SettingsModal.tsx`

- [ ] **Step 1: Add `SocialsSection`**

```tsx
function SocialsSection() {
  const { profile } = useProfile();
  const { isConnected: igConnected, account: igAccount, connect: connectIg, disconnect: disconnectIg } = useInstagramConnect();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const otherSocials = useMemo(() => {
    if (!profile?.socials) return [] as { category: string; link: string; verified: boolean; handle: string }[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (profile.socials as any[])
      .filter((s) => s.category !== "instagram")
      .map((s) => ({
        category: s.category as string,
        link: s.link as string,
        verified: !!s.verified,
        handle:
          s.category === "twitter" ? s.link?.split(".com/")[1]
          : s.category === "telegram" ? s.link?.split(".me/")[1]
          : s.category === "discord" ? "Connected"
          : s.link,
      }));
  }, [profile?.socials]);

  const ens = profile?.ens_nickname;
  const iconMap: Record<string, string> = { twitter: "X", telegram: "TG", discord: "DC" };
  const labelMap: Record<string, string> = { twitter: "Twitter", telegram: "Telegram", discord: "Discord" };

  // Instagram "disconnect" is a single-action (no primary concept), so we render a custom
  // row here rather than using ConnectedItemRow's confirm-on-remove flow.
  const instagramRow = igConnected && igAccount ? (
    <div className="flex items-center gap-3 py-3 border-b border-white/5">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)" }}
      >
        IG
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 truncate">@{igAccount.ig_username}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-green-400">Verified</span>
          </span>
          <span className="text-[11px] text-white/50">Instagram</span>
        </div>
      </div>
      <button
        onClick={disconnectIg}
        className="text-[11px] text-red-400 hover:text-red-300"
      >
        Disconnect
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-3 py-3 border-b border-white/5">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)" }}
      >
        IG
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90">Instagram</p>
        <p className="text-[11px] text-white/50">Not connected</p>
      </div>
      <button
        onClick={connectIg}
        className="px-3 py-1.5 text-[11px] font-semibold text-white rounded-md hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)" }}
      >
        Connect
      </button>
    </div>
  );

  return (
    <section>
      <SectionHeader title="Socials" />

      {ens && (
        <ConnectedItemRow icon="ENS" primary={ens} />
      )}

      {instagramRow}

      {otherSocials.map((s) => (
        <ConnectedItemRow
          key={s.category}
          icon={iconMap[s.category] || s.category.charAt(0).toUpperCase()}
          primary={s.handle || s.link}
          secondary={labelMap[s.category] || s.category}
          verified={s.verified}
          showVerification={s.verified}
        />
      ))}

      {!ens && !igConnected && otherSocials.length === 0 && (
        <p className="text-sm text-white/40 italic py-2">No socials connected yet</p>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Render `<SocialsSection />` after `<PhonesSection />`**

- [ ] **Step 3: Build**

Run: `npx nx build website`
Expected: build succeeds.

- [ ] **Step 4: Browser check**

- Instagram row: `Connect` gradient button when disconnected; handle + `Disconnect ✕` when connected.
- ENS / Twitter / Telegram / Discord rows appear if you have them; clean read-only.
- If nothing is connected, empty-state line shows.

- [ ] **Step 5: Commit**

```bash
git add apps/website/src/components/passport/SettingsModal.tsx
git commit -m "feat(website/passport): Socials section in SettingsModal"
```

---

## Task 10: Founder NFTs section

**Purpose:** Read-only grid of founder NFTs. Hidden if user has none.

**Files:**
- Modify: `apps/website/src/components/passport/SettingsModal.tsx`

- [ ] **Step 1: Add `FounderNftsSection`**

```tsx
function FounderNftsSection() {
  const { nfts, isLoading } = useMyNfts();
  if (isLoading) {
    return (
      <section>
        <SectionHeader title="Founder NFTs" />
        <div className="flex items-center justify-center py-8"><Spinner size={24} /></div>
      </section>
    );
  }
  if (!nfts || nfts.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Founder NFTs" right={<span className="text-[11px] text-white/40">{nfts.length}</span>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {nfts.map((nft) => (
          <div key={nft.token_ref_id} className="relative rounded-lg overflow-hidden border border-white/10">
            <img src={nft.image_url} alt={nft.name} className="w-full aspect-square object-cover block" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
              <p className="text-[10px] text-white/90 truncate">{nft.name}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Render `<FounderNftsSection />` after `<SocialsSection />`**

- [ ] **Step 3: Build**

Run: `npx nx build website`
Expected: build succeeds.

- [ ] **Step 4: Browser check**

- If test user has founder NFTs, grid renders. If not, section is absent.

- [ ] **Step 5: Commit**

```bash
git add apps/website/src/components/passport/SettingsModal.tsx
git commit -m "feat(website/passport): Founder NFTs section in SettingsModal"
```

---

## Task 11: Compact profile strip in the modal header

**Purpose:** Show the avatar + nickname + Founder badge + membership tier right under the header bar, as an identity cue. Not editable here.

**Files:**
- Modify: `apps/website/src/components/passport/SettingsModal.tsx`

- [ ] **Step 1: Add `ProfileStrip`**

```tsx
function ProfileStrip() {
  const { profile } = useProfile();
  const [imgError, setImgError] = useState(false);

  const rawAvatar = profile?.avatar?.image || profile?.pfp_image;
  const avatar = fixAvatarUrl(rawAvatar && rawAvatar.length > 0 ? rawAvatar : undefined);
  const name = profile?.nickname || profile?.custom_nickname || "Citizen";
  const membership = profile?.membership;
  const isFounder =
    membership?.toLowerCase() === "founder" ||
    profile?.role === "Founder" ||
    (profile?.founder_nfts_count ?? 0) > 0;

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 flex-shrink-0">
      <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
        {avatar && !imgError ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
            <span className="text-base font-bold text-white">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white truncate">{name}</p>
          {isFounder && (
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-white/15 text-white border border-white/20 rounded-full flex-shrink-0">
              Founder
            </span>
          )}
        </div>
        <p className="text-[11px] text-white/50 capitalize">{membership || "Citizen"} of Zo World</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Render `<ProfileStrip />` between the header and the scroll body**

In the modal JSX, insert `<ProfileStrip />` directly below the `</div>` that closes the sticky header, before the `<div className="flex-1 overflow-y-auto px-5 py-4">` scroll body.

- [ ] **Step 3: Build**

Run: `npx nx build website`
Expected: build succeeds.

- [ ] **Step 4: Browser check**

- Strip shows avatar + name + Founder badge (if applicable) + membership text.
- Strip does not scroll with the body (it sits under the sticky header, also outside scroll).

- [ ] **Step 5: Commit**

```bash
git add apps/website/src/components/passport/SettingsModal.tsx
git commit -m "feat(website/passport): compact profile strip in SettingsModal"
```

---

## Task 12: Focus trap + final cleanup + delete old drawer

**Purpose:** Finish accessibility, verify no `dash-*` leakage, delete the old drawer file. This is the terminal task.

**Files:**
- Modify: `apps/website/src/components/passport/SettingsModal.tsx`
- (Optional) Modify: `apps/website/package.json`
- Delete: `apps/website/src/components/passport/SettingsDrawer.tsx`

- [ ] **Step 1: Decide focus-trap approach**

Check if the codebase already has something:

```bash
grep -r "focus-trap" apps/website libs
```

If nothing is there, pick one:
- **Option A (recommended):** `npm install focus-trap-react --workspace=apps/website` then wrap the modal container with `<FocusTrap active={isOpen}>`.
- **Option B:** Skip for this iteration and open a follow-up ticket. Still set `autoFocus` on the close button so initial focus lands somewhere inside the modal.

Pick Option B if adding a dependency is out of scope for this session — it's a small gap and the Esc-close + scrim-close already handle the 80% case.

- [ ] **Step 2: If Option A: wrap the modal**

`focus-trap-react` requires its child to be a single element that accepts a ref. `GlowCard` is a plain function component without `forwardRef`, so wrap `GlowCard` in an extra `<div>` (which accepts refs natively) instead of targeting `GlowCard` directly. Move the `relative w-full max-w-[640px]` sizing to the wrapping div to keep the visual identical.

```tsx
// At top of file:
import FocusTrap from "focus-trap-react";

// In the return, replace the <GlowCard className="relative w-full max-w-[640px] ..."> block with:
<FocusTrap
  active={isOpen}
  focusTrapOptions={{
    escapeDeactivates: false,   // we handle Esc ourselves
    allowOutsideClick: true,    // scrim-click close still works
    returnFocusOnDeactivate: true,
  }}
>
  <div className="relative w-full max-w-[640px] h-[100dvh] sm:h-auto sm:max-h-[85vh]">
    <GlowCard className="w-full h-full sm:rounded-[24px] rounded-none flex flex-col overflow-hidden">
      {/* existing header, profile strip, scroll body */}
    </GlowCard>
  </div>
</FocusTrap>
```

`focus-trap-react` restores focus to the previously focused element (the Settings button on the passport card) on deactivate — no manual ref bookkeeping required.

- [ ] **Step 3: If Option B: add initial focus hint**

Add `autoFocus` to the close button in the header. Document the missing focus trap in a code comment at the top of `SettingsModal.tsx`:

```tsx
// NOTE: Full focus trap is tracked as a follow-up. Esc-close + scrim-close
// are wired. Initial focus is on the close button.
```

- [ ] **Step 4: Verify zero `dash-*` tokens**

Run: `grep -n 'dash-' apps/website/src/components/passport/SettingsModal.tsx`
Expected: no output.

If anything matches, replace with plain Tailwind utilities and re-grep.

- [ ] **Step 5: Verify no import of the old drawer remains**

```bash
grep -rn "SettingsDrawer" apps/website libs
```

Expected: no matches anywhere under `apps/website/` or `libs/`. (Matches inside `apps/dashboard/` are fine and out of scope.)

- [ ] **Step 6: Delete the old drawer file**

```bash
rm apps/website/src/components/passport/SettingsDrawer.tsx
```

- [ ] **Step 7: Build the full website app**

Run: `npx nx build website`
Expected: build succeeds.

- [ ] **Step 8: End-to-end browser check**

On `localhost:4202/passport`, run through the full acceptance list:

- Open the modal — opens centered, GlowCard look, scrim dims page.
- Mobile viewport (`⌘⇧M`, iPhone 14 preset) — modal is full-screen, no horizontal scroll.
- Profile strip shows avatar + name + Founder badge (if applicable).
- Scroll the body — header + profile strip stay fixed.
- Every Profile and Location field edits inline (including Nationality).
- Cultures picker search + toggle works.
- Wallets: make primary, remove (with confirm inline), list updates.
- Emails: make primary, remove, add new — full cycle.
- Phones: make primary, remove.
- Socials: Instagram connect/disconnect flows; ENS/Twitter/Telegram/Discord render if present.
- NFTs grid renders if user has founder NFTs (else absent).
- `Esc`, scrim click, and `✕` all close the modal.
- After close, focus returns to the passport card's Settings button (Option A) or at minimum nothing throws.
- No console errors at any step.

- [ ] **Step 9: Final commit**

```bash
# stages: new SettingsModal.tsx, deleted SettingsDrawer.tsx, updated index.ts, updated pages/passport.tsx
git add apps/website/src/components/passport/ apps/website/src/pages/passport.tsx
# only if Option A (focus-trap-react) was picked:
# git add apps/website/package.json package-lock.json
git commit -m "feat(website/passport): replace SettingsDrawer with SettingsModal

- Center glass-morphism modal using GlowCard shell
- Unified EditableRow / ConnectedItemRow primitives, no zud dash-* tokens
- Every profile + location field editable inline (nationality now wired via CAS_COUNTRIES)
- Wallet/email/phone/Instagram rows use inline actions instead of dropdown menus
- Add flow only where backend supports it (emails)
- No backend, hook, or data-shape changes

Spec: docs/superpowers/specs/2026-04-11-passport-settings-modal-design.md"
```

---

## Success criteria (checked at end of Task 12)

- `apps/website/src/components/passport/SettingsDrawer.tsx` deleted; `SettingsModal.tsx` in its place.
- `grep 'dash-' apps/website/src/components/passport/SettingsModal.tsx` returns zero lines.
- `grep -rn 'SettingsDrawer' apps/website libs` returns zero lines.
- `npx nx build website` succeeds.
- Browser end-to-end check (Task 12 Step 8) passes without regressions.
- Modal opens centered on desktop, full-screen on mobile; scrim + Esc + ✕ all close.
- All edit / add / remove / make-primary / connect / disconnect paths work identically to the old drawer.
