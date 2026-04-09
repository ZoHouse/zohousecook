# zozozo.work Onboarding Flow — Design Spec

> **⚠ SUPERSEDED 2026-04-09** by [`2026-04-09-zozozo-onboarding-v2-design.md`](./2026-04-09-zozozo-onboarding-v2-design.md). v2 expands this 3-step flow (Nickname, Avatar, City) into 8 required steps (adds Whereabouts, Citizen, Birthday, Cultures + makes Hometown required). v1 was never implemented; v2 inherits its architectural decisions (queue-based progressive onboarding, `skipOnboarding` prop, modal auto-close guard) and extends them. Read this file only for historical context.

## Goal

Replace the defunct web3 onboarding (ENS/PFP/wallet/socials — all commented out) with a hospitality-focused flow that collects nickname, body type (avatar), and city. Applies to website and dashboard apps on zozozo.work. PMS and admin apps skip onboarding (see Cross-App Impact section).

## Reference Implementation

The zo-zo mobile app (`thezoworld/zo-zo`) has a working onboarding flow:
1. Phone + OTP
2. Username → saved as nickname
3. Body shape (Bro/Bae) → backend generates Zobu avatar
4. Location permission + city via Google Places
5. Done → main app

This spec ports that pattern to the zo.xyz web monorepo's shared auth library.

## Architecture

### Where it lives

All onboarding lives in `libs/auth/src/components/ZoAuth/`. This is a shared library used by all apps.

### Step type

```typescript
type ZoAuthStep =
  | "ENTRY"
  | "MOBILE_LOGIN"
  | "EMAIL_LOGIN"
  | "ONBOARDING_CHECK"
  | "NICKNAME"
  | "AVATAR"
  | "CITY"
  | "WELCOME";
```

Removed steps: `WALLET_CONNECTING`, `SET_ENS`, `NO_ENS`, `SET_PFP`, `NO_PFP`, `SET_ZO`, `WALLET_ADDITION`, `SOCIALS`, `FOUNDER`, `NO_FOUNDER`, `INTRO`.

### Modal auto-close fix (critical)

`ZoAuth.tsx` has a `useEffect` (lines 90-101) that calls `hideModal()` when `isLoggedIn` becomes true. The `login()` call in AuthProvider.tsx triggers `setLoggedIn(true)` after a 2-second delay (`setTimeout`, line 235). The OTP success handler calls both `login()` and `setStep("ONBOARDING_CHECK")` synchronously, so when `isLoggedIn` fires 2s later, `step` is already `ONBOARDING_CHECK`. The guard works because the step has transitioned before the timeout fires.

Fix: add a guard that suppresses auto-close while the current step is an onboarding step.

```typescript
const ONBOARDING_STEPS = ["ONBOARDING_CHECK", "NICKNAME", "AVATAR", "CITY"];
const isOnboarding = ONBOARDING_STEPS.includes(step);

useEffect(() => {
  if (isLoggedIn && !isOnboarding) {
    if (isLoggingWithMobile) {
      if (isZostelLoggedIn) {
        hideModal();
        setLoggingWithMobile(false);
      }
    } else {
      hideModal();
    }
  }
}, [hideModal, isLoggedIn, isZostelLoggedIn, step, isOnboarding]);
```

**Duplicate step push prevention:** Entry.tsx has a `useEffect` (lines 104-121) that calls `setStep("ONBOARDING_CHECK")` when `isLoggedIn` becomes true. But the OTP success handler also calls `setStep("ONBOARDING_CHECK")` synchronously. This pushes `ONBOARDING_CHECK` onto the step stack twice. Fix: use `replaceStep` instead of `setStep` in Entry.tsx's useEffect, or guard with `if (step !== "ONBOARDING_CHECK")`.

### Onboarding queue state

The queue of missing steps is computed in `OnboardingCheck` and stored as `useState<ZoAuthStep[]>` in `ZoAuth.tsx`. OnboardingCheck receives `setOnboardingQueue` as an additional prop (beyond `ZoAuthStepProps`).

Each onboarding step receives `advanceOnboarding` as a prop. It uses `replaceStep` (not `setStep`) to avoid growing the step stack:

