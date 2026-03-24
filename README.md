# Zo World — Monorepo

Powers **zo.xyz** (production) and **zozozo.work** (staging/community). Same codebase, two deployments.

| Environment | Domain | Infra | Purpose |
|------------|--------|-------|---------|
| Production | zo.xyz | AWS ECS Fargate | Live for all 108+ properties |
| Staging | zozozo.work | Vercel | Community testing ground for Zo House features |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/ZoHouse/zohousecook.git
cd zohousecook

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Copy env files (see Environment Variables below)
cp apps/pms/.env.example apps/pms/.env.local
cp apps/website/.env.example apps/website/.env.local

# 4. Run the app you need
npx nx serve website    # → http://localhost:4202
npx nx serve pms        # → http://localhost:4204
npx nx serve dashboard  # → http://localhost:4203
```

## Apps

| App | Route | Port | What it does |
|-----|-------|------|-------------|
| **website** | `/` | 4202 | Public site — home, /house, /events, /membership, /cafezomad |
| **pms** | `/pm` | 4204 | Property Management — check-ins, bookings, guests, staff, **Cafe Zomad** |
| **dashboard** | `/dashboard` | 4203 | Analytics dashboard |
| **admin** | `/admin` | 4201 | Admin panel |
| **zo-ops** | `/ops` | 4210 | Operations — reviews, Slack, WhatsApp |
| **ops-backend** | — | 4211 | Node.js API for reviews, analytics, notifications |
| **web-checkin** | `/checkin` | 4206 | Guest web check-in |
| **payment** | `/payments` | 4205 | Payment processing |
| **comic** | `/comic` | 4209 | Comic |
| **meme** | `/meme` | 4208 | Meme generator |

## Environment Variables

Each app has its own `.env.local` (dev), `.env.staging`, `.env.production`. These are gitignored.

### PMS App (`apps/pms/.env.local`)

```env
# Core (required)
APP_ID = fd2c509253239f84db51
ZOSTEL_APP_ID = 5Njb5awMk0dbC7VNnY7Z35tw2yEE1HtA92r9YA1t
NODE_ENV = development
NEXT_ASSET_PREFIX =
NEXT_BASE_PATH =

# API — use production for real data
API_BASE_URL = https://api.io.zo.xyz
API_BASE_URL_ZOSTEL = https://api.zostel.com
API_SOCKET_URL = wss://api.io.zo.xyz

# Sentry (optional)
SENTRY_AUTH_TOKEN = ""

# Zo House Features — Supabase (only needed for cafe/housekeeping)
NEXT_PUBLIC_SUPABASE_URL = <ask team for Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY = <ask team for anon key>
```

### Website App (`apps/website/.env.local`)

```env
APP_ID = c26ea3e427cf42a88a18
NODE_ENV = development
NEXT_ASSET_PREFIX =
NEXT_BASE_PATH =
API_BASE_URL = https://api.io.zo.xyz
API_SOCKET_URL = wss://api.io.zo.xyz
WEB_BASE_URL = https://zo.xyz
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = <ask team for Mapbox token>
MEDIA_BASE_URL = https://proxy.cdn.zo.xyz

# Cafe Zomad customer ordering (only needed for /cafezomad)
NEXT_PUBLIC_SUPABASE_URL = <ask team for Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY = <ask team for anon key>
```

### Other Apps

All other apps follow the same pattern. Copy from `.env.staging` and update:
- `API_BASE_URL` → `https://api.io.zo.xyz` (production) or `https://api.nsfp.io.zo.xyz` (staging)
- `NEXT_BASE_PATH` → the app's route prefix (e.g., `/dashboard`, `/admin`)
- `NEXT_ASSET_PREFIX` → leave empty for local dev

## Tech Stack

- **Monorepo:** [Nx](https://nx.dev/) 17
- **Framework:** [Next.js](https://nextjs.org/) 14 (Pages Router)
- **UI:** [Ant Design](https://ant.design/) 5 + [Tailwind CSS](https://tailwindcss.com/) 3
- **State:** [React Query](https://tanstack.com/query) 5
- **Auth:** Zo World + Zostel phone OTP (5-tier RBAC)
- **Icons:** Custom `@zo/assets/icons` library
- **Backend:** Django REST API (production), Supabase (staging features)

## Shared Libraries (`libs/`)

| Library | Import | Purpose |
|---------|--------|---------|
| `@zo/auth` | API hooks (`useQueryApi`, `useMutationApi`), auth providers | All data fetching + auth |
| `@zo/moal` | `Head`, `Avatar`, `Button`, `Input`, `Table` | UI components |
| `@zo/zud` | `ZudTable` | Advanced filterable tables |
| `@zo/assets/icons` | `Icon`, `IconName` | SVG icon library |
| `@zo/utils/font` | `cn`, `fontClassName` | Tailwind class merge + fonts |
| `@zo/utils/hooks` | `useOutsideClick`, `useWindowSize` | Utility hooks |
| `@zo/definitions` | TypeScript type definitions | Shared types |

## Zo House Features (Cafe Zomad)

The PMS app has Zo House-specific features that only appear for Zo House properties:

- **Operator codes:** `BNGHO812` (Koramangala), `BNGS531` (Whitefield)
- **Config:** `apps/pms/src/configs/zo-house-features.ts`
- **Admin pages:** `/pm/cafe/*` — Dashboard, Kitchen, Menu, Orders, Tables, Meal Plan, Inventory
- **Customer page:** `/cafezomad/[tableId]` — QR scan ordering (in website app)
- **Backend:** Direct Supabase calls (staging). Will migrate to Django when ready.

### Building a New Zo House Feature

1. Add your feature to `zo-house-features.ts` with `status: 'testing'`
2. Create pages in `apps/pms/src/pages/` (admin) or `apps/website/src/pages/` (customer)
3. Use Supabase direct calls for data (see existing cafe hooks as reference)
4. Wrap admin pages in `ZoHouseGuard` for route protection
5. Test locally, push to main → auto-deploys to zozozo.work
6. When ready for production: hand off Supabase schema to backend team for Django endpoints

## Folder Structure

```
.
├── apps/
│   ├── website/          # Public site (zo.xyz root)
│   ├── pms/              # Property Management System
│   ├── dashboard/        # Analytics
│   ├── admin/            # Admin panel
│   ├── zo-ops/           # Operations
│   ├── ops-backend/      # Node.js API
│   ├── web-checkin/      # Guest check-in
│   ├── payment/          # Payments
│   ├── comic/            # Comic
│   └── meme/             # Meme
├── libs/
│   ├── auth/             # Auth + API hooks
│   ├── assets/icons/     # SVG icon library
│   ├── definitions/      # Shared TypeScript types
│   ├── moal/             # UI components
│   ├── utils/            # Utility functions + hooks
│   └── zud/              # Advanced table component
├── docs/
│   └── superpowers/      # Design specs + implementation plans
├── CLAUDE.md             # AI assistant instructions
└── README.md             # This file
```

## Deployment

- **Production (zo.xyz):** AWS ECS Fargate via GitHub Actions (`nx affected` builds only changed apps)
- **Staging (zozozo.work):** Vercel auto-deploy on push to `main` (9 separate projects)

## Contributing

1. Create a branch from `main`
2. Make your changes
3. Test locally (`npx nx serve <app>`)
4. Push → creates Vercel preview deployment
5. PR to `main` → review → merge → auto-deploys to zozozo.work

For Zo House features, see the "Building a New Zo House Feature" section above.
