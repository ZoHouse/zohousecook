# Welcome to the New Zo Monorepo

**TL;DR:** The `ZoHouse/zohousecook` repo now contains the **entire zo.xyz platform** — not just the old cafe app. Same repo URL, much bigger scope. This is the single codebase powering both zo.xyz (production) and zozozo.work (staging).

## Why This Changed

We consolidated all dev efforts into one place. Instead of scattered codebases, everything — website, PMS, dashboard, admin, ops, payments, check-in, and our new Zo House features (Cafe Zomad, housekeeping) — lives in one Nx monorepo.

**zozozo.work** is our staging/community site where we build and test new features before they go live on zo.xyz for all 108+ properties.

## Quick Setup (If You Had the Old Repo)

Your local `zohousecook` folder has the old standalone app. Here's how to switch:

```bash
# 1. Go to your zohousecook folder
cd zohousecook  # or wherever you cloned it

# 2. Clean out old files (won't delete your .env — that's gitignored)
rm -rf node_modules .next .vercel

# 3. Pull the new codebase
git fetch origin
git reset --hard origin/main

# 4. Install dependencies (this is an Nx monorepo now — bigger install)
npm install --legacy-peer-deps

# 5. Set up your env files
cp apps/pms/.env.example apps/pms/.env.local
cp apps/website/.env.example apps/website/.env.local
# Then edit .env.local files — ask Samurai for Supabase keys
```

That's it. Your old code is replaced with the full monorepo.

## Running Apps Locally

```bash
# Run the PMS (property management — where Cafe Zomad lives)
npx nx serve pms
# → http://localhost:4204

# Run the website (public site + /cafezomad customer ordering)
npx nx serve website
# → http://localhost:4202

# Run both at once
npx nx serve pms & npx nx serve website &
```

Login with your phone number (same OTP as zo.xyz). Select a Zo House property from the top-left dropdown to see Cafe Zomad.

## What's Where

```
apps/
├── website/     → zo.xyz homepage, /house, /events, /membership, /cafezomad
├── pms/         → zo.xyz/pm — check-ins, bookings, Cafe Zomad (admin)
├── dashboard/   → zo.xyz/dashboard
├── admin/       → zo.xyz/admin
├── zo-ops/      → zo.xyz/ops — reviews, Slack, WhatsApp
├── web-checkin/  → zo.xyz/checkin
├── payment/     → zo.xyz/payments
└── ...

libs/            → shared code (auth, icons, UI components, utils)
```

## Cafe Zomad Pages

These are the pages we built for Zo House properties. They only appear when you select a Zo House in the PMS sidebar:

| Page | Route | What it does |
|------|-------|-------------|
| Dashboard | /cafe | Today's orders, revenue, popular items |
| Kitchen | /cafe/kitchen | Live Kanban board — realtime order tracking |
| Menu | /cafe/menu | Edit menu items, categories, availability |
| Orders | /cafe/orders | Order history with status filters |
| Tables | /cafe/tables | Table management + QR codes |
| Meal Plan | /cafe/meal-plan | Weekly meal planning calendar |
| Inventory | /cafe/inventory | Ingredient stock tracking |

**Customer ordering:** /cafezomad/[tableId] — this is what guests see when they scan the QR code at their table.

## How to Contribute a Feature

### 1. Create a branch
```bash
git checkout -b feature/my-feature
```

### 2. Find where your code goes

- **New Zo House admin page?** → `apps/pms/src/pages/cafe/`
- **New customer-facing page?** → `apps/website/src/pages/`
- **New hook for Supabase data?** → `apps/pms/src/hooks/cafe/`
- **New component?** → `apps/pms/src/components/cafe/`

### 3. Follow existing patterns

Look at any existing cafe page as a template. Every admin page:
- Imports `ZoHouseGuard`, `Page`, `PageHeader`, `PageContent`
- Uses `usePropertyId()` to get the Supabase property ID
- Queries Supabase directly via the `supabase` client
- Uses Ant Design components (not shadcn/ui — that was the old app)

```tsx
// Template for a new cafe page
import { NextPage } from "next";
import ZoHouseGuard from "../../components/helpers/app/ZoHouseGuard";
import { Page, PageContent, PageHeader } from "../../components/ui";
import { usePropertyId } from "../../hooks/cafe/usePropertyId";
import { supabase } from "../../configs/supabase";

const MyNewPage: NextPage = () => {
  const { propertyId } = usePropertyId();

  // Your Supabase queries here

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="My Feature" icon="Food" />
        <PageContent>
          {/* Your UI here */}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  );
};

export default MyNewPage;
```

### 4. Add to sidebar (if new page)

Edit `apps/pms/src/configs/zo-house-features.ts` to add your page to the nav:

```ts
navLinks: [
  // ... existing links
  { id: "cafe-my-feature", name: "My Feature", path: "/cafe/my-feature", icon: "Food" },
],
```

### 5. Test locally
```bash
npx nx serve pms
# Open http://localhost:4204, select Zo House, navigate to your page
```

### 6. Push and PR
```bash
git push origin feature/my-feature
# Create PR on GitHub → auto-deploys preview to Vercel
# After merge → goes live on zozozo.work
```

## Environment Variables You'll Need

Copy from `.env.example` and fill in:

| Variable | Where to get it | Required for |
|----------|----------------|-------------|
| APP_ID | Already in .env.example | All apps |
| ZOSTEL_APP_ID | Already in .env.example | PMS, admin |
| API_BASE_URL | Already set to production | All apps |
| NEXT_PUBLIC_SUPABASE_URL | Ask Samurai | Cafe features |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Ask Samurai | Cafe features |
| NEXT_PUBLIC_SUPABASE_SERVICE_KEY | Ask Samurai | Cafe features (bypasses RLS) |

**Don't commit .env files** — they're gitignored.

## Key Rules

- **Don't change auth** for PMS, admin, web-checkin, or payment apps — other teams depend on them
- **Use Ant Design** components — not shadcn/ui (that was the old standalone app)
- **Menu is standardised** — no property filters on menu/meal plan/recipes. Only orders, stock, and tables are per-property.
- **Zo Houses are in Bangalore** — Koramangala (BLR) and Whitefield (WTF). No Goa.
- **Test locally before pushing** — `npx nx serve pms` should work without errors

## Architecture Overview

```
zo.xyz (production)          zozozo.work (staging)
     │                            │
     │  AWS ECS Fargate           │  Vercel (9 projects)
     │  Django backend            │  Django + Supabase
     │                            │
     └──── Same codebase ────────┘
           github.com/ZoHouse/zohousecook
```

**Zo House features** (cafe, housekeeping) are gated by operator code — they only appear for BLR and WTF properties. They use Supabase as a staging database. When a feature is ready, the backend team creates Django endpoints, we swap the data source, and it goes live on zo.xyz for everyone.

## Need Help?

- **CLAUDE.md** in the repo root has detailed architecture + rules
- **README.md** has the full tech stack and app breakdown
- **docs/superpowers/** has design specs and implementation plans
- Or just ask Samurai
