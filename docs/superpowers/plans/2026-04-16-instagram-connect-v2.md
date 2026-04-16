# Instagram Connect v2 — Backend Migration

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Supabase-backed Instagram OAuth flow with Daya's new Zo backend endpoints (`api.nsfp.io.zo.xyz/api/v1/oauth/instagram/`), making IG connect a first-class Zo API feature with encrypted token storage, XP awards, and daily refresh.

**Architecture:** Client redirects to Meta OAuth → callback page strips `#_` from code → POSTs code to Zo backend via authenticated `fetch()` → backend stores token, creates social profile, awards XP. Status on reload comes from `profile.socials` (category `"instagram"`). Old Supabase routes and tables become dead code.

**Tech Stack:** Next.js (Pages Router), `fetch()` with auth tokens from localStorage (matching `useMyXp` pattern), Meta OAuth, Zo API

**Prior art:** Original spec at `docs/superpowers/specs/2026-04-01-instagram-connect-design.md`, original plan at `docs/superpowers/plans/2026-04-01-instagram-connect.md`. Both are now superseded — the Supabase approach is being replaced.

---

## Chunk 1: Hook Rewrite + Callback Page

### File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Rewrite | `apps/website/src/hooks/useInstagramConnect.ts` | OAuth redirect, connect/disconnect via Zo API, status from `profile.socials` |
| Create | `apps/website/src/pages/oauth/instagram/callback.tsx` | Handles Meta redirect, strips `#_`, POSTs code to backend, redirects to /passport |
| Modify | `apps/website/src/components/passport/SettingsModal.tsx:495-536` | Minor: adapt `SocialsSection` to new account shape (`username` not `ig_username`) |
| Test | `apps/website/src/__tests__/useInstagramConnect.test.ts` | Hook unit tests |
| Test | `apps/website/src/__tests__/instagram-callback.test.tsx` | Callback page tests |

### Daya's Backend API (source of truth)

```
Base: https://api.nsfp.io.zo.xyz/api/v1/

POST /oauth/instagram/connect/
  Headers: Authorization: Bearer {token}
  Body: { "code": "<auth_code_from_meta>" }
  200: { "success": true, "instagram": { "id": "...", "username": "...", "account_type": "PERSONAL|CREATOR|BUSINESS" } }

DELETE /oauth/instagram/disconnect/
  Headers: Authorization: Bearer {token}
  200: { "success": true }
  404: { "success": false, "errors": ["No Instagram account connected."] }

Side effects (backend-handled):
  - Social profile entry auto-created/updated on connect (populates profile.socials)
  - Social entry auto-deleted on disconnect
  - XP awarded on first connect
  - Token stored encrypted, auto-refreshed daily
```

### Key context: how `profile.socials` works

`SettingsModal.tsx:470-489` already reads `profile.socials` and filters `category !== "instagram"` for the "other socials" list. Each social object has `{ category, link, verified }`. After Daya's connect endpoint fires, the backend creates a social profile entry with `category: "instagram"` that will appear in `profile.socials` on next profile fetch. The hook reads this for status hydration — no separate GET needed.

**Note:** `account_type` may not be present in `profile.socials` entries. The hook gracefully handles this with `ig.account_type || ""`. Verify after first real connect whether the backend includes it.

### Key context: auth pattern for API calls

`zoServer` (from `libs/auth/src/utils.ts`) is internal to `libs/auth/` and **NOT exported** via `@zo/auth`. No file in `apps/website/src/` imports it. The established pattern for authenticated calls in the website app (see `useMyXp.ts:25-38`) is:

```typescript
// Read auth tokens from localStorage (same keys AuthProvider uses)
const token = localStorage.getItem('zo-admin-token') || localStorage.getItem('zo-web-token');
const deviceId = localStorage.getItem('zo-admin-device-id') || localStorage.getItem('zo-web-device-id');
const deviceSecret = localStorage.getItem('zo-admin-device-secret') || localStorage.getItem('zo-web-device-secret');

// API_BASE_URL is available client-side via next.config.js env block
const ZO_API = process.env.API_BASE_URL || 'https://api.io.zo.xyz';

fetch(`${ZO_API}/api/v1/...`, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'client-device-id': deviceId || '',
    'client-device-secret': deviceSecret || '',
  },
});
```

