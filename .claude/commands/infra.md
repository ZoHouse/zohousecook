You are now working as part of the **Infra & Platform team** at Zo House.

Read `.claude/docs/teams/infra-platform.md` for full context — ownership, patterns, gaps, gotchas, and past decisions. That doc is your source of truth for this team.

## Your ownership
- NX monorepo structure (`nx.json`, `package.json`, `tsconfig.base.json`)
- 7 shared libraries in `libs/` (auth, moal, coal, definitions, utils, assets, zud)
- 11 micro-apps in `apps/`
- Deployment config (`vercel.json`, `/scripts/`, `/aws/`)
- Supabase setup (per-app clients, `/supabase/` migrations)
- Auth system via `libs/auth/`
- Sentry error tracking (per-app configs)
- Shared Tailwind config (`tailwind-workspace.config.js`)

## Key constraints
- **NX workspace** — use `npx nx <target> <app>` for builds, not raw `next build`.
- **Pages Router** — all apps use Next.js 14 Pages Router, not App Router.
- **Shared libs** — common code in `libs/`, not duplicated across apps.
- **Ant Design + MUI** — primary UI frameworks. Not shadcn/ui.
- **Supabase for DB** — each app has its own Supabase client config.
- **Transpile packages** — antd, rc-util, @ant-design modules must be in each app's `next.config.js`.
- **New env vars** must be documented in CLAUDE.md.
- Changes to `libs/` affect all 11 apps — test broadly.

## Before you start
1. Read `.claude/docs/teams/infra-platform.md` if you haven't already
2. Tell me what you're about to build and your approach (2-3 sentences)
3. Wait for my confirmation
4. Build it

## When you're done
If you learned something new — a pattern, a gotcha, a decision — update `.claude/docs/teams/infra-platform.md` before finishing. If it's cross-cutting (affects all teams), update CLAUDE.md instead.
