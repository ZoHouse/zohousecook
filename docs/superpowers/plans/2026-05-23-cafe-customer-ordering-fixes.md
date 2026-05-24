# Cafe Customer Ordering — UX & Persistence Fixes

**Status:** Approved, ready to build
**Date:** 2026-05-23
**Owner team:** Cafe Ops
**Primary surface:** `apps/website/src/pages/cafezomad/[tableId].tsx` (the customer-facing QR ordering page in the `website` app — NOT the staff PMS variant at `apps/pms/src/pages/cafe/order/[tableId].tsx`)
**Citizens served:** Residents & Community (diners) ↔ Operators (cafe staff via kitchen board)

---

## Why this exists

Three pain points are hurting diner experience and order completion on the QR-scan customer ordering page:

1. **Visually messy menu** — a 2-column grid of square cards crammed with diet dot, name, description, price, calories, macros (P/C/F), and ADD button. Hard to scan; visible vertical + horizontal scrollbars added to the noise.
2. **"Orders" tab capped at 20 rows** — `fetchOrders` had `.limit(20)` hard-coded, so older history was invisible with no way to load more.
3. **Cart resets between visits** — cart was stored in `localStorage` keyed by `cafezomad_cart_${tableId}`, so scanning a different table the next day showed an empty cart instead of restoring the saved items.

## Goals

- Menu cards scannable with a **Swiggy-style** image-right layout, with a clean fallback for items without an image.
- "Orders" tab shows the **logged-in user's orders only**, paginated 10/page + Load More, across tables and days.
- Cart **persists per logged-in Zo user in the DB** so it survives device/browser/day switches. Guest fallback via `localStorage`.

## Non-goals

- No payment-page changes (still "pay at counter").
- No menu schema changes — `image_url` already exists on `cafe_menu_items`.
- No admin Orders page changes (already paginated).
- No kitchen board changes.
- Not swapping the 5s poll for Supabase Realtime (user explicitly deferred).

---

## Design 1 — Menu cards (Swiggy-style)

### Card layout (per item)

```
┌──────────────────────────────────────┐
│  ● Paneer Tikka              ┌─────┐ │
│    Smoky cottage cheese,     │     │ │
│    mint chutney              │ IMG │ │
│                              │     │ │
│    ₹ 280 · 320 kcal          │[ADD]│ │
│                              └─────┘ │
└──────────────────────────────────────┘
```

- **Image** 96×96px, right-aligned, `rounded-2xl`, `object-cover`. ADD button overlays the bottom of the image (white bg, black border, 8px lift below image edge — Swiggy/Zomato pattern).
- **Fallback when `image_url` is null:** 96×96 `bg-stone-200` tile with a fork/knife icon and the first 1–2 letters of the item name. Layout stays consistent.
- **Text column:** diet dot (`w-3`), name (`text-base font-bold`), 2-line `line-clamp-2` description (`text-[13px]`), price + calories on one line separated by `·` (calories slightly muted so price wins).
- **Quantity control** replaces ADD once added — same black pill `−` / qty / `+`, anchored to the image-overlay position so the row doesn't shift.

### Category navigation

- **Sticky horizontal chip strip** at top of menu (under search bar when shown). Scrollable horizontally for long category lists. Tap a chip to filter.
- **Keep the floating yellow FAB** for the full overlay list (power-user shortcut when 15+ categories).

### Misc

- **Touch targets:** ADD button bumps to 36px height.
- **Image loading:** `loading="lazy"`, `decoding="async"` on plain `<img>` (avoid Next/Image complexity on a customer page).

---

## Design 2 — Customer "Orders" tab

### Current behavior

`[tableId].tsx:158-174`:

- `select * from cafe_orders where table_id = X order by created_at desc` — no limit, no user filter
- `setInterval(fetchOrders, 5000)` — refetches the entire list every 5s

### New behavior

| State | What shows | How fetched |
|---|---|---|
| Not logged in | Orders placed in this browser session (in-memory list populated when `place_cafe_order` returns) | No network poll, no DB read |
| Logged in | "My Orders" — all orders by `zo_user_id = user.id`, paginated 10/page with **Load More** | One paginated query on tab open + on Load More |

### Pagination

- Initial: 10 most recent.
- Sticky "Load More" button when `loaded < totalCount`.
- Use Supabase `.range(from, to)` with `count: 'exact'` (same pattern as admin `useCafeOrders.ts:40-55`).

### Polling