```typescript
// In ZoAuth.tsx
const [onboardingQueue, setOnboardingQueue] = useState<ZoAuthStep[]>([]);

const advanceOnboarding = () => {
  const [, ...remaining] = onboardingQueue;
  setOnboardingQueue(remaining);
  replaceStep(remaining.length > 0 ? remaining[0] : "WELCOME");
};
```

**OnboardingCheck rendering:**
```typescript
case "ONBOARDING_CHECK":
  return (
    <OnboardingCheck
      setStep={setStep}
      setFocus={setFocus}
      setOnboardingQueue={setOnboardingQueue}
    />
  );
```

**Onboarding step rendering (each gets advanceOnboarding):**
```typescript
case "NICKNAME":
  return <Nickname advanceOnboarding={advanceOnboarding} />;
case "AVATAR":
  return <Avatar advanceOnboarding={advanceOnboarding} />;
case "CITY":
  return <City advanceOnboarding={advanceOnboarding} />;
```

### Step detection (OnboardingCheck)

After OTP verification, the auth modal transitions to `ONBOARDING_CHECK`. This step fetches the user's profile and determines which steps are missing:

```
fetch profile → check fields:
  !custom_nickname && !ens_nickname  → queue NICKNAME
  !body_type                         → queue AVATAR
  !place_name                        → queue CITY
  queue empty                        → go to WELCOME
  queue not empty                    → setOnboardingQueue(queue), setStep(queue[0])
```

This is progressive: returning users who already have a nickname but no body_type will only see the AVATAR step. Users with everything set skip straight to WELCOME (2s auto-close).

**Important:** All profile fields are accessed as `profile?.custom_nickname`, `profile?.body_type`, etc. These fields exist on the backend (verified in dashboard/passport.tsx and admin/profile.tsx) but are NOT in the `Profile` TypeScript type in `libs/definitions/auth/src/index.ts`. The `useProfile()` hook returns an untyped object. During implementation, add these fields to the Profile type for type safety.

### Back button during onboarding

Hide the back button during onboarding steps (NICKNAME, AVATAR, CITY). Update the condition in ZoAuth.tsx (lines 183-188):

```typescript
const hideBackButton = step === "ENTRY" || step === "WELCOME"
  || ONBOARDING_STEPS.includes(step);
```

### Cross-App Impact

The auth library is shared. Different apps should behave differently:

| App | Should onboard? | Reason |
|-----|-----------------|--------|
| Website (`/`) | Yes | Public visitors becoming citizens |
| Dashboard (`/dashboard`) | Yes | Passport/identity requires nickname + avatar |
| PMS (`/pm`) | No | Staff managing rooms/cafe — onboarding would be disruptive |
| Admin (`/admin`) | No | Operational tool |

**Implementation:** Add a `skipOnboarding?: boolean` prop to `AuthProvider`. PMS and Admin `_app.tsx` pass `skipOnboarding={true}`. OnboardingCheck reads this from auth context and skips straight to WELCOME if true.

### UserCollection side panel

`UserCollection` in ZoAuth.tsx renders a video background on the right side. During onboarding steps, hide it to give full width to the onboarding content. Check `step` and conditionally render:

```typescript
{!ONBOARDING_STEPS.includes(step) && <UserCollection focus={focus} />}
```

## Steps

### ENTRY (modified)

**File:** `Entry.tsx` (modify existing)

Remove wallet connection UI. Keep:
- Phone OTP as primary (country code selector + phone input + OTP verification)
- Email as secondary option

Remove all wallet-related code:
- Remove `useAccount` import from wagmi and the `isConnected` logic branch (lines 108-114)
- Remove wallet connection button/icon from the UI (CustomButton, line ~402)
- Remove `WalletConnecting` step navigation
- Note: `WagmiProvider` and `RainbowKitProvider` in AuthProvider.tsx wrap the entire app tree — leave them for now. Other features (token analytics, dashboard) may depend on them. Removing wagmi from AuthProvider is a separate task.

### NICKNAME

**File:** `Nickname.tsx` (new)

**Props:** `{ advanceOnboarding: () => void }`

**UI:**
- Heading: "Pick your .zo handle"
- Text input with `.zo` suffix displayed inline (not editable)
- Real-time validation indicators:
  - 4-16 characters
  - Alphanumeric only (a-z, 0-9)
  - Available (green check / red x)