### Key context: redirect URI

`NEXT_PUBLIC_APP_URL` already exists (line 36 of `.env.local`, value `http://localhost:4202` in dev, `https://zozozo.work` in prod). The redirect URI is constructed as `${NEXT_PUBLIC_APP_URL}/oauth/instagram/callback` — no separate env var needed.

---

### Task 1: Write `useInstagramConnect` hook tests

**Files:**
- Create: `apps/website/src/__tests__/useInstagramConnect.test.ts`

- [ ] **Step 1: Create test file with 4 test cases**

```typescript
import { renderHook, act } from "@testing-library/react";

jest.mock("@zo/auth", () => ({
  useProfile: jest.fn(),
}));
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { useProfile } from "@zo/auth";
import { useRouter } from "next/router";
import useInstagramConnect from "../hooks/useInstagramConnect";

const mockProfile = {
  code: "ABC123",
  socials: [
    { category: "instagram", link: "https://instagram.com/johndoe", verified: true },
    { category: "twitter", link: "https://x.com/johndoe", verified: false },
  ],
};

const mockProfileNoIg = {
  code: "ABC123",
  socials: [
    { category: "twitter", link: "https://x.com/johndoe", verified: false },
  ],
};

const mockRouter = {
  query: {},
  replace: jest.fn(),
  pathname: "/passport",
};

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
  delete (window as any).location;
  (window as any).location = { href: "" };
});

describe("useInstagramConnect", () => {
  test("detects connected state from profile.socials", () => {
    (useProfile as jest.Mock).mockReturnValue({ profile: mockProfile, refetchProfile: jest.fn() });
    const { result } = renderHook(() => useInstagramConnect());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.account?.username).toBe("johndoe");
  });

  test("detects disconnected state when no IG in socials", () => {
    (useProfile as jest.Mock).mockReturnValue({ profile: mockProfileNoIg, refetchProfile: jest.fn() });
    const { result } = renderHook(() => useInstagramConnect());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.account).toBeNull();
  });

  test("connect() redirects to Meta OAuth URL", () => {
    (useProfile as jest.Mock).mockReturnValue({ profile: mockProfile, refetchProfile: jest.fn() });
    const { result } = renderHook(() => useInstagramConnect());

    act(() => result.current.connect());

    expect(window.location.href).toContain("api.instagram.com/oauth/authorize");
    expect(window.location.href).toContain("response_type=code");
  });

  test("connect() toasts error when not logged in", () => {
    (useProfile as jest.Mock).mockReturnValue({ profile: null, refetchProfile: jest.fn() });
    const { result } = renderHook(() => useInstagramConnect());
    const { toast } = require("sonner");

    act(() => result.current.connect());

    expect(toast.error).toHaveBeenCalledWith("Please log in first");
    expect(window.location.href).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/samuraizan/samuraidojo/zohouse/zo.xyz/mono-front-main && npx nx test website --testPathPattern="useInstagramConnect" --no-coverage`
Expected: FAIL — hook still uses old Supabase-based implementation (calls `basePath/api/auth/instagram/status`)

---

### Task 2: Rewrite `useInstagramConnect` hook

**Files:**
- Modify: `apps/website/src/hooks/useInstagramConnect.ts`

- [ ] **Step 3: Replace hook implementation**

