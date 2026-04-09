---
title: zozozo.work Onboarding v2 — Design Spec
date: 2026-04-09
status: ready-for-implementation
supersedes: docs/superpowers/specs/2026-04-05-zozozo-onboarding-design.md
related:
  - docs/superpowers/plans/2026-04-09-zoauth-retro-tv-effect.md  # parallel visual treatment
  - docs/superpowers/plans/2026-04-06-zozozo-onboarding.md       # v1 plan, also superseded
---

# zozozo.work Onboarding v2 — Design Spec

## Summary

Replace the defunct web3 onboarding (ENS / PFP / wallet / socials — all commented out) with a hospitality-and-identity-focused 8-step flow that runs after OTP login on every zozozo.work session. Required for new users; resumable for returning users with partial profiles.

This spec **supersedes** `2026-04-05-zozozo-onboarding-design.md`, which described a 3-step flow (Nickname, Avatar, City). v1 was never implemented; we're not migrating anything, just expanding the design.

## Goal

Get every Zo World citizen to a complete, identity-rich profile before they reach the passport page, so:

- Passport pages render with real avatars, real cultures, real geography (not placeholders or empty states)
- Downstream features (dashboard lobby, "people in your city," cultural matchmaking, $Zo grants by interest, founder chemistry) have signal to work with
- Citizenship + hometown + birthday are captured at sign-up rather than via a settings drawer most users never open
- New users feel they "arrived somewhere" instead of being dropped into a blank app

## Non-goals

- 3D avatar pipeline (Phase 2 of dashboard avatar roadmap)
- Avatar trait editor / re-roll
- Onboarding rewards / $Zo airdrop (the `ONBOARDING_GRANTS` endpoint exists; wiring it is a follow-up)
- Removing wagmi/RainbowKit from `AuthProvider.tsx` (other features depend on them)
- Migrating existing users' stale `place_name` values
- Web3 wallet login (already removed from `Entry.tsx` in v1 spec)
- Email login UX changes (only the post-OTP gate changes)
- Body type "they" (Zo backend only supports `bro` / `bae`; revisit when backend adds the option)
- Onboarding analytics dashboard (Sentry/PostHog events are sufficient for v1)

## Reference implementations

- **`thezoworld/zo-zo`** (mobile, React Native / Expo) — the gold-standard onboarding flow we're porting from. Located at `/Users/samuraizan/samuraidojo/zo-world/zo-zo/`. Direct ports for Avatar, Whereabouts, and Hometown steps. Source files: `app/onboarding.tsx`, `components/helpers/login/{NameSection,AvatarSection,LocationPrompt,CityPrompt}.tsx`, `context/LocationContext.tsx`.
- **`docs/superpowers/specs/2026-04-05-zozozo-onboarding-design.md`** — v1 spec (3 steps). This v2 spec inherits its architectural decisions: queue-based progressive onboarding, `skipOnboarding` prop for PMS/Admin, modal auto-close guard, dead step deletion, Profile type extension, Welcome screen update.

## Scope of writes

**Two backends are in scope on zozozo.work, per the standing rule:**

1. **Zo API** (`api.io.zo.xyz`) — authenticated via Zo token, used for **all** onboarding writes
2. **Zostel API** (`api.zostel.com`) — authenticated via Zostel token (dual auth on zozozo.work), used for **reads only** by downstream pages (passport XP, stays history). **Onboarding never writes to Zostel**, because Zostel exposes no user-scoped write endpoints. Verified via probe of `libs/auth/src/endpoints/admin.ts`, `auth.ts`, `stay.ts` — every Zostel write endpoint is admin-scoped.

Supabase is **not in scope** for any onboarding write. This is a hard rule (see `feedback_zozozo_backends.md`).

## Backend verification — what we tested live

Before writing this spec, the following endpoints were tested with Samurai's user token (PID `GC2483Q2`) against the live Zo API. All confirmed working:

| Endpoint | Method | Verified shape | Notes |
|---|---|---|---|
| `/api/v1/profile/me/` | GET | Returns full profile object | 30+ fields including `cultures`, `country`, `body_type`, `avatar`, `place_name`, `home_location`, `date_of_birth` |
| `/api/v1/profile/me/` | POST | `{custom_nickname, body_type, country, cultures, place_name, place_ref_id, home_location, date_of_birth}` | All fields verified writable |
| `/api/v1/profile/custom-nickname/available/` | GET | `?nickname={x}.zo` → `{available: bool}` | Existing endpoint, used in v1 spec |
| `/api/v1/cas/cultures/` | GET | `?limit=50` → 27 cultures (id, key, name, icon) | The catalog of available cultures |
| `/api/v2/places/whereabouts/` | GET | Returns `{place_name, place_ref_id, location: {long, lat}, created_at, updated_at}` | Note: `long`, not `lng` |
| `/api/v2/places/whereabouts/` | POST | `{place_name, place_ref_id, location: {long, lat}}` | Used by zo-zo mobile, verified shape from existing record |

