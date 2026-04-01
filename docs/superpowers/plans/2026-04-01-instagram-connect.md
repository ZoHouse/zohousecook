# Instagram Connect Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let dashboard users connect their Instagram account via OAuth, store profile metadata in Supabase, and display connected state on the main dashboard and passport page.

**Architecture:** Next.js API routes handle Instagram OAuth (start → callback). A CSRF state table prevents forgery. Connected accounts are stored in the Zo House Supabase instance, keyed by `zo_user_code`. A React hook provides the frontend interface. The Supabase client is server-side only (service role key never exposed to browser).

**Tech Stack:** Next.js 14 (Pages Router), Supabase, Instagram Graph API v25.0, TypeScript, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-04-01-instagram-connect-design.md`

**Monorepo root:** `/Users/samuraizan/samuraidojo/zohouse/zo.xyz/mono-front-main/`
**Dashboard app:** `apps/dashboard/`
**Dashboard dev server:** `npx nx serve dashboard` (port 4203)
**Dashboard basePath:** `/dashboard` (set via `NEXT_BASE_PATH` env var)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/dashboard/src/config/supabase.ts` | Create | Server-side Supabase client |
| `apps/dashboard/src/pages/api/auth/instagram/index.ts` | Create | OAuth start — generate state, redirect to IG |
| `apps/dashboard/src/pages/api/auth/instagram/callback.ts` | Create | OAuth callback — validate state, token exchange, profile fetch, upsert |
| `apps/dashboard/src/pages/api/auth/instagram/status.ts` | Create | Return connection status for a user |
| `apps/dashboard/src/pages/api/auth/instagram/disconnect.ts` | Create | Remove connection |
| `apps/dashboard/src/hooks/useInstagramConnect.ts` | Create | React hook — status, connect, disconnect |
| `apps/dashboard/src/components/dashboard/QuestContainer.tsx` | Modify | Add IG connect button + connected state |
| `apps/dashboard/src/pages/passport.tsx` | Modify | Extend SocialsSection with IG row |

---

## Chunk 1: Database + Supabase Client

### Task 1: Create Supabase tables

**Files:**
- Reference: `apps/pms/src/configs/supabase.ts`

- [ ] **Step 1: Create `ig_connected_accounts` table in Supabase**

Run this SQL in the Zo House Supabase dashboard (SQL Editor):

