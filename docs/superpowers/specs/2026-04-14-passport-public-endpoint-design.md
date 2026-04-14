# Passport Public Endpoint — Design Spec

**Date:** 2026-04-14
**Author:** Samurai + Claude
**Status:** Draft — handoff to Vibhu for zo-backend implementation
**PRD ref:** Erum Passport PRD Field #1 + `passport-creator-social-loop.md` Path A/B/C
**Depends on:** zo-backend PR #3414 (`feature/passport` — new `passport/` Django app with `XP` / `XPEarned` / `XPLeaderboard` tables)

---

## One-line idea

A clean, anonymous, cacheable read endpoint under the new `passport/` app that returns everything the public passport view at `zo.xyz/@<handle>` needs — so the frontend can render User1's Stamps / Badges / Trophies / Reels / Tribe to an anonymous visitor without touching `cas/`, the old lobby endpoint, or the legacy `zoprofile` surface.

---

## Why this is its own endpoint

The public passport view is the **social-loop entry point**. It is linked from:
- Pro Creator IG bio (`zo.xyz/erum`)
- Pro Creator IG story URL tag
- WhatsApp share flow (shared link)
- WhatsApp Status (status link)
- IG campaign posts / DMs from `@zo` account

It will receive **bursty anonymous traffic** from every IG viewer, most of whom are logged out. The endpoint must:

1. **Require no authentication** — logged-out viewers see the same passport a logged-in viewer sees
2. **Be cacheable at the edge** — Vercel + Cloudflare / CDN caching by `handle` for N minutes
3. **Never leak private fields** — email, phone, Govt ID, address, wallet keys, token balances, booking history, internal flags
4. **Live in a clean namespace** — not `cas/`, not the old `profile/api/v1/profile/lobby/` surface. The existing lobby endpoint was built for the dashboard/room side-project and carries auth/WebSocket assumptions we do not want in prod

**Design rule:** the new `passport/` Django app gets its own URL namespace. Everything the public passport view needs is served from there. No cross-imports from `cas/views/`. If joining booking/trip data is necessary, import directly from `bookings/` models at the ORM layer — not via a `cas/views/` function.

---

## URL

```
GET  api.zostel.com/passport/api/v1/public/<handle>/
```

- `handle` is the bare form from `zo.xyz/@<handle>` — no `.zo` suffix
- Backend internally normalises to `custom_nickname = f"{handle}.zo"` for the lookup
- No trailing query parameters required
- 404 if handle does not resolve to a user
- 410 if the user has opted out of public passport display (future field — see "Privacy controls")
- No `Authorization` header required or honoured (endpoint is public)
- CORS: allow origins `https://zo.xyz`, `https://zozozo.work`, `http://localhost:4202` (dev)

**URL shape rationale:**
- `/passport/api/v1/` — lives in the new `passport/` app, version-tagged for future shape changes
- `/public/<handle>/` — the `public` segment makes it explicit that this is the anonymous read. A separate `/passport/api/v1/private/me/` authenticated endpoint may follow for the owner's full view; the split lets us cache aggressively on `public` without auth-gating concerns
- Trailing slash matches zo-backend's existing Django URL conventions

---

## Response shape

```json
{
  "handle": "samurai",
  "custom_nickname": "samurai.zo",
  "display_name": "Ashwin Panicker",
  "avatar_url": "https://cdn.zo.xyz/avatars/...",
  "hometown": "Bangalore",
  "nationality": "India",
  "current_city": "Bangalore",
  "bio": "Building Zo House...",

  "state": "unlocked_pro",

  "xp": {
    "total": 12450,
    "rank_key": "explorer",
    "rank_title": "Explorer",
    "rank_progress": { "current": 12450, "next_threshold": 15000 }
  },

  "roles": [
    { "key": "founder",     "label": "Founder of Zo World" },
    { "key": "creator",     "label": "Creator" },
    { "key": "tribemaker",  "label": "Tribemaker" }
  ],

  "badges": [
    { "key": "creator_reach_100k", "label": "100K Reach",    "tier": "rolling",  "earned_at": "2026-03-15T..." },
    { "key": "tribemaker_10",      "label": "10 Tribe",       "tier": "all_time", "earned_at": "2026-02-01T..." }
  ],

  "stamps": [
    { "key": "zostel_manali",    "label": "Zostel Manali",    "art_url": "...", "unlocked_at": "2025-12-10T..." },
    { "key": "zostel_udaipur",   "label": "Zostel Udaipur",   "art_url": "...", "unlocked_at": "2026-01-22T..." }
  ],

  "trophies": [
    { "season": "2026_s1", "rank": 3, "medal": "bronze" }
  ],

  "stats": {
    "destinations": 12,
    "stays": 34,
    "properties": 8,
    "tribe": 87,
    "reels_submitted": 5,
    "reels_qualified": 3
  },

  "reels": [
    {
      "id": "r_abc",
      "prompt": "Why I'd choose Zostel Pahalgam",
      "ig_post_url": "https://instagram.com/p/...",
      "thumbnail_url": "...",
      "status": "qualified",
      "views": 45000
    }
  ],

  "tribe_sample": [
    { "handle": "alice",   "avatar_url": "..." },
    { "handle": "bob",     "avatar_url": "..." }
  ],
  "tribe_total": 87,

  "inviter": {
    "handle": "erum",
    "avatar_url": "..."
  }
}
```