### Critical findings from verification

1. **`country_citizen` does not exist as a field.** The TypeScript type at `libs/definitions/auth/src/index.ts:26` lies. The actual field is `country` — an object on read (`{code, name, local_currency, flag, mobile_code}`) and a 3-letter ISO code string on write (`{country: "IND"}`). Object form on write returns 422.
2. **`cultures` is REPLACE semantics, not append.** POST `{cultures: ["business", "design"]}` overwrites the entire array, dropping any cultures not in the new list. This is the most dangerous gotcha in the flow — implementation must pre-fill returning users' existing cultures before allowing edits.
3. **`whereabouts.location.long` vs `home_location.lng`.** Same concept, different field names. The hometown POST uses `lng`; the whereabouts POST uses `long`. Easy bug source.
4. **`place_ref_id` is a Google Place ID.** Both whereabouts and hometown expect Google Places format. We need Google Places integration for full backend compatibility.
5. **27 cultures available** in the catalog (not 13/14/19 as earlier audits guessed). Includes culture-specific ones like `64xzo`, `pickleballxzo`, `pokerxzo`, `catanxzo`.

## Architecture

### Where it lives

`libs/auth/src/components/ZoAuth/` — the same shared library targeted by v1. Every monorepo app that imports `@zo/auth` gets the new flow for free. Apps that should bypass onboarding (PMS, admin) pass `skipOnboarding={true}` on `<AuthProvider>` (mechanism designed in v1 spec).

### Pattern

Queue-based progressive onboarding. After OTP success → `ONBOARDING_CHECK` step → fetch profile → compute queue of missing fields → push first missing step → user advances through queue → `WELCOME` → modal closes. Returning users with partial profiles see only the steps they're missing.

### Step type

```ts
type ZoAuthStep =
  | "ENTRY"
  | "MOBILE_LOGIN"
  | "EMAIL_LOGIN"
  | "ONBOARDING_CHECK"
  | "NICKNAME"      // step 1
  | "AVATAR"        // step 2 + 3 (body type select + image generation polling)
  | "WHEREABOUTS"   // step 4
  | "CITIZEN"       // step 5
  | "HOMETOWN"      // step 6 (was CITY in v1)
  | "BIRTHDAY"      // step 7
  | "CULTURES"      // step 8
  | "WELCOME";
```

`AVATAR` is one component with internal phase state (`select` → `generating` → `done`), not two steps. Matches zo-zo mobile.

### ZoAuth orchestrator changes

- `ONBOARDING_STEPS` array updated to include all new step names
- `onboardingQueue` state and `advanceOnboarding` helper unchanged from v1 — they already work for arbitrary queue lengths
- Auto-close guard, hide-back-button, hide-UserCollection logic — unchanged from v1, just covers more steps
- `OnboardingCheck` computes the queue from 8 field checks instead of 3

### Dual auth interaction

No changes. The Zostel auth handshake still happens before `ONBOARDING_CHECK` via the existing `MobileLogin.tsx` flow, gated on `apps/website/_app.tsx`'s `isZostelLoginRequired={ZOSTEL_ENABLED}` (true on zozozo.work because `ZOSTEL_APP_ID` env var is set). Onboarding never reads or writes Zostel; Zostel is consumed later by `/passport`.

### File inventory

**Modify:**
- `libs/auth/src/components/ZoAuth/ZoAuth.tsx` — new step type, new step cases in `renderStep()`, ONBOARDING_STEPS array, queue state (already in v1 spec)
- `libs/auth/src/components/ZoAuth/steps/OnboardingCheck.tsx` — rewrite from v1 stub
- `libs/auth/src/components/ZoAuth/steps/Welcome.tsx` — render avatar + nickname (per v1 spec)
- `libs/auth/src/components/ZoAuth/steps/Entry.tsx` — fix duplicate ONBOARDING_CHECK push (per v1 spec)
- `libs/auth/src/contexts/auth/AuthContext.tsx` — add `skipOnboarding` to interface (per v1 spec)
- `libs/auth/src/contexts/auth/AuthProvider.tsx` — add `skipOnboarding` prop (per v1 spec)
- `libs/definitions/auth/src/index.ts` — add missing Profile fields (`custom_nickname`, `body_type`, `avatar`, `place_name`, `place_ref_id`, `home_location`, `country`, `cultures`, `date_of_birth`, `pfp_image`, `pfp_metadata`, `selected_nickname`, `ens_nickname`)
- `apps/pms/src/pages/_app.tsx` — add `skipOnboarding={true}` to AuthProvider
- `apps/admin/src/pages/_app.tsx` — add `skipOnboarding={true}` to AuthProvider

