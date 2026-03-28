# Infra & Platform Team

## Mission

Keep Zo House Cook's infrastructure solid — own the NX monorepo, shared libraries, auth, deployment, monitoring, and cross-cutting concerns. Every other team depends on this being reliable.

## Ownership

### NX Monorepo Structure

| File | Purpose |
|------|---------|
| `nx.json` | NX workspace configuration — targets, caching, generators |
| `package.json` | Root dependencies for all 11 apps |
| `tsconfig.base.json` | Root TypeScript configuration |
| `vercel.json` | Vercel subdomain-based routing |
| `tailwind-workspace.config.js` | Shared Tailwind configuration |

### Shared Libraries (`libs/`)

| Library | Path | Purpose |
|---------|------|---------|
| auth | `libs/auth/` | Auth contexts, endpoints, components, hooks — used by all apps |
| moal | `libs/moal/` | Modal/UI component library + utilities + hooks |
| coal | `libs/coal/` | Coal design system (typography & UI) |
| definitions | `libs/definitions/` | Shared type definitions (admin, auth, general) |
| utils | `libs/utils/` | Utility library (array, auth, file, font, hooks, web3, etc.) |
| assets | `libs/assets/` | Static assets (brands, icons, Lottie animations) |
| zud | `libs/zud/` | State management/component library |

### Apps (11 micro-apps)

| App | Path | Purpose | Size |
|-----|------|---------|------|
| admin | `apps/admin/` | Main admin (trips, bookings, events, houses, partners) | ~397 files (largest) |
| pms | `apps/pms/` | Property Management (cafe, kitchen, IoT, housekeeping) | ~110 files |
| website | `apps/website/` | Public website + web3 features | ~192 files |
| dashboard | `apps/dashboard/` | Founder metrics & analytics | ~66 files |
| zo-ops | `apps/zo-ops/` | Operations dashboard | ~50 files |
| payment | `apps/payment/` | Payment processing | ~22 files |
| web-checkin | `apps/web-checkin/` | Guest web check-in | ~16 files |
| comic | `apps/comic/` | Comic generation | ~30 files |
| meme | `apps/meme/` | Meme generation | ~30 files |
| pg | `apps/pg/` | PG features | ~8 files |
| ops-backend | `apps/ops-backend/` | Backend operations | — |

### Deployment

- **Vercel** — Frontend apps routed by hostname via `vercel.json`
- **AWS ECS** — Backend services (scripts in `/scripts/`, config in `/aws/`)
- **Sentry** — Error tracking per app (separate configs)

### Per-App Config

Each app has its own:
- `next.config.js` — NX + Sentry plugins, basePath, env vars, transpile packages
- `tailwind.config.js` — App-specific Tailwind config
- `tsconfig.json` — App TypeScript config
- `project.json` — NX project config
- `.env.*` files — Environment-specific variables

### Supabase

- Per-app Supabase client configured in `src/configs/supabase.ts`
- Migrations and seeds in root `/supabase/` directory
- Used for both DB access and Realtime subscriptions

## Patterns to Follow

- **NX workspace** — use `npx nx <target> <app>` for builds, not raw `next build`.
- **Shared libs** — common code goes in `libs/`, not duplicated across apps.
- **Pages Router** — all apps use Next.js 14 Pages Router (`src/pages/`), not App Router.
- **Auth via libs/auth/** — shared auth library provides contexts, hooks, and components.
- **Per-app config** — each app has its own `next.config.js`, env vars, and Sentry setup.
- **Supabase per-app** — each app configures its own Supabase client.
- **Transpile packages** — antd, rc-util, @ant-design modules, dnd-kit, rc-table must be listed in each app's `next.config.js`.
- **API routes return JSON** with consistent error shape: `{ error: string }` with appropriate HTTP status.

## Known Gaps

- No centralized API gateway — each app has minimal API routes.
- Supabase migrations are in `/supabase/` but migration workflow isn't documented.
- AWS deployment scripts exist but aren't well-documented.
- No CI/CD pipeline beyond Vercel auto-deploy.
- No rate limiting on API routes.

## Watch Out For

- **Shared lib changes ripple everywhere** — changes to `libs/auth/`, `libs/moal/`, `libs/utils/` affect all 11 apps. Test broadly.
- **NX caching** — NX caches build/lint/test results. If seeing stale results, clear with `npx nx reset`.
- **Vercel routing** — `vercel.json` routes traffic by hostname. Adding a new app requires a new route entry.
- **Transpile list** — forgetting to add antd/rc-* packages to `transpilePackages` in `next.config.js` causes build failures.
- **No Prisma** — the codebase uses Supabase client for DB access, not Prisma ORM. Some generated Prisma files may exist but are not the primary data access pattern.

## Decisions

- **2026-03-28:** Updated documentation to reflect NX monorepo architecture with 11 apps and 7 shared libs. Previous docs incorrectly described a single Next.js 16 App Router app with Prisma.

---

*Update this doc when you learn something new about the platform. Use `/learn` to trigger a review.*