- Submit button: "Claim it" (disabled until all 3 checks pass)

**Validation:**
- Length: 4-16 characters (client-side, instant)
- Alphanumeric: `/^[a-z0-9]+$/i` (client-side, instant)
- Availability: debounced 500ms, controlled by `enabled` flag on the query:

```typescript
const [checkEnabled, setCheckEnabled] = useState(false);

// Debounce: set checkEnabled=true 500ms after last keystroke
useEffect(() => {
  setCheckEnabled(false);
  const timer = setTimeout(() => {
    if (isValidLength && isAlphanumeric) setCheckEnabled(true);
  }, 500);
  return () => clearTimeout(timer);
}, [input]);

const { data: availabilityData } = useQueryApi(
  "PROFILE_CUSTOM_NICKNAME_AVAILABLE",
  { enabled: checkEnabled, refetchOnWindowFocus: false },
  "",  // additionalRoute
  `nickname=${input}.zo`  // search → becomes ?nickname=x.zo
);
```

Note: The old `SetZo.tsx` used 6-32 chars. We're tightening to 4-16 to match the zo-zo mobile app. If the backend rejects this range, adjust to match backend constraints.

**Save:**
Use `updateProfile` from `useProfile()` hook (defaults to POST, which the backend accepts). Note: `updateProfile` already has an `onSuccess: refetchProfile` configured in the hook — don't add a redundant `refetchProfile()` call.

```typescript
const { updateProfile } = useProfile();

updateProfile(
  { data: { custom_nickname: `${input}.zo` } },
  { onSuccess: () => advanceOnboarding() }
);
```

Note: `selected_nickname: "custom"` is not sent — the existing `SetZo.tsx` doesn't send it either. Test whether the backend correctly infers `selected_nickname` from `custom_nickname` being set. If not, add it.

### AVATAR

**File:** `Avatar.tsx` (new)

**Props:** `{ advanceOnboarding: () => void }`

**UI:**
- Heading: "Choose your body shape" (or "Choose your body shape, {nickname}" if nickname is set)
- Two large selectable cards side by side:
  - **Bae** — with base female silhouette illustration
  - **Bro** — with base male silhouette illustration
- Selected card gets a highlight border
- Submit button: "Generate Avatar" (appears after selection)
- After generation starts: polling state with loading animation
- When `avatar.image` is populated: show generated avatar with "Zo Zo Zo! Let's Go" button

**Save:**
```typescript
const { updateProfile, refetchProfile } = useProfile();

updateProfile(
  { data: { body_type: selectedShape } },  // "bro" or "bae"
  { onSuccess: () => startAvatarPolling() }
);
```

**Avatar generation polling:**
- After save succeeds, start a `setInterval` that calls `refetchProfile()` every 1 second
- On each refetch, check if `profile?.avatar?.image` is truthy (confirmed correct path — used identically in `apps/dashboard/src/pages/passport.tsx:174`)
- Max 10 polls (10 seconds). If still not ready, proceed anyway (avatar will appear later)
- On success or timeout: clear interval, call `advanceOnboarding()`

**Known issue:** `refetchProfile()` internally calls `queryClient.resetQueries(["PROFILE", "ME"])` with uppercase keys, but the query is registered with lowercase `["profile", "me"]`. The reset is a no-op, but the `refetch()` call that follows works correctly (bypasses cache). This is a pre-existing bug — the polling will work despite it.

**Base avatar illustrations:** `libs/avatar-renderer/` exists in tsconfig but the source directory is empty. Use simple inline SVG silhouettes (a male and female outline) directly in the component. No external dependency needed.

### CITY

**File:** `City.tsx` (new)

**Props:** `{ advanceOnboarding: () => void }`

**UI:**
- Heading: "Where's home?"
- Text input (plain text for v1 — see Google Places note below)
- Skip button: "Maybe Later" (city is optional)
- Submit button: "That's me"

**Save:**
```typescript
updateProfile(
  { data: { place_name: cityInput } },
  { onSuccess: () => advanceOnboarding() }
);
```

On skip → call `advanceOnboarding()` directly (no save).