**Create:**
- `libs/auth/src/components/ZoAuth/steps/Nickname.tsx`
- `libs/auth/src/components/ZoAuth/steps/Avatar.tsx`
- `libs/auth/src/components/ZoAuth/steps/Whereabouts.tsx`
- `libs/auth/src/components/ZoAuth/steps/Citizen.tsx`
- `libs/auth/src/components/ZoAuth/steps/Hometown.tsx`
- `libs/auth/src/components/ZoAuth/steps/Birthday.tsx`
- `libs/auth/src/components/ZoAuth/steps/Cultures.tsx`
- `libs/auth/src/data/countries.json` (bundled country list with ISO 3-letter codes + flags) — unless a Zo API endpoint is found
- `libs/auth/src/utils/geocoding.ts` — Google Maps reverse geocode helper (ported from zo-zo `utils/geo.ts`)

**Delete (per v1 spec):**
- 11 dead web3 step files: `Intro.tsx`, `SetENS.tsx`, `NoENS.tsx`, `SetZo.tsx`, `SetPFP.tsx`, `NoPFP.tsx`, `WalletAddition.tsx`, `WalletConnecting.tsx`, `Socials.tsx`, `Founder.tsx`, `NoFounder.tsx`

## Components

All components live in `libs/auth/src/components/ZoAuth/steps/`. All accept `{ advanceOnboarding: () => void }` as the only prop. All match the existing dark modal style (`bg-zui-dark`, white text, action button at bottom, green `#66DF48` for valid/success states). Visual style mirrors zo-zo mobile patterns (heading at top, big tappable cards/inputs, bottom-anchored action button).

### Step 1 — `Nickname.tsx` (NEW)

**Purpose:** Pick a unique `.zo` handle.

**State:** `input`, `checkEnabled`, `isSaving`. Local validation: length 4–16, alphanumeric only.

**UI:**
- Heading: *"Pick your .zo handle"*
- Subtitle: *"Your permanent identity in Zo World"*
- Single text input with `.zo` suffix shown inline (decoration, not editable)
- Three live validity rows: length, alphanumeric, available — each rendered with green ✓ / red ✗ / spinner / empty ○
- Action button: *"Claim it"* — disabled until all three pass

**Validation logic:**
- Local checks (length + alphanumeric): instant
- Availability check: debounced 500ms (matches mobile), gated via `enabled` flag on react-query, calls `GET /api/v1/profile/custom-nickname/available/?nickname={x}.zo`

**Save:**
```ts
updateProfile(
  { data: { custom_nickname: `${input.toLowerCase()}.zo` } },
  { onSuccess: () => advanceOnboarding(), onError: () => setIsSaving(false) }
);
```

### Step 2/3 — `Avatar.tsx` (port from zo-zo `AvatarSection.tsx`)

**Purpose:** Select body shape, generate avatar via backend service, show result.

**State:** `selected: "bro" | "bae" | null`, `phase: "select" | "generating" | "done"`, `pollCount` (ref), `pollInterval` (ref).

**UI phases:**

- **`select`:**
  - Heading: *"Choose your body shape, {nickname}"* (interpolates `custom_nickname.replace('.zo','')` from previous step)
  - Two large tappable card buttons side by side: **Bae** and **Bro**, each with a base silhouette SVG (inline simple shapes; `libs/avatar-renderer/` is empty per v1 spec)
  - Selected card gets green border + subtle scale-up (CSS transition)
  - Action button: *"Generate Avatar"* — disabled until selection
- **`generating`:**
  - Selected silhouette pulses in center (CSS opacity animation, 500ms cycle)
  - Title fades to *"Generating your Zobu..."*
  - Subtitle: *"This takes a few seconds"*
- **`done`:**
  - Generated avatar (`profile.avatar.image`) displayed as 160px rounded image
  - Subtitle: *"Looking good!"*
  - Action button: *"Zo Zo Zo! Let's Go"*

**Save + polling:**

```ts
const handleGenerate = () => {
  if (!selected) return;
  updateProfile(
    { data: { body_type: selected } },
    { onSuccess: () => startPolling(), onError: () => setPhase("select") }
  );
};

const startPolling = () => {
  setPhase("generating");
  pollCountRef.current = 0;
  pollInterval.current = setInterval(() => {
    pollCountRef.current++;
    refetchProfile();
    if (pollCountRef.current >= 10) {
      clearInterval(pollInterval.current!);
      pollInterval.current = null;
      advanceOnboarding();  // timeout fallback
    }
  }, 1000);
};

useEffect(() => {
  if (phase === "generating" && profile?.avatar?.image) {
    clearInterval(pollInterval.current!);
    pollInterval.current = null;
    setPhase("done");
  }
}, [phase, profile?.avatar?.image]);

useEffect(() => () => {
  if (pollInterval.current) clearInterval(pollInterval.current);
}, []);
```

Body type "they" is **not** offered. Backend only accepts `bro` / `bae`.

### Step 4 — `Whereabouts.tsx` (port from zo-zo `LocationPrompt.tsx` + `LocationContext.tsx`)

**Purpose:** Capture user's current physical location via browser geolocation.

**State:** `phase: "ask" | "requesting" | "geocoding" | "saving" | "done" | "error"`, `error: string | null`, `coords: {lat, long} | null`.

**UI phases:**