- **Keep the 5s poll** but scope it to the current page slice (10 orders, not all orders), and only when the Orders tab is the active tab.
- Skip the poll entirely when not logged in (no orders to fetch from DB).

### Empty states

- Guest (not logged in): "Sign in to see your order history" + login CTA.
- Logged in, no orders: existing "No orders yet" empty state.

### Edge case — guest places order, then logs in mid-session

After login, refetch My Orders. The just-placed order will appear because `place_cafe_order` is already called with `p_zo_user_id: user.id`.

---

## Design 3 — Persistent cart (`cafe_carts` table)

### New table

Migration: `supabase/migrations/20260523_cafe_carts.sql`

```sql
create table cafe_carts (
  id uuid primary key default gen_random_uuid(),
  zo_user_id uuid not null,
  property_id uuid not null references properties(id),
  table_id uuid references cafe_tables(id),  -- last table they were at; nullable
  items jsonb not null default '[]',         -- [{menu_item_id, quantity, name_snapshot, price_snapshot}]
  updated_at timestamptz not null default now(),
  unique (zo_user_id)
);

alter table cafe_carts enable row level security;
create policy "own_cart_select" on cafe_carts for select
  using (zo_user_id = auth.uid());
create policy "own_cart_upsert" on cafe_carts for all
  using (zo_user_id = auth.uid()) with check (zo_user_id = auth.uid());
```

**Why one row per user** (not user × table): one cart, full stop. Switching tables updates `table_id` on the existing cart so we know where to send the order — it does not fork.

### Sync flow (client side in `[tableId].tsx`)

| Event | Action |
|---|---|
| Page load, logged in | Fetch `cafe_carts` row → hydrate local state |
| Page load, guest | Read `localStorage['cafe_cart_guest']` → hydrate |
| Add/remove/qty change | Debounced 500ms upsert to `cafe_carts` (logged-in) OR write `localStorage` (guest) |
| Login mid-session (guest → user) | Merge local guest cart into DB cart (item-level: same `menu_item_id` → sum quantities), clear guest `localStorage` |
| Place Order success | Clear DB row + clear `localStorage` |
| Cart age > 7 days | Server-side cron clears stale carts (separate follow-up, not blocking) |

### Stale price / removed item safety

- Snapshot `name` and `price` into cart items.
- `place_cafe_order` RPC already re-validates prices server-side (`[tableId].tsx:202-208`) — diner pays current price, not snapshot.
- On hydrate, filter out items whose menu item is no longer available (`is_available=false` or soft-deleted). Show a one-line toast: "Some items in your cart are no longer available."
- When snapshot price ≠ current menu price, show a small "Prices updated" banner on the Cart tab.

---

## Implementation Plan

- [x] Migration `20260523_cafe_carts.sql` (table + trigger + index).
- [x] `apps/website/src/hooks/useCafePersistentCart.ts` — DB sync + legacy localStorage migration + stale-item filtering.
- [x] `apps/website/src/hooks/useCafeCustomerOrders.ts` — user-scoped paginated fetch (10/page) with Load More + visibility-aware polling.
- [x] Menu card redesign in `apps/website/src/pages/cafezomad/[tableId].tsx` — Swiggy-style image-right layout (112×112), fallback letter tile, ADD pill overlapping image.
- [x] Sticky category chip strip (with `hide-scrollbar`); existing FAB retained for long lists.
- [x] Wire both new hooks; remove old localStorage cart, old session-order tracking, old 20-row poll. Preserve Razorpay/$food/notes/daily-limits flows.
- [x] Hide vertical scrollbar on the main scroll container.
- [x] `npx tsc --noEmit -p apps/website/tsconfig.json` passes (0 errors).

## Connection surfaces (Zo Universe)

- **Residents/Community (diners)** ↔ **Operators (cafe staff)**: cart and orders are the data flowing between them.
- **$Zo trace**: `cafe_carts.zo_user_id` and `cafe_orders.zo_user_id` already wire orders to identity. Persistent cart preserves intent across sessions, so dropped-cart conversion can be measured by the Token team later.

## Out of scope / follow-ups

- Server-side cron to expire stale `cafe_carts` rows older than 7 days.
- Replacing the 5s poll with Supabase Realtime subscription (kitchen board uses it — proven pattern, but deferred this iteration).
- Item detail modal (where we could move calories + longer description + ingredients).
- Image upload bulk-fill for menu items missing `image_url`.