### Field notes

- **`state`** — one of `"locked"`, `"unlocked_free"`, `"unlocked_pro"`. Derived server-side from:
  - `locked` — user exists but `ProfileCompletionGrantClaim` for the passport grant has not been claimed (onboarding incomplete)
  - `unlocked_free` — claim exists, no active Pro subscription
  - `unlocked_pro` — claim exists AND active Pro subscription row in credits/subscriptions
  - The frontend uses `state` to pick the pitch variant (see PRD drawio public-view matrix)

- **`xp.total`** — reads directly from `XPLeaderboard.total` (new `passport/` models). O(1) read.

- **`xp.rank_key` / `rank_title` / `rank_progress`** — server-computed from `xp.total` using the rank thresholds currently living in `apps/dashboard/src/api/leaderboard.ts`. Those thresholds should move into `passport/ranks.py` or a config module so both the API and the frontend read the same source. See "Open questions" below.

- **`roles`** — sourced from existing Zo API roles system (already wired in `useMyRoles` hook). Return as an ordered list, highest-priority role first (Founder > Creator > Tribemaker > Citizen).

- **`badges`** — derived from counts in related tables. Two tiers:
  - `tier: "rolling"` — current count (Tribemaker tribe count, Creator reach this month)
  - `tier: "all_time"` — lifetime milestone
  - For L3 MVP, only emit badges whose art exists. No broken image URLs.
  - Badge art URLs come from a `Badge` catalog table (future — for MVP hardcode a small map in `passport/badges.py`)

- **`stamps`** — one per unique `destination` + `property` the user has stayed at. Art URL TBD — Erum blocked on design. For L3 MVP emit stamps with placeholder `art_url: null` and let the frontend render a handle-coloured circle with the destination name as fallback.

- **`trophies`** — season leaderboard top-3 finishes. Reads from the existing season leaderboard computation. L3 MVP can emit an empty array until Season 1 ends and trophies are awarded.

- **`reels`** — populated only when the user has submitted reel quests. Filter to `qualified` status for the public view. Hide `pending`, `disqualified`, `draft`. L3 MVP can emit empty array until the quest engine lands.

- **`tribe_sample`** — maximum 8 tribe members for visual display. Server-picks randomly or by most-recent-join. Full count in `tribe_total`.

- **`inviter`** — the referrer handle stored in `localStorage.zo_referrer` when User2 first lands on `zo.xyz/@<handle>`. Server does not know this — the frontend reads it from localStorage and overlays it on the page independently. Included in the response shape only for completeness; **server returns `null` for this field always in L3**. Future: a backend `Referral` model may track attribution at the user level.

- **No private fields.** The response must not include: email, phone, DOB, Govt ID, wallet addresses (non-primary), booking history, internal UUIDs, notes, internal flags (`is_banned`, etc.).

---

## Status codes and error shapes

| Status | When | Body |
|---|---|---|
| `200` | Handle resolved to a user with at least a logged-in state | Full shape above |
| `404` | Handle does not match any user | `{"detail": "Passport not found"}` |
| `410` | User has a `public_passport_disabled: true` flag (future) | `{"detail": "This passport is private"}` |
| `429` | Rate limit exceeded (per-IP) | `{"detail": "Rate limit exceeded", "retry_after": 60}` |
| `500` | Server error | `{"detail": "Internal server error"}` |

Never return `401` or `403` — this endpoint is public by definition.

---

## Caching

The endpoint response should set:

```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

- Edge caches (Vercel, Cloudflare) hold the response for 60s fresh, 300s stale-while-revalidate
- Backend sees one request per handle per minute under steady state
- IG story traffic spikes: first hit warms the cache, next 60s of viewers hit the edge

**Cache invalidation:**
- Stale-while-revalidate covers the usual case (profile edits propagate within 1-6 min)
- If an instant invalidation is needed (user hides passport, user deletes account), the API should expose a POST `/passport/api/v1/public/<handle>/invalidate/` that requires admin auth and purges the CDN cache
- For L3 MVP, stale-while-revalidate is acceptable; no purge endpoint needed

---

## Privacy controls (future, not in L3 MVP)

L3 MVP assumes all passports are public. Future opt-out fields:

- `Profile.public_passport_disabled` — if `True`, endpoint returns 410
- `Profile.public_passport_fields` — per-field allowlist (e.g. hide hometown but show stamps)
- `Profile.public_passport_hide_tribe` — boolean to hide tribe section

These do not need to be in the initial migration but the endpoint should be coded so adding them later is a one-field check, not a shape change.

---

## Rate limiting

Per-IP rate limit: **60 requests per minute**. Per-handle rate limit: none (edge cache handles that). Use the existing `authentication/rate_limit` middleware pattern if available, otherwise add a lightweight DRF throttle.

---

## Open questions — need Vibhu's / product's call

1. **Rank thresholds location.** `apps/dashboard/src/api/leaderboard.ts` currently has the rank ladder. Should this move to `passport/ranks.py` server-side as the source of truth? (Recommended: yes. Frontend imports the same constants from a shared JSON file at build time.)

2. **Badge catalog.** Hardcoded map in `passport/badges.py` for L3 MVP, or dedicated `Badge` + `UserBadge` tables? (Recommended: hardcoded map for MVP. Promote to tables when Erum ships the badge art set.)

3. **Stamp art URLs.** Blocked on Erum design. L3 MVP returns `art_url: null` and frontend renders a fallback. Confirm this is acceptable to Erum.

4. **Inviter field.** Server always returns `null` in L3. Confirm we defer the backend attribution table to a later phase. Frontend reads from `localStorage.zo_referrer` and overlays independently.

5. **`state` derivation logic.** Needs the exact rules for determining `locked` / `unlocked_free` / `unlocked_pro`:
   - Does "unlocked" mean `ProfileCompletionGrantClaim` exists for a specific grant key? Which grant key?
   - Does "pro" mean an active row in `credits/subscriptions` tagged for passport-pro? Or a flag on `Profile`?
   - Confirm before coding.

6. **Reel data source.** Reels are not yet modelled in `passport/` or anywhere else in zo-backend. For L3 MVP the field returns `[]`. When the quest engine lands, a `Reel` or `QuestSubmission` model populates this.

7. **Tribe definition.** What counts as "tribe"? Users who booked through this user's `zo_referrer`? Users who checked into the same property at overlapping dates? Confirm before coding the tribe query.

---

## Non-goals (explicitly out of L3 scope)

- Authenticated variant (`/passport/api/v1/me/`) — separate follow-up
- Write endpoints — no POST/PATCH in this doc
- Seeding the `XP` catalog with the 20 PRD actions — separate commit on `feature/passport`
- Wiring signals (OTP verified → `XP.objects.award()`, etc.) — separate commit on `feature/passport`
- Any `cas/` changes — this endpoint does not touch CAS
- Any `zoprofile/` changes — this endpoint does not touch the old profile app except reading Profile via ORM foreign key
- Any dashboard sub-app changes — the frontend consumer lives in `apps/website`

---

## Frontend integration plan (on the Zo monorepo side)

Not Vibhu's concern, but documented here for symmetry. When the endpoint lands:

1. **New fetch hook in website:** `apps/website/src/hooks/usePublicPassport.ts`
   ```ts
   export function usePublicPassport(handle: string | null) {
     return useQuery({
       queryKey: ['public-passport', handle],
       queryFn: async () => {
         const res = await fetch(`${API_BASE_URL}/passport/api/v1/public/${handle}/`);
         if (res.status === 404) return null;
         if (!res.ok) throw new Error(`Public passport fetch failed: ${res.status}`);
         return res.json();
       },
       enabled: !!handle,
       staleTime: 60_000,
     });
   }
   ```

2. **Visitor-mode branch in `passport.tsx`:** when `router.query.handle` (from the rewrite) is set AND `router.query.handle !== viewer's own handle`, render the public view instead of `useProfile()` data. Covered in Step C of the `final` branch plan.

3. **Referrer capture:** on first visit to `/@<handle>`, `localStorage.setItem('zo_referrer', handle)` if the key isn't already set. First-touch wins. Covered in Step C.

4. **State-aware pitch overlay:** 4 variants keyed off `(viewer's state, public passport state)` per the PRD drawio matrix. Covered in Step C.

---

## Delivery checklist (for whoever picks this up on zo-backend)

- [ ] Create `passport/views/public.py` with `PublicPassportView` (anonymous, `GET /public/<handle>/`)
- [ ] Create `passport/serializers/public.py` with `PublicPassportSerializer`
- [ ] Register the URL in `passport/urls.py`
- [ ] Wire `passport/urls.py` into `zo/urls.py` with prefix `passport/api/v1/`
- [ ] Add CORS allowlist for `zo.xyz`, `zozozo.work`, `localhost:4202`
- [ ] Add `Cache-Control` header
- [ ] Add per-IP rate limit (DRF throttle or middleware)
- [ ] Unit tests: handle found, handle not found, private fields excluded, all `state` variants
- [ ] Integration test: anonymous curl → 200 with expected fields
- [ ] Answer the 7 open questions above with product before coding the state derivation
- [ ] Confirm no `cas/` imports before merge