- **`ask`:**
  - Heading: *"Where in Zo World are you right now?"*
  - Subtitle: *"We'll use this to show you stuff happening near you"*
  - Action button: *"Share my Location"* — primary, no skip
- **`requesting`:** spinner + *"Asking for permission..."*
- **`geocoding`:** spinner + *"Finding your spot..."*
- **`saving`:** spinner + *"Locking it in..."*
- **`done`:** brief flash of `place_name` + green check, auto-advance
- **`error`:** red banner + *"Try Again"* button

**Logic flow:**

```ts
const handleShareLocation = async () => {
  setPhase("requesting");
  if (!navigator.geolocation) {
    setPhase("error");
    setError("Your browser can't share location.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      setPhase("geocoding");
      const { latitude: lat, longitude: long } = pos.coords;
      const result = await reverseGeocode(lat, long);  // libs/auth/src/utils/geocoding.ts
      if (!result) {
        setPhase("error");
        setError("Couldn't identify your location.");
        return;
      }
      setPhase("saving");
      try {
        await whereaboutsPost({
          place_name: result.place_name,
          place_ref_id: result.place_id,
          location: { lat, long },  // NOTE: long, not lng
        });
        setPhase("done");
        setTimeout(advanceOnboarding, 600);
      } catch (e) {
        setPhase("error");
        setError("Couldn't save — try again.");
      }
    },
    (err) => {
      setPhase("error");
      setError(err.code === err.PERMISSION_DENIED
        ? "We need your location to continue."
        : "Couldn't get your location.");
    },
    { timeout: 10000, maximumAge: 60000 }
  );
};
```

**`reverseGeocode` helper** (in `libs/auth/src/utils/geocoding.ts`):
- Calls Google Maps Geocoding API: `https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{long}&key={NEXT_PUBLIC_GOOGLE_MAPS_KEY}&result_type=locality`
- Falls back to `administrative_area_level_2`, then `administrative_area_level_1`
- Returns `{ place_name, place_id }` or null
- Direct port from zo-zo `utils/geo.ts`

**Permission denied handling:** Show error message + "Try Again" button. No skip path. If the user persistently refuses, they cannot complete onboarding — explicit consequence of the "all 8 required" rule. Document as a known constraint.

### Step 5 — `Citizen.tsx` (NEW)

**Purpose:** Pick country of citizenship.

**State:** `selectedCode: string | null` (ISO 3-letter), `searchQuery`, `isSaving`.

**UI:**
- Heading: *"Where are you a proud citizen?"*
- Subtitle: *"Your homeland flag on your passport"*
- Searchable country picker: input + filtered list of countries with flag emoji + name
- Selected country shows large flag preview above the picker
- Action button: *"That's home"* — disabled until selection

**Country list:** Bundled `libs/auth/src/data/countries.json` containing `{ code, name, flag }` for ~250 countries. Open question: if a Zo API endpoint exists for this, prefer that. Verify in implementation.

**Save:**
```ts
updateProfile(
  { data: { country: selectedCode } },  // 3-letter ISO string, NOT object
  { onSuccess: () => advanceOnboarding(), onError: () => setIsSaving(false) }
);
```

### Step 6 — `Hometown.tsx` (port from zo-zo `CityPrompt.tsx` + `CitySearch.tsx`, with Google Places)

**Purpose:** Pick the city the user calls home.

**State:** `query`, `predictions: Prediction[]`, `selected: Prediction | null`, `isSaving`.

**UI:**
- Heading: *"Where's home?"*
- Subtitle: *"Your roots — the city you call yours"*
- Text input that fires Google Places Autocomplete on each keystroke (debounced 300ms)
- Dropdown with predictions: city name + region/country
- Action button: *"That's me"* — disabled until selection
- **No skip** — required (overrides zo-zo mobile which allows skip)

**Google Places integration:**
- Use `@react-google-maps/api` Places library or Places JS SDK directly
- API key: `NEXT_PUBLIC_GOOGLE_MAPS_KEY` (already in monorepo per v1 spec)
- On selection: extract `place_name` (formatted_address or main_text), `place_ref_id` (`place_id`), and lat/lng (`geometry.location.lat()` / `.lng()`)

**Save:**
```ts
updateProfile(
  {
    data: {
      place_name: selected.formatted_address,
      place_ref_id: selected.place_id,
      home_location: { lat, lng },  // NOTE: lng, not long (different from whereabouts!)
    },
  },
  { onSuccess: () => advanceOnboarding(), onError: () => setIsSaving(false) }
);
```

### Step 7 — `Birthday.tsx` (NEW)

**Purpose:** Capture date of birth.

**State:** `date: string` (YYYY-MM-DD), `isValid`, `isSaving`.

**UI:**
- Heading: *"When's your Zo Day?"*
- Subtitle: *"We celebrate you"*
- Single native `<input type="date">` styled to match the dark modal (border, padding, fill); cross-platform, mobile-friendly
- Live validation: must be a real past date, age ≥ 13, age < 120
- Action button: *"Confirm"* — disabled until valid

