# Instagram Connect for /dashboard — Design Spec

**Date:** 2026-04-01
**Author:** Samurai + Claude
**Status:** Approved

---

## Goal

Let dashboard users connect their Instagram account via OAuth. Store profile metadata (username, followers, bio, profile picture) in Supabase alongside their Zo World user identity. Display connected state on the main dashboard and passport page.

## Non-goals

- Onboarding flow changes (Socials.tsx step)
- Media sync, analytics, or insights
- Quest verification or Zo Klout scoring
- Django backend changes
- Token refresh automation (manual reconnect for now)
- Token encryption at rest (acceptable for staging; flag for production migration)

## Context

The dashboard already has Twitter, Discord, and Telegram social connects. Twitter and Discord flow through Django backend endpoints (`/api/v1/socials/{platform}/oauth/...`). We cannot modify the Django backend, so Instagram OAuth is handled entirely within the dashboard app using Next.js API routes and the existing Zo House Supabase instance.

**Auth constraint:** Dashboard auth is entirely client-side — tokens stored in `localStorage` under `zo-web-token`, never sent as cookies. API routes cannot read auth state from the request. This affects how we bind OAuth flows to users (see Auth section).

Reference implementation: `command-centre/src/app/api/auth/instagram/` (OAuth flow, token exchange, profile fetch).

## Architecture

```
User clicks "Connect Instagram"
       │
       ▼
Hook: connect() builds URL with zo_user_code query param
       │
       ▼
GET /dashboard/api/auth/instagram?zo_user_code=ABC123
       │  1. Generates random state token (crypto.randomUUID)
       │  2. Stores {state, zo_user_code, created_at} in Supabase ig_oauth_states
       │  3. Builds Instagram OAuth URL with state token
       │  4. Redirects to Instagram
       ▼
instagram.com/oauth/authorize
       │  User grants permission (scope: instagram_business_basic)
       ▼
GET /dashboard/api/auth/instagram/callback?code=...&state=...
       │  1. Look up state in ig_oauth_states, get zo_user_code
       │  2. Reject if state not found or expired (>10 min)
       │  3. Delete used state row (single-use)
       │  4. Exchange code → short-lived token
       │  5. Exchange → long-lived token (60 days)
       │  6. Fetch profile from IG Graph API v25.0
       │  7. Upsert to ig_connected_accounts keyed by zo_user_code
       ▼
Redirect to /dashboard?ig_connected=true
```

## Database

Stored in the existing Zo House Supabase instance.

### Table: `ig_connected_accounts`

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

### Table: `ig_oauth_states` (CSRF protection)

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

States expire after 10 minutes. Cleanup: delete on use (callback), and periodically delete rows older than 10 minutes.

**Key decisions:**
- Keyed by `zo_user_code` (from `profile.code`) — the stable Zo World user identifier
- `UNIQUE` on `zo_user_code` — one Instagram account per Zo user
- Index on `ig_user_id` for future lookups
- Access token stored in plaintext (acceptable for staging; encrypt for production)
- RLS with service role bypass — same pattern as PMS Supabase tables
- Separate CSRF state table prevents OAuth state forgery

## Auth & CSRF

Dashboard auth lives in `localStorage` (`zo-web-token`), inaccessible to API routes. We handle this with a two-step approach:

**User binding:** The `connect()` function passes `zo_user_code` from `profile.code` as a query param to the OAuth start route. This is not secret but identifies which user initiated the flow.

**CSRF protection:** The OAuth start route generates a random `state` token (`crypto.randomUUID()`), stores it in `ig_oauth_states` alongside the `zo_user_code`, and passes only the state to Instagram. On callback, the state is looked up in Supabase to recover the `zo_user_code`. States are single-use (deleted after lookup) and expire after 10 minutes.

**Threat model:** An attacker cannot forge the OAuth callback because they don't know the random state token. The `zo_user_code` is never exposed in the OAuth redirect URL — only the opaque state token is.

## API Routes

All routes in `apps/dashboard/src/pages/api/auth/instagram/`.

### `GET /api/auth/instagram` — Start OAuth

```typescript
// pages/api/auth/instagram/index.ts

// 1. Read zo_user_code from query param
// 2. If missing → 400
// 3. Generate state = crypto.randomUUID()
// 4. Insert {state, zo_user_code} into ig_oauth_states
// 5. Build Instagram OAuth URL:
//    - enable_fb_login=0
//    - client_id = INSTAGRAM_APP_ID
//    - redirect_uri = {NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback
//      (Next.js auto-prefixes with basePath, so NEXT_PUBLIC_APP_URL should NOT include /dashboard)
//    - response_type = code
//    - scope = instagram_business_basic
//    - state = generated state token
// 6. Redirect to Instagram
```

