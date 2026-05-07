# Social & Content Team

## Mission

Tell the Zo House story. Builders should be visible — their work, their experiments, their community. Coordinate content across platforms with a single calendar, so nothing falls through the cracks.

## Ownership

### Status

`apps/social-engine` — v0 personal X scheduler shipped 2026-04-26. Pages Router + antd, Supabase-backed.

### Files (apps/social-engine)

- `src/pages/compose.tsx` — write a tweet, pick scheduled time, "Schedule" or "Post now"
- `src/pages/queue.tsx` — list of posts, polls every 15s, supports cancel / post-now / retry
- `src/pages/api/posts/index.ts` — GET (list 200 newest), POST (create pending row)
- `src/pages/api/posts/[id].ts` — DELETE (cancel pending), POST (post immediately, ignores schedule)
- `src/pages/api/cron/tick.ts` — Vercel cron every minute; selects up to 5 due `pending` rows and tweets them
- `src/lib/x-client.ts` — OAuth 2.0 user-context, refresh-on-demand → POST `https://api.x.com/2/tweets`. Seeds from env on first run, then DB-only.
- `src/lib/store.ts` — JSON-file store at `.data/db.json` with promise-queue mutex; holds posts + per-platform tokens. **Local-only — swap before serverless deploy** (Vercel filesystem is ephemeral).
- `apps/social-engine/vercel.json` — cron config (`* * * * *` → `/social-engine/api/cron/tick`)
- Dev port: `4210`. Public path: `/social-engine` (wired in root `vercel.json`).

## Patterns to Follow

- **Pages Router** — consistent with all other apps in the monorepo.
- **Ant Design UI** — use antd components for consistency.
- **Supabase for data** — social accounts and content stored via Supabase.
- **Calendar-first** — everything organized by scheduled date. Week view is default.
- **Multi-platform support** — posts can target multiple platforms with platform-specific formatting.

## Known Gaps

- Content calendar implementation status unclear.
- Platform connection setup needs documentation.
- Post scheduling workflow needs documentation.
- No auto-publishing — posts must be manually published.
- No analytics per post.
- No AI content generation.

## Watch Out For

- OAuth tokens expire per platform — each has different refresh logic.
- Platform-specific character limits: Twitter (280), LinkedIn (3000), Instagram (2200), TikTok (2200).

## Decisions

- **2026-04-26 — Personal-tool scope, no OAuth flow.** v0 social-engine uses the org's own X Developer app credentials in env vars (OAuth 1.0a user context). No login UI, no `social_accounts` table, no token refresh. Reason: it's an internal tool the team uses themselves; multi-account OAuth was scoped out. Revisit when we want a non-staff member to publish.
- **2026-04-26 — OAuth 2.0 user-context (not 1.0a), self-managed refresh.** `src/lib/x-client.ts` uses OAuth 2.0 PKCE tokens, not 1.0a HMAC-SHA1. Why: X recommends OAuth 2.0 for new apps, and the dashboard's "Generate" button now spits out 2.0 tokens by default. How: access token (~2h TTL) and refresh token (~6mo TTL, **rotates on every use**) live in the local JSON store; we refresh ~60s before expiry and persist the new pair back. Initial seeding via `X_INITIAL_ACCESS_TOKEN` / `X_INITIAL_REFRESH_TOKEN` env vars on first run — after that the store is source of truth.
- **2026-04-26 — Local JSON store, no Supabase (v0).** Dropped Supabase entirely for v0. `src/lib/store.ts` writes a single `.data/db.json` file (gitignored) with `posts` + `tokens` collections, serialized via in-memory promise queue. Why: this is a personal tool used only locally; Supabase added env-config friction (RLS, env loading races) for zero benefit at v0 scale. **Swap required before deploying to Vercel** — serverless filesystem is ephemeral and doesn't share state across invocations. Candidates for the swap: Vercel KV, Turso, or back to Supabase with proper RLS policies.
- **2026-04-26 — Vercel Cron every minute, batch=5.** `/api/cron/tick` selects up to 5 due pending rows per run. Reason: Vercel free-tier crons fire at the minute granularity anyway; batching limits the worst-case fan-out if a backlog builds up. Adjust `MAX_PER_TICK` if the queue grows.

---

*Update this doc when you learn something new about the social system. Use `/learn` to trigger a review.*