**Validation:**
- Future date → red border + *"Pick a date in the past"*
- Age < 13 → *"Sorry, Zo World is 13+"* — hard block
- Age > 120 → *"Hmm, double-check that"* — soft warn, allow override
- Invalid date (Feb 30 etc.) → blocked by native input

**Save:**
```ts
updateProfile(
  { data: { date_of_birth: date } },  // ISO date string YYYY-MM-DD
  { onSuccess: () => advanceOnboarding(), onError: () => setIsSaving(false) }
);
```

### Step 8 — `Cultures.tsx` (NEW)

**Purpose:** Pick the cultures the user identifies with.

**State:** `selectedKeys: Set<string>`, `availableCultures: Culture[]`, `isLoading`, `isSaving`.

**UI:**
- Heading: *"What's your culture?"*
- Subtitle: *"Pick everything that's you"*
- Grid of culture chips, each showing icon + name (icons fetched from Zo CDN; data shape from `GET /api/v1/cas/cultures/?limit=50`)
- Tap to toggle — selected chips get green border + green tint
- Live counter: *"3 selected"* (min 1 enforced client-side)
- Action button: *"Lock it in"* — disabled until 1+ selected

**Data fetching:** `useQueryApi("CAS_CULTURES", { enabled: true }, "?limit=50")` on mount → 27 cultures returned.

**Save:**
```ts
updateProfile(
  { data: { cultures: Array.from(selectedKeys) } },  // REPLACE semantics
  { onSuccess: () => advanceOnboarding(), onError: () => setIsSaving(false) }
);
```

**Critical edge case for returning users:** Cultures POST is REPLACE, not append. If a user already has cultures (e.g., 20 entries), the picker MUST pre-fill with the existing selection on mount, or submitting a single newly-picked culture will silently wipe the other 19. Implementation:

```ts
useEffect(() => {
  if (profile?.cultures) {
    setSelectedKeys(new Set(profile.cultures.map(c => c.key)));
  }
}, [profile?.cultures]);
```

This MUST be unit-tested.

### Modified — `Welcome.tsx`

Display avatar + nickname, auto-close in 2s. Already specced in v1 — no further changes.

### Modified — `OnboardingCheck.tsx`

Compute the onboarding queue from 8 field checks. Each check pushes a step name to the queue if missing. Whereabouts requires a separate fetch since it's not on the profile object.

```ts
import { FC, useEffect, useState } from "react";
import { useAuth } from "../../../contexts/auth";
import useProfile from "../../../hooks/useProfile";
import { ZoAuthStep, ZoAuthStepProps } from "../ZoAuth";
import { fetchWhereabouts } from "../../../utils/whereabouts";

interface OnboardingCheckProps extends ZoAuthStepProps {
  setOnboardingQueue: (queue: ZoAuthStep[]) => void;
}

const OnboardingCheck: FC<OnboardingCheckProps> = ({ setStep, setOnboardingQueue }) => {
  const { skipOnboarding } = useAuth();
  const { profile } = useProfile();
  const [whereabouts, setWhereabouts] = useState<unknown | null | undefined>(undefined);

  useEffect(() => {
    fetchWhereabouts()
      .then(setWhereabouts)
      .catch(() => setWhereabouts(null));
  }, []);

  useEffect(() => {
    if (!profile || whereabouts === undefined) return;
    if (skipOnboarding) {
      setStep("WELCOME");
      return;
    }
    const queue: ZoAuthStep[] = [];
    if (!profile.custom_nickname && !profile.ens_nickname) queue.push("NICKNAME");
    if (!profile.body_type) queue.push("AVATAR");
    if (!whereabouts) queue.push("WHEREABOUTS");
    if (!profile.country?.code) queue.push("CITIZEN");
    if (!profile.place_name) queue.push("HOMETOWN");
    if (!profile.date_of_birth) queue.push("BIRTHDAY");
    if (!profile.cultures || profile.cultures.length < 1) queue.push("CULTURES");

    if (queue.length === 0) {
      setStep("WELCOME");
    } else {
      setOnboardingQueue(queue);
      setStep(queue[0]);
    }
  }, [profile, whereabouts, skipOnboarding, setStep, setOnboardingQueue]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <i className="uil uil-spinner animate-spin text-2xl" />
      <span className="text-sm mt-4 text-white/50">Setting things up...</span>
    </div>
  );
};

export default OnboardingCheck;
```

## Data flow

### Flow A — First-time user (full 8 steps)

