# Cafe Ops Team

## Mission

Run the best cafe experience across Zo House properties. Make ordering frictionless for members, give kitchen staff real-time clarity, give admins full control. Food is infrastructure — it's what keeps builders fuelled and in the building.

## Ownership

### App: `apps/pms/` (Property Management System)

### Admin Pages (8)

| Route | File | Purpose | Status |
|-------|------|---------|--------|
| `/cafe` | `apps/pms/src/pages/cafe/index.tsx` | Dashboard — daily orders, revenue, avg order value, popular items | Complete |
| `/cafe/kitchen` | `apps/pms/src/pages/cafe/kitchen.tsx` | Realtime kanban — orders move through new/accepted/preparing/ready/served | Complete |
| `/cafe/menu` | `apps/pms/src/pages/cafe/menu.tsx` | Menu CRUD — categories, item grid, search, availability toggle | Complete |
| `/cafe/orders` | `apps/pms/src/pages/cafe/orders.tsx` | Order history — paginated table, status/date filtering, order detail modal | Complete |
| `/cafe/tables` | `apps/pms/src/pages/cafe/tables.tsx` | Table management — create with code/label/area/capacity, QR generation | Complete |
| `/cafe/inventory` | `apps/pms/src/pages/cafe/inventory.tsx` | Ingredient inventory — search, category/property filter, low stock alerts | Complete |
| `/cafe/meal-plan` | `apps/pms/src/pages/cafe/meal-plan.tsx` | Weekly planner — calendar grid (breakfast/lunch/dinner x 7 days) | Complete |
| `/cafe/food-credits` | `apps/pms/src/pages/cafe/food-credits.tsx` | Food credit management | Complete |

### Customer-Facing Page (1)

| Route | File | Purpose | Status |
|-------|------|---------|--------|
| `/cafe/order/[tableId]` | `apps/pms/src/pages/cafe/order/[tableId].tsx` | Customer ordering — scan QR, browse menu, add to cart, pay via Razorpay | Complete |

### API Routes

| File | Purpose |
|------|---------|
| `apps/pms/src/pages/api/cafe/ai-fill.ts` | AI-powered menu item autofill |

Note: Most data access goes through Supabase client or external APIs, not local API routes.

### Components

Located in `apps/pms/src/components/cafe/` — cafe-specific UI components.

### Hooks (in `apps/pms/src/hooks/cafe/`)

| Hook | Purpose |
|------|---------|
| `useCafeMenu.ts` | Menu items and categories CRUD |
| `useCafeMealPlans.ts` | Meal plan management |
| `useCafeOrders.ts` | Order management and history |
| `useCafeTables.ts` | Table management |
| `useCafeAnalytics.ts` | Dashboard analytics |
| `useCafeRealtimeOrders.ts` | Supabase Realtime order subscriptions |
| `useFoodCredits.ts` | Food credit operations |
| `useIngredients.ts` | Ingredient inventory management |
| `usePropertyId.ts` | Current property context |

### Utilities (in `apps/pms/src/lib/cafe/`)

| File | Purpose |
|------|---------|
| `order-calculator.ts` | Order total calculation (prices in paise) |
| `kitchen-status.ts` | Kitchen order status management |
| `inventory-deduct.ts` | Auto-deduct inventory on order completion |
| `food-credit-debit.ts` | Food credit debit operations |
| `operator-map.ts` | Operator mapping |
| `phone-normalize.ts` | Phone number normalization |

### Types

- `apps/pms/src/types/cafe.ts` — All cafe type definitions

## Patterns to Follow

- **Pages Router** — all pages in `apps/pms/src/pages/cafe/`. No App Router.
- **Hooks for data** — page components use hooks from `src/hooks/cafe/` for data fetching.
- **Ant Design UI** — primary UI library. Use antd components.
- **Supabase for DB** — data access via Supabase client configured in `src/configs/supabase.ts`.
- **Realtime via Supabase** — kitchen board and order updates use Supabase Realtime subscriptions.
- **Prices in paise** — all prices stored and calculated in paise. Convert to rupees only in display layer.
- **Per-property data** — inventory and orders are per-property (BLR/WTF). Menu and meal plans are standardised across properties.
- **Kitchen status flow:** new -> accepted -> preparing -> ready -> served. Only "cancelled" can skip steps.
- **Category-based browsing** — both admin menu and customer order page use category sidebar/chips for navigation, with search as secondary.

## Known Gaps

- Only 1 API route exists (`ai-fill.ts`). Most data fetching goes through Supabase directly or external APIs.
- No standalone recipe page — recipes are only editable inside the menu item form.
- No kitchen analytics — cook times, throughput, bottleneck detection not tracked.
- No order notifications — no push/SMS when order status changes for customer.

## Watch Out For

- Customer ordering page (`/cafe/order/[tableId]`) bypasses admin auth — don't add admin auth here.
- Kitchen board uses Supabase Realtime — test with actual Supabase connection, not mocks.
- Menu items and categories are shared across properties — no property selector on menu pages.
- `order-calculator.ts` handles all price math — don't duplicate price logic elsewhere.
- Razorpay webhook must return 200 quickly — don't do heavy processing inline.
- Menu item `customizations` is stored as JSONB — validate the shape before writing.

## Decisions

- **2026-03-22:** Standardised menu across properties. Only inventory/orders vary by property. Reason: Zo House brand consistency, simpler management.
- **2026-03-22:** Customer auth via phone OTP only (no email, no social). Reason: phone is required for order association and future Zo Card lookup.

---

*Update this doc when you learn something new about the cafe system. Use `/learn` to trigger a review.*