**Google Places:** The monorepo uses `NEXT_PUBLIC_GOOGLE_MAPS_KEY` (not `GOOGLE_PLACES_API_KEY`). There is no reusable Google Places autocomplete component in `libs/` — the admin app uses Mapbox for maps. For v1, use a plain text input. Google Places autocomplete can be added in a future iteration if desired (would need `@react-google-maps/api` or the Places API directly).

### WELCOME

**File:** `Welcome.tsx` (modify existing)

**UI:**
- Heading: "Zo Zo {nickname}!"
- If avatar is generated: show avatar image
- If no avatar yet: show body type silhouette
- Subtitle: "Welcome to Zo World"
- Auto-closes after 2 seconds (existing behavior)

Update the display logic. New fallback chain:
```typescript
const { profile } = useProfile();
const displayName = profile?.custom_nickname?.replace(".zo", "")
  || profile?.ens_nickname
  || profile?.first_name
  || "Citizen";
```
Show avatar if `profile?.avatar?.image` is truthy, otherwise show body type silhouette. Remove `formatAddress(wallet_address)` fallback.

## Files to delete

These step components are no longer referenced and should be removed:

- `libs/auth/src/components/ZoAuth/steps/Intro.tsx`
- `libs/auth/src/components/ZoAuth/steps/SetENS.tsx`
- `libs/auth/src/components/ZoAuth/steps/NoENS.tsx`
- `libs/auth/src/components/ZoAuth/steps/SetZo.tsx`
- `libs/auth/src/components/ZoAuth/steps/SetPFP.tsx`
- `libs/auth/src/components/ZoAuth/steps/NoPFP.tsx`
- `libs/auth/src/components/ZoAuth/steps/WalletAddition.tsx`
- `libs/auth/src/components/ZoAuth/steps/Socials.tsx`
- `libs/auth/src/components/ZoAuth/steps/Founder.tsx`
- `libs/auth/src/components/ZoAuth/steps/NoFounder.tsx`
- `libs/auth/src/components/ZoAuth/steps/WalletConnecting.tsx`

Also remove their imports from `ZoAuth.tsx` and the corresponding `case` statements in `renderStep()`.

## Files to modify

| File | Change |
|------|--------|
| `libs/auth/src/components/ZoAuth/ZoAuth.tsx` | Remove deleted step imports/cases, add new step imports/cases, update `ZoAuthStep` type, add `onboardingQueue` state + `advanceOnboarding`, add `isOnboarding` guard on auto-close useEffect, hide back button during onboarding, conditionally hide UserCollection |
| `libs/auth/src/components/ZoAuth/steps/OnboardingCheck.tsx` | Replace commented-out logic with progressive step queue, remove `groupBy` and `console.log` |
| `libs/auth/src/components/ZoAuth/steps/Entry.tsx` | Remove wallet connection UI (`useAccount`, `isConnected` branch, wallet button), fix duplicate `ONBOARDING_CHECK` push |
| `libs/auth/src/components/ZoAuth/steps/Welcome.tsx` | Update display to use custom_nickname + avatar |
| `libs/auth/src/contexts/auth/AuthProvider.tsx` | Add `skipOnboarding` prop, pass through context |
| `libs/definitions/auth/src/index.ts` | Add missing Profile fields: `custom_nickname`, `ens_nickname`, `body_type`, `avatar`, `place_name`, `place_ref_id`, `pfp_image`, `selected_nickname` |
| `apps/pms/src/pages/_app.tsx` | Add `skipOnboarding` to AuthProvider |
| `apps/admin/src/pages/_app.tsx` | Add `skipOnboarding` to AuthProvider |

## Files to create

| File | Purpose |
|------|---------|
| `libs/auth/src/components/ZoAuth/steps/Nickname.tsx` | .zo handle selection with availability check |
| `libs/auth/src/components/ZoAuth/steps/Avatar.tsx` | Body type selection + avatar generation polling |
| `libs/auth/src/components/ZoAuth/steps/City.tsx` | Hometown selection (plain text v1) |

## API endpoints used

All endpoints already exist — no backend changes needed.