```
[1] User on zo.xyz → clicks "Become a Citizen" CTA
    → HeroSection.tsx:12 calls showLoginModal(undefined, "/passport")

[2] ZoAuth modal opens → Entry → MOBILE_LOGIN
    → User enters phone + country code
    → POST /api/v1/auth/request-otp/mobile/        → OTP sent
    → User enters OTP
    → POST /api/v1/auth/login/mobile/otp/          → Zo token + user object
        Stored in localStorage as "zo-admin-token"
        axios interceptors set Authorization: Bearer ...
    → MobileLogin.tsx:63 detects isZostelLoginRequired=true
    → POST /api/v1/auth/request-otp/zostel/        → Zostel OTP issued via Zo backend
    → POST /api/v1/auth/activate/                  → Zostel token
        Stored in localStorage, ZostelAuthProvider configured

[3] OTP success handler → setStep("ONBOARDING_CHECK")
    Auto-close guard suppresses hideModal because step is in ONBOARDING_STEPS

[4] OnboardingCheck mounts
    → useProfile() → GET /api/v1/profile/me/
    → fetchWhereabouts() → GET /api/v2/places/whereabouts/  (404 for new user)
    → Computes queue (new user → all 7 step names; AVATAR covers 2 onboarding "steps")
    → setOnboardingQueue([NICKNAME, AVATAR, WHEREABOUTS, CITIZEN, HOMETOWN, BIRTHDAY, CULTURES])
    → setStep("NICKNAME")

[5-11] User completes each step. Each step:
    → POST /api/v1/profile/me/ {field}              (or /api/v2/places/whereabouts/ for step 4)
    → advanceOnboarding() → replaceStep(next in queue)

[12] Queue empty → replaceStep("WELCOME")
    → Welcome.tsx renders avatar + nickname
    → setTimeout(hideModal, 2000)
    → Modal closes
    → Page navigates to /passport

[13] /passport reads from BOTH backends:
    → Zo API: profile (with all 8 fields populated)
    → Zostel API: stays history, XP, bookings (uses Zostel token from dual auth)
    → Renders unified passport with real data
```

### Flow B — Returning user with partial profile (Case 2)

Same as Flow A through step [3]. At step [4], OnboardingCheck computes a subset queue based on what's already filled.

Example: user with `custom_nickname`, `body_type`, `avatar.image`, `place_name` but no whereabouts, no country, no DOB, no cultures.

```
OnboardingCheck queue: [WHEREABOUTS, CITIZEN, BIRTHDAY, CULTURES]
→ User skips NICKNAME, AVATAR, HOMETOWN
→ Sees only the 4 missing steps
→ Modal closes after the last one
```

**Edge case — interrupted onboarding:** User completes 5 of 8 steps, closes the tab. On next login, OnboardingCheck sees the 5 saved fields and queues only the 3 remaining. They pick up where they left off. **No client-side state to persist** — the profile IS the state.

### Cross-cutting properties

- **Atomicity:** Each step writes one field. No transactional batch. Closing the tab mid-flow preserves saved fields.
- **Idempotency:** Re-submitting a step is safe — same payload, same result. Cultures POST is idempotent because of REPLACE semantics. Whereabouts POST upserts a single row keyed by user.
- **Bypass prevention:** `isOnboarding` guard suppresses modal close. Back button hidden during onboarding. UserCollection panel hidden. Only escape is browser-level (close tab) → resumable on next login.
- **Two backends, one direction:** WRITE during onboarding = Zo API only. READ after onboarding = Zo + Zostel. Onboarding never writes Zostel.

## Error handling

### Per-step

| Step | Condition | UX |
|---|---|---|
| **NICKNAME** | Length / alphanumeric fails | Live red ✗ on local rows; submit disabled |
| | Availability returns `false` | Live red ✗ on "Available" row |
| | POST 5xx / network | Inline red banner above button + retry |
| **AVATAR** | Body type POST fails | Reset to `select` phase, banner |
| | Generation timeout (10 polls × 1s) | Force-advance with placeholder. Welcome screen shows: *"Your Zobu is still cooking — refresh in a moment"* |
| | Component unmount mid-poll | Cleanup clears interval; no leak |
| **WHEREABOUTS** | Browser doesn't support geolocation | Hard block. Banner: *"Your browser can't share location."* + *"Open in a new tab"* |
| | Permission denied | Banner: *"We need your location to continue."* + *"Try Again"* |
| | Position unavailable | Banner + retry |
| | Timeout (10s) | Banner + retry |
| | HTTPS not used | Hard block (dev-only safeguard) |
| | Reverse geocode no results | Fall through `locality` → `area_level_2` → `area_level_1` → raw lat/lng with `place_name = "Unknown location"`. POST anyway. |
| | Maps API key missing | Banner: *"Location service unavailable — please contact support"* + console.error |
| | POST 5xx | Banner + retry, lat/lng kept in state |
| **CITIZEN** | Country list fails to load (if remote) | Use bundled fallback |
| | Backend rejects code (422) | Banner: *"That country isn't available yet"* (should never happen) |
| | POST 5xx | Banner + retry |
| **HOMETOWN** | Google Places script timeout | Banner: *"Search unavailable — please refresh"* |
| | Zero predictions | *"No matches — try a bigger city"* |
| | OVER_QUERY_LIMIT | Banner: *"Too many searches — wait a moment"* |
| | Prediction missing geometry | Re-fetch place details; drop silently if still missing |
| | POST 5xx | Banner + retry |
| **BIRTHDAY** | Future date | Local: *"Pick a date in the past"* |
| | Age < 13 | Local: *"Sorry, Zo World is 13+"* (hard block) |
| | Age > 120 | Local: *"Hmm, double-check that"* (soft, allow override) |
| | Invalid date | Local: blocked by native input |
| | POST 5xx | Banner + retry |
| **CULTURES** | Catalog GET fails | Error + retry button. Cannot proceed without catalog. |
| | Selected 0 | Submit disabled. Counter: *"Pick at least 1"* |
| | POST 5xx | Banner + retry |
| | Returning user existing cultures | Pre-select on mount from `profile.cultures` |

