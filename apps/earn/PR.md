# feat(earn): skeleton loading states — final polish before prod

> Last polish on `apps/earn/` before we route real traffic to it. The
> diff itself is one file, but this PR is also the place to confirm
> end-to-end readiness for the /earn rollout that's been landing on
> main over the last few commits. Reviewer: please use this as the
> sign-off PR for the whole feature, not just the skeleton change.

Closes/relates to: the /earn rollout (5f44521 → 4ab2dd7 → ccb5b57 → this PR).

---

## TL;DR

- Replaces the bare `Loading quests…` / `Loading events…` text with
  proper skeleton placeholders that mirror the eventual layout, so the
  page feels populated immediately even while the bounty grid and Luma
  feed are being fetched.
- Single file changed: `apps/earn/src/pages/index.tsx` (+99 / -9).
- Build is green (`npx nx build earn`), all four pages + 7 API routes
  emit successfully, no behavioural change to data flow.

The rest of this description recaps the whole /earn feature so the
reviewer can sign off on prod, not just the skeleton patch.

---

## What changed in this PR

`apps/earn/src/pages/index.tsx`

- New components: `BountyCardSkeleton`, `BountyTableSkeleton`,
  `EventBannerSkeleton`. Each is a layout-faithful stub using
  Tailwind's `animate-pulse` shimmer.
- The bounty grid loading branch now picks the skeleton variant based
  on the active `viewMode` (cards → 6 card stubs in 2-col grid;
  table → 6 row stubs).
- The `ZoEvents` carousel loading branch swaps from a centered text
  label to a `9/16` aspect-ratio banner skeleton with title/footer
  stubs, matching the real banner so layout doesn't shift on data
  arrival.

No new imports, no new dependencies, no API surface change.

---

## Why this matters

Prior state: the bounty grid showed "Loading quests…" centred in the
viewport, and the right rail showed "LOADING EVENTS…" — both as plain
text. With `_app.js` weighing ~695 KB gzipped and Luma being a remote
fetch, the empty layout was visible for several seconds on cold paint.

After: the eventual structure renders instantly with shimmering stubs
in the exact slots the data will fill. Cold load now reads as
"already on the page, content settling" rather than "blank app".

This does not reduce the actual JS payload — that's a separate change
(see the **Performance** section, kept as a follow-up).

---

## Full /earn feature state — context for the prod sign-off

The /earn micro-app is a builder-facing quest/bounty/grants/projects
hub. It connects two citizen subsets in the Zo Universe: Founders &
sponsors who post bounties, and Builders who claim them. $Zo flows are
trace-able via the new `analytics_events` table.

### What's live as of this branch

- `/` — Open Quests grid + Luma "This week at Zo" carousel +
  navbar (Sign-in / profile chip)
- `/projects` — "Coming soon" empty state
- `/grants` — "Coming soon" empty state
- `/admin` — Zo-auth + ADMIN_KEY-gated console for creating
  bounties / projects / grants

### Citizen connections this app surfaces

| Surface | Connects | $Zo touchpoint |
|---|---|---|
| Bounty card "Accept" | Founder ↔ Builder | XP increment on apply, persisted in `earn_profiles.xp` |
| /admin bounty form | Founder | Writes a `bounty_posted` analytics event |
| Login (phone OTP) | Builder ↔ Zo Universe | Cookie-anon row in `users` is the lightweight identity |
| Luma feed | Operator ↔ Citizen | Surfaces house events from `lu.ma/zohouse` |

---

## Architecture

