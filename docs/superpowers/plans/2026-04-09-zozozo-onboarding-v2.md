# zozozo.work Onboarding v2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the defunct web3 onboarding in `libs/auth/src/components/ZoAuth/` with an 8-step required onboarding gate that runs after OTP login on every zozozo.work session.

**Architecture:** Queue-based progressive onboarding. After OTP success → `ONBOARDING_CHECK` step → fetch profile + whereabouts → compute queue of missing fields → push first missing step → user advances through queue → `WELCOME` → modal closes. Returning users with partial profiles see only missing steps. PMS/Admin staff bypass via `skipOnboarding` prop.

**Tech Stack:** Next.js 14 (Pages Router), React 18, TypeScript, Tailwind CSS, react-query v3, axios, Jest. Shared via NX `libs/auth/`. Google Maps Places + Geocoding APIs (key: `NEXT_PUBLIC_GOOGLE_MAPS_KEY`).

**Spec:** `docs/superpowers/specs/2026-04-09-zozozo-onboarding-v2-design.md`

**Coordinated parallel work:** `docs/superpowers/plans/2026-04-09-zoauth-retro-tv-effect.md` (presentation-only change to the same `ZoAuth.tsx` root layout). Recommended merge order: TV effect first, then this plan on top — but they can ship in either order without functional conflict.

---

## Chunk 1: Scaffold — Types, Auth Context, ZoAuth Orchestrator

This chunk lays the foundation: extend the Profile type, add `skipOnboarding` to the auth context, rewrite the `ZoAuth.tsx` orchestrator with the new step enum and queue mechanics, and delete the 11 dead web3 step files. After this chunk, all apps compile, login still works, and the onboarding stub renders (but no real steps yet).

### Task 1: Extend the Profile type

**Files:**
- Modify: `libs/definitions/auth/src/index.ts`

- [ ] **Step 1: Open the file and locate the Profile interface**

Find the existing `Profile` interface (around line 18-58). Note its current shape so the additions slot in cleanly.

- [ ] **Step 2: Add the missing onboarding fields**

After the `work_role: string;` line (around line 57), add:

```typescript
  // Onboarding fields (returned by backend, previously untyped)
  custom_nickname?: string;
  ens_nickname?: string;
  selected_nickname?: string;
  body_type?: "bro" | "bae";
  avatar?: {
    image: string;
    metadata: string;
    ref_id: number;
  };
  pfp_image?: string;
  pfp_metadata?: {
    contract_address?: string;
    token_id?: string;
    metadata?: string;
    is_valid?: string;
  };
  place_name?: string;
  place_ref_id?: string;
  home_location?: { lat: number; lng: number } | null;
  country?: {
    code: string;
    name: string;
    local_currency?: string;
    flag?: string;
    mobile_code?: string;
  };
  cultures?: Array<{
    key: string;
    name: string;
    description?: string;
    icon?: string;
  }>;
  date_of_birth?: string;
```

**Critical:** Do NOT add a `country_citizen` field. The backend doesn't have one. The spec explicitly calls this out at line 708. Use `country` only.

- [ ] **Step 3: Verify it compiles**

Run: `npx nx build auth 2>&1 | tail -20`
Expected: SUCCESS. If there are pre-existing build errors unrelated to the type, note them but proceed.

- [ ] **Step 4: Commit**

```bash
git add libs/definitions/auth/src/index.ts
git commit -m "types(auth): extend Profile with onboarding fields"
```

---

### Task 2: Add skipOnboarding to AuthContext

**Files:**
- Modify: `libs/auth/src/contexts/auth/AuthContext.tsx`
- Modify: `libs/auth/src/contexts/auth/AuthProvider.tsx`

- [ ] **Step 1: Add skipOnboarding to the AuthContext interface**

In `libs/auth/src/contexts/auth/AuthContext.tsx`, find the `AuthContextInterface` and add `skipOnboarding`:

```typescript
interface AuthContextInterface {
  isLoggedIn: boolean | null;
  logout: () => void;
  login: (user: AuthUser, token: string, validTill: number) => void;
  user: AuthUser | null;
  showLoginModal: (
    allowedLoginTypes?: LoginTypes[],
    redirectPath?: string
  ) => void;
  skipOnboarding?: boolean;
}
```

Update the default context value:

```typescript
const AuthContext = createContext<AuthContextInterface>({
  isLoggedIn: null,
  user: null,
  login: () => {},
  logout: () => {},
  showLoginModal: () => {},
  skipOnboarding: false,
});
```

- [ ] **Step 2: Thread skipOnboarding through AuthProvider props**

In `libs/auth/src/contexts/auth/AuthProvider.tsx`, find the props interface for the provider component (likely `AuthProviderProps` or similar). Add:

```typescript
skipOnboarding?: boolean;
```

Find the `<AuthContext.Provider value={{...}}>` JSX. Add `skipOnboarding` to the value object so it's exposed via the context:

```tsx
<AuthContext.Provider
  value={{
    isLoggedIn,
    user,
    login,
    logout,
    showLoginModal,
    skipOnboarding,
  }}
>
```

The `skipOnboarding` prop should be destructured from the component's props at the top of the function body alongside `localKey`, `isLoginRequired`, etc.

- [ ] **Step 3: Wire skipOnboarding=true in PMS app**

In `apps/pms/src/pages/_app.tsx`, find the `<AuthProvider>` JSX and add `skipOnboarding`:

```tsx
<AuthProvider
  localKey="zo-admin"
  isLoginRequired
  isZostelLoginRequired
  allowedLoginTypes={["mobile"]}
  skipOnboarding
>
```

- [ ] **Step 4: Wire skipOnboarding=true in Admin app**

In `apps/admin/src/pages/_app.tsx`, do the same:

```tsx
<AuthProvider
  localKey="zo-admin"
  // ...existing props
  skipOnboarding
>
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx nx build pms 2>&1 | tail -20`
Expected: SUCCESS

Run: `npx nx build admin 2>&1 | tail -20`
Expected: SUCCESS

- [ ] **Step 6: Commit**

```bash
git add libs/auth/src/contexts/auth/AuthContext.tsx libs/auth/src/contexts/auth/AuthProvider.tsx apps/pms/src/pages/_app.tsx apps/admin/src/pages/_app.tsx
git commit -m "feat(auth): add skipOnboarding prop to AuthProvider for PMS/Admin"
```

---

### Task 3: Rewrite ZoAuth orchestrator — step type and queue state

**Files:**
- Modify: `libs/auth/src/components/ZoAuth/ZoAuth.tsx`

- [ ] **Step 1: Update the ZoAuthStep type**

Find the `ZoAuthStep` type definition (around line 32-48 per v1 spec). Replace it entirely with:

```typescript
export type ZoAuthStep =
  | "ENTRY"
  | "MOBILE_LOGIN"
  | "EMAIL_LOGIN"
  | "ONBOARDING_CHECK"
  | "NICKNAME"
  | "AVATAR"
  | "WHEREABOUTS"
  | "CITIZEN"
  | "HOMETOWN"
  | "BIRTHDAY"
  | "CULTURES"
  | "WELCOME";
```

- [ ] **Step 2: Remove imports for deleted step components**

Find and DELETE these imports at the top of `ZoAuth.tsx`:

```typescript
import Founder from "./steps/Founder";
import Intro from "./steps/Intro";
import NoENS from "./steps/NoENS";
import NoFounder from "./steps/NoFounder";
import NoPFP from "./steps/NoPFP";
import SetENS from "./steps/SetENS";
import SetPFP from "./steps/SetPFP";
import SetZo from "./steps/SetZo";
import Socials from "./steps/Socials";
import WalletAddition from "./steps/WalletAddition";
import WalletConnecting from "./steps/WalletConnecting";
```

- [ ] **Step 3: Add imports for new step components (will create later in chunks 3-4)**

Add at the top with the other step imports:

```typescript
import Nickname from "./steps/Nickname";
import Avatar from "./steps/Avatar";
import Whereabouts from "./steps/Whereabouts";
import Citizen from "./steps/Citizen";
import Hometown from "./steps/Hometown";
import Birthday from "./steps/Birthday";
import Cultures from "./steps/Cultures";
```

These imports will be red until those files exist (chunks 3-4). That's expected.

- [ ] **Step 4: Add ONBOARDING_STEPS constant and onboardingQueue state**

After the existing `useState` declarations in the `ZoAuth` component (around line 64-66), add:

```typescript
const ONBOARDING_STEPS: ZoAuthStep[] = [
  "ONBOARDING_CHECK",
  "NICKNAME",
  "AVATAR",
  "WHEREABOUTS",
  "CITIZEN",
  "HOMETOWN",
  "BIRTHDAY",
  "CULTURES",
];

const isOnboarding = ONBOARDING_STEPS.includes(step);

const [onboardingQueue, setOnboardingQueue] = useState<ZoAuthStep[]>([]);

const advanceOnboarding = () => {
  const remaining = onboardingQueue.slice(1);
  setOnboardingQueue(remaining);
  if (remaining.length > 0) {
    replaceStep(remaining[0]);
  } else {
    replaceStep("WELCOME");
  }
};
```

`replaceStep` should already exist in the component (it replaces the top of the step stack instead of pushing). If not, add a wrapper that calls `setStep` after popping the current step.

- [ ] **Step 5: Update the auto-close useEffect with isOnboarding guard**

Find the useEffect (around lines 90-101 per v1 spec) that calls `hideModal()` when `isLoggedIn` becomes true. Replace with:

```typescript
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

The key change: `&& !isOnboarding` prevents the modal from auto-closing while a user is mid-onboarding.

- [ ] **Step 6: Update renderStep() — remove deleted cases, add stub cases**

Find the `renderStep()` function. Remove all case statements for the deleted steps (`INTRO`, `SET_ENS`, `NO_ENS`, `SET_ZO`, `SET_PFP`, `NO_PFP`, `WALLET_ADDITION`, `WALLET_CONNECTING`, `SOCIALS`, `FOUNDER`, `NO_FOUNDER`).

Add new case statements for the new steps:

```typescript
case "ONBOARDING_CHECK":
  return (
    <OnboardingCheck
      setStep={setStep}
      setFocus={setFocus}
      setOnboardingQueue={setOnboardingQueue}
    />
  );
case "NICKNAME":
  return <Nickname advanceOnboarding={advanceOnboarding} />;
case "AVATAR":
  return <Avatar advanceOnboarding={advanceOnboarding} />;
case "WHEREABOUTS":
  return <Whereabouts advanceOnboarding={advanceOnboarding} />;
case "CITIZEN":
  return <Citizen advanceOnboarding={advanceOnboarding} />;
case "HOMETOWN":
  return <Hometown advanceOnboarding={advanceOnboarding} />;
case "BIRTHDAY":
  return <Birthday advanceOnboarding={advanceOnboarding} />;
case "CULTURES":
  return <Cultures advanceOnboarding={advanceOnboarding} />;
```

Keep the existing `ENTRY`, `MOBILE_LOGIN`, `EMAIL_LOGIN`, and `WELCOME` cases unchanged.

- [ ] **Step 7: Hide back button during onboarding**

Find the header section (around lines 176-189 per v1 spec) that conditionally renders the back button. Replace the back button condition:

```tsx
{step === "ENTRY" ? (
  <div className="flex flex-shrink-0 flex-col mb-4 items-start">
    <span className="font-semibold text-3xl leading-none">
      Follow Your Heart
    </span>
    <h1 className="font-bold text-6xl mt-2 text-zui-pink">Zo World</h1>
  </div>
) : step !== "WELCOME" && !ONBOARDING_STEPS.includes(step) ? (
  <div className="flex flex-shrink-0 flex-col mb-4 items-start">
    <button onClick={goBack}>
      <Icon name="ArrowLeft" size={24} fill="#fff" />
    </button>
  </div>
) : null}
```

- [ ] **Step 8: Conditionally hide UserCollection during onboarding**

Find the `<UserCollection focus={focus} />` JSX (towards the bottom of the return). Wrap it:

```tsx
{!isOnboarding && <UserCollection focus={focus} />}
```

- [ ] **Step 9: Note that the build is currently red (expected)**

The new step component imports point at files that don't exist yet. This is expected — we'll create them in chunks 3-4. Don't run the build right now; it will fail.

- [ ] **Step 10: Commit**

```bash
git add libs/auth/src/components/ZoAuth/ZoAuth.tsx
git commit -m "feat(auth): rewrite ZoAuth orchestrator with onboarding queue and 8-step support"
```

---

### Task 4: Delete dead web3 step components

**Files:**
- Delete: 11 step files

- [ ] **Step 1: Delete all dead step files in one batch**

```bash
cd libs/auth/src/components/ZoAuth/steps
rm Intro.tsx SetENS.tsx NoENS.tsx SetZo.tsx SetPFP.tsx NoPFP.tsx WalletAddition.tsx WalletConnecting.tsx Socials.tsx Founder.tsx NoFounder.tsx
cd -
```

Verify:

```bash
ls libs/auth/src/components/ZoAuth/steps/
```

Expected output: only `EmailLogin.tsx`, `Entry.tsx`, `MobileLogin.tsx`, `OnboardingCheck.tsx`, `Welcome.tsx` (the 5 files that survive — plus the new step components we create in later chunks).

- [ ] **Step 2: Search for stale references to deleted files**

Run: `grep -r "Intro\|SetENS\|NoENS\|SetZo\|SetPFP\|NoPFP\|WalletAddition\|WalletConnecting\|Socials\|NoFounder" libs/auth/src/ apps/ 2>&1 | grep -v node_modules | grep -v ".test." | head -30`

Expected: no matches in source files (some matches in unrelated comments/docs are OK, but no `import` statements). `Founder` may match unrelated `founder` references — that's fine.

If any imports remain, remove them. Common offenders are barrel files (`index.ts` re-exports).

- [ ] **Step 3: Commit**

```bash
git add -A libs/auth/src/components/ZoAuth/steps/
git commit -m "refactor(auth): delete 11 dead web3 onboarding step components"
```

---

### Task 5: Verify Chunk 1 builds (without new step files)

The new step component imports in `ZoAuth.tsx` reference files we haven't created yet. To verify Chunk 1 in isolation, we'll temporarily stub those imports.

- [ ] **Step 1: Create empty stub files for the 7 new step components**

```bash
mkdir -p libs/auth/src/components/ZoAuth/steps
for name in Nickname Avatar Whereabouts Citizen Hometown Birthday Cultures; do
  cat > "libs/auth/src/components/ZoAuth/steps/${name}.tsx" <<EOF
import { FC } from "react";
interface ${name}Props { advanceOnboarding: () => void; }
const ${name}: FC<${name}Props> = ({ advanceOnboarding }) => (
  <div className="flex flex-1 items-center justify-center">
    <span className="text-white/40">${name} (stub)</span>
  </div>
);
export default ${name};
EOF
done
```

These are 1-line stubs that compile cleanly. They will be replaced in Chunks 3 and 4.

- [ ] **Step 2: Build all affected apps**

```bash
npx nx build website 2>&1 | tail -10
```
Expected: SUCCESS.

```bash
npx nx build dashboard 2>&1 | tail -10
```
Expected: SUCCESS (or pre-existing PedestalScene error only — not related to auth changes per v1 spec note).

```bash
npx nx build pms 2>&1 | tail -10
```
Expected: SUCCESS.

```bash
npx nx build admin 2>&1 | tail -10
```
Expected: SUCCESS.

- [ ] **Step 3: Manual smoke test (optional but recommended)**

```bash
npx nx serve website --port 4202
```

Open `http://localhost:4202/`. Click "Become a Citizen". Complete OTP login with a test phone number. You should land on `OnboardingCheck` (which is still the old commented-out stub from v1 — it'll just show "Please Wait"). The modal should NOT close automatically. Press Ctrl+C to stop the server.

If the modal closes immediately on login, the auto-close guard (Task 3 Step 5) is wrong. Re-check.

- [ ] **Step 4: Commit the stubs**

```bash
git add libs/auth/src/components/ZoAuth/steps/
git commit -m "chore(auth): stub new onboarding step components for Chunk 1 build verification"
```

---

## Chunk 2: OnboardingCheck + Welcome + Entry Fixes

This chunk implements the queue computation logic that decides which steps a user sees. The queue function is a pure function — perfect for unit testing. Also rewrites `Welcome.tsx` to render the new avatar, fixes the duplicate `ONBOARDING_CHECK` push in `Entry.tsx`, and creates the whereabouts utility module.

### Task 6: Create the whereabouts utility module (TDD)

**Files:**
- Create: `libs/auth/src/utils/whereabouts.ts`
- Create: `libs/auth/src/utils/whereabouts.test.ts`