```typescript
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useProfile } from "@zo/auth";
import { toast } from "sonner";

const IG_APP_ID = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";
const ZO_API = process.env.API_BASE_URL || "https://api.io.zo.xyz";

function getZoAuthHeaders(): Record<string, string> {
  const token =
    localStorage.getItem("zo-admin-token") ||
    localStorage.getItem("zo-web-token") ||
    "";
  const deviceId =
    localStorage.getItem("zo-admin-device-id") ||
    localStorage.getItem("zo-web-device-id") ||
    "";
  const deviceSecret =
    localStorage.getItem("zo-admin-device-secret") ||
    localStorage.getItem("zo-web-device-secret") ||
    "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "client-device-id": deviceId,
    "client-device-secret": deviceSecret,
  };
}

export interface InstagramAccount {
  username: string;
  account_type: string;
  verified: boolean;
}

interface UseInstagramConnectReturn {
  isLoading: boolean;
  isConnected: boolean;
  account: InstagramAccount | null;
  connect: () => void;
  disconnect: () => Promise<void>;
}

export default function useInstagramConnect(): UseInstagramConnectReturn {
  const { profile, refetchProfile } = useProfile();
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const account = useMemo<InstagramAccount | null>(() => {
    if (!profile?.socials) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ig = (profile.socials as any[]).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => s.category === "instagram"
    );
    if (!ig) return null;
    const username = ig.link
      ? ig.link.replace(/.*instagram\.com\//, "").replace(/\/$/, "")
      : "";
    return {
      username,
      account_type: ig.account_type || "",
      verified: !!ig.verified,
    };
  }, [profile?.socials]);

  useEffect(() => {
    if (router.query.ig_connected === "true") {
      toast.success("Instagram connected!");
      refetchProfile?.();
      const { ig_connected: _, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, {
        shallow: true,
      });
    }
    if (router.query.ig_error) {
      toast.error(`Instagram: ${router.query.ig_error}`);
      const { ig_error: _, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, {
        shallow: true,
      });
    }
  }, [router.query.ig_connected, router.query.ig_error]); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = useCallback(() => {
    if (!profile) {
      toast.error("Please log in first");
      return;
    }
    if (!IG_APP_ID) {
      toast.error("Instagram not configured");
      return;
    }
    const redirectUri = `${APP_URL}/oauth/instagram/callback`;
    const params = new URLSearchParams({
      client_id: IG_APP_ID,
      redirect_uri: redirectUri,
      scope: "user_profile,user_media",
      response_type: "code",
    });
    window.location.href = `https://api.instagram.com/oauth/authorize?${params}`;
  }, [profile]);

  const disconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch(`${ZO_API}/api/v1/oauth/instagram/disconnect/`, {
        method: "DELETE",
        headers: getZoAuthHeaders(),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("Instagram disconnected");
        refetchProfile?.();
      } else {
        toast.error(data?.errors?.[0] || "Failed to disconnect");
      }
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setIsDisconnecting(false);
    }
  }, [refetchProfile]);

  return {
    isLoading: isDisconnecting,
    isConnected: account !== null,
    account,
    connect,
    disconnect,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx nx test website --testPathPattern="useInstagramConnect" --no-coverage`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/website/src/hooks/useInstagramConnect.ts apps/website/src/__tests__/useInstagramConnect.test.ts
git commit -m "feat(passport): rewrite useInstagramConnect to use Zo backend"
```

---

### Task 3: Create OAuth callback page

**Files:**
- Create: `apps/website/src/pages/oauth/instagram/callback.tsx`
- Create: `apps/website/src/__tests__/instagram-callback.test.tsx`

- [ ] **Step 6: Write callback page test**

```typescript
// apps/website/src/__tests__/instagram-callback.test.tsx
import { render, waitFor } from "@testing-library/react";

jest.mock("@zo/auth", () => ({
  useProfile: jest.fn(() => ({ profile: { code: "ABC123" } })),
}));
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

import { useRouter } from "next/router";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockStorage: Record<string, string> = {
  "zo-web-token": "test-bearer-token",
  "zo-web-device-id": "dev-123",
  "zo-web-device-secret": "sec-456",
};
Object.defineProperty(window, "localStorage", {
  value: { getItem: (key: string) => mockStorage[key] || null },
});

describe("Instagram OAuth callback", () => {
  test("strips #_ from code and POSTs to Zo backend", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { code: "META_CODE_123#_" },
      push: mockPush,
      isReady: true,
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        instagram: { id: "123", username: "johndoe", account_type: "CREATOR" },
      }),
    });

    const { default: CallbackPage } = await import(
      "../pages/oauth/instagram/callback"
    );
    render(<CallbackPage />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/oauth/instagram/connect/"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ code: "META_CODE_123" }),
        })
      );
      expect(mockPush).toHaveBeenCalledWith("/passport?ig_connected=true");
    });
  });

  test("redirects with error when no code param", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: {},
      push: mockPush,
      isReady: true,
    });

    jest.resetModules();
    jest.mock("@zo/auth", () => ({
      useProfile: jest.fn(() => ({ profile: { code: "ABC123" } })),
    }));
    const { default: CallbackPage } = await import(
      "../pages/oauth/instagram/callback"
    );
    render(<CallbackPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/passport?ig_error=no_code");
    });
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx nx test website --testPathPattern="instagram-callback" --no-coverage`
Expected: FAIL — page doesn't exist yet

- [ ] **Step 8: Create callback page**

```typescript
// apps/website/src/pages/oauth/instagram/callback.tsx
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useProfile } from "@zo/auth";

const ZO_API = process.env.API_BASE_URL || "https://api.io.zo.xyz";
const TIMEOUT_MS = 20000;

function getZoAuthHeaders(): Record<string, string> {
  const token =
    localStorage.getItem("zo-admin-token") ||
    localStorage.getItem("zo-web-token") ||
    "";
  const deviceId =
    localStorage.getItem("zo-admin-device-id") ||
    localStorage.getItem("zo-web-device-id") ||
    "";
  const deviceSecret =
    localStorage.getItem("zo-admin-device-secret") ||
    localStorage.getItem("zo-web-device-secret") ||
    "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "client-device-id": deviceId,
    "client-device-secret": deviceSecret,
  };
}

export default function InstagramCallbackPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const calledRef = useRef(false);

  // Timeout: if profile never loads, redirect with error after 20s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true;
        router.push("/passport?ig_error=auth_timeout");
      }
    }, TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (!router.isReady || calledRef.current) return;
    if (!profile) return;

    const rawCode = (router.query.code as string) || "";
    if (!rawCode) {
      calledRef.current = true;
      router.push("/passport?ig_error=no_code");
      return;
    }

    const code = rawCode.replace(/#_$/, "");
    calledRef.current = true;

    fetch(`${ZO_API}/api/v1/oauth/instagram/connect/`, {
      method: "POST",
      headers: getZoAuthHeaders(),
      body: JSON.stringify({ code }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          router.push("/passport?ig_connected=true");
        } else {
          router.push(
            `/passport?ig_error=${encodeURIComponent(data?.errors?.[0] || "connect_failed")}`
          );
        }
      })
      .catch(() => {
        router.push("/passport?ig_error=connect_failed");
      });
  }, [router.isReady, router.query.code, profile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <p className="text-white/60 text-sm">Connecting Instagram...</p>
    </div>
  );
}
```

- [ ] **Step 9: Run tests**

Run: `npx nx test website --testPathPattern="instagram-callback" --no-coverage`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add apps/website/src/pages/oauth/instagram/callback.tsx apps/website/src/__tests__/instagram-callback.test.tsx
git commit -m "feat(passport): add Instagram OAuth callback page for Zo backend"
```

---

### Task 4: Update SettingsModal SocialsSection

**Files:**
- Modify: `apps/website/src/components/passport/SettingsModal.tsx:495-536`

The `SocialsSection` currently reads `igAccount.ig_username` (old Supabase shape). The new hook returns `account.username`. The connected-state JSX block needs updating.

- [ ] **Step 11: Update IG connected row**

In `SettingsModal.tsx`, replace the `instagramRow` connected branch (lines 495-516):

Old: `<p className="text-sm text-white/90 truncate">@{igAccount.ig_username}</p>`
New: `<p className="text-sm text-white/90 truncate">@{igAccount.username}</p>`

Old: `<span className="text-green-400">Verified</span>`
New: `<span className="text-green-400">Connected</span>` + optional account type badge:

```tsx
const instagramRow = igConnected && igAccount ? (
  <div className="flex items-center gap-3 py-3 border-b border-white/5">
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
      style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)" }}
    >
      IG
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-white/90 truncate">@{igAccount.username}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="flex items-center gap-1 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-green-400">Connected</span>
        </span>
        {igAccount.account_type && (
          <span className="text-[11px] text-white/50">{igAccount.account_type}</span>
        )}
      </div>
    </div>
    <button onClick={disconnectIg} className="text-[11px] text-red-400 hover:text-red-300">
      Disconnect
    </button>
  </div>
) : (
  // ... "Not connected" + "Connect" button unchanged (lines 518-536)
```

- [ ] **Step 12: Verify TypeScript compiles**

Run: `npx nx build website --skip-nx-cache`
Expected: Build succeeds

- [ ] **Step 13: Commit**

```bash
git add apps/website/src/components/passport/SettingsModal.tsx
git commit -m "feat(passport): update SocialsSection for new IG backend shape"
```

---

## Chunk 2: Cleanup + Env Config

### Task 5: Environment variable setup

**Files:**
- Modify: `apps/website/.env.local`

- [ ] **Step 14: Update IG env vars — add public, remove secrets**

In `apps/website/.env.local`, replace lines 26-30:

```diff
-# Meta / Instagram OAuth (Zostel Creators app)
-NEXT_PUBLIC_META_APP_ID=1305959311430459
-META_APP_SECRET=dd3439e1760f023fca570d55d3ed35dc
-INSTAGRAM_APP_ID=1426467909279534
-INSTAGRAM_APP_SECRET=16003158ef890b7e83cae66c7f2a8b49
+# Instagram OAuth — client-side only, backend owns secrets
+NEXT_PUBLIC_INSTAGRAM_APP_ID=1426467909279534
```

**Before removing `NEXT_PUBLIC_META_APP_ID` and `META_APP_SECRET`:** verify no other code references them.

Run: `grep -r "META_APP_ID\|META_APP_SECRET" apps/website/src/ --include="*.ts" --include="*.tsx"`

If no results (likely — Meta Pixel uses a different config path), remove them. If results found, keep `NEXT_PUBLIC_META_APP_ID` and document its other consumer.

`NEXT_PUBLIC_APP_URL` already exists at line 36 — the hook constructs the redirect URI from it (`${NEXT_PUBLIC_APP_URL}/oauth/instagram/callback`).

- [ ] **Step 15: Commit**

```bash
git add apps/website/.env.local
git commit -m "chore(passport): update IG env vars — public app ID only, secrets removed"
```

**NOTE for Vercel deploy:** Set in the Vercel dashboard for `zozozo-website` project:
- `NEXT_PUBLIC_INSTAGRAM_APP_ID` = `1426467909279534`
- `NEXT_PUBLIC_APP_URL` is already set to `https://zozozo.work`

**NOTE for Meta portal:** Add `https://zozozo.work/oauth/instagram/callback` as a valid OAuth redirect URI in the Meta developer portal (same app Daya's backend uses — app ID `1426467909279534`).

---

### Task 6: Delete legacy Supabase-based routes + fix dashboard consumers

**Files:**
- Delete: `apps/dashboard/src/pages/api/auth/instagram/index.ts`
- Delete: `apps/dashboard/src/pages/api/auth/instagram/callback.ts`
- Delete: `apps/dashboard/src/pages/api/auth/instagram/status.ts`
- Delete: `apps/dashboard/src/pages/api/auth/instagram/disconnect.ts`
- Delete: `apps/dashboard/src/hooks/useInstagramConnect.ts`
- Modify: `apps/dashboard/src/hooks/index.ts` (remove re-export)
- Modify: `apps/dashboard/src/components/dashboard/QuestContainer.tsx` (remove IG import + usage)
- Modify: `apps/dashboard/src/components/passport/PassportNav.tsx` (remove IG import + usage)
- Modify: `apps/dashboard/src/components/passport/SettingsDrawer.tsx` (remove IG import + usage)

- [ ] **Step 16: Remove IG from dashboard hooks barrel**

In `apps/dashboard/src/hooks/index.ts`, remove:
```diff
-import useInstagramConnect from "./useInstagramConnect";
-export { useGoto, useLogin, useInstagramConnect };
+export { useGoto, useLogin };
```

- [ ] **Step 17: Remove IG from QuestContainer.tsx**

In `apps/dashboard/src/components/dashboard/QuestContainer.tsx`:
- Remove line 3: `import useInstagramConnect from "../../hooks/useInstagramConnect";`
- Remove line 12: `const { isLoading, isConnected, account, connect } = useInstagramConnect();`
- Remove any JSX that references `isConnected`, `account`, or `connect` for IG. Replace with a placeholder or remove the IG quest row entirely.

- [ ] **Step 18: Remove IG from PassportNav.tsx**

In `apps/dashboard/src/components/passport/PassportNav.tsx`:
- Remove line 3: `import useInstagramConnect from "../../hooks/useInstagramConnect";`
- Remove line 7: `const { isConnected, account, connect } = useInstagramConnect();`
- Remove any IG-related JSX.

- [ ] **Step 19: Remove IG from SettingsDrawer.tsx**

In `apps/dashboard/src/components/passport/SettingsDrawer.tsx`:
- Remove line 6: `import useInstagramConnect from "../../hooks/useInstagramConnect";`
- Remove line 541: `const { isConnected: igConnected, ... } = useInstagramConnect();`
- Remove the IG section in the JSX (around line 586).

Note: `SettingsDrawer.tsx` is the OLD settings UI (pre-SettingsModal). It's 737+ lines that were supposed to be deleted in the SettingsModal migration. If the dashboard app is being sunset, these removals are fine — the dashboard IG UI won't be missed.

- [ ] **Step 20: Delete legacy API routes + hook**

```bash
git rm apps/dashboard/src/pages/api/auth/instagram/index.ts
git rm apps/dashboard/src/pages/api/auth/instagram/callback.ts
git rm apps/dashboard/src/pages/api/auth/instagram/status.ts
git rm apps/dashboard/src/pages/api/auth/instagram/disconnect.ts
git rm apps/dashboard/src/hooks/useInstagramConnect.ts
```

- [ ] **Step 21: Check if dashboard supabase.ts has other consumers**

Run: `grep -r "from.*supabase\|from.*config/supabase" apps/dashboard/src/ --include="*.ts" --include="*.tsx" -l`

If only the deleted IG routes imported it, also delete `apps/dashboard/src/config/supabase.ts`:
```bash
git rm apps/dashboard/src/config/supabase.ts
```

- [ ] **Step 22: Verify dashboard build passes**

Run: `npx nx build dashboard --skip-nx-cache`
Expected: Build succeeds with all IG imports removed

- [ ] **Step 23: Commit**

```bash
git add -u apps/dashboard/
git commit -m "chore: remove legacy Supabase-based Instagram OAuth from dashboard"
```

---

### Task 7: End-to-end smoke test

- [ ] **Step 24: Start dev server**

```bash
npx nx serve website
```

Open `http://localhost:4202/passport`

- [ ] **Step 25: Test connect flow**

1. Log in via phone OTP
2. Open Settings (gear icon)
3. Scroll to Socials section
4. Click "Connect" on Instagram row
5. Verify redirect to `api.instagram.com/oauth/authorize` with correct `client_id` and `redirect_uri`
6. Authorize on Meta (use a test IG account)
7. Verify redirect to `localhost:4202/oauth/instagram/callback?code=...`
8. Verify "Connecting Instagram..." loading state shows
9. Verify redirect to `/passport?ig_connected=true`
10. Verify toast "Instagram connected!" appears
11. Verify IG row shows `@{username}` + "Connected" badge
12. Refresh page — verify connected state persists (from `profile.socials`)

- [ ] **Step 26: Test disconnect flow**

1. Click "Disconnect" on Instagram row
2. Verify toast "Instagram disconnected"
3. Verify row reverts to "Not connected" + "Connect" button
4. Refresh — verify disconnected state persists

- [ ] **Step 27: Test edge cases**

1. Click Connect when logged out → toast "Please log in first"
2. Navigate directly to `/oauth/instagram/callback` with no `?code=` → redirects to `/passport?ig_error=no_code`
3. Wait 20s on callback page without auth → redirects to `/passport?ig_error=auth_timeout`

---

## Deferred (not in this plan)

- **Supabase table cleanup:** Drop `ig_connected_accounts` + `ig_oauth_states` after ≥3 days stable on prod. Separate migration.
- **Account type gating:** Show prompt to switch to Creator/Business for quest features. Deferred until quest engine backend exists.
- **Meta portal config:** Needs someone with Meta developer portal access. Add `https://zozozo.work/oauth/instagram/callback` as valid redirect URI.
- **OAuth scope verification:** Daya's spec uses `user_profile,user_media`. If Meta's API version requires different scopes (e.g., `instagram_basic` for Business Login API), update the `connect()` call. Confirm with Daya which Meta product the backend is built against.
