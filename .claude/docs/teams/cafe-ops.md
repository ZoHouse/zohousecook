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
- **Kitchen status flow:** new -> accepted -> preparing -> ready -> served. Only "cancelled" can skip steps. Status transitions on the kitchen board MUST go through the `advance_kitchen_status` RPC, which locks the row and asserts the expected current status — never a bare UPDATE. Concurrent kitchen tabs would otherwise double-fire inventory/credit side-effects.
- **Category-based browsing** — both admin menu and customer order page use category sidebar/chips for navigation, with search as secondary.
- **Order placement ALWAYS funnels through `place_cafe_order` RPC** — both the customer route (`apps/website/src/pages/cafezomad/[tableId].tsx`) and the staff "New Order" dialog (`components/cafe/CreateOrderDialog.tsx`). The RPC enforces accepting_orders, validates prices server-side, applies food credits atomically, and assigns display_number safely. Direct inserts into `cafe_orders` / `cafe_order_items` are forbidden — they bypass the credit ledger and corrupt analytics. RPC takes `p_mode` (dine_in/pickup/room_service) since the 20260518 migration; for non-dine_in pass `p_table_id=null`.
- **Standardised menu writes cascade** — `createItem` / `updateItem` / `toggleAvailability` / `deleteItem` in `useCafeMenu` and `toggleCategory` ALL look up same-named siblings across properties via the `findSiblingMenuItemIds` helper and apply the change to every property's row. Never do a single-row `.update()` on `cafe_menu_items` or `cafe_menu_categories` — drift between BLR and WTF is invisible to admins because of the dedup-by-name display layer.
- **N+1 prevention on order lists** — `useCafeOrders` and `useCafeRealtimeOrders` use a single embedded query: `.select('*, order_items:cafe_order_items(*), table:cafe_tables(*)')`. Don't reintroduce per-row fetches.
- **Aggregates via Postgres views** — for top-line numbers like `$food` totals, query the `food_credit_summary` view instead of pulling every transaction row. Add new views beside it when you need other aggregates.

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
- **2026-05-18:** Production customer ordering route is `/cafezomad/[tableId]` on the website app — QR codes resolve to `https://zozozo.work/cafezomad/<table-id>`. The legacy `/cafe/order/[tableId]` mirror in the PMS app was deleted because (a) no QR points at it, (b) it had silently drifted behind the cafezomad page on credit redemption, accepting_orders gating, visibility-paused polling, and per-user order scoping. Don't reintroduce — extend cafezomad instead.
- **2026-05-18:** Staff "New Order" dialog rewritten to call `place_cafe_order` RPC. Previously did direct inserts and never debited `food_credit_wallets` when staff picked `payment_mode='zo_card'`. The RPC now accepts `p_mode` so pickup / room_service work through it too.
- **2026-05-18:** Kitchen status transitions go through `advance_kitchen_status` RPC (optimistic lock + state-machine assertion) instead of bare UPDATEs. Closes the double-advance race when two kitchen tabs are open.

---

*Update this doc when you learn something new about the cafe system. Use `/learn` to trigger a review.*
