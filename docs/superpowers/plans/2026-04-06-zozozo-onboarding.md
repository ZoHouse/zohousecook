# zozozo.work Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the defunct web3 onboarding with a hospitality-focused flow: Nickname → Body Type/Avatar → City → Welcome.

**Architecture:** Rewrite `OnboardingCheck` to compute a queue of missing profile fields, then present new step components (Nickname, Avatar, City) in sequence. Each step saves to the existing profile API. The auto-close guard in ZoAuth prevents the modal from dismissing during onboarding. PMS/Admin apps skip onboarding via a `skipOnboarding` prop.

**Tech Stack:** React 18, TypeScript, react-query v3, Next.js 14 Pages Router, Tailwind CSS, Ant Design

**Spec:** `docs/superpowers/specs/2026-04-05-zozozo-onboarding-design.md`

---

## Chunk 1: Scaffold — Types, Auth Context, ZoAuth Orchestrator

### Task 1: Update Profile type with missing fields

**Files:**
- Modify: `libs/definitions/auth/src/index.ts`

- [ ] **Step 1: Add missing fields to Profile type**

Add after `work_role: string;` (line 57):

```typescript
  // Onboarding fields (returned by backend, previously untyped)
  custom_nickname?: string;
  ens_nickname?: string;
  selected_nickname?: string;
  body_type?: string;
  avatar?: { image: string; metadata: string; ref_id: number };
  place_name?: string;
  place_ref_id?: string;
  pfp_image?: string;
```

- [ ] **Step 2: Commit**

```bash
git add libs/definitions/auth/src/index.ts
git commit -m "types: add missing Profile fields for onboarding (body_type, avatar, place_name, custom_nickname)"
```

### Task 2: Add skipOnboarding to AuthContext

**Files:**
- Modify: `libs/auth/src/contexts/auth/AuthContext.tsx`
- Modify: `libs/auth/src/contexts/auth/AuthProvider.tsx`

- [ ] **Step 1: Add skipOnboarding to context interface and default**

In `AuthContext.tsx`, add `skipOnboarding` to the interface (after `showLoginModal`):

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

And add to the default context value:

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

- [ ] **Step 2: Thread skipOnboarding through AuthProvider**

In `AuthProvider.tsx`, add `skipOnboarding?: boolean` to the component props interface. Pass it through the context value object alongside `isLoggedIn`, `user`, `login`, `logout`, `showLoginModal`.

Find the `<AuthContext.Provider value={...}>` and add `skipOnboarding` to the value object.

- [ ] **Step 3: Set skipOnboarding in PMS and Admin apps**

In `apps/pms/src/pages/_app.tsx`, add `skipOnboarding` to the AuthProvider:

```tsx
<AuthProvider
  localKey="zo-admin"
  isLoginRequired
  isZostelLoginRequired
  allowedLoginTypes={["mobile"]}
  skipOnboarding
>
```

Do the same in `apps/admin/src/pages/_app.tsx`.

- [ ] **Step 4: Commit**

```bash
git add libs/auth/src/contexts/auth/AuthContext.tsx libs/auth/src/contexts/auth/AuthProvider.tsx apps/pms/src/pages/_app.tsx apps/admin/src/pages/_app.tsx
git commit -m "feat(auth): add skipOnboarding prop to AuthProvider for PMS/Admin"
```

### Task 3: Rewrite ZoAuth orchestrator

**Files:**
- Modify: `libs/auth/src/components/ZoAuth/ZoAuth.tsx`

- [ ] **Step 1: Update step type and imports**

Replace the `ZoAuthStep` type (line 32-48) with:

```typescript
export type ZoAuthStep =
  | "ENTRY"
  | "MOBILE_LOGIN"
  | "EMAIL_LOGIN"
  | "ONBOARDING_CHECK"
  | "NICKNAME"
  | "AVATAR"
  | "CITY"
  | "WELCOME";
```

Remove imports for deleted steps:
```typescript
// DELETE these imports:
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

Add imports for new steps:
```typescript
import Nickname from "./steps/Nickname";
import Avatar from "./steps/Avatar";
import City from "./steps/City";
```

- [ ] **Step 2: Add onboarding queue state and auto-close guard**

After the existing state declarations (line 64-66), add:

```typescript
const [onboardingQueue, setOnboardingQueue] = useState<ZoAuthStep[]>([]);