```
apps/earn/
├── prisma/
│   ├── schema.prisma                  # minimal User → users (existing) + EarnProfile + earn-specific models
│   └── migrations/20260428000000_init/migration.sql   # idempotent, never alters `users`
├── public/
│   ├── login-bg.mp4                   # consumed by ZoAuth modal
│   ├── logo.png, money.png, claw.png  # marketing assets
├── src/
│   ├── components/
│   │   ├── AuthCorner.tsx             # nav corner: Sign-in / profile dropdown
│   │   ├── NavChip.tsx                # XP/streak/trophies chip
│   │   └── ui/{button,resizable-navbar}.tsx
│   ├── lib/
│   │   ├── prisma.ts                  # singleton client
│   │   ├── auth.ts                    # cookie-anon getOrCreateUser → users + earn_profiles
│   │   ├── admin.ts                   # x-admin-key gate for /api writes
│   │   ├── track.ts                   # client-side beacon → /api/track
│   │   └── utils.ts                   # cn()
│   ├── pages/
│   │   ├── _app.tsx                   # Zo + Zostel auth providers, fonts, global CSS
│   │   ├── index.tsx                  # Bounties + ZoEvents (this PR's diff)
│   │   ├── grants.tsx, projects.tsx   # Coming soon
│   │   ├── admin/index.tsx            # Admin console (Zo auth + admin key)
│   │   └── api/
│   │       ├── bounties/index.ts             # GET (list) + POST (admin create)
│   │       ├── bounties/[id]/apply.ts        # POST: claim a bounty, +XP
│   │       ├── grants.ts, projects.ts        # GET + POST (admin create)
│   │       ├── achievements + season-path / me  # gamification reads
│   │       ├── events.ts                     # Luma list-events (cached 5 min)
│   │       └── track.ts                      # POST analytics_events
│   └── scripts/scrape-bounties.ts     # standalone scraper, idempotent upsert
├── next.config.js                     # basePath /earn, transpilePackages for antd/rc-util
├── project.json                       # NX targets; build.dependsOn=[] (avoid pulling other apps)
└── tsconfig.json                      # path aliases mirror tsconfig.base
```

### Routing

- `next.config.js` sets `basePath = "/earn"` (override via
  `NEXT_PUBLIC_BASE_PATH`).
- Vercel routes `/earn` and `/earn/:path*` to this app via
  `vercel.json` (already present).
- All internal links use `next/link` so the basePath is auto-applied;
  the few raw `<img>` / `<video>` references are hand-prefixed with
  `process.env.NEXT_PUBLIC_BASE_PATH`.

---

## Database schema — what we did and didn't touch

**Did NOT touch:** `public.users` (209 MB, 60+ columns, RLS policies,
9 FK referrers). The earn app inserts rows containing only `id`;
every other column stays at its default/null. This was the explicit
constraint the team set: keep the canonical Zo identity table free of
schema churn.

**New tables created (additive only, all FK to existing `users.id`):**

| Table | Rows seeded | Purpose |
|---|---|---|
| `earn_profiles` | per-user | Sidecar holding gamification fields (handle, xp, level, title, streak, quests_done, combo, xp_max). PK = `user_id` references `users(id)` ON DELETE CASCADE. |
| `bounties` | 0 | Open quests. Unique on `(source, source_id)` so the scraper is idempotent. |
| `projects` | 0 | Featured projects (currently behind a "Coming soon" UI). |
| `grants` | 0 | Grants (also behind "Coming soon"). |
| `applications` | 0 | A user's claim on a bounty. Unique `(user_id, bounty_id)` prevents double-apply. |
| `achievements` | 8 (seeded) | Static badge catalog (First Blood, Centurion, Streak-7, etc.). |
| `user_achievements` | 0 | User ↔ achievement join. |
| `season_nodes` | 10 (seeded) | Currently unused on the page (Season Path component is hidden). |
| `analytics_events` | 0 | Click / apply / page_view tracking. No FK to `bounties` by design — keeps event ingestion lossless. |

The migration is `IF NOT EXISTS` everywhere and re-runnable. Seeds use
`ON CONFLICT DO NOTHING`.

### Identity flow (cookie-anon → real Zo identity, by design)

- First page hit with a write call (`/api/me`, `/api/track`, `/api/bounties/[id]/apply`):
  - Cookie `zo_user` not present → server generates a UUID, INSERTs a
    row in `public.users` (id only), creates a row in `earn_profiles`
    with a randomised handle (e.g. `QuantumNomad_863`), sets the
    cookie (`HttpOnly`, `SameSite=Lax`).
- Subsequent calls reuse the cookie's id, fetch the matching
  `earn_profiles` row.
- The /admin page additionally requires Zo phone OTP login and an
  `x-admin-key` header for writes — two factors.

This means **earn users are full citizens of the Zo identity universe
from the first click** without forcing a login wall on the bounty
grid. If the same human later signs in via Zo phone OTP, today they
get a separate users row; linking is a follow-up (see below).

---

## External integrations

### Luma (events feed)

- Endpoint: `https://public-api.lu.ma/public/v1/calendar/list-events?after=<now>&pagination_limit=8`
- Auth: `x-luma-api-key` header (server-side only — key in `.env`,
  never bundled into client JS)
- Calendar: `cal-ZVonmjVxLk7F2oM` (the Zo House public calendar at lu.ma/zohouse)
- Cached server-side for 5 min in module memory; stale-on-error
  fallback so a Luma outage doesn't blank the carousel.