### `GET /api/auth/instagram/callback` — Handle OAuth callback

```typescript
// pages/api/auth/instagram/callback.ts

// 1. Extract code and state from query params
// 2. Strip trailing #_ from code (Instagram appends it)
// 3. Look up state in ig_oauth_states → get zo_user_code
// 4. If not found or created_at > 10 min ago → redirect with error
// 5. Delete the state row (single-use)
// 6. Exchange code for short-lived token:
//    POST https://api.instagram.com/oauth/access_token
//    body: { client_id, client_secret, grant_type: "authorization_code", redirect_uri, code }
// 7. Exchange for long-lived token:
//    GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=...&access_token=...
// 8. Fetch profile:
//    GET https://graph.instagram.com/v25.0/me?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url&access_token=...
// 9. Upsert to ig_connected_accounts:
//    { zo_user_code, ig_user_id, ig_username, display_name, followers_count, ..., updated_at: now() }
// 10. Redirect to /dashboard?ig_connected=true
// On error → redirect to /dashboard?ig_error={message}
```

### `GET /api/auth/instagram/status` — Check connection status

```typescript
// pages/api/auth/instagram/status.ts

// 1. Read zo_user_code from query param
// 2. If missing → 400
// 3. Query ig_connected_accounts where zo_user_code matches
// 4. Return { connected: boolean, account: { ig_username, display_name, followers_count, profile_picture_url, biography, connected_at } | null }
// Note: does NOT return access_token — that stays server-side only
```

### `DELETE /api/auth/instagram/disconnect` — Remove connection

```typescript
// pages/api/auth/instagram/disconnect.ts

// 1. Read zo_user_code from query param
// 2. If missing → 400
// 3. Delete from ig_connected_accounts where zo_user_code matches
// 4. Return { success: true }
```

**Token exchange gotchas** (from command-centre learnings):
- Always `.trim()` env vars — Vercel adds trailing newlines
- Instagram codes expire in seconds — exchange immediately, no intermediate redirects
- Instagram App Secret != Meta App Secret — use the correct one
- Strip `#_` suffix from code param (Instagram appends it)

## Supabase Client

**Server-side only** — new file: `apps/dashboard/src/config/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Important:** This client uses the **non-public** `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix), so it is only available in API routes (server-side). The service key is never bundled into client-side JS. This is different from PMS which uses `NEXT_PUBLIC_SUPABASE_SERVICE_KEY` — PMS is an internal staff tool; dashboard is public-facing.

API routes import this client. The React hook calls API routes — it never queries Supabase directly.

## React Hook

New file: `apps/dashboard/src/hooks/useInstagramConnect.ts`

```typescript
function useInstagramConnect() → {
  isLoading: boolean;
  isConnected: boolean;
  account: {
    ig_username: string;
    display_name: string;
    followers_count: number;
    profile_picture_url: string;
    biography: string;
    connected_at: string;
  } | null;
  connect: () => void;
  disconnect: () => Promise<void>;
  refetch: () => void;
}
```

**Implementation:**
- Uses `useProfile()` to get `profile.code` as the lookup key
- Fetches `GET /api/auth/instagram/status?zo_user_code={profile.code}` via `fetch()`
- `connect()` navigates to `{basePath}/api/auth/instagram?zo_user_code={profile.code}`
- `disconnect()` calls `DELETE /api/auth/instagram/disconnect?zo_user_code={profile.code}`, then refetches
- On mount, checks for `?ig_connected=true` query param and triggers refetch + optional toast
- On `?ig_error=...`, shows error toast

## UI Changes

### 1. QuestContainer (main dashboard, left panel)

File: `apps/dashboard/src/components/dashboard/QuestContainer.tsx`

Currently a simple 18-line component with static text. Modify to use `useInstagramConnect()`.

**Not connected state:**
```
┌──────────────────────────────┐
│  Earn from your travel       │
│  content                     │
│                              │
│  Join the Zo Creator         │
│  Programme. Daily quests,    │
│  real earnings.              │
│                              │
│  [ Connect Instagram ]       │
└──────────────────────────────┘
```
- Button styled with Instagram gradient (`linear-gradient(135deg, #833AB4, #E1306C, #F77737)`)
- Clicking calls `connect()` from the hook