const ONBOARDING_STEPS: ZoAuthStep[] = ["ONBOARDING_CHECK", "NICKNAME", "AVATAR", "CITY"];
const isOnboarding = ONBOARDING_STEPS.includes(step);

const advanceOnboarding = () => {
  const [, ...remaining] = onboardingQueue;
  setOnboardingQueue(remaining);
  replaceStep(remaining.length > 0 ? remaining[0] : "WELCOME");
};
```

Replace the auto-close useEffect (lines 90-101) with:

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

- [ ] **Step 3: Update renderStep — remove deleted cases, add new ones**

Remove all deleted step cases from `renderStep()`. Replace with new onboarding cases:

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
case "CITY":
  return <City advanceOnboarding={advanceOnboarding} />;
```

Keep ENTRY, MOBILE_LOGIN, EMAIL_LOGIN, WELCOME cases unchanged (except WELCOME already works).

- [ ] **Step 4: Hide back button and UserCollection during onboarding**

Update the header section (lines 176-189). Replace the back button condition:

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

Conditionally hide UserCollection:

```tsx
{!isOnboarding && <UserCollection focus={focus} />}
```

- [ ] **Step 5: Commit**

```bash
git add libs/auth/src/components/ZoAuth/ZoAuth.tsx
git commit -m "feat(auth): rewrite ZoAuth orchestrator — onboarding queue, auto-close guard, remove web3 steps"
```

### Task 4: Delete dead step components

**Files:**
- Delete: 11 step files

- [ ] **Step 1: Delete all dead step files**

```bash
cd libs/auth/src/components/ZoAuth/steps
rm Intro.tsx SetENS.tsx NoENS.tsx SetZo.tsx SetPFP.tsx NoPFP.tsx WalletAddition.tsx WalletConnecting.tsx Socials.tsx Founder.tsx NoFounder.tsx
```

- [ ] **Step 2: Commit**

```bash
git add -A libs/auth/src/components/ZoAuth/steps/
git commit -m "refactor(auth): delete 11 dead web3 onboarding step components"
```

---

## Chunk 2: OnboardingCheck + Entry.tsx Fixes

### Task 5: Rewrite OnboardingCheck with progressive queue

**Files:**
- Modify: `libs/auth/src/components/ZoAuth/steps/OnboardingCheck.tsx`

- [ ] **Step 1: Rewrite OnboardingCheck**

Replace the entire file contents with:

```typescript
import { FC, useEffect } from "react";
import { useAuth } from "../../../contexts/auth";
import useProfile from "../../../hooks/useProfile";
import { ZoAuthStep, ZoAuthStepProps } from "../ZoAuth";

interface OnboardingCheckProps extends ZoAuthStepProps {
  setOnboardingQueue: (queue: ZoAuthStep[]) => void;
}

const OnboardingCheck: FC<OnboardingCheckProps> = ({ setStep, setOnboardingQueue }) => {
  const { skipOnboarding } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    if (!profile) return;

    if (skipOnboarding) {
      setStep("WELCOME");
      return;
    }

    const queue: ZoAuthStep[] = [];

    if (!profile.custom_nickname && !profile.ens_nickname) {
      queue.push("NICKNAME");
    }
    if (!profile.body_type) {
      queue.push("AVATAR");
    }
    if (!profile.place_name) {
      queue.push("CITY");
    }

    if (queue.length === 0) {
      setStep("WELCOME");
    } else {
      setOnboardingQueue(queue);
      setStep(queue[0]);
    }
  }, [profile, skipOnboarding, setStep, setOnboardingQueue]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <i className="uil uil-spinner animate-spin text-2xl" />
      <span className="text-sm mt-4 text-white/50">Setting things up...</span>
    </div>
  );
};

export default OnboardingCheck;
```