The whereabouts module wraps `GET` and `POST /api/v2/places/whereabouts/` with typed helpers. Critical: the location object uses `long`, NOT `lng` (this is the source of one of the spec's biggest gotchas).

- [ ] **Step 1: Write the failing test**

Create `libs/auth/src/utils/whereabouts.test.ts`:

```typescript
import { fetchWhereabouts, postWhereabouts } from "./whereabouts";

// Mock the zoServer axios instance
jest.mock("../utils", () => ({
  zoServer: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import { zoServer } from "../utils";
const mockGet = zoServer.get as jest.Mock;
const mockPost = zoServer.post as jest.Mock;

describe("whereabouts utils", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  describe("fetchWhereabouts", () => {
    it("returns the whereabouts record on success", async () => {
      mockGet.mockResolvedValue({
        data: {
          place_name: "Bengaluru",
          place_ref_id: "ChIJbU60yXAWrjsR4E9-UejD3_g",
          location: { lat: 12.97, long: 77.74 },
          created_at: "2026-03-22T13:33:03Z",
          updated_at: "2026-03-22T13:33:03Z",
        },
      });
      const result = await fetchWhereabouts();
      expect(result).not.toBeNull();
      expect(result?.place_name).toBe("Bengaluru");
      expect(result?.location.long).toBe(77.74);
      expect(mockGet).toHaveBeenCalledWith("/api/v2/places/whereabouts/");
    });

    it("returns null on 404 (no whereabouts set)", async () => {
      mockGet.mockRejectedValue({ response: { status: 404 } });
      const result = await fetchWhereabouts();
      expect(result).toBeNull();
    });

    it("rethrows on non-404 errors", async () => {
      mockGet.mockRejectedValue({ response: { status: 500 } });
      await expect(fetchWhereabouts()).rejects.toMatchObject({
        response: { status: 500 },
      });
    });
  });

  describe("postWhereabouts", () => {
    it("sends the location with 'long' (not 'lng')", async () => {
      mockPost.mockResolvedValue({ data: {} });
      await postWhereabouts({
        place_name: "Bengaluru",
        place_ref_id: "ChIJbU60yXAWrjsR4E9-UejD3_g",
        location: { lat: 12.97, long: 77.74 },
      });
      expect(mockPost).toHaveBeenCalledWith(
        "/api/v2/places/whereabouts/",
        expect.objectContaining({
          location: { lat: 12.97, long: 77.74 },
        })
      );
      // Critically: the call must NOT have 'lng' anywhere
      const callArg = mockPost.mock.calls[0][1];
      expect(JSON.stringify(callArg)).not.toContain("lng");
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx nx test auth --testFile=libs/auth/src/utils/whereabouts.test.ts 2>&1 | tail -30
```

Expected: FAIL with "Cannot find module './whereabouts'" or similar.

- [ ] **Step 3: Implement the minimal whereabouts.ts**

Create `libs/auth/src/utils/whereabouts.ts`:

```typescript
import { zoServer } from "../utils";

export interface WhereaboutsRecord {
  place_name: string;
  place_ref_id: string;
  location: { lat: number; long: number };  // NOTE: 'long', not 'lng'
  created_at?: string;
  updated_at?: string;
}

export interface WhereaboutsPayload {
  place_name: string;
  place_ref_id: string;
  location: { lat: number; long: number };  // NOTE: 'long', not 'lng'
}

export async function fetchWhereabouts(): Promise<WhereaboutsRecord | null> {
  try {
    const response = await zoServer.get("/api/v2/places/whereabouts/");
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function postWhereabouts(
  payload: WhereaboutsPayload
): Promise<WhereaboutsRecord> {
  const response = await zoServer.post("/api/v2/places/whereabouts/", payload);
  return response.data;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx nx test auth --testFile=libs/auth/src/utils/whereabouts.test.ts 2>&1 | tail -20
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add libs/auth/src/utils/whereabouts.ts libs/auth/src/utils/whereabouts.test.ts
git commit -m "feat(auth): add typed whereabouts helper enforcing 'long' field name"
```

---

### Task 7: Extract OnboardingCheck queue computation as a pure function (TDD)

**Files:**
- Create: `libs/auth/src/components/ZoAuth/steps/computeOnboardingQueue.ts`
- Create: `libs/auth/src/components/ZoAuth/steps/computeOnboardingQueue.test.ts`

The queue logic is the most testable part of the whole flow. Extract it as a pure function before writing the React component that calls it.

- [ ] **Step 1: Write the failing test**

Create `libs/auth/src/components/ZoAuth/steps/computeOnboardingQueue.test.ts`:

```typescript
import { computeOnboardingQueue } from "./computeOnboardingQueue";
import { Profile } from "@zo/definitions/auth";
import { WhereaboutsRecord } from "../../../utils/whereabouts";

const emptyProfile: Partial<Profile> = {};

const fullProfile: Partial<Profile> = {
  custom_nickname: "samurai.zo",
  body_type: "bro",
  avatar: { image: "https://example/avatar.svg", metadata: "", ref_id: 1 },
  country: { code: "IND", name: "India" },
  place_name: "Bangalore",
  date_of_birth: "1991-08-03",
  cultures: [{ key: "business", name: "Business" }],
};

const someWhereabouts: WhereaboutsRecord = {
  place_name: "Bengaluru",
  place_ref_id: "ChIJ...",
  location: { lat: 12.97, long: 77.74 },
};

describe("computeOnboardingQueue", () => {
  it("returns all 7 step names for a brand-new user (no profile fields, no whereabouts)", () => {
    const queue = computeOnboardingQueue(emptyProfile as Profile, null);
    expect(queue).toEqual([
      "NICKNAME",
      "AVATAR",
      "WHEREABOUTS",
      "CITIZEN",
      "HOMETOWN",
      "BIRTHDAY",
      "CULTURES",
    ]);
  });

  it("returns an empty queue when every field is filled", () => {
    const queue = computeOnboardingQueue(fullProfile as Profile, someWhereabouts);
    expect(queue).toEqual([]);
  });

  it("treats ens_nickname as equivalent to custom_nickname", () => {
    const profile = { ...fullProfile, custom_nickname: undefined, ens_nickname: "samurai.eth" };
    const queue = computeOnboardingQueue(profile as Profile, someWhereabouts);
    expect(queue).not.toContain("NICKNAME");
  });

  it("queues only WHEREABOUTS when whereabouts is null but everything else is filled", () => {
    const queue = computeOnboardingQueue(fullProfile as Profile, null);
    expect(queue).toEqual(["WHEREABOUTS"]);
  });

  it("queues CULTURES when cultures array is empty", () => {
    const profile = { ...fullProfile, cultures: [] };
    const queue = computeOnboardingQueue(profile as Profile, someWhereabouts);
    expect(queue).toEqual(["CULTURES"]);
  });

  it("does not queue CULTURES when at least one culture is present", () => {
    const profile = {
      ...fullProfile,
      cultures: [{ key: "business", name: "Business" }],
    };
    const queue = computeOnboardingQueue(profile as Profile, someWhereabouts);
    expect(queue).not.toContain("CULTURES");
  });

  it("queues only CITIZEN when country.code is missing", () => {
    const profile = { ...fullProfile, country: undefined };
    const queue = computeOnboardingQueue(profile as Profile, someWhereabouts);
    expect(queue).toEqual(["CITIZEN"]);
  });

  it("queues steps in the correct order (Case 2 partial fill)", () => {
    const profile = {
      custom_nickname: "samurai.zo",
      body_type: "bro" as const,
      avatar: { image: "https://example/avatar.svg", metadata: "", ref_id: 1 },
      // missing: country, place_name, date_of_birth, cultures
    };
    const queue = computeOnboardingQueue(profile as Profile, someWhereabouts);
    expect(queue).toEqual(["CITIZEN", "HOMETOWN", "BIRTHDAY", "CULTURES"]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx nx test auth --testFile=libs/auth/src/components/ZoAuth/steps/computeOnboardingQueue.test.ts 2>&1 | tail -20
```

Expected: FAIL with "Cannot find module './computeOnboardingQueue'".

- [ ] **Step 3: Implement the queue function**

Create `libs/auth/src/components/ZoAuth/steps/computeOnboardingQueue.ts`:

```typescript
import { Profile } from "@zo/definitions/auth";
import { WhereaboutsRecord } from "../../../utils/whereabouts";
import { ZoAuthStep } from "../ZoAuth";

/**
 * Pure function that determines which onboarding steps a user is missing.
 * Order matters — the returned array is the order steps are presented.
 *
 * Whereabouts is fetched separately (not on the profile object) and passed in.
 * Pass `null` if no whereabouts record exists; the function will queue WHEREABOUTS.
 */
export function computeOnboardingQueue(
  profile: Profile,
  whereabouts: WhereaboutsRecord | null
): ZoAuthStep[] {
  const queue: ZoAuthStep[] = [];

  if (!profile.custom_nickname && !profile.ens_nickname) {
    queue.push("NICKNAME");
  }
  if (!profile.body_type) {
    queue.push("AVATAR");
  }
  if (!whereabouts) {
    queue.push("WHEREABOUTS");
  }
  if (!profile.country?.code) {
    queue.push("CITIZEN");
  }
  if (!profile.place_name) {
    queue.push("HOMETOWN");
  }
  if (!profile.date_of_birth) {
    queue.push("BIRTHDAY");
  }
  if (!profile.cultures || profile.cultures.length < 1) {
    queue.push("CULTURES");
  }

  return queue;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx nx test auth --testFile=libs/auth/src/components/ZoAuth/steps/computeOnboardingQueue.test.ts 2>&1 | tail -20
```

Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/computeOnboardingQueue.ts libs/auth/src/components/ZoAuth/steps/computeOnboardingQueue.test.ts
git commit -m "feat(auth): pure queue computation function with full test coverage"
```

---

### Task 8: Rewrite OnboardingCheck.tsx to use the queue function

**Files:**
- Modify: `libs/auth/src/components/ZoAuth/steps/OnboardingCheck.tsx`

- [ ] **Step 1: Replace the entire file**

Replace the contents of `libs/auth/src/components/ZoAuth/steps/OnboardingCheck.tsx` with:

```typescript
import { FC, useEffect, useState } from "react";
import { useAuth } from "../../../contexts/auth";
import useProfile from "../../../hooks/useProfile";
import { fetchWhereabouts, WhereaboutsRecord } from "../../../utils/whereabouts";
import { ZoAuthStep, ZoAuthStepProps } from "../ZoAuth";
import { computeOnboardingQueue } from "./computeOnboardingQueue";

interface OnboardingCheckProps extends ZoAuthStepProps {
  setOnboardingQueue: (queue: ZoAuthStep[]) => void;
}

const OnboardingCheck: FC<OnboardingCheckProps> = ({
  setStep,
  setOnboardingQueue,
}) => {
  const { skipOnboarding } = useAuth();
  const { profile } = useProfile();
  const [whereabouts, setWhereabouts] = useState<
    WhereaboutsRecord | null | undefined
  >(undefined);

  // Fetch whereabouts once on mount (it's not on the profile object)
  useEffect(() => {
    fetchWhereabouts()
      .then((result) => setWhereabouts(result))
      .catch(() => setWhereabouts(null));
  }, []);

  useEffect(() => {
    // Wait for both profile and whereabouts to be resolved
    if (!profile || whereabouts === undefined) return;

    if (skipOnboarding) {
      setStep("WELCOME");
      return;
    }

    const queue = computeOnboardingQueue(profile, whereabouts);

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

- [ ] **Step 2: Verify the file compiles**

```bash
npx nx build website 2>&1 | tail -10
```
Expected: SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/OnboardingCheck.tsx
git commit -m "feat(auth): rewrite OnboardingCheck with queue computation and whereabouts fetch"
```

---

### Task 9: Update Welcome.tsx to render new avatar + nickname

**Files:**
- Modify: `libs/auth/src/components/ZoAuth/steps/Welcome.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
import { FC, useEffect } from "react";
import useProfile from "../../../hooks/useProfile";
import { ZoAuthStepProps } from "../ZoAuth";

interface WelcomeProps extends ZoAuthStepProps {
  hideModal: () => void;
}

const Welcome: FC<WelcomeProps> = ({ setFocus, hideModal }) => {
  const { profile } = useProfile();

  useEffect(() => {
    setFocus("all");
  }, [setFocus]);

  useEffect(() => {
    const timer = setTimeout(hideModal, 2000);
    return () => clearTimeout(timer);
  }, [hideModal]);

  const displayName =
    profile?.custom_nickname?.replace(".zo", "") ||
    profile?.ens_nickname ||
    profile?.first_name ||
    "Citizen";

  const avatarUrl = profile?.avatar?.image;

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt="Your Zobu"
          className="w-32 h-32 rounded-full mb-6 border-2 border-white/20"
        />
      )}
      <span className="text-2xl">
        Zo Zo{" "}
        <span className="text-zui-pink font-bold">{displayName}</span>!
      </span>
      <span className="text-xl mt-4">Welcome to Zo World</span>
      <i className="uil uil-spinner animate-spin mt-6" />
    </div>
  );
};

export default Welcome;
```

- [ ] **Step 2: Verify the build**

```bash
npx nx build website 2>&1 | tail -10
```
Expected: SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/Welcome.tsx
git commit -m "feat(auth): Welcome step renders generated avatar and custom nickname"
```

---

### Task 10: Fix duplicate ONBOARDING_CHECK push in Entry.tsx

**Files:**
- Modify: `libs/auth/src/components/ZoAuth/steps/Entry.tsx`

- [ ] **Step 1: Find and remove the redundant useEffect**

Open `libs/auth/src/components/ZoAuth/steps/Entry.tsx`. Locate the `useEffect` that watches `isLoggedIn` and calls `setStep("ONBOARDING_CHECK")` (around lines 104-121 per v1 spec). Per v1 spec analysis, the OTP success handler already calls `setStep("ONBOARDING_CHECK")` synchronously, so this useEffect causes a duplicate stack entry.

The simplest fix per v1 spec note: **delete the useEffect entirely**. The `isLoggedIn`-based navigation was only needed for wallet-connected users (which we're removing).

If a manual smoke test reveals returning users no longer land on `ONBOARDING_CHECK` after re-opening the modal, restore the effect with a guard:

```typescript
useEffect(() => {
  if (isLoggedIn && step !== "ONBOARDING_CHECK") {
    setStep("ONBOARDING_CHECK");
  }
}, [isLoggedIn, step]);
```

- [ ] **Step 2: Also remove wallet UI from Entry.tsx (per v1 spec)**

In the same file, remove:
- The `useAccount` import from `wagmi` (if present)
- The `isConnected` check in any useEffect that navigates to `WALLET_CONNECTING`
- The wallet button / icon from the JSX (the `CustomButton` or `CustomConnectButton` component render)

Keep: phone OTP UI, email login option, OTP input/verification UI.

`WagmiProvider` and `RainbowKitProvider` in `AuthProvider.tsx` remain — other features depend on them.

- [ ] **Step 3: Verify build**

```bash
npx nx build website 2>&1 | tail -10
```
Expected: SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/Entry.tsx
git commit -m "fix(auth): remove wallet UI and duplicate ONBOARDING_CHECK push from Entry"
```

---

### Task 11: Manual smoke test of Chunk 2

- [ ] **Step 1: Start website locally**

```bash
npx nx serve website --port 4202
```

- [ ] **Step 2: Test new-user flow against the stubs**

1. Open `http://localhost:4202/`
2. Click "Become a Citizen"
3. Enter a phone number → receive OTP → verify
4. You should see: `OnboardingCheck` ("Setting things up...") briefly, then it should land on the first stub step (`Nickname (stub)`)
5. The stub steps don't have an "advance" button — close the modal manually

This proves: queue computation runs, the first step is rendered, and the modal does NOT auto-close.

- [ ] **Step 3: Test returning-user-with-full-profile flow**

If you have a test account with all fields filled (Samurai's account does), log in with that. The queue should be empty → `WELCOME` should render → modal closes after 2s.

If the modal doesn't close, debug `OnboardingCheck` logging.

- [ ] **Step 4: Stop the server**

`Ctrl+C`

---

## Chunk 3: Step Components — No Google APIs Required

Build the 5 step components that don't need Google Maps integration. After this chunk, 5 of 7 step components are functional end-to-end against the live API.

### Task 12: Implement Nickname.tsx

**Files:**
- Replace: `libs/auth/src/components/ZoAuth/steps/Nickname.tsx` (currently a stub)

- [ ] **Step 1: Replace the stub with the full component**

```typescript
import { FC, useEffect, useState } from "react";
import useProfile from "../../../hooks/useProfile";
import { useQueryApi } from "../../../hooks/useQueryApi";

interface NicknameProps {
  advanceOnboarding: () => void;
}

const Nickname: FC<NicknameProps> = ({ advanceOnboarding }) => {
  const { updateProfile } = useProfile();
  const [input, setInput] = useState("");
  const [checkEnabled, setCheckEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isValidLength = input.length >= 4 && input.length <= 16;
  const isAlphanumeric = /^[a-z0-9]+$/i.test(input);
  const isLocallyValid = isValidLength && isAlphanumeric;

  // Debounce the availability check by 500ms after the user stops typing
  useEffect(() => {
    setCheckEnabled(false);
    if (!isLocallyValid) return;
    const timer = setTimeout(() => setCheckEnabled(true), 500);
    return () => clearTimeout(timer);
  }, [input, isLocallyValid]);

  const { data: availabilityData, isLoading: isCheckingAvailability } =
    useQueryApi(
      "PROFILE_CUSTOM_NICKNAME_AVAILABLE",
      {
        enabled: checkEnabled,
        refetchOnWindowFocus: false,
        retry: false,
      },
      "",
      `nickname=${input.toLowerCase()}.zo`
    );

  const isAvailable = availabilityData?.data?.available === true;
  const allValid =
    isLocallyValid && checkEnabled && isAvailable && !isCheckingAvailability;

  const handleSubmit = () => {
    if (!allValid || isSaving) return;
    setIsSaving(true);
    updateProfile(
      { data: { custom_nickname: `${input.toLowerCase()}.zo` } },
      {
        onSuccess: () => advanceOnboarding(),
        onError: () => setIsSaving(false),
      }
    );
  };

  const renderCheck = (
    label: string,
    passed: boolean,
    checking?: boolean
  ) => (
    <div className="flex items-center gap-2 text-sm">
      {checking ? (
        <i className="uil uil-spinner animate-spin text-white/40" />
      ) : passed ? (
        <span className="text-[#66DF48]">✓</span>
      ) : input.length > 0 ? (
        <span className="text-red-400">✗</span>
      ) : (
        <span className="text-white/20">○</span>
      )}
      <span className={passed ? "text-white/80" : "text-white/40"}>{label}</span>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-2xl font-bold mb-2">Pick your .zo handle</span>
      <span className="text-sm text-white/50 mb-8">
        Your permanent identity in Zo World
      </span>

      <div className="flex items-center w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus-within:border-white/30 transition-colors">
        <input
          type="text"
          value={input}
          onChange={(e) =>
            setInput(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))
          }
          placeholder="yourname"
          className="bg-transparent text-white text-lg flex-1 outline-none placeholder-white/20"
          maxLength={16}
          autoFocus
        />
        <span className="text-white/30 text-lg">.zo</span>
      </div>

      <div className="flex flex-col gap-1.5 mb-8">
        {renderCheck("4-16 characters", isValidLength)}
        {renderCheck(
          "Letters and numbers only",
          input.length > 0 ? isAlphanumeric : false
        )}
        {renderCheck(
          isAvailable ? "Available!" : "Available",
          isAvailable,
          isCheckingAvailability || (isLocallyValid && !checkEnabled)
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allValid || isSaving}
        className={`mt-auto w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
          allValid && !isSaving
            ? "bg-white text-black hover:bg-white/90 cursor-pointer"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        {isSaving ? "Claiming..." : "Claim it"}
      </button>
    </div>
  );
};

export default Nickname;
```

- [ ] **Step 2: Verify import path for useQueryApi**

```bash
ls libs/auth/src/hooks/ | grep -i query
```

If the file is named differently or the export is named differently, adjust the import in `Nickname.tsx`.

- [ ] **Step 3: Build website**

```bash
npx nx build website 2>&1 | tail -10
```
Expected: SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/Nickname.tsx
git commit -m "feat(auth): Nickname step with availability check"
```

---

### Task 13: Implement Avatar.tsx

**Files:**
- Replace: `libs/auth/src/components/ZoAuth/steps/Avatar.tsx`

- [ ] **Step 1: Replace the stub**

```typescript
import { FC, useCallback, useEffect, useRef, useState } from "react";
import useProfile from "../../../hooks/useProfile";

interface AvatarProps {
  advanceOnboarding: () => void;
}

type BodyType = "bro" | "bae";
type Phase = "select" | "generating" | "done";

const Avatar: FC<AvatarProps> = ({ advanceOnboarding }) => {
  const { profile, updateProfile, refetchProfile } = useProfile();
  const [selected, setSelected] = useState<BodyType | null>(null);
  const [phase, setPhase] = useState<Phase>("select");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const displayName =
    profile?.custom_nickname?.replace(".zo", "") ||
    profile?.first_name ||
    "";

  const startPolling = useCallback(() => {
    setPhase("generating");
    pollCountRef.current = 0;

    pollRef.current = setInterval(() => {
      pollCountRef.current++;
      refetchProfile();

      if (pollCountRef.current >= 10) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        // Timeout — proceed anyway
        advanceOnboarding();
      }
    }, 1000);
  }, [refetchProfile, advanceOnboarding]);

  // Watch for avatar.image appearing → done phase
  useEffect(() => {
    if (phase === "generating" && profile?.avatar?.image) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      setPhase("done");
    }
  }, [phase, profile?.avatar?.image]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleGenerate = () => {
    if (!selected) return;
    updateProfile(
      { data: { body_type: selected } },
      {
        onSuccess: () => startPolling(),
        onError: () => setPhase("select"),
      }
    );
  };

  const BroSilhouette = () => (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <circle cx="60" cy="40" r="25" fill="currentColor" opacity="0.3" />
      <rect x="35" y="70" width="50" height="60" rx="8" fill="currentColor" opacity="0.2" />
      <rect x="25" y="75" width="15" height="45" rx="6" fill="currentColor" opacity="0.15" />
      <rect x="80" y="75" width="15" height="45" rx="6" fill="currentColor" opacity="0.15" />
    </svg>
  );

  const BaeSilhouette = () => (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <circle cx="60" cy="38" r="23" fill="currentColor" opacity="0.3" />
      <path
        d="M38 70 Q38 65 60 65 Q82 65 82 70 L78 130 Q78 135 60 135 Q42 135 42 130 Z"
        fill="currentColor"
        opacity="0.2"
      />
      <rect x="25" y="75" width="14" height="40" rx="6" fill="currentColor" opacity="0.15" />
      <rect x="81" y="75" width="14" height="40" rx="6" fill="currentColor" opacity="0.15" />
    </svg>
  );

  if (phase === "done") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center w-full">
        <img
          src={profile?.avatar?.image}
          alt="Your Zobu"
          className="w-40 h-40 rounded-full mb-6 border-2 border-[#66DF48]/30"
        />
        <span className="text-lg text-white/60 mb-8">Looking good!</span>
        <button
          onClick={advanceOnboarding}
          className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider bg-white text-black hover:bg-white/90 cursor-pointer transition-all"
        >
          Zo Zo Zo! Let&apos;s Go
        </button>
      </div>
    );
  }

  if (phase === "generating") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center w-full">
        <i className="uil uil-spinner animate-spin text-4xl mb-4" />
        <span className="text-lg">Generating your Zobu...</span>
        <span className="text-sm text-white/40 mt-2">This takes a few seconds</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-2xl font-bold mb-2">
        Choose your body shape{displayName ? `, ${displayName}` : ""}
      </span>
      <span className="text-sm text-white/50 mb-8">
        This determines your Zobu avatar
      </span>

      <div className="flex gap-4 w-full mb-8">
        {(["bae", "bro"] as BodyType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelected(type)}
            className={`flex-1 flex flex-col items-center p-6 rounded-2xl border-2 transition-all cursor-pointer ${
              selected === type
                ? "border-[#66DF48] bg-white/5"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <div className="w-20 h-28 text-white mb-3">
              {type === "bro" ? <BroSilhouette /> : <BaeSilhouette />}
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">
              {type === "bro" ? "Bro" : "Bae"}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        disabled={!selected}
        className={`mt-auto w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
          selected
            ? "bg-white text-black hover:bg-white/90 cursor-pointer"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        Generate Avatar
      </button>
    </div>
  );
};

export default Avatar;
```

- [ ] **Step 2: Build**

```bash
npx nx build website 2>&1 | tail -10
```
Expected: SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/Avatar.tsx
git commit -m "feat(auth): Avatar step with body type selection and generation polling"
```

---

### Task 14: Bundle the country list and implement Citizen.tsx

**Files:**
- Create: `libs/auth/src/data/countries.json`
- Replace: `libs/auth/src/components/ZoAuth/steps/Citizen.tsx`

- [ ] **Step 1: Create the country list JSON**

Create `libs/auth/src/data/countries.json` with the canonical list of ISO 3-letter country codes. Use a publicly available list (e.g., from `https://gist.githubusercontent.com/keeguon/2310008/raw/bdc2ce1c1e3f28f9cab5b4393c7549f38361be4e/countries.json`) or a bundled copy. Each entry needs `{ code: "IND", name: "India", flag: "🇮🇳" }`.

For the implementer: a hand-curated 50-country list is fine for v1 if a full list isn't available. The user can expand later. Minimum entries: India (IND), United States (USA), United Kingdom (GBR), Germany (DEU), France (FRA), Canada (CAN), Australia (AUS), Japan (JPN), Singapore (SGP), Netherlands (NLD), and any other countries known to be in the user base.

```json
[
  { "code": "IND", "name": "India", "flag": "🇮🇳" },
  { "code": "USA", "name": "United States", "flag": "🇺🇸" },
  { "code": "GBR", "name": "United Kingdom", "flag": "🇬🇧" },
  { "code": "DEU", "name": "Germany", "flag": "🇩🇪" },
  { "code": "FRA", "name": "France", "flag": "🇫🇷" },
  { "code": "CAN", "name": "Canada", "flag": "🇨🇦" },
  { "code": "AUS", "name": "Australia", "flag": "🇦🇺" },
  { "code": "JPN", "name": "Japan", "flag": "🇯🇵" },
  { "code": "SGP", "name": "Singapore", "flag": "🇸🇬" },
  { "code": "NLD", "name": "Netherlands", "flag": "🇳🇱" }
]
```

- [ ] **Step 2: Implement Citizen.tsx**

Replace `libs/auth/src/components/ZoAuth/steps/Citizen.tsx`:

```typescript
import { FC, useMemo, useState } from "react";
import useProfile from "../../../hooks/useProfile";
import countries from "../../../data/countries.json";

interface CitizenProps {
  advanceOnboarding: () => void;
}

interface Country {
  code: string;
  name: string;
  flag: string;
}

const Citizen: FC<CitizenProps> = ({ advanceOnboarding }) => {
  const { updateProfile } = useProfile();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Country | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return countries as Country[];
    const q = query.toLowerCase();
    return (countries as Country[]).filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSubmit = () => {
    if (!selected || isSaving) return;
    setIsSaving(true);
    updateProfile(
      { data: { country: selected.code } }, // 3-letter ISO STRING, NOT object
      {
        onSuccess: () => advanceOnboarding(),
        onError: () => setIsSaving(false),
      }
    );
  };

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-2xl font-bold mb-2">
        Where are you a proud citizen?
      </span>
      <span className="text-sm text-white/50 mb-8">
        Your homeland flag on your passport
      </span>

      {selected && (
        <div className="w-full text-center mb-4 text-6xl">{selected.flag}</div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search countries..."
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors mb-4"
        autoFocus
      />

      <div className="w-full flex-1 overflow-y-auto max-h-64 border border-white/10 rounded-lg">
        {filtered.map((country) => (
          <button
            key={country.code}
            onClick={() => setSelected(country)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              selected?.code === country.code
                ? "bg-white/10"
                : "hover:bg-white/5"
            }`}
          >
            <span className="text-2xl">{country.flag}</span>
            <span className="text-white">{country.name}</span>
            <span className="text-white/30 text-sm ml-auto">{country.code}</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected || isSaving}
        className={`mt-6 w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
          selected && !isSaving
            ? "bg-white text-black hover:bg-white/90 cursor-pointer"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        {isSaving ? "Saving..." : "That's home"}
      </button>
    </div>
  );
};

export default Citizen;
```

- [ ] **Step 3: Build**

```bash
npx nx build website 2>&1 | tail -10
```
Expected: SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add libs/auth/src/data/countries.json libs/auth/src/components/ZoAuth/steps/Citizen.tsx
git commit -m "feat(auth): Citizen step with bundled country list and ISO code save"
```

---

### Task 15: Implement Birthday.tsx with date validation tests

**Files:**
- Create: `libs/auth/src/components/ZoAuth/steps/birthdayValidation.ts`
- Create: `libs/auth/src/components/ZoAuth/steps/birthdayValidation.test.ts`
- Replace: `libs/auth/src/components/ZoAuth/steps/Birthday.tsx`

- [ ] **Step 1: Write the failing test for date validation**

Create `libs/auth/src/components/ZoAuth/steps/birthdayValidation.test.ts`:

```typescript
import { validateBirthday } from "./birthdayValidation";

describe("validateBirthday", () => {
  // Use a fixed "today" for stable tests
  const today = new Date("2026-04-09");

  it("rejects empty input", () => {
    expect(validateBirthday("", today)).toEqual({
      ok: false,
      reason: "Pick a date",
    });
  });

  it("rejects malformed date strings", () => {
    expect(validateBirthday("not-a-date", today).ok).toBe(false);
  });

  it("rejects future dates", () => {
    expect(validateBirthday("2099-01-01", today)).toEqual({
      ok: false,
      reason: "Pick a date in the past",
    });
  });

  it("rejects users under 13", () => {
    expect(validateBirthday("2020-01-01", today)).toEqual({
      ok: false,
      reason: "Sorry, Zo World is 13+",
    });
  });

  it("accepts users exactly 13", () => {
    expect(validateBirthday("2013-04-09", today)).toEqual({ ok: true });
  });

  it("accepts users in their twenties", () => {
    expect(validateBirthday("2000-01-01", today)).toEqual({ ok: true });
  });

  it("warns on suspicious ages over 120 but allows", () => {
    expect(validateBirthday("1900-01-01", today)).toEqual({
      ok: true,
      warning: "Hmm, double-check that",
    });
  });

  it("rejects Feb 30 as invalid", () => {
    expect(validateBirthday("2000-02-30", today).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx nx test auth --testFile=libs/auth/src/components/ZoAuth/steps/birthdayValidation.test.ts 2>&1 | tail -20
```
Expected: FAIL with "Cannot find module './birthdayValidation'".

- [ ] **Step 3: Implement the validation function**

Create `libs/auth/src/components/ZoAuth/steps/birthdayValidation.ts`:

```typescript
export type ValidationResult =
  | { ok: true; warning?: string }
  | { ok: false; reason: string };

export function validateBirthday(
  input: string,
  today: Date = new Date()
): ValidationResult {
  if (!input) return { ok: false, reason: "Pick a date" };

  // Strict ISO date parse — reject invalid dates like Feb 30
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!match) return { ok: false, reason: "Not a real date" };

  const [, yearStr, monthStr, dayStr] = match;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { ok: false, reason: "Not a real date" };
  }

  if (date > today) {
    return { ok: false, reason: "Pick a date in the past" };
  }

  // Compute age in full years
  let age = today.getUTCFullYear() - year;
  const m = today.getUTCMonth() - (month - 1);
  if (m < 0 || (m === 0 && today.getUTCDate() < day)) {
    age--;
  }

  if (age < 13) {
    return { ok: false, reason: "Sorry, Zo World is 13+" };
  }

  if (age > 120) {
    return { ok: true, warning: "Hmm, double-check that" };
  }

  return { ok: true };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx nx test auth --testFile=libs/auth/src/components/ZoAuth/steps/birthdayValidation.test.ts 2>&1 | tail -20
```
Expected: PASS (8 tests).

- [ ] **Step 5: Implement Birthday.tsx**

Replace `libs/auth/src/components/ZoAuth/steps/Birthday.tsx`:

```typescript
import { FC, useState } from "react";
import useProfile from "../../../hooks/useProfile";
import { validateBirthday } from "./birthdayValidation";

interface BirthdayProps {
  advanceOnboarding: () => void;
}

const Birthday: FC<BirthdayProps> = ({ advanceOnboarding }) => {
  const { updateProfile } = useProfile();
  const [date, setDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const validation = validateBirthday(date);
  const canSubmit = validation.ok && !isSaving;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setIsSaving(true);
    updateProfile(
      { data: { date_of_birth: date } },
      {
        onSuccess: () => advanceOnboarding(),
        onError: () => setIsSaving(false),
      }
    );
  };

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-2xl font-bold mb-2">When&apos;s your Zo Day?</span>
      <span className="text-sm text-white/50 mb-8">We celebrate you</span>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        max={new Date().toISOString().split("T")[0]}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-white/30 transition-colors mb-4"
        autoFocus
      />

      {!validation.ok && date.length > 0 && (
        <span className="text-sm text-red-400 mb-4">{validation.reason}</span>
      )}
      {validation.ok && validation.warning && (
        <span className="text-sm text-yellow-400 mb-4">{validation.warning}</span>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`mt-auto w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
          canSubmit
            ? "bg-white text-black hover:bg-white/90 cursor-pointer"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        {isSaving ? "Saving..." : "Confirm"}
      </button>
    </div>
  );
};

export default Birthday;
```

- [ ] **Step 6: Build**

```bash
npx nx build website 2>&1 | tail -10
```
Expected: SUCCESS.

- [ ] **Step 7: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/birthdayValidation.ts libs/auth/src/components/ZoAuth/steps/birthdayValidation.test.ts libs/auth/src/components/ZoAuth/steps/Birthday.tsx
git commit -m "feat(auth): Birthday step with tested age validation (13+ floor)"
```

---

### Task 16: Implement Cultures.tsx with REPLACE-semantics pre-fill test

**Files:**
- Create: `libs/auth/src/components/ZoAuth/steps/cultures.test.tsx`
- Replace: `libs/auth/src/components/ZoAuth/steps/Cultures.tsx`

- [ ] **Step 1: Write the failing test for the pre-fill behavior**

The spec marks this test as REQUIRED — without it, returning users with existing cultures will silently lose data when they edit during Case 2 onboarding.

Create `libs/auth/src/components/ZoAuth/steps/cultures.test.tsx`:

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock useProfile to return a user with existing cultures
const mockProfile = {
  cultures: [
    { key: "business", name: "Business" },
    { key: "design", name: "Design" },
    { key: "music-entertainment", name: "Music & Entertainment" },
  ],
};

jest.mock("../../../hooks/useProfile", () => ({
  __esModule: true,
  default: () => ({
    profile: mockProfile,
    updateProfile: jest.fn(),
  }),
}));

// Mock the cultures catalog query
jest.mock("../../../hooks/useQueryApi", () => ({
  useQueryApi: () => ({
    data: {
      data: {
        results: [
          { id: "1", key: "business", name: "Business", icon: "" },
          { id: "2", key: "design", name: "Design", icon: "" },
          { id: "3", key: "music-entertainment", name: "Music & Entertainment", icon: "" },
          { id: "4", key: "food", name: "Food", icon: "" },
          { id: "5", key: "games", name: "Games", icon: "" },
        ],
      },
    },
    isLoading: false,
  }),
}));

import Cultures from "./Cultures";

describe("Cultures step", () => {
  it("pre-selects the user's existing cultures on mount", async () => {
    render(<Cultures advanceOnboarding={jest.fn()} />);

    // Wait for catalog + pre-selection
    await waitFor(() => {
      expect(screen.getByText("Business")).toBeInTheDocument();
    });

    // The 3 existing cultures should appear as pre-selected
    // (we test by their selected styling — green border via aria-pressed or data-selected)
    const businessChip = screen.getByRole("button", { name: /business/i });
    const foodChip = screen.getByRole("button", { name: /^food$/i });

    expect(businessChip).toHaveAttribute("data-selected", "true");
    expect(foodChip).toHaveAttribute("data-selected", "false");
  });

  it("counter shows the number of pre-selected cultures", async () => {
    render(<Cultures advanceOnboarding={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx nx test auth --testFile=libs/auth/src/components/ZoAuth/steps/cultures.test.tsx 2>&1 | tail -20
```
Expected: FAIL — Cultures stub doesn't have the pre-fill logic.

- [ ] **Step 3: Implement Cultures.tsx**

Replace `libs/auth/src/components/ZoAuth/steps/Cultures.tsx`:

```typescript
import { FC, useEffect, useMemo, useState } from "react";
import useProfile from "../../../hooks/useProfile";
import { useQueryApi } from "../../../hooks/useQueryApi";

interface CulturesProps {
  advanceOnboarding: () => void;
}

interface Culture {
  id: string;
  key: string;
  name: string;
  icon?: string;
}

const Cultures: FC<CulturesProps> = ({ advanceOnboarding }) => {
  const { profile, updateProfile } = useProfile();
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // CRITICAL: pre-fill from existing cultures so REPLACE doesn't wipe them.
  // Without this, a returning user editing one culture would silently lose all others.
  useEffect(() => {
    if (profile?.cultures) {
      setSelectedKeys(new Set(profile.cultures.map((c) => c.key)));
    }
  }, [profile?.cultures]);

  const { data, isLoading } = useQueryApi(
    "CAS_CULTURES",
    { enabled: true, refetchOnWindowFocus: false },
    "",
    "limit=50"
  );

  const cultures: Culture[] = useMemo(
    () => data?.data?.results || [],
    [data]
  );

  const toggle = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const canSubmit = selectedKeys.size >= 1 && !isSaving;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setIsSaving(true);
    updateProfile(
      { data: { cultures: Array.from(selectedKeys) } }, // REPLACE — full array
      {
        onSuccess: () => advanceOnboarding(),
        onError: () => setIsSaving(false),
      }
    );
  };

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-2xl font-bold mb-2">What&apos;s your culture?</span>
      <span className="text-sm text-white/50 mb-4">
        Pick everything that&apos;s you
      </span>

      <span className="text-xs text-white/40 mb-4">
        {selectedKeys.size} selected
      </span>

      {isLoading ? (
        <div className="flex items-center justify-center w-full py-12">
          <i className="uil uil-spinner animate-spin text-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full mb-6 max-h-64 overflow-y-auto">
          {cultures.map((c) => {
            const isSelected = selectedKeys.has(c.key);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.key)}
                data-selected={isSelected ? "true" : "false"}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? "border-[#66DF48] bg-[#66DF48]/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                {c.icon && (
                  <img src={c.icon} alt="" className="w-6 h-6" />
                )}
                <span className="text-sm text-white">{c.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`mt-auto w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
          canSubmit
            ? "bg-white text-black hover:bg-white/90 cursor-pointer"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        {isSaving ? "Saving..." : "Lock it in"}
      </button>
    </div>
  );
};

export default Cultures;
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx nx test auth --testFile=libs/auth/src/components/ZoAuth/steps/cultures.test.tsx 2>&1 | tail -20
```
Expected: PASS (2 tests).

- [ ] **Step 5: Build**

```bash
npx nx build website 2>&1 | tail -10
```
Expected: SUCCESS.

- [ ] **Step 6: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/cultures.test.tsx libs/auth/src/components/ZoAuth/steps/Cultures.tsx
git commit -m "feat(auth): Cultures step with REPLACE-semantics pre-fill (tested)"
```

---

### Task 17: Manual smoke test of Chunk 3

- [ ] **Step 1: Start the website locally**

```bash
npx nx serve website --port 4202
```

- [ ] **Step 2: Test as a brand-new user**

1. Open `http://localhost:4202/`
2. Click "Become a Citizen" → enter test phone → OTP → verify
3. You should land on NICKNAME → claim a name
4. Then AVATAR → pick body, generate, wait for image
5. Then WHEREABOUTS → still a stub (no advance button), close the modal
6. Re-open the modal as the same user. The queue should now skip NICKNAME and AVATAR, landing back at WHEREABOUTS.

- [ ] **Step 3: Create a test user with a partial profile to test the order**

Manually use a Zo API tool (or `scripts/zo-api.sh POST /api/v1/profile/me/ '{...}'`) to set `custom_nickname`, `body_type`, and `place_name` on a test account. Log in. The queue should be `[WHEREABOUTS, CITIZEN, BIRTHDAY, CULTURES]`. Skip past WHEREABOUTS by closing, walk through CITIZEN → BIRTHDAY → CULTURES. They should all save and advance.

- [ ] **Step 4: Stop the server**

`Ctrl+C`

---

## Chunk 4: Steps Requiring Google APIs

### Task 18: Add geocoding helper (TDD) and install Google Places library

**Files:**
- Create: `libs/auth/src/utils/geocoding.ts`
- Create: `libs/auth/src/utils/geocoding.test.ts`
- Modify: `libs/auth/package.json`

- [ ] **Step 1: Write the failing test**

Create `libs/auth/src/utils/geocoding.test.ts`:

```typescript
import { reverseGeocode } from "./geocoding";

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

describe("reverseGeocode", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = "TEST_KEY";
  });

  it("returns place_name and place_id from a locality result", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "OK",
        results: [
          {
            place_id: "ChIJ_TEST_LOCALITY",
            formatted_address: "Bengaluru, Karnataka, India",
            types: ["locality", "political"],
            address_components: [
              { long_name: "Bengaluru", types: ["locality"] },
            ],
          },
        ],
      }),
    });

    const result = await reverseGeocode(12.97, 77.74);
    expect(result).not.toBeNull();
    expect(result?.place_name).toBe("Bengaluru");
    expect(result?.place_id).toBe("ChIJ_TEST_LOCALITY");
  });

  it("falls back to administrative_area_level_2 when locality returns nothing", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "ZERO_RESULTS", results: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "OK",
          results: [
            {
              place_id: "ChIJ_AREA_2",
              formatted_address: "Bangalore Urban, India",
              types: ["administrative_area_level_2"],
              address_components: [
                { long_name: "Bangalore Urban", types: ["administrative_area_level_2"] },
              ],
            },
          ],
        }),
      });

    const result = await reverseGeocode(12.97, 77.74);
    expect(result?.place_id).toBe("ChIJ_AREA_2");
  });

  it("returns null when all fallbacks return zero results", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ZERO_RESULTS", results: [] }),
    });
    const result = await reverseGeocode(0, 0);
    expect(result).toBeNull();
  });

  it("returns null and warns when API key is missing", async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const result = await reverseGeocode(12.97, 77.74);
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_GOOGLE_MAPS_KEY")
    );
    consoleSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx nx test auth --testFile=libs/auth/src/utils/geocoding.test.ts 2>&1 | tail -20
```
Expected: FAIL.

- [ ] **Step 3: Implement geocoding.ts**

Create `libs/auth/src/utils/geocoding.ts`:

```typescript
export interface GeocodeResult {
  place_name: string;
  place_id: string;
}

const RESULT_TYPE_FALLBACKS = [
  "locality",
  "administrative_area_level_2",
  "administrative_area_level_1",
];

export async function reverseGeocode(
  lat: number,
  long: number
): Promise<GeocodeResult | null> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) {
    console.error(
      "reverseGeocode: NEXT_PUBLIC_GOOGLE_MAPS_KEY not set — cannot reverse-geocode"
    );
    return null;
  }

  for (const resultType of RESULT_TYPE_FALLBACKS) {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?latlng=${lat},${long}` +
      `&key=${key}` +
      `&result_type=${resultType}`;

    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      if (data.status !== "OK" || !data.results?.length) continue;

      const top = data.results[0];
      const component = top.address_components?.find((c: any) =>
        c.types?.includes(resultType)
      );
      const place_name = component?.long_name || top.formatted_address;
      return {
        place_name,
        place_id: top.place_id,
      };
    } catch (err) {
      console.error(`reverseGeocode: ${resultType} failed`, err);
      continue;
    }
  }

  return null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx nx test auth --testFile=libs/auth/src/utils/geocoding.test.ts 2>&1 | tail -20
```
Expected: PASS (4 tests).

- [ ] **Step 5: Add the Google Maps Places React library to libs/auth**

Check if `@react-google-maps/api` or similar is already in the monorepo:

```bash
grep -r "@react-google-maps" package.json apps/*/package.json libs/*/package.json 2>&1 | head
```

If not present, add to `libs/auth/package.json` (or root `package.json` per the monorepo's convention):

```bash
npm install --save @react-google-maps/api
```

- [ ] **Step 6: Commit**

```bash
git add libs/auth/src/utils/geocoding.ts libs/auth/src/utils/geocoding.test.ts package.json package-lock.json libs/auth/package.json 2>/dev/null
git commit -m "feat(auth): reverse-geocode helper with fallback chain (tested)"
```

---

### Task 19: Implement Whereabouts.tsx

**Files:**
- Replace: `libs/auth/src/components/ZoAuth/steps/Whereabouts.tsx`

- [ ] **Step 1: Replace the stub**

```typescript
import { FC, useState } from "react";
import { reverseGeocode } from "../../../utils/geocoding";
import { postWhereabouts } from "../../../utils/whereabouts";

interface WhereaboutsProps {
  advanceOnboarding: () => void;
}

type Phase = "ask" | "requesting" | "geocoding" | "saving" | "done" | "error";

const Whereabouts: FC<WhereaboutsProps> = ({ advanceOnboarding }) => {
  const [phase, setPhase] = useState<Phase>("ask");
  const [error, setError] = useState<string | null>(null);
  const [savedPlaceName, setSavedPlaceName] = useState<string | null>(null);

  const handleShareLocation = () => {
    setPhase("requesting");
    setError(null);

    if (!navigator.geolocation) {
      setPhase("error");
      setError("Your browser can't share location.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: long } = pos.coords;
        setPhase("geocoding");

        const geo = await reverseGeocode(lat, long);
        if (!geo) {
          setPhase("error");
          setError("Couldn't identify your location.");
          return;
        }

        setPhase("saving");
        try {
          await postWhereabouts({
            place_name: geo.place_name,
            place_ref_id: geo.place_id,
            location: { lat, long }, // NOTE: long, not lng
          });
          setSavedPlaceName(geo.place_name);
          setPhase("done");
          setTimeout(() => advanceOnboarding(), 800);
        } catch (e) {
          setPhase("error");
          setError("Couldn't save — try again.");
        }
      },
      (err) => {
        setPhase("error");
        if (err.code === err.PERMISSION_DENIED) {
          setError("We need your location to continue.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("Couldn't get your location — try again.");
        } else if (err.code === err.TIMEOUT) {
          setError("Took too long — try again.");
        } else {
          setError("Something went wrong.");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  if (phase === "done" && savedPlaceName) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center w-full">
        <span className="text-4xl mb-4">📍</span>
        <span className="text-xl font-bold text-white">{savedPlaceName}</span>
        <span className="text-sm text-white/50 mt-2">Locked in</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-2xl font-bold mb-2">
        Where in Zo World are you right now?
      </span>
      <span className="text-sm text-white/50 mb-8">
        We&apos;ll use this to show you stuff happening near you
      </span>

      <div className="flex-1 flex items-center justify-center w-full">
        {phase === "ask" || phase === "error" ? (
          <span className="text-6xl">📍</span>
        ) : (
          <i className="uil uil-spinner animate-spin text-4xl" />
        )}
      </div>

      {phase === "requesting" && (
        <span className="text-sm text-white/60 text-center w-full mb-4">
          Asking for permission...
        </span>
      )}
      {phase === "geocoding" && (
        <span className="text-sm text-white/60 text-center w-full mb-4">
          Finding your spot...
        </span>
      )}
      {phase === "saving" && (
        <span className="text-sm text-white/60 text-center w-full mb-4">
          Locking it in...
        </span>
      )}
      {phase === "error" && error && (
        <span className="text-sm text-red-400 text-center w-full mb-4">
          {error}
        </span>
      )}

      <button
        onClick={handleShareLocation}
        disabled={phase === "requesting" || phase === "geocoding" || phase === "saving"}
        className={`mt-auto w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
          phase === "requesting" || phase === "geocoding" || phase === "saving"
            ? "bg-white/10 text-white/30 cursor-not-allowed"
            : "bg-white text-black hover:bg-white/90 cursor-pointer"
        }`}
      >
        {phase === "error" ? "Try Again" : "Share my Location"}
      </button>
    </div>
  );
};

export default Whereabouts;
```

- [ ] **Step 2: Build**

```bash
npx nx build website 2>&1 | tail -10
```
Expected: SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/Whereabouts.tsx
git commit -m "feat(auth): Whereabouts step with browser geolocation + reverse geocode"
```

---

### Task 20: Implement Hometown.tsx with Google Places autocomplete

**Files:**
- Replace: `libs/auth/src/components/ZoAuth/steps/Hometown.tsx`

- [ ] **Step 1: Replace the stub**

```typescript
import { FC, useEffect, useRef, useState } from "react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import useProfile from "../../../hooks/useProfile";

interface HometownProps {
  advanceOnboarding: () => void;
}

const LIBRARIES: ("places")[] = ["places"];

const Hometown: FC<HometownProps> = ({ advanceOnboarding }) => {
  const { updateProfile } = useProfile();
  const [selected, setSelected] = useState<{
    place_name: string;
    place_id: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries: LIBRARIES,
  });

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.geometry?.location) return;
    setSelected({
      place_name: place.formatted_address || place.name || "",
      place_id: place.place_id || "",
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    });
  };

  const handleSubmit = () => {
    if (!selected || isSaving) return;
    setIsSaving(true);
    updateProfile(
      {
        data: {
          place_name: selected.place_name,
          place_ref_id: selected.place_id,
          home_location: { lat: selected.lat, lng: selected.lng }, // NOTE: lng, not long
        },
      },
      {
        onSuccess: () => advanceOnboarding(),
        onError: () => setIsSaving(false),
      }
    );
  };

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-2xl font-bold mb-2">Where&apos;s home?</span>
      <span className="text-sm text-white/50 mb-8">
        Your roots — the city you call yours
      </span>

      {isLoaded ? (
        <Autocomplete
          onLoad={(ac) => (autocompleteRef.current = ac)}
          onPlaceChanged={handlePlaceChanged}
          types={["(cities)"]}
        >
          <input
            type="text"
            placeholder="Bangalore, Bengaluru..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-white/30 transition-colors mb-4"
            autoFocus
          />
        </Autocomplete>
      ) : (
        <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/40 mb-4">
          Loading search...
        </div>
      )}

      {selected && (
        <span className="text-sm text-[#66DF48] mb-4">
          ✓ {selected.place_name}
        </span>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selected || isSaving}
        className={`mt-auto w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
          selected && !isSaving
            ? "bg-white text-black hover:bg-white/90 cursor-pointer"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        {isSaving ? "Saving..." : "That's me"}
      </button>
    </div>
  );
};

export default Hometown;
```

- [ ] **Step 2: Verify NEXT_PUBLIC_GOOGLE_MAPS_KEY is set**

```bash
grep -r "NEXT_PUBLIC_GOOGLE_MAPS_KEY" apps/website/.env* 2>/dev/null
```

If missing, add to `apps/website/.env.local` (and the Vercel project env vars per `reference_vercel_setup.md`):

```
NEXT_PUBLIC_GOOGLE_MAPS_KEY=<your-google-maps-key-with-Places-and-Geocoding-enabled>
```

- [ ] **Step 3: Build**

```bash
npx nx build website 2>&1 | tail -10
```
Expected: SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/Hometown.tsx
git commit -m "feat(auth): Hometown step with Google Places autocomplete"
```

---

### Task 21: End-to-end manual smoke test of Chunks 3 + 4

- [ ] **Step 1: Start the website**

```bash
npx nx serve website --port 4202
```

- [ ] **Step 2: Run the full 8-step onboarding as a brand-new user**

1. Open `http://localhost:4202/`
2. Click "Become a Citizen"
3. Enter a fresh phone number → OTP → verify
4. **NICKNAME:** type a name, see availability check, claim it
5. **AVATAR:** pick Bro or Bae, click Generate, wait for image, click "Zo Zo Zo!"
6. **WHEREABOUTS:** click Share my Location, allow browser permission, watch it geocode and save
7. **CITIZEN:** search for India, pick it, click "That's home"
8. **HOMETOWN:** type Bangalore, pick from autocomplete, click "That's me"
9. **BIRTHDAY:** pick a date, click Confirm
10. **CULTURES:** select a few cultures, click Lock it in
11. **WELCOME:** see avatar + nickname, modal closes after 2s

Each step should save and advance. Final state: profile has all 8 fields filled.

- [ ] **Step 3: Confirm via the API**

```bash
scripts/zo-api.sh GET /api/v1/profile/me/ 2>&1 | python3 -c "
import sys, json
p = json.loads(sys.stdin.read()).get('data', {})
print('custom_nickname:', p.get('custom_nickname'))
print('body_type:', p.get('body_type'))
print('avatar.image:', p.get('avatar', {}).get('image'))
print('country.code:', p.get('country', {}).get('code'))
print('place_name:', p.get('place_name'))
print('date_of_birth:', p.get('date_of_birth'))
print('cultures count:', len(p.get('cultures', [])))
"
```
Expected: all fields populated.

- [ ] **Step 4: Test Case 2 — close mid-flow, re-open, resume**

Open the modal, complete steps 1-4, then close the browser tab. Re-open, log in. The queue should skip the completed steps and land on step 5 (CITIZEN).

- [ ] **Step 5: Test the returning-user-with-full-profile flow**

Log in with Samurai's account. Should go straight to WELCOME → close in 2s.

- [ ] **Step 6: Stop the server**

`Ctrl+C`

---

## Chunk 5: Polish — Telemetry, Final QA, Cross-app Builds

### Task 22: Add telemetry events

**Files:**
- Modify: each step component to emit events
- Choose: PostHog (`posthog-js`) or Sentry (`@sentry/nextjs`) — check what's already in the monorepo and pick the one that's installed.

- [ ] **Step 1: Find the existing telemetry library**

```bash
grep -l "posthog\|@sentry" apps/website/package.json libs/auth/package.json libs/utils/package.json 2>/dev/null
```

Use whatever is already wired. If neither is, defer telemetry to a follow-up and skip this task.

- [ ] **Step 2: Create a thin event helper**

Create `libs/auth/src/utils/telemetry.ts` (adjust based on the chosen library):

```typescript
// Adjust this import based on what's installed (posthog-js or @sentry/nextjs).
// If posthog-js:
import posthog from "posthog-js";

interface OnboardingEventProps {
  step_name?: string;
  user_pid?: string;
  duration_ms?: number;
  error_type?: string;
  http_status?: number;
  queue_length?: number;
  queue_steps?: string[];
  steps_completed?: number;
  total_duration_ms?: number;
}

export function trackOnboarding(
  event: string,
  props?: OnboardingEventProps
): void {
  try {
    posthog?.capture?.(event, props);
  } catch {
    // Telemetry should never break the flow
  }
}
```

- [ ] **Step 3: Wire events into each step**

In each step component, add `trackOnboarding` calls at the relevant lifecycle points:

- `OnboardingCheck.tsx`: emit `onboarding_started` after computing the queue (with `queue_length` and `queue_steps`)
- Each step component on mount: `onboarding_step_entered` with `step_name`
- Each step on successful save: `onboarding_step_completed` with `step_name` and `duration_ms`
- Each step on save error: `onboarding_step_error` with `step_name`, `error_type`, `http_status`
- `Welcome.tsx`: `onboarding_completed` with `total_duration_ms` and `steps_completed`

For abandonment, add a `beforeunload` listener at `ZoAuth.tsx` level:

```typescript
useEffect(() => {
  if (!isOnboarding) return;
  const handler = () => {
    trackOnboarding("onboarding_abandoned", { step_name: step });
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [isOnboarding, step]);
```

- [ ] **Step 4: Build**

```bash
npx nx build website 2>&1 | tail -10
```
Expected: SUCCESS.

- [ ] **Step 5: Commit**

```bash
git add libs/auth/src/utils/telemetry.ts libs/auth/src/components/ZoAuth/
git commit -m "feat(auth): instrument onboarding flow with telemetry events"
```

---

### Task 23: Final cross-app build verification

- [ ] **Step 1: Build all four affected apps**

```bash
npx nx build website 2>&1 | tail -10
```
Expected: SUCCESS.

```bash
npx nx build dashboard 2>&1 | tail -10
```
Expected: SUCCESS (or pre-existing PedestalScene error only).

```bash
npx nx build pms 2>&1 | tail -10
```
Expected: SUCCESS.

```bash
npx nx build admin 2>&1 | tail -10
```
Expected: SUCCESS.

- [ ] **Step 2: Run all auth lib tests**

```bash
npx nx test auth 2>&1 | tail -30
```
Expected: PASS for all the new tests (whereabouts, computeOnboardingQueue, birthdayValidation, geocoding, cultures pre-fill).

- [ ] **Step 3: Lint**

```bash
npx nx lint auth 2>&1 | tail -20
npx nx lint website 2>&1 | tail -20
```
Expected: clean (or pre-existing warnings only).

---

### Task 24: Final manual QA pass

Three personas to test:

- [ ] **Persona 1: brand-new user**

Walk through all 8 steps end-to-end against zozozo.work. Verify:
- Each step's UI matches the spec (heading, subtitle, action button copy)
- Each save advances to the next step
- The modal can't be closed by ESC or backdrop click during onboarding
- The browser back button doesn't break the flow
- The Welcome screen shows the generated avatar and the nickname
- After Welcome, the page navigates to `/passport`
- The passport renders all 8 fields

- [ ] **Persona 2: returning user with partial data**

Construct a test user with partial data (e.g., set `custom_nickname`, `body_type`, `avatar.image` only). Log in. Verify:
- The queue is `[WHEREABOUTS, CITIZEN, HOMETOWN, BIRTHDAY, CULTURES]`
- Only those 5 steps appear
- Modal closes after the last one

- [ ] **Persona 3: PMS staff (skipOnboarding)**

Open `apps/pms` locally (or deployed). Log in as a staff account that has missing onboarding fields. Verify:
- Onboarding is skipped entirely
- Modal closes immediately on Welcome
- No onboarding steps appear

---

### Task 25: Final commit and handoff

- [ ] **Step 1: Confirm clean working tree**

```bash
git status
```

- [ ] **Step 2: View the chunk of work**

```bash
git log --oneline main...HEAD
```

- [ ] **Step 3: If any straggling changes, commit them**

```bash
git add -A
git commit -m "chore(auth): final cleanup for onboarding v2"
```

- [ ] **Step 4: Hand off**

The branch is ready for PR. Title suggestion: `feat(auth): zozozo.work onboarding v2 — 8-step required flow`. The PR description should reference the spec at `docs/superpowers/specs/2026-04-09-zozozo-onboarding-v2-design.md` and note coordination with the parallel TV-effect plan.

---

## Notes for the executor

- **Profile type extension is load-bearing.** Many step components reference fields that the v1 type doesn't include. If TypeScript errors fire about `profile.cultures` or `profile.country`, re-check Task 1.
- **The cultures REPLACE gotcha** is the most dangerous bug surface in this whole plan. The required test in Task 16 catches it. Don't disable that test "to ship faster."
- **`long` vs `lng`** is enforced at the type level in `whereabouts.ts`. If you ever see a TS error about `lng` on a whereabouts payload, the type is doing its job — fix the call site, don't widen the type.
- **`country` is a string on write, an object on read.** This is asymmetric and weird but verified by live API testing. Don't try to PATCH it as an object.
- **The v1 spec's pre-existing issues** (refetchProfile cache key bug, incomplete Profile type) are inherited. Polling still works despite the cache bug. Don't try to fix the cache bug as part of this work — separate cleanup.
- **PMS / Admin use the same shared library** — `skipOnboarding` is the only escape hatch. Verify that prop is set on both apps' AuthProviders before calling Chunk 1 done.
- **Coordinated TV effect plan:** if it's already merged, the new step components will inherit the visual treatment automatically. If it isn't, the plain dark modal will work fine and the TV effect can land later.