### Cross-cutting

- **Token expiry mid-onboarding:** Catch 401 globally → silently call refresh-token endpoint → retry the original request once. Standard pattern, partially implemented in axios interceptors. Fallback to relogin if refresh fails (then OnboardingCheck resumes from saved state).
- **Modal close attempts:** Browser/tab close = nothing to do, resumable on next login. ESC key + backdrop click = ignored during `isOnboarding`. No close X button rendered.
- **Network offline:** `navigator.onLine` detection. Banner: *"You're offline — connect to continue"*. Submit disabled. Auto-clear on `online` event.
- **PMS / Admin staff:** `skipOnboarding={true}` bypasses everything. Staff complete missing fields later via passport settings.
- **Existing zozozo.work users (~2,707 known):** Hit Case 2 on next login with whatever subset they're missing. No data migration. No backfill. Track per-step drop-off in telemetry.
- **Avatar generation race (double click):** Idempotent; second POST replaces first body_type write with same value. Polling restarts. No corruption.
- **Cultures REPLACE gotcha:** See `Cultures.tsx` returning-user pre-fill logic above. **Required unit test.**
- **Whereabouts vs hometown field name confusion:** `whereabouts.location.long` vs `home_location.lng`. Wrap each step's payload in a typed helper. Never let the raw object literal float around.
- **Google Maps API key exposure:** `NEXT_PUBLIC_*` is bundled into client JS by design. Mitigate via HTTP referrer restrictions on the key in Google Cloud Console (`*.zo.xyz`, `*.zozozo.work`, `localhost`). Deployment checklist item.
- **Multiple tabs:** Last write wins. Acceptable because each step writes a distinct field, except cultures (unrealistic concurrent edit case).
- **Iframe embedding:** Out of scope for v1.

## Implementation order — 5 chunks

Each chunk is independently shippable and testable.

### Chunk 1 — Scaffold (extends v1 spec)
- Update `Profile` type with all missing fields
- Add `skipOnboarding` to `AuthContext` + `AuthProvider`
- Wire `skipOnboarding={true}` in PMS + Admin `_app.tsx`
- Rewrite `ZoAuth.tsx` orchestrator: new step type enum, `ONBOARDING_STEPS` array, queue state, `advanceOnboarding`, auto-close guard, hide back button + UserCollection during onboarding
- Delete the 11 dead web3 step files
- **Build green checkpoint:** all apps compile, login still works, onboarding stub renders

### Chunk 2 — OnboardingCheck + Welcome
- Rewrite `OnboardingCheck.tsx` with full 8-field queue computation
- Add separate whereabouts fetch in OnboardingCheck
- Update `Welcome.tsx` to render avatar + nickname (per v1 spec)
- Fix duplicate `ONBOARDING_CHECK` push in `Entry.tsx` (per v1 spec)
- **Build green checkpoint:** new users land on a placeholder step, returning users with full profiles see Welcome

### Chunk 3 — Steps that don't need Google APIs
- `Nickname.tsx` (uniqueness check via existing endpoint)
- `Avatar.tsx` (body type + polling)
- `Citizen.tsx` (country picker from bundled JSON)
- `Birthday.tsx` (date input + validation)
- `Cultures.tsx` (catalog fetch + multi-select + REPLACE save with returning-user pre-fill)
- **Build green checkpoint:** 5 of 7 step components work end-to-end against the live API

### Chunk 4 — Steps that need Google APIs
- Add `@react-google-maps/api` to `libs/auth/package.json` (or use Places JS SDK directly)
- Create `libs/auth/src/utils/geocoding.ts` (port from zo-zo `geo.ts`)
- `Whereabouts.tsx` (browser geolocation + reverse geocode + POST whereabouts)
- `Hometown.tsx` (Google Places Autocomplete + POST profile)
- Verify `NEXT_PUBLIC_GOOGLE_MAPS_KEY` is set on Vercel
- **Build green checkpoint:** all 7 step components work end-to-end

### Chunk 5 — Polish & verification
- Manual QA: brand-new user (full 8 steps), Samurai (returning with full profile, should skip everything), constructed test user with partial data (Case 2)
- Sentry / PostHog instrumentation: log step entry, success, error, abandonment
- Copy review pass
- Final build of website, dashboard, pms, admin
- **Ship checkpoint:** merge to main, deploy to zozozo.work

## Coordinated parallel work