- [ ] **Step 2: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/OnboardingCheck.tsx
git commit -m "feat(auth): rewrite OnboardingCheck with progressive onboarding queue"
```

### Task 6: Fix Entry.tsx — remove wallet, fix duplicate step push

**Files:**
- Modify: `libs/auth/src/components/ZoAuth/steps/Entry.tsx`

- [ ] **Step 1: Remove wallet imports and logic**

Remove the `useAccount` import from wagmi (if present). Remove the `isConnected` check in the useEffect that navigates to `WALLET_CONNECTING`. Remove the wallet button/icon from the UI (the `CustomButton` or `CustomConnectButton` component render).

Keep: phone OTP flow, email login option, the OTP input/verification UI.

- [ ] **Step 2: Fix duplicate ONBOARDING_CHECK push**

Find the `useEffect` that watches `isLoggedIn` and calls `setStep("ONBOARDING_CHECK")`. Add a guard:

```typescript
useEffect(() => {
  if (isLoggedIn) {
    // Guard against pushing duplicate ONBOARDING_CHECK
    // (OTP success handler already pushes it synchronously)
    setStep("ONBOARDING_CHECK");
  }
}, [isLoggedIn]);
```

Actually, since the OTP success handler already calls `setStep("ONBOARDING_CHECK")`, this useEffect is redundant for the OTP path. But it catches the case where `isLoggedIn` is already true when Entry mounts (returning user). To prevent the duplicate, replace `setStep` with `replaceStep` in this useEffect (if `replaceStep` is available as a prop — check if it needs to be added to Entry's props).

If `replaceStep` is not available, simply guard: `if (step === "ENTRY") setStep("ONBOARDING_CHECK")` — but Entry doesn't have access to `step`. Simplest fix: remove the `isLoggedIn` useEffect entirely from Entry.tsx, since the OTP success handler already navigates. The `isLoggedIn` check is only needed for wallet-connected users (which we're removing).

- [ ] **Step 3: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/Entry.tsx
git commit -m "fix(auth): remove wallet UI from Entry, fix duplicate ONBOARDING_CHECK push"
```

### Task 7: Update Welcome.tsx

**Files:**
- Modify: `libs/auth/src/components/ZoAuth/steps/Welcome.tsx`

- [ ] **Step 1: Update display logic**

Replace the entire file with:

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
    setTimeout(hideModal, 2000);
  }, []);

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
      <span className="text-xl mt-4">
        Welcome to Zo World
      </span>
      <i className="uil uil-spinner animate-spin mt-6" />
    </div>
  );
};

export default Welcome;
```

- [ ] **Step 2: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/Welcome.tsx
git commit -m "feat(auth): update Welcome to show avatar + custom_nickname"
```

---

## Chunk 3: New Onboarding Step Components

### Task 8: Create Nickname step

**Files:**
- Create: `libs/auth/src/components/ZoAuth/steps/Nickname.tsx`

- [ ] **Step 1: Create the Nickname component**

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

  // Debounce availability check
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
  const allValid = isLocallyValid && checkEnabled && isAvailable && !isCheckingAvailability;

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

  const renderCheck = (label: string, passed: boolean, checking?: boolean) => (
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
      <span className="text-sm text-white/50 mb-8">Your permanent identity in Zo World</span>

      <div className="flex items-center w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus-within:border-white/30 transition-colors">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
          placeholder="yourname"
          className="bg-transparent text-white text-lg flex-1 outline-none placeholder-white/20"
          maxLength={16}
          autoFocus
        />
        <span className="text-white/30 text-lg">.zo</span>
      </div>

      <div className="flex flex-col gap-1.5 mb-8">
        {renderCheck("4-16 characters", isValidLength)}
        {renderCheck("Letters and numbers only", input.length > 0 ? isAlphanumeric : false)}
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

- [ ] **Step 2: Verify useQueryApi import path**

Check that `useQueryApi` is exported from `libs/auth/src/hooks/useQueryApi.ts` and can be imported as shown. If the export is different, adjust the import.

- [ ] **Step 3: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/Nickname.tsx
git commit -m "feat(auth): add Nickname onboarding step — .zo handle with availability check"
```

### Task 9: Create Avatar step

**Files:**
- Create: `libs/auth/src/components/ZoAuth/steps/Avatar.tsx`

- [ ] **Step 1: Create the Avatar component**

```typescript
import { FC, useCallback, useEffect, useRef, useState } from "react";
import useProfile from "../../../hooks/useProfile";

interface AvatarProps {
  advanceOnboarding: () => void;
}

type BodyType = "bro" | "bae";

const Avatar: FC<AvatarProps> = ({ advanceOnboarding }) => {
  const { profile, updateProfile, refetchProfile } = useProfile();
  const [selected, setSelected] = useState<BodyType | null>(null);
  const [phase, setPhase] = useState<"select" | "generating" | "done">("select");
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
        // Timeout — proceed anyway
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        advanceOnboarding();
      }
    }, 1000);
  }, [refetchProfile, advanceOnboarding]);

  // Watch for avatar.image appearing
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
      <path d="M38 70 Q38 65 60 65 Q82 65 82 70 L78 130 Q78 135 60 135 Q42 135 42 130 Z" fill="currentColor" opacity="0.2" />
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
      <span className="text-sm text-white/50 mb-8">This determines your Zobu avatar</span>

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