```sql
CREATE TABLE IF NOT EXISTS ig_connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zo_user_code TEXT NOT NULL UNIQUE,
  ig_user_id TEXT NOT NULL,
  ig_username TEXT NOT NULL,
  display_name TEXT,
  followers_count INTEGER DEFAULT 0,
  follows_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  biography TEXT,
  profile_picture_url TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ig_connected_ig_user_id ON ig_connected_accounts(ig_user_id);

ALTER TABLE ig_connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON ig_connected_accounts FOR ALL
  USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Create `ig_oauth_states` table in Supabase**

```sql
CREATE TABLE IF NOT EXISTS ig_oauth_states (
  state TEXT PRIMARY KEY,
  zo_user_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ig_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON ig_oauth_states FOR ALL
  USING (true) WITH CHECK (true);
```

- [ ] **Step 3: Verify both tables exist**

Run in Supabase SQL Editor:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'ig_%';
```
Expected: `ig_connected_accounts`, `ig_oauth_states`

### Task 2: Create server-side Supabase client

**Files:**
- Create: `apps/dashboard/src/config/supabase.ts`
- Reference: `apps/pms/src/configs/supabase.ts`

- [ ] **Step 1: Create the Supabase client**

```typescript
// apps/dashboard/src/config/supabase.ts

/**
 * Server-side Supabase client for Instagram connect.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix) so this is
 * only available in API routes — never bundled into client-side JS.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

export const supabase = createClient(supabaseUrl, supabaseKey);
```

- [ ] **Step 2: Verify env vars are set**

Check that the dashboard app has these env vars configured (Vercel or local `.env`):
- `NEXT_PUBLIC_SUPABASE_URL` — should already exist (used by PMS)
- `SUPABASE_SERVICE_ROLE_KEY` — may need to be added to the dashboard's env

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/src/config/supabase.ts
git commit -m "feat(dashboard): add server-side Supabase client for Instagram connect"
```

---

## Chunk 2: API Routes

### Task 3: OAuth start route

**Files:**
- Create: `apps/dashboard/src/pages/api/auth/instagram/index.ts`

- [ ] **Step 1: Create the API route**

```typescript
// apps/dashboard/src/pages/api/auth/instagram/index.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { supabase } from "../../../../config/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const zoUserCode = (req.query.zo_user_code as string || "").trim();
  if (!zoUserCode) {
    return res.status(400).json({ error: "zo_user_code is required" });
  }

  const appId = (process.env.INSTAGRAM_APP_ID || "").trim();
  if (!appId) {
    return res.status(500).json({ error: "INSTAGRAM_APP_ID not configured" });
  }

  // Generate CSRF state token and store with user binding
  const state = randomUUID();
  const { error: stateErr } = await supabase
    .from("ig_oauth_states")
    .insert({ state, zo_user_code: zoUserCode });

  if (stateErr) {
    console.error("[ig/start] Failed to store state:", stateErr.message);
    return res.status(500).json({ error: "Failed to initiate OAuth" });
  }

  // Clean up expired states (older than 10 minutes)
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  await supabase
    .from("ig_oauth_states")
    .delete()
    .lt("created_at", tenMinAgo);

  // Build the redirect URI
  // NEXT_PUBLIC_APP_URL should be the root domain (e.g., https://zozozo.work)
  // basePath (/dashboard) is applied by Next.js automatically
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
  const basePath = (process.env.NEXT_BASE_PATH || "").trim();
  const redirectUri = `${appUrl}${basePath}/api/auth/instagram/callback`;

  const authUrl =
    "https://www.instagram.com/oauth/authorize" +
    "?enable_fb_login=0" +
    `&client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&response_type=code" +
    "&scope=instagram_business_basic" +
    `&state=${state}`;

  return res.redirect(authUrl);
}
```

- [ ] **Step 2: Add env vars to dashboard**

Add to the dashboard's `.env` (or Vercel env):
```
INSTAGRAM_APP_ID=<your-instagram-app-id>
INSTAGRAM_APP_SECRET=<your-instagram-app-secret>
NEXT_PUBLIC_APP_URL=http://localhost:4203   # local dev — set to https://zozozo.work on Vercel
```

Note: `NEXT_PUBLIC_APP_URL` is NOT already configured for the dashboard — it must be added. Without it, redirect URIs will be empty and OAuth will fail.

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/src/pages/api/auth/instagram/index.ts
git commit -m "feat(dashboard): add Instagram OAuth start route"
```

### Task 4: OAuth callback route

**Files:**
- Create: `apps/dashboard/src/pages/api/auth/instagram/callback.ts`

- [ ] **Step 1: Create the callback route**

```typescript
// apps/dashboard/src/pages/api/auth/instagram/callback.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../../config/supabase";

const basePath = (process.env.NEXT_BASE_PATH || "").trim();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const dashboardUrl = `${(process.env.NEXT_PUBLIC_APP_URL || "").trim()}${basePath}`;

  // Extract params
  let code = (req.query.code as string) || "";
  const state = (req.query.state as string) || "";
  const error = req.query.error as string | undefined;

  if (error || !code) {
    const reason = (req.query.error_description as string) || "oauth_denied";
    return res.redirect(`${dashboardUrl}?ig_error=${encodeURIComponent(reason)}`);
  }

  // Strip trailing #_ that Instagram sometimes appends
  code = code.replace(/#.*$/, "");

  // --- Step 1: Validate CSRF state ---
  const { data: stateRow, error: stateFetchErr } = await supabase
    .from("ig_oauth_states")
    .select("zo_user_code, created_at")
    .eq("state", state)
    .single();

  if (stateFetchErr || !stateRow) {
    return res.redirect(
      `${dashboardUrl}?ig_error=${encodeURIComponent("Invalid or expired OAuth state. Please try again.")}`
    );
  }

  // Check expiry (10 minutes)
  const stateAge = Date.now() - new Date(stateRow.created_at).getTime();
  if (stateAge > 10 * 60 * 1000) {
    await supabase.from("ig_oauth_states").delete().eq("state", state);
    return res.redirect(
      `${dashboardUrl}?ig_error=${encodeURIComponent("OAuth session expired. Please try again.")}`
    );
  }

  const zoUserCode = stateRow.zo_user_code;

  // Delete used state (single-use)
  await supabase.from("ig_oauth_states").delete().eq("state", state);

  const appId = (process.env.INSTAGRAM_APP_ID || "").trim();
  const appSecret = (process.env.INSTAGRAM_APP_SECRET || "").trim();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
  const redirectUri = `${appUrl}${basePath}/api/auth/instagram/callback`;

  if (!appId || !appSecret) {
    return res.redirect(
      `${dashboardUrl}?ig_error=${encodeURIComponent("Server misconfigured: missing Instagram credentials")}`
    );
  }

  try {
    // --- Step 2: Exchange code for short-lived token ---
    const tokenRes = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code,
        }),
      }
    );

    const tokenText = await tokenRes.text();
    if (!tokenRes.ok) {
      let errMsg = `Token exchange failed (${tokenRes.status})`;
      try {
        const errBody = JSON.parse(tokenText);
        errMsg = errBody.error_message || errMsg;
      } catch {
        /* use default */
      }
      throw new Error(errMsg);
    }

    const tokenBody = JSON.parse(tokenText) as {
      access_token: string;
      user_id: number;
    };

    // --- Step 3: Exchange for long-lived token ---
    const longRes = await fetch(
      `https://graph.instagram.com/access_token` +
        `?grant_type=ig_exchange_token` +
        `&client_secret=${appSecret}` +
        `&access_token=${tokenBody.access_token}`
    );
    const longBody = await longRes.json().catch(() => ({})) as Record<string, unknown>;
    const accessToken = String(longBody.access_token || tokenBody.access_token);
    const expiresIn = longBody.expires_in as number | undefined;

    // --- Step 4: Fetch profile ---
    const profileRes = await fetch(
      `https://graph.instagram.com/v25.0/me` +
        `?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url` +
        `&access_token=${accessToken}`
    );

    if (!profileRes.ok) {
      const errBody = await profileRes.json().catch(() => ({})) as Record<string, unknown>;
      const errMsg =
        (errBody.error as Record<string, unknown>)?.message ||
        `Profile fetch failed (${profileRes.status})`;
      throw new Error(String(errMsg));
    }

    const profile = (await profileRes.json()) as {
      id: string;
      username: string;
      name?: string;
      biography?: string;
      followers_count?: number;
      follows_count?: number;
      media_count?: number;
      profile_picture_url?: string;
    };

    // --- Step 5: Upsert to Supabase ---
    const now = new Date().toISOString();
    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    const { error: upsertErr } = await supabase
      .from("ig_connected_accounts")
      .upsert(
        {
          zo_user_code: zoUserCode,
          ig_user_id: profile.id,
          ig_username: profile.username,
          display_name: profile.name || profile.username,
          followers_count: profile.followers_count ?? 0,
          follows_count: profile.follows_count ?? 0,
          media_count: profile.media_count ?? 0,
          biography: profile.biography || null,
          profile_picture_url: profile.profile_picture_url || null,
          access_token: accessToken,
          token_expires_at: tokenExpiresAt,
          updated_at: now,
        },
        { onConflict: "zo_user_code" }
      );

    if (upsertErr) {
      console.error("[ig/callback] Upsert error:", upsertErr.message);
      throw new Error("Failed to save Instagram account");
    }

    return res.redirect(`${dashboardUrl}?ig_connected=true`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[ig/callback] Error:", message);
    return res.redirect(
      `${dashboardUrl}?ig_error=${encodeURIComponent(message)}`
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/dashboard/src/pages/api/auth/instagram/callback.ts
git commit -m "feat(dashboard): add Instagram OAuth callback route"
```

### Task 5: Status and disconnect routes

**Files:**
- Create: `apps/dashboard/src/pages/api/auth/instagram/status.ts`
- Create: `apps/dashboard/src/pages/api/auth/instagram/disconnect.ts`

- [ ] **Step 1: Create status route**

```typescript
// apps/dashboard/src/pages/api/auth/instagram/status.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../../config/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const zoUserCode = (req.query.zo_user_code as string || "").trim();
  if (!zoUserCode) {
    return res.status(400).json({ error: "zo_user_code is required" });
  }

  const { data, error } = await supabase
    .from("ig_connected_accounts")
    .select(
      "ig_username, display_name, followers_count, profile_picture_url, biography, connected_at"
    )
    .eq("zo_user_code", zoUserCode)
    .single();

  if (error || !data) {
    return res.status(200).json({ connected: false, account: null });
  }

  return res.status(200).json({ connected: true, account: data });
}
```

- [ ] **Step 2: Create disconnect route**

```typescript
// apps/dashboard/src/pages/api/auth/instagram/disconnect.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../../config/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Use POST (not DELETE) — DELETE with query params can be triggered via
  // img tags or simple URL visits. POST requires a form/fetch body.
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const zoUserCode = ((req.body?.zo_user_code as string) || "").trim();
  if (!zoUserCode) {
    return res.status(400).json({ error: "zo_user_code is required" });
  }

  const { error } = await supabase
    .from("ig_connected_accounts")
    .delete()
    .eq("zo_user_code", zoUserCode);

  if (error) {
    console.error("[ig/disconnect] Error:", error.message);
    return res.status(500).json({ error: "Failed to disconnect" });
  }

  return res.status(200).json({ success: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/src/pages/api/auth/instagram/status.ts apps/dashboard/src/pages/api/auth/instagram/disconnect.ts
git commit -m "feat(dashboard): add Instagram status and disconnect API routes"
```

---

## Chunk 3: React Hook

### Task 6: Create useInstagramConnect hook

**Files:**
- Create: `apps/dashboard/src/hooks/useInstagramConnect.ts`
- Modify: `apps/dashboard/src/hooks/index.ts`

- [ ] **Step 1: Create the hook**

```typescript
// apps/dashboard/src/hooks/useInstagramConnect.ts

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useProfile } from "@zo/auth";
import { toast } from "sonner";

export interface InstagramAccount {
  ig_username: string;
  display_name: string;
  followers_count: number;
  profile_picture_url: string | null;
  biography: string | null;
  connected_at: string;
}

interface UseInstagramConnectReturn {
  isLoading: boolean;
  isConnected: boolean;
  account: InstagramAccount | null;
  connect: () => void;
  disconnect: () => Promise<void>;
  refetch: () => void;
}

export default function useInstagramConnect(): UseInstagramConnectReturn {
  const { profile } = useProfile();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<InstagramAccount | null>(null);

  const zoUserCode = profile?.code as string | undefined;
  const basePath = router.basePath || "";

  const fetchStatus = useCallback(async () => {
    if (!zoUserCode) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${basePath}/api/auth/instagram/status?zo_user_code=${encodeURIComponent(zoUserCode)}`
      );
      const data = await res.json();
      setAccount(data.connected ? data.account : null);
    } catch {
      setAccount(null);
    } finally {
      setIsLoading(false);
    }
  }, [zoUserCode, basePath]);

  // Fetch on mount and when zoUserCode changes
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle query params from OAuth redirect
  useEffect(() => {
    if (router.query.ig_connected === "true") {
      toast.success("Instagram connected!");
      fetchStatus();
      // Clean up query param
      const { ig_connected: _ig_connected, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, {
        shallow: true,
      });
    }
    if (router.query.ig_error) {
      toast.error(`Instagram: ${router.query.ig_error}`);
      const { ig_error: _ig_error, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, {
        shallow: true,
      });
    }
  }, [router.query.ig_connected, router.query.ig_error]); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = useCallback(() => {
    if (!zoUserCode) {
      toast.error("Please log in first");
      return;
    }
    window.location.href = `${basePath}/api/auth/instagram?zo_user_code=${encodeURIComponent(zoUserCode)}`;
  }, [zoUserCode, basePath]);

  const disconnect = useCallback(async () => {
    if (!zoUserCode) return;

    try {
      const res = await fetch(
        `${basePath}/api/auth/instagram/disconnect`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zo_user_code: zoUserCode }),
        }
      );
      if (res.ok) {
        setAccount(null);
        toast.success("Instagram disconnected");
      } else {
        toast.error("Failed to disconnect");
      }
    } catch {
      toast.error("Failed to disconnect");
    }
  }, [zoUserCode, basePath]);

  return {
    isLoading,
    isConnected: account !== null,
    account,
    connect,
    disconnect,
    refetch: fetchStatus,
  };
}
```

- [ ] **Step 2: Export from hooks index**

Modify `apps/dashboard/src/hooks/index.ts`:

```typescript
import useGoto from "./useGoto";
import useLogin from "./useLogin";
import useInstagramConnect from "./useInstagramConnect";

export { useGoto, useLogin, useInstagramConnect };
```

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/src/hooks/useInstagramConnect.ts apps/dashboard/src/hooks/index.ts
git commit -m "feat(dashboard): add useInstagramConnect hook"
```

---

## Chunk 4: UI Changes

### Task 7: Update QuestContainer with Instagram connect

**Files:**
- Modify: `apps/dashboard/src/components/dashboard/QuestContainer.tsx`

- [ ] **Step 1: Rewrite QuestContainer with connect state**

```tsx
// apps/dashboard/src/components/dashboard/QuestContainer.tsx

import React from "react";
import { GlassCard } from "./GlassCard";
import useInstagramConnect from "../../hooks/useInstagramConnect";

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function QuestContainer() {
  const { isLoading, isConnected, account, connect } = useInstagramConnect();

  if (isLoading) {
    return (
      <GlassCard className="p-5 flex flex-col">
        <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-2" />
        <div className="h-3 w-48 bg-white/10 rounded animate-pulse mb-4" />
        <div className="h-10 w-full bg-white/10 rounded-dash-md animate-pulse" />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5 flex flex-col">
      {isConnected && account && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-dash-border">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
            }}
          >
            IG
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-dash-text truncate">
              @{account.ig_username}
            </p>
            <p className="text-[10px] text-dash-text-50">
              {formatFollowers(account.followers_count)} followers
            </p>
          </div>
          <span className="px-2 py-0.5 text-[10px] uppercase bg-green-500/20 text-green-400 rounded-full flex-shrink-0">
            Connected
          </span>
        </div>
      )}

      <h3 className="text-base font-bold text-dash-text mb-1">
        Earn from your travel content
      </h3>
      <p className="text-xs text-dash-text-50 mb-4">
        Join the Zo Creator Programme. Daily quests, real earnings.
      </p>

      {isConnected ? (
        <button className="w-full py-3 rounded-dash-md text-sm font-semibold text-dash-text bg-white/10 border border-dash-border hover:bg-white/15 hover:border-dash-border-hover backdrop-blur-dash-md transition-colors">
          Join as Creator
        </button>
      ) : (
        <button
          onClick={connect}
          className="w-full py-3 rounded-dash-md text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            background:
              "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
          }}
        >
          Connect Instagram
        </button>
      )}
    </GlassCard>
  );
}
```

- [ ] **Step 2: Verify QuestContainer renders on dashboard**

Run: `npx nx serve dashboard`
Open: `http://localhost:4203/dashboard`
Expected: QuestContainer in the left panel shows "Connect Instagram" button with gradient styling.

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/src/components/dashboard/QuestContainer.tsx
git commit -m "feat(dashboard): add Instagram connect button to QuestContainer"
```

### Task 8: Extend SocialsSection on passport page

**Files:**
- Modify: `apps/dashboard/src/pages/passport.tsx`

- [ ] **Step 1: Update the SocialsSection**

In `apps/dashboard/src/pages/passport.tsx`, find the `SocialsSection` function (around line 541) and replace it with:

```tsx
// --- Socials ---

function SocialsSection() {
  const { profile } = useProfile();
  const { isConnected: igConnected, account: igAccount, connect: connectIg, disconnect: disconnectIg } = useInstagramConnect();

  const socials = useMemo(() => {
    if (!profile?.socials) return [];
    return (profile.socials as any[])
      .filter((s) => s.category !== "instagram") // Exclude IG from Django socials — we handle it separately
      .map((s) => ({
        category: s.category as string, link: s.link as string, verified: s.verified as boolean,
        handle: s.category === "twitter" ? s.link?.split(".com/")[1]
          : s.category === "telegram" ? s.link?.split(".me/")[1]
          : s.category === "discord" ? "Connected" : s.link,
      }));
  }, [profile?.socials]);

  const ens = profile?.ens_nickname;
  const iconMap: Record<string, string> = { twitter: "X", telegram: "TG", discord: "DC" };

  return (
    <GlassCard className="p-dash-xl">
      <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider mb-dash-lg">Connected Socials</h3>
      <div className="flex flex-col gap-2">
        {ens && (
          <div className={rowCls}>
            <div className="flex items-center gap-3">
              <div className={iconCircle + " text-[10px] font-bold"}>ENS</div>
              <p className="text-sm text-dash-text">{ens}</p>
            </div>
          </div>
        )}
        {socials.map((s) => (
          <div key={s.category} className={rowCls}>
            <div className="flex items-center gap-3">
              <div className={iconCircle + " text-[10px] font-bold"}>
                {iconMap[s.category] || s.category.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] text-dash-text-40 capitalize">{s.category}</p>
                <p className="text-sm text-dash-text">{s.handle || s.link}</p>
              </div>
            </div>
            {s.verified && <span className={badgeVerified}>Verified</span>}
          </div>
        ))}

        {/* Instagram — from Supabase via useInstagramConnect */}
        {igConnected && igAccount ? (
          <div className={rowCls}>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
                }}
              >
                IG
              </div>
              <div>
                <p className="text-[10px] text-dash-text-40">Instagram</p>
                <p className="text-sm text-dash-text">@{igAccount.ig_username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={badgeVerified}>Verified</span>
              <button
                onClick={disconnectIg}
                className="px-2 py-1 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-dash-sm transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className={rowCls}>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
                }}
              >
                IG
              </div>
              <div>
                <p className="text-[10px] text-dash-text-40">Instagram</p>
                <p className="text-sm text-dash-text-50">Not connected</p>
              </div>
            </div>
            <button
              onClick={connectIg}
              className="px-3 py-1 text-[10px] font-semibold text-white rounded-dash-sm transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
              }}
            >
              Connect
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
```

- [ ] **Step 2: Add the import at the top of passport.tsx**

At the top of `apps/dashboard/src/pages/passport.tsx`, add the import alongside the existing ones:

```typescript
import useInstagramConnect from "../hooks/useInstagramConnect";
```

- [ ] **Step 3: Remove the early return that hides SocialsSection when empty**

The current code (around line 556) has:
```typescript
if (socials.length === 0 && !ens) return null;
```

This is removed in the new version since we always want to show the Instagram row (connected or not). The new code uses `hasAnySocials` only for future reference — the section always renders now because the IG connect button is always visible.

- [ ] **Step 4: Verify on passport page**

Run: `npx nx serve dashboard`
Open: `http://localhost:4203/dashboard/passport`
Expected: SocialsSection shows Instagram row at the bottom with either "Connect" button (gradient) or connected state with "@username" and "Disconnect" button.

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/src/pages/passport.tsx
git commit -m "feat(dashboard): add Instagram connect/disconnect to passport SocialsSection"
```

---

## Chunk 5: Meta App Setup & Testing

### Task 9: Configure Meta developer app

- [ ] **Step 1: Create or configure Instagram app on Meta developer portal**

Go to https://developers.facebook.com/ and either create a new app or use the existing Zo World app.

1. Navigate to: Use Cases → Instagram → API setup with Instagram Login
2. Note the **Instagram App ID** and **Instagram App Secret**
3. Add redirect URI: the callback URL for your environment
   - Production: `https://zozozo.work/dashboard/api/auth/instagram/callback`
   - Staging/tunnel: `https://{your-tunnel}/dashboard/api/auth/instagram/callback`