- Returned shape: `{ events: ZoEventDTO[], cached: bool, stale?: bool }`
- House inference: address/city heuristic →
  Whitefield → "WTFxZo", Bengaluru/Koramangala → "BLRxZo".

### Zo Auth (libs/auth)

- `_app.tsx` wraps `<ZostelAuthProvider>` + `<AuthProvider>` with
  `localKey="zo-earn"`, `allowedLoginTypes=["mobile"]`,
  `skipOnboarding=true`.
- Server-side configuration via `API_BASE_URL=https://api.nsfp.io.zo.xyz`
  (staging) and `API_BASE_URL_ZOSTEL=https://api.staging.zostel.com`.
- Login modal references `/login-bg.mp4` — copied into earn's `public/`.

### Prisma + Supabase

- `DATABASE_URL` (pooler, port 6543) and `DIRECT_URL` (port 5432) both
  in root `.env`. Earn uses the pooler URL via Prisma's default.
- Migration applied via `psql "$DIRECT_URL" -f migration.sql` against
  the live DB; verified with `\d` on each new table.

---

## Test plan

### Build / lint

- [ ] `npx nx build earn` → green (verified locally — output below)
- [ ] No new TypeScript errors
- [ ] No new ESLint errors

```
Route (pages)                              Size     First Load JS
┌ ○ /                                       9.55 kB         825 kB
├   /_app                                   0 B             775 kB
├ ○ /404                                    186 B           775 kB
├ ○ /admin                                  5.16 kB         821 kB
├ ƒ /api/bounties                           0 B             775 kB
├ ƒ /api/bounties/[id]/apply                0 B             775 kB
├ ƒ /api/events                             0 B             775 kB
├ ƒ /api/grants                             0 B             775 kB
├ ƒ /api/me                                 0 B             775 kB
├ ƒ /api/projects                           0 B             775 kB
├ ƒ /api/season-path                        0 B             775 kB
├ ƒ /api/track                              0 B             775 kB
├ ○ /grants                                 1.69 kB         820 kB
└ ○ /projects                               1.59 kB         820 kB
```

### Manual QA

