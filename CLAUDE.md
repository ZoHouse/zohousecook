# zo.xyz Monorepo

Nx monorepo powering zo.xyz (production) and zozozo.work (staging/community).

## Architecture

- **Monorepo:** Nx 17, Next.js 14, React 18, TypeScript
- **UI:** Ant Design 5 (dark theme, neon green `#cfff50` accent)
- **Auth:** Zostel auth (phone OTP) + Zo World auth, 5-tier RBAC
- **Shared libs:** `@zo/auth`, `@zo/moal`, `@zo/zud`, `@zo/utils`, `@zo/assets`
- **Production backend:** Django REST API at `api.io.zo.xyz`
- **Staging backend:** Supabase (for Zo House-specific features only)

## Deployments

| Environment | Domain | Infrastructure | Backend |
|------------|--------|---------------|---------|
| Production | zo.xyz | AWS ECS Fargate | Django (`api.io.zo.xyz`) |
| Staging | zozozo.work | Vercel (9 projects) | Django + Supabase |

Same codebase, same GitHub repo: `github.com/ZoHouse/zohousecook`

## Apps

| App | Path | Base Path | Port (dev) | Purpose |
|-----|------|-----------|-----------|---------|
| website | apps/website | / | 4202 | Public site (house, events, membership, cafezomad) |
| pms | apps/pms | /pm | 4204 | Property Management System |
| dashboard | apps/dashboard | /dashboard | 4203 | Analytics dashboard |
| admin | apps/admin | /admin | — | Admin panel |
| zo-ops | apps/zo-ops | /ops | — | Operations (reviews, Slack, WhatsApp) |
| ops-backend | apps/ops-backend | — | — | Node.js API (reviews, analytics, Slack) |
| web-checkin | apps/web-checkin | /checkin | — | Guest check-in |
| payment | apps/payment | /payments | — | Payment processing |
| comic | apps/comic | /comic | — | Comic |
| meme | apps/meme | /meme | — | Meme generator |

## Running Locally

```bash
# Install deps (from monorepo root)
npm install --legacy-peer-deps

# Run specific app
npx nx serve website    # localhost:4202
npx nx serve pms        # localhost:4204

# Run multiple
npx nx serve website & npx nx serve pms &
```

**PMS .env.local** must use production APIs for Zo House staff:
```
API_BASE_URL = https://api.io.zo.xyz
API_BASE_URL_ZOSTEL = https://api.zostel.com
```

## Zo House Feature Gating

New features for Zo House properties are gated and only visible when the selected operator is a Zo House:

| Property | Operator Code |
|----------|--------------|
| Zo House Bangalore (Koramangala) | `BNGHO812` |
| Zo House Bangalore (Whitefield) | `BNGS531` |

**Config:** `apps/pms/src/configs/zo-house-features.ts`
**Route guard:** `apps/pms/src/components/helpers/app/ZoHouseGuard.tsx`
**Nav integration:** `apps/pms/src/components/helpers/app/Navigation.tsx` — expandable sidebar sections after Activity Manager

Features use Supabase as staging DB. When graduating to production:
1. Backend team creates Django models + endpoints matching Supabase schema
2. Hooks swap from Supabase client → `useQueryApi`/`useMutationApi`
3. Feature config changes: `backend: 'django'`, `status: 'graduated'`

## Cafe Zomad Module

**Admin** (PMS app at /pm/cafe/*):
- Dashboard, Kitchen (realtime Kanban), Menu, Orders, Tables, Meal Plan, Inventory
- Gated to Zo House operators only
- Data: Supabase direct calls via hooks in `apps/pms/src/hooks/cafe/`

**Customer** (Website app at /cafezomad/*):
- QR scan → /cafezomad/TABLE_UUID → menu → cart → order
- Bypasses website header/footer (fullscreen mobile experience)
- Orders appear on kitchen board in real-time
- Data: Supabase direct calls

## Key Rules

- **Never force push main** — preserve commit history
- **Use Ant Design** for PMS/admin UI — don't add new UI libraries
- **Pages Router** — all apps use Next.js Pages Router (not App Router)
- **Follow existing patterns** — `Page`/`PageHeader`/`PageContent` wrappers, `useAssociation()` for operator context
- **Env vars via Vercel** — never commit secrets, use `.env.local` for dev
- **Standardised menu** — menu items, categories, meal plans are shared across all Zo House properties. Only orders, inventory stock, and tables are per-property.
- **Zo House properties are in Bangalore** — Koramangala and Whitefield. There is NO Zo House in Goa.

## Shared Libraries

| Lib | Exports | Usage |
|-----|---------|-------|
| `@zo/auth` | `useQueryApi`, `useMutationApi`, `useAuth`, `AuthProvider`, `ZostelAuthProvider` | All API calls, auth |
| `@zo/moal` | `Head`, `Avatar`, `Button`, `Input`, `Table`, `Modal` | UI components |
| `@zo/zud` | `ZudTable`, `ZudColumnType` | Advanced tables |
| `@zo/utils/font` | `cn`, `fontClassName` | Tailwind class merge |
| `@zo/utils/hooks` | `useOutsideClick`, `useWindowSize` | Utility hooks |
| `@zo/assets/icons` | `Icon`, `IconName` | Icon library |

## Vercel Projects (zozozo.work)

9 projects on Vercel team `samurais-dojo`, all linked to `ZoHouse/zohousecook` repo:
`zozozo-website`, `zozozo-pm`, `zozozo-dashboard`, `zozozo-admin`, `zozozo-ops`, `zozozo-checkin`, `zozozo-payments`, `zozozo-comic`, `zozozo-meme`

Domain: `zozozo.work` on Namecheap, DNS via Cloudflare (`community@zo.xyz`), A record → `76.76.21.21`