4. Ensure `instagram_business_basic` permission is requested

- [ ] **Step 2: Set env vars**

Set in dashboard `.env` or Vercel:
```
INSTAGRAM_APP_ID=<from step 1>
INSTAGRAM_APP_SECRET=<from step 1>
```

### Task 10: End-to-end test

- [ ] **Step 1: Test the full OAuth flow**

1. Start dashboard: `npx nx serve dashboard`
2. Open `http://localhost:4203/dashboard`
3. Log in with Zo World auth
4. Click "Connect Instagram" in QuestContainer
5. Should redirect to Instagram OAuth screen
6. Authorize the app
7. Should redirect back to dashboard with `?ig_connected=true`
8. QuestContainer should show `@username` + follower count + "Connected" badge
9. Navigate to `/dashboard/passport`
10. SocialsSection should show Instagram row with verified badge

- [ ] **Step 2: Test disconnect**

1. On passport page, click "Disconnect" next to Instagram
2. Should show "Instagram disconnected" toast
3. Instagram row should switch to "Connect" button
4. QuestContainer on main dashboard should also show "Connect Instagram" again

- [ ] **Step 3: Test error handling**

1. Navigate directly to `/dashboard/api/auth/instagram` without `zo_user_code`
2. Should return 400 JSON error
3. Start OAuth, but deny permissions on Instagram
4. Should redirect back with error toast

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(dashboard): Instagram connect — complete implementation"
```