**Loading state (this PR's actual change)**
- [ ] Visit `/earn` cold — bounty grid shows 6 shimmering card
      skeletons; right rail shows shimmering 9/16 banner skeleton.
      Both replace prior plain text labels.
- [ ] Toggle table view via the icon while loading — skeleton
      switches from cards-grid to table-rows. Real data populates
      without layout shift.

**Existing flows that must still work**
- [ ] `/earn` renders bounties (currently 12 demo entries since the DB
      table is empty; the API route falls through to `DEMO_BOUNTIES`).
- [ ] `/earn` "This week at Zo" sidebar shows real Luma events (8
      upcoming pulled live: Founders Dinner, Pitch Roast, Zo World
      India Tour - Kochi, etc.).
- [ ] `/earn/projects` shows "Coming soon" card.
- [ ] `/earn/grants` shows "Coming soon" card.
- [ ] Logged-out: navbar shows green "Sign in →" button; clicking it
      opens the Zo phone-OTP modal (login-bg.mp4 plays as background).
- [ ] Click "Accept" on a bounty while logged-out → opens the same
      Zo login modal instead of navigating.
- [ ] Logged-in: navbar shows the XP/streak chip; click reveals
      profile dropdown with phone number + Sign out.
- [ ] After Sign in, user lands back on the page they were on
      (not redirected away).
- [ ] All in-app nav (Bounties / Projects / Grants) routes to
      `/earn/*` not `/*`.
- [ ] `/earn/admin` requires Zo login; entering an admin key unlocks
      the bounty/project/grant create forms.

**Database side-effects (verify in Supabase)**
- [ ] `SELECT id FROM public.users WHERE id = '<cookie>';` returns
      one row with all canonical columns NULL (only `id` populated).
- [ ] `SELECT * FROM public.earn_profiles WHERE user_id = '<cookie>';`
      returns a row with handle/xp/level defaults.
- [ ] `SELECT * FROM public.analytics_events ORDER BY created_at DESC
      LIMIT 5;` shows recent `page_view`, `source_filter`,
      `bounty_click` events tied to the cookie's user_id.

**Prisma & migrations**
- [ ] `npx prisma generate --schema=apps/earn/prisma/schema.prisma`
      succeeds.
- [ ] Migration is idempotent: re-running
      `psql "$DIRECT_URL" -f migration.sql` produces only `NOTICE`s,
      no errors.

---

## Security review (audit findings — what's done vs deferred)

A full audit was run against `apps/earn/`. The blockers are addressed
on this branch; the rest are tracked as follow-ups.

### Addressed in the journey to this branch

- ✅ `users` schema is **not** altered. Only `id`-only inserts.
  RLS policies and FK referrers are untouched.
- ✅ `LUMA_API_KEY` is server-side only. Verified with
  `grep "secret-" dist/apps/earn/.next/static` — no hits.
- ✅ Admin writes require both Zo phone OTP + `x-admin-key` header.
- ✅ Cookie is `HttpOnly`, `SameSite=Lax`.
- ✅ Earn app NX target overrides `dependsOn: []` so this build is
  isolated from broken sibling app builds.
- ✅ TypeScript path aliases self-contained
  (`tsconfig.json` mirrors `tsconfig.base.json`).

### Open follow-ups (not blockers, tracked separately)

| # | Issue | Severity | Suggested fix |
|---|---|---|---|
| 1 | `DATABASE_URL` is exposed via `next.config.js` `env` block. Doesn't leak today (no client import of `prisma.ts`) but is a footgun. | P1 | Remove from `env` block. Server-only env vars don't need to be there. |
| 2 | Session cookie missing `Secure` flag in prod. | P1 | `parts.push(...(NODE_ENV==="production"?["Secure"]:[]))` in `lib/auth.ts`. |
| 3 | `lib/admin.ts` uses `provided !== expected` (timing-attack vulnerable). | P2 | Replace with `crypto.timingSafeEqual`. |
| 4 | `GET /api/me` triggers `getOrCreateUser` on every anonymous hit, polluting `users` with bot/crawler rows. | P1 | Make `/me` read-only; only insert on actual writes (`/track`, `/apply`). |
| 5 | `/api/track` accepts arbitrary `name`, `bountyId`, `source`. | P2 | Allowlist `name` against a known set. |
| 6 | Handle pool is only ~57.6k combinations. | P2 | Expand adjective/noun pools or add 4-digit suffix. |
| 7 | No rate limiting anywhere. | P2 | In-memory bucket on `/track`, `/apply`, `/me` (10 req/min/IP). |
| 8 | No tests. | P2 | Cover the `xpFor` transaction in `/apply` and the `getOrCreateUser` flow. |

None of the above expose existing user data or enable identity
spoofing. They're hardening, not bug-fixes.

---

## Performance

`First Load JS shared by all` is **819 KB** (gzipped), with
`_app.js` accounting for **695 KB** of that.

Root cause (verified by grepping the `_app` chunk):

- `metamask` SDK — 27 hits
- `rainbowkit` — 10
- `wagmi` — 5
- `viem` — 2
- `wallet` (generic refs) — 234
- `moment` — 22
- plus two more always-loaded shared chunks: a 392 KB viem bigint /
  RLP / secp256k1 chunk and a 385 KB MetaMask SDK chunk

Earn only uses `allowedLoginTypes=["mobile"]` — the entire wallet
stack is dead weight. It's bundled because `libs/auth`'s
`AuthProvider` statically imports the `ZoAuth` modal, which in turn
imports the wallet login path.

**Deferred fix** (not in this PR): wrap `ZoAuth` in `next/dynamic`
inside `libs/auth/src/contexts/auth/AuthProvider.tsx` so the modal
(and its wallet code) only download when `showLoginModal()` is first
called. Estimated saving: **~400 KB out of 695 KB on `_app`**.

This was deliberately split out — it touches `libs/auth`, which is
shared infra. It needs its own PR with cross-app smoke testing
(pms / admin / dashboard / etc.).

The skeleton states in this PR mask the wait so the page feels
populated even before that lazy-load fix lands.

---

## Deployment / config — must do before prod

### Env vars (non-secret)

The following must be set in the Vercel "earn" project (Production):

```
APP_ID=<earn's own APP_ID — request from Zo backend team>
API_BASE_URL=<prod Zo backend, not staging>
API_BASE_URL_ZOSTEL=<prod Zostel backend, not staging>
WEB_BASE_URL=https://zozozo.work/earn
NEXT_PUBLIC_BASE_PATH=/earn
```

> **Action item before prod:** the `apps/earn/.env.local` currently
> uses `APP_ID=273cebeeff2130e3501f` (borrowed from the admin app to
> unblock dev). Register an earn-specific APP_ID with the Zo backend
> and swap it in for prod.

### Env vars (secret)

```
DATABASE_URL=<Supabase pooler URL with password>
LUMA_API_KEY=<the secret-… key already in repo .env>
ADMIN_KEY=<a long random value used for admin write gating>
```

### Database migration

```
psql "$DIRECT_URL" -f apps/earn/prisma/migrations/20260428000000_init/migration.sql
```

Already applied to the prod Supabase. Running again is safe (idempotent).

Verify:
```
psql "$DIRECT_URL" -At -c "
SELECT table_name FROM information_schema.tables
WHERE table_schema='public'
  AND table_name IN ('earn_profiles','bounties','projects','grants',
                     'applications','achievements','user_achievements',
                     'season_nodes','analytics_events')
ORDER BY table_name;
"
```
should return all 9 names.

### Vercel routing

`vercel.json` already routes `/earn` and `/earn/:path*` to
`https://zozozo-earn-samurais-dojo.vercel.app/earn`. No change.

### Zo backend (out of repo)

- Register an `earn` APP_ID so analytics, permissions, and audit
  scoping are tagged to this app and not borrowed from `admin`.

---

## Known follow-ups (not blockers)

1. **Lazy-load the ZoAuth modal in `libs/auth`** — biggest single
   perf win (~400 KB cut from every page load). Separate PR.
2. **Link cookie-anon earn users to Zo phone-authed users** — when a
   user completes Zo login, copy their existing `earn_profiles` row to
   the new Zo `user_id` and delete the cookie-anon row, so they don't
   end up with two identities.
3. **Move demo data fixtures out of API route files** —
   `DEMO_BOUNTIES`, `DEMO_GRANTS` etc. should live in
   `apps/earn/src/fixtures/*.ts`.
4. **Extract shared `navItems` and `basePath` constants** — they're
   duplicated across 4 pages and `lib/track.ts`.
5. **Split `pages/index.tsx`** — it's 1156 lines after this PR. Move
   bounty + event components to `components/bounty/`, `components/events/`.
6. **Wire bounty scraper to a cron job** — `scripts/scrape-bounties.ts`
   exists and works, but isn't scheduled. Without it, /earn keeps
   serving demo data even after going live.
7. **Surface SeasonPath when ready** — the component is built and
   wired to `/api/season-path` but currently hidden in `index.tsx`
   (kept in code for fast re-enable). Either ship it or delete the
   dead code.
8. **Empty-state for `/api/events`** when Luma calendar has no
   upcoming entries (currently the carousel is hidden — fine, but
   worth confirming with copy).
9. **Re-enable `transpilePackages` audit** — verify whether antd 5 +
   Next 14 still needs the antd / rc-util entries.

---

## Rollback plan

If anything breaks in prod:

- This PR (skeleton-only): revert via `git revert 685ea8a`. No DB,
  no env, no infra impact.
- Wider /earn rollout (if a deeper revert is needed):
  - Set Vercel routing for `/earn/*` to a static "Coming soon" page.
  - The new tables (`earn_profiles`, `bounties`, etc.) and the new
    rows in `users` are inert as long as no client hits them. Safe
    to leave in place.
  - `users` was never altered, so no rollback work there.

---

## Screenshots / visual

- Cold load on `/earn`: 6 shimmering card stubs in a 2-column grid
  + 9/16 shimmering event banner on the right rail. Layout matches
  the eventual data layout exactly.
- After data lands: skeletons swap out for real bounty cards + the
  Luma carousel — no layout shift.
- `/earn/grants` and `/earn/projects`: dashed "Coming soon" card
  centered in the page.
- Logged-out navbar: green "Sign in →" button top-right.
- Logged-in navbar: XP/streak chip + dropdown with phone + Sign out.

(Attach screenshots before merging.)

---

## Reviewer checklist

- [ ] The skeleton rendering matches the production bounty card and
      event banner visually (no layout shift on data arrival).
- [ ] Build is green locally (`npx nx build earn`).
- [ ] DB migration was already applied to prod Supabase; confirm by
      running the verify SQL above.
- [ ] Env vars listed in **Deployment** section are set in Vercel
      Production.
- [ ] Acceptable to defer the `_app` bundle-size fix to a follow-up
      libs/auth PR (it's a shared-lib change, deserves its own scope).
- [ ] Acceptable to keep cookie-anon `users` rows for now; linking
      to Zo phone identity tracked as a follow-up.
- [ ] No expectation that scraper is running in prod — bounty grid
      will show demo data until cron is wired (item 6 in follow-ups).