**Connected state:**
```
┌──────────────────────────────┐
│  IG  @username    ✓ Connected│
│  1.2K followers              │
│                              │
│  Earn from your travel       │
│  content                     │
│                              │
│  [ Join as Creator ]         │
└──────────────────────────────┘
```
- Shows IG username + follower count at top of card
- "Join as Creator" button remains for future quest flow

### 2. SocialsSection on Passport page

File: `apps/dashboard/src/pages/passport.tsx`

Current `SocialsSection` only renders socials from `profile.socials` (Django). Extend it to also show Instagram from Supabase via the hook.

- Always render the Instagram row (connected or not)
- If connected: show IG icon, `@username`, follower count, "Verified" badge
- If not connected: show IG icon + "Connect" button
- Sits alongside the existing Twitter/Discord/Telegram/ENS rows
- If `SocialsSection` currently returns null when no socials exist, change condition to also check Instagram connection

**Connected:**
```
┌──────────────────────────────────────┐
│  IG  │ instagram                     │
│      │ @username         [Verified]  │
│      │ 1.2K followers               │
└──────────────────────────────────────┘
```

**Not connected:**
```
┌──────────────────────────────────────┐
│  IG  │ Instagram         [Connect]  │
└──────────────────────────────────────┘
```

## Environment Variables

Three env vars for the dashboard app:

```env
INSTAGRAM_APP_ID=              # Instagram App ID (from Meta developer portal)
INSTAGRAM_APP_SECRET=          # Instagram App Secret (NOT Meta App Secret)
SUPABASE_SERVICE_ROLE_KEY=     # Already exists — server-side only, no NEXT_PUBLIC_ prefix
```

`NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SUPABASE_URL` are already configured.

**basePath note:** `NEXT_PUBLIC_APP_URL` should be the root domain (e.g., `https://zozozo.work`), not including `/dashboard`. Next.js auto-prefixes API routes with the basePath configured in `next.config.js`.

## Meta App Configuration

In the Meta developer portal, add the redirect URI:
```
https://zozozo.work/dashboard/api/auth/instagram/callback
```

For local development, use a tunnel since Instagram requires HTTPS:
```
https://{tunnel-domain}/dashboard/api/auth/instagram/callback
```

## File Inventory

| File | Action | Purpose |
|------|--------|---------|
| `apps/dashboard/src/config/supabase.ts` | Create | Server-side Supabase client (service role key, NOT public) |
| `apps/dashboard/src/pages/api/auth/instagram/index.ts` | Create | OAuth start — generate state, redirect to IG |
| `apps/dashboard/src/pages/api/auth/instagram/callback.ts` | Create | OAuth callback — validate state, token exchange, profile fetch, upsert |
| `apps/dashboard/src/pages/api/auth/instagram/status.ts` | Create | Check if user has connected IG account |
| `apps/dashboard/src/pages/api/auth/instagram/disconnect.ts` | Create | Remove IG connection |
| `apps/dashboard/src/hooks/useInstagramConnect.ts` | Create | React hook — status, connect, disconnect |
| `apps/dashboard/src/components/dashboard/QuestContainer.tsx` | Modify | Add connect button + connected state |
| `apps/dashboard/src/pages/passport.tsx` | Modify | Extend SocialsSection with IG row |

## Dependencies

Verify `@supabase/supabase-js` is available in the dashboard app's build graph. It's a dependency of the PMS app and likely hoisted in the NX monorepo, but should be confirmed. If missing, add to root `package.json`.

## Migration Path

When Django eventually gets Instagram OAuth endpoints:
1. Migrate `ig_connected_accounts` data to `profile.socials[]` via a one-time script
2. Switch the hook to read from `profile.socials` instead of API routes
3. Remove the dashboard API routes, Supabase tables, and config
4. Instagram joins Twitter/Discord in the standard socials flow

## Rate Limits

| API | Limit |
|-----|-------|
| Instagram Graph API | 200 calls/user/hour |
| Token exchange | No explicit limit, but codes expire in seconds |

Not a concern for connect-only (one-time per user). Becomes relevant if media sync is added later.

## Token Lifecycle

```
Auth Code (seconds) → Short-lived Token (1 hour) → Long-lived Token (60 days)
```

For now, tokens expire after 60 days and the user needs to reconnect. Token refresh can be added later as a scheduled job or cron trigger.
