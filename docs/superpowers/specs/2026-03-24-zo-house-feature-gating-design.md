# Zo House Feature Gating — Design Spec

## Problem

The PMS app (`zo.xyz/pm`) serves 108+ properties across Zostel, Zostel Plus, Zostel Homes, Zo Selections, and Zo House. New features (cafe, housekeeping, etc.) are being built for Zo House properties first, tested at `zozozo.work/pm`, then graduated to all properties on `zo.xyz/pm`.

These features need:
- Visibility gating (only Zo House properties see them during testing)
- A dual backend (Supabase for testing, Django for production)
- A clean migration path from Supabase to Django

## Zo House Properties

| Property | Code |
|----------|------|
| Zo House Bangalore (Koramangala) | `BNGHO812` |
| Zo House Bangalore (Whitefield) | `BNGS531` |

New Zo Houses get added to the allowlist as they open.

## Design

### 1. Feature Registry

A single config file controls which features are visible and which backend they use:

```ts
// src/configs/zo-house-features.ts

export const ZO_HOUSE_OPERATOR_CODES = ['BNGHO812', 'BNGS531']

export type FeatureBackend = 'supabase' | 'django'
export type FeatureStatus = 'testing' | 'graduated' | 'disabled'

interface ZoFeature {
  id: string
  label: string
  backend: FeatureBackend
  status: FeatureStatus
  navLinks: { name: string; path: string; icon: string }[]
}

export const ZO_FEATURES: Record<string, ZoFeature> = {
  cafe: {
    id: 'cafe',
    label: 'Cafe Zomad',
    backend: 'supabase',
    status: 'testing',
    navLinks: [
      { name: 'Dashboard', path: '/cafe', icon: 'Coffee' },
      { name: 'Kitchen', path: '/cafe/kitchen', icon: 'Flame' },
      { name: 'Menu', path: '/cafe/menu', icon: 'UtensilsCrossed' },
      { name: 'Orders', path: '/cafe/orders', icon: 'ClipboardList' },
      { name: 'Tables', path: '/cafe/tables', icon: 'Grid' },
      { name: 'Meal Plan', path: '/cafe/meal-plan', icon: 'Calendar' },
      { name: 'Inventory', path: '/cafe/inventory', icon: 'Package' },
    ],
  },
  housekeeping: {
    id: 'housekeeping',
    label: 'Housekeeping',
    backend: 'supabase',
    status: 'testing',
    navLinks: [
      { name: 'Status', path: '/housekeeping', icon: 'Sparkles' },
    ],
  },
}
```

### 2. Sidebar Integration

Cafe Zomad appears as an **expandable section** in the existing PMS sidebar, positioned after Activity Manager:

```
Overview
Pending Web Check-ins
Future Web Check-ins
Digital Register
Activity Manager
▼ Cafe Zomad              ← expandable, Zo House only
    Dashboard
    Kitchen
    Menu
    Orders
    Tables
    Meal Plan
    Inventory
▶ Housekeeping             ← future expandable, Zo House only
Chat Access
Reports
Demand Dashboard
Staff
```

Gating logic in `Navigation.tsx`:
- After existing `hasAccess(minRole)` + `requiredDataKey` filters
- If a nav section is a Zo Feature with `status: 'testing'` → only show when `selectedOperator.code` is in `ZO_HOUSE_OPERATOR_CODES`
- When `status: 'graduated'` → show for all properties (gate removed)

### 3. Dual Backend

**Existing:** PMS uses `zoServer` (axios) → `api.io.zo.xyz` (Django)

**Added:** Supabase client for Zo House features:

```ts
// src/configs/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

New env vars in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<zohousecook supabase project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<zohousecook supabase anon key>
```

**Hook pattern:** Every Supabase hook returns data in the same shape the future Django endpoint will. Components never know which backend they're talking to.

### 4. Migration Path (Supabase → Django)

When a feature is tested and ready to graduate:

1. **Hand off schema** — Supabase table definitions exported for backend team to create Django models + REST endpoints
2. **Swap hook internals** — Change data source from Supabase client to `useQueryApi`/`useMutationApi` (existing Django pattern). Components unchanged.
3. **Update feature config** — `backend: 'django'`, `status: 'graduated'`
4. **PR to main** — No Supabase dependency in production

Each feature gets a migration doc at `docs/features/<feature>/migration.md` with:
- Supabase tables → Django models mapping
- API endpoint spec for backend team
- Data migration script if needed

### 5. Deployment

- **zozozo.work** deploys the same monorepo with Supabase env vars set → Zo House features active
- **zo.xyz/pm** deploys without Supabase env vars (or with `status: 'disabled'`) → Zo House features hidden until graduated

### 6. Porting from zohousecook

zohousecook (standalone Next.js 16, App Router, shadcn/ui, Prisma) is the prototype. Features get ported into the Nx monorepo (`apps/pms`) by:

- Converting App Router pages → Pages Router pages
- Converting shadcn/ui components → Ant Design components (matching PMS design system)
- Converting Prisma ORM calls → direct Supabase client calls
- Reusing existing PMS patterns: `useQueryApi`/`useMutationApi` hooks, `Page`/`PageHeader` components, `AssociationProvider` context

The Supabase tables remain the same — only the ORM layer changes (Prisma → Supabase JS client).