| Endpoint | Method | Purpose | Hook |
|----------|--------|---------|------|
| `/api/v1/profile/me/` | GET | Fetch profile (check missing fields) | `useProfile().refetchProfile` |
| `/api/v1/profile/me/` | POST | Update profile (nickname, body_type, place_name) | `useProfile().updateProfile` |
| `/api/v1/profile/custom-nickname/available` | GET | Check nickname availability | `useQueryApi("PROFILE_CUSTOM_NICKNAME_AVAILABLE", ...)` |

Note: `updateProfile` defaults to POST (via `useMutationApi` default method). The backend accepts POST on this endpoint — confirmed by existing usage in `SetZo.tsx`.

## Data flow

```
OTP verified → login() called → setStep("ONBOARDING_CHECK") (sync)
  → 2s later: setLoggedIn(true) fires
  → ZoAuth auto-close suppressed (isOnboarding guard, step is already ONBOARDING_CHECK)

  → ONBOARDING_CHECK:
    → useProfile() fetches profile
    → Computes queue: [NICKNAME, AVATAR, CITY] (only missing fields)
    → setOnboardingQueue(queue) in parent
    → setStep(queue[0]) → NICKNAME

  → NICKNAME: user picks "samurai.zo"
    → updateProfile({ data: { custom_nickname: "samurai.zo" } })
    → advanceOnboarding() → replaceStep(AVATAR)

  → AVATAR: user picks "bro"
    → updateProfile({ data: { body_type: "bro" } })
    → Poll refetchProfile() every 1s until avatar.image exists (max 10s)
    → advanceOnboarding() → replaceStep(CITY)

  → CITY: user types "Bangalore"
    → updateProfile({ data: { place_name: "Bangalore, India" } })
    → advanceOnboarding() → queue empty → replaceStep(WELCOME)

  → WELCOME: "Zo Zo samurai!" + avatar + 2s auto-close
  → hideModal() → App loads
```

## Styling

The auth modal uses `bg-zui-dark text-zui-white` (dark theme, white text). All new steps should match this existing style. Use the same layout pattern as existing steps: heading at top, content centered, action button at bottom.

Input styling should match the existing `Entry.tsx` OTP input pattern. Validation indicators use green (#66DF48) for pass, red for fail.

## Edge cases

- **User closes modal mid-onboarding:** Profile is partially saved. Next login, OnboardingCheck picks up where they left off (only shows remaining missing steps).
- **Avatar generation times out:** Proceed anyway. Avatar will generate in background and appear later.
- **Nickname already taken:** Show "taken" indicator, disable submit. User picks another.
- **User has ENS nickname but no custom_nickname:** ENS counts as having a nickname. Skip NICKNAME step.
- **Mobile login on zozozo.work (ZOSTEL_ENABLED):** The Zostel auth handshake happens before OnboardingCheck. For mobile login, `isLoggingWithMobile=true` gates the auto-close behind `isZostelLoggedIn`. Once Zostel auth completes, `hideModal()` would fire — but the `isOnboarding` guard catches it. Flow: OTP → Zostel auto-auth → OnboardingCheck → onboarding steps → Welcome → close.
- **PMS/Admin staff:** `skipOnboarding=true` on AuthProvider bypasses onboarding entirely. Staff log in and go straight to the app.
- **Duplicate ONBOARDING_CHECK push:** Entry.tsx's useEffect and OTP handler both call `setStep("ONBOARDING_CHECK")`. Guard with `if (step !== "ONBOARDING_CHECK")` in the useEffect to prevent duplicate stack entry.

## Known issues (pre-existing, not caused by this work)

- `refetchProfile()` in `useProfile.ts` calls `queryClient.resetQueries(["PROFILE", "ME"])` with uppercase keys, but the query is registered with lowercase `["profile", "me"]`. The reset is a no-op. The `refetch()` call works correctly.
- `Profile` type in `libs/definitions/auth/src/index.ts` is severely incomplete — missing ~20 fields the backend returns. This spec adds the critical ones.

## What this does NOT include

- Avatar trait editor (customizing individual traits) — future feature
- Location GPS permission (web has limited geolocation UX, city input is sufficient)
- Google Places autocomplete (v1 uses plain text — can be added later)
- Social connections (Twitter/Discord) — can be added post-onboarding
- Profile photo upload — Zobu avatar is the profile image
- Progressive completion rewards — can be added separately
- Removing WagmiProvider/RainbowKitProvider from AuthProvider (other features may depend on them)