- [ ] **Step 2: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/Avatar.tsx
git commit -m "feat(auth): add Avatar onboarding step — body type selection + generation polling"
```

### Task 10: Create City step

**Files:**
- Create: `libs/auth/src/components/ZoAuth/steps/City.tsx`

- [ ] **Step 1: Create the City component**

```typescript
import { FC, useState } from "react";
import useProfile from "../../../hooks/useProfile";

interface CityProps {
  advanceOnboarding: () => void;
}

const City: FC<CityProps> = ({ advanceOnboarding }) => {
  const { updateProfile } = useProfile();
  const [input, setInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = () => {
    if (!input.trim() || isSaving) return;
    setIsSaving(true);
    updateProfile(
      { data: { place_name: input.trim() } },
      {
        onSuccess: () => advanceOnboarding(),
        onError: () => setIsSaving(false),
      }
    );
  };

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-2xl font-bold mb-2">Where&apos;s home?</span>
      <span className="text-sm text-white/50 mb-8">Your city or hometown</span>

      <div className="flex items-center w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus-within:border-white/30 transition-colors">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Bangalore, India"
          className="bg-transparent text-white text-lg flex-1 outline-none placeholder-white/20"
          autoFocus
        />
      </div>

      <div className="mt-auto w-full flex flex-col gap-3">
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isSaving}
          className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
            input.trim() && !isSaving
              ? "bg-white text-black hover:bg-white/90 cursor-pointer"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          {isSaving ? "Saving..." : "That's me"}
        </button>
        <button
          onClick={advanceOnboarding}
          className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

export default City;
```

- [ ] **Step 2: Commit**

```bash
git add libs/auth/src/components/ZoAuth/steps/City.tsx
git commit -m "feat(auth): add City onboarding step — hometown input with skip"
```

---

## Chunk 4: Build Verification + Cleanup

### Task 11: Build all affected apps

- [ ] **Step 1: Build website**

```bash
npx nx build website
```

Expected: SUCCESS. The website uses `libs/auth/` and must compile with the new steps.

- [ ] **Step 2: Build dashboard**

```bash
npx nx build dashboard
```

Expected: SUCCESS (or pre-existing PedestalScene error only — not related to auth changes).

- [ ] **Step 3: Build PMS**

```bash
npx nx build pms
```

Expected: SUCCESS. PMS passes `skipOnboarding` — verify no type errors.

- [ ] **Step 4: Fix any build errors**

If TypeScript errors appear (missing imports, type mismatches), fix them. Common issues:
- `useQueryApi` import path — check `libs/auth/src/hooks/` for exact export
- `ZoAuthStep` type not exported — make sure it's exported from ZoAuth.tsx
- `advanceOnboarding` prop type — make sure new step components accept it

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(auth): resolve build errors from onboarding rewrite"
```

### Task 12: Manual smoke test checklist

- [ ] **Step 1: Start the website locally**

```bash
npx nx serve website --port 4202
```

Open `http://localhost:4202/house` and test the login flow.

- [ ] **Step 2: Test new user flow**

1. Click "tune in" on mobile bar (or navigate to a page that triggers login)
2. Enter phone number → receive OTP → verify
3. Should see: "Pick your .zo handle" screen
4. Enter a valid nickname → see availability check → click "Claim it"
5. Should see: "Choose your body shape" screen
6. Select Bro or Bae → click "Generate Avatar"
7. Should see: generating spinner → then avatar (or timeout after 10s)
8. Should see: "Where's home?" screen
9. Enter a city → click "That's me" (or click "Maybe Later")
10. Should see: "Zo Zo {nickname}!" welcome screen → auto-close after 2s

- [ ] **Step 3: Test returning user with complete profile**

Log in with a user who already has nickname + body_type + place_name. Should skip straight to Welcome → close. No onboarding steps shown.

- [ ] **Step 4: Test partial profile**

Log in with a user who has a nickname but no body_type. Should only see Avatar → City → Welcome. Nickname step skipped.

### Task 13: Final commit

- [ ] **Step 1: Commit all remaining changes**

```bash
git add -A
git commit -m "feat(auth): complete onboarding flow — nickname, avatar, city for zozozo.work"
```