`docs/superpowers/plans/2026-04-09-zoauth-retro-tv-effect.md` is a parallel plan that adds a retro-TV + VHS-static visual treatment to `libs/auth/src/components/ZoAuth/ZoAuth.tsx` — the same file this spec modifies. The two changes are functionally independent (TV effect is presentation-only; this spec is logic) but touch the same component, so merge order matters:

- **Recommended order:** Land the TV effect plan **first** (smaller, presentation-only). Then land this spec on top — the new step components inherit the visual treatment for free.
- **Alternative:** Land both in the same PR if the implementer is comfortable. The TV effect plan only restructures the root `<div>` tree; the step components inside `renderStep()` are unaffected.

## Telemetry — events to wire in Chunk 5

- `onboarding_started` (user_pid, queue_length, queue_steps[])
- `onboarding_step_entered` (step_name)
- `onboarding_step_completed` (step_name, duration_ms)
- `onboarding_step_error` (step_name, error_type, http_status)
- `onboarding_completed` (user_pid, total_duration_ms, steps_completed)
- `onboarding_abandoned` (last_step, time_on_step_ms) — fired on `beforeunload` if onboarding active

This data answers: which step has the highest drop-off? Which is slowest? Which has the most errors? Critical for iterating after launch.

## API endpoints used (all already exist)

| Endpoint | Method | Used by | Notes |
|---|---|---|---|
| `/api/v1/profile/me/` | GET | `useProfile`, `OnboardingCheck` | Read full profile |
| `/api/v1/profile/me/` | POST | All steps except Whereabouts | Partial update writable |
| `/api/v1/profile/custom-nickname/available/` | GET | `Nickname.tsx` | `?nickname={x}.zo` → `{available: bool}` |
| `/api/v1/cas/cultures/` | GET | `Cultures.tsx` | `?limit=50` → catalog of 27 cultures |
| `/api/v2/places/whereabouts/` | GET | `OnboardingCheck` | Read current whereabouts (404 if none) |
| `/api/v2/places/whereabouts/` | POST | `Whereabouts.tsx` | Upsert whereabouts |
| `/api/v1/auth/token/refresh/` | POST | axios interceptor | Existing 401 handling |

**Zo API only.** No Zostel writes. No new endpoints. No backend changes.

## Open questions (non-blocking, resolve during implementation)

1. **Country list source** — bundled `countries.json` or a Zo API endpoint? Default: bundled. Verify if a remote endpoint exists.
2. **`useProfile.refetchProfile` cache key bug** (pre-existing, v1 spec note) — polling works despite it. Optional cleanup, not blocking.
3. **`@react-google-maps/api` package version** — pick a stable version compatible with Next 14 / React 18.
4. **Country picker UX** — searchable dropdown vs flag grid vs scrollable list. Implementer's call; reference shadcn / HeadlessUI Combobox.
5. **Birthday input style** — native `<input type="date">` (cross-platform but ugly) vs custom DD/MM/YYYY split. Default: native unless implementer has strong feelings.
6. **Cultures grid layout** — 2-col, 3-col, scrollable. 27 entries means 3-col × 9-row fits desktop; mobile probably needs 2-col scrollable. Match zo-zo style if findable.

## Definition of done

A user can:

1. Click "Become a Citizen" on the zo.xyz / zozozo.work homepage
2. Enter phone + OTP (existing flow, unchanged)
3. Land in the new modal flow and complete 8 steps in order (all required, no skips)
4. Be redirected to `/passport` afterward
5. See their nickname, avatar, country flag, hometown, birthday, and cultures rendered on the passport page (passport page already reads these — no spec changes there)
6. **Returning users with partial data:** complete only the missing steps and exit
7. **PMS / Admin users:** never see onboarding (`skipOnboarding={true}`)
8. **Build green:** all 4 affected apps build cleanly (`npx nx build website`, `dashboard`, `pms`, `admin`)

## Pre-existing issues acknowledged (not caused by this work)

- `refetchProfile()` cache key uppercase/lowercase mismatch. Polling works because the underlying `refetch()` bypasses cache. Optional cleanup.
- `Profile` type in `libs/definitions/auth/src/index.ts` is severely incomplete — missing ~20 fields the backend returns. This spec adds the relevant ones; full cleanup is out of scope.
- The TypeScript field name `country_citizen` does not match the actual API field (`country`). The Profile type extension in this spec uses the correct name (`country`).

## What this spec does NOT include

- Avatar trait editor / re-roll — future feature
- 3D avatar pipeline — Phase 2
- Onboarding rewards / $Zo airdrop — `ONBOARDING_GRANTS` endpoint exists, wiring is a follow-up
- WagmiProvider / RainbowKitProvider removal — separate cleanup
- Existing user `place_name` migration — out of scope
- Email login UX changes — only post-OTP gate changes
- Onboarding analytics dashboard — Sentry/PostHog events sufficient
- "They" body type — backend doesn't support
- Onboarding skip for power users — hard rule, no skips
- Iframe embedding support — out of scope
