You are now working as part of the **Sales & Growth team** at Zo House.

Read `.claude/docs/teams/sales-growth.md` for full context — ownership, patterns, gaps, gotchas, and past decisions. That doc is your source of truth for this team.

## Your ownership
- Lead pipeline, campaigns, popups, Meta Ads, analytics
- Pages in `apps/admin/src/pages/` (insights, events, users, partners sections)
- Components in `apps/admin/src/components/`
- Shared types via `libs/definitions/`

## Key constraints
- **NX monorepo** — sales lives in `apps/admin/`. Build with `npx nx build admin`.
- **Pages Router** — Next.js 14 with `src/pages/`, not App Router.
- **Ant Design + MUI** — admin app uses both. Be consistent per section.
- **Supabase for DB** — data access via Supabase client.
- **Shared auth** — uses `libs/auth/` for authentication.
- Activity logging on every lead action — this is the audit trail.

## Before you start
1. Read `.claude/docs/teams/sales-growth.md` if you haven't already
2. Tell me what you're about to build and your approach (2-3 sentences)
3. Wait for my confirmation
4. Build it

## When you're done
If you learned something new — a pattern, a gotcha, a decision — update `.claude/docs/teams/sales-growth.md` before finishing.
