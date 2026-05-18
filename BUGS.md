# fix/bugs — Testing Punch List

Working doc for this branch. Delete before merging to `main`.

**Apps under test**
- PMS — `apps/pms/` — routes: `/pm/cafe`, `/pm/cafe/kitchen`, `/pm/cafe/menu`, `/pm/cafe/orders`, `/pm/cafe/tables`, `/pm/cafe/inventory`, `/pm/cafe/meal-plan`, `/pm/cafe/food-credits`, `/pm/cafe/order/[tableId]`
- Cafezomad site — _(confirm app path: `apps/website/`?)_

---

## PMS

### To Delete
<!-- file/route/component + why -->
- [ ]

### Bugs

- [x] **Menu categories duplicated** — `apps/pms/src/hooks/cafe/useCafeMenu.ts`
  - Repro: open `/pm/cafe/menu` → every category (Breakfast, Burgers, …) appears twice
  - Cause: categories fetched without `propertyId`, so BLR + WTF rows both returned and never deduped (items already were, lines 73-79)
  - Fix: dedupe categories by name, remap `item.category_id` to canonical id so `getItemCount(cat.id)` still works
  - Status: **fixed**

- [x] **Menu mutations only hit one property** — `apps/pms/src/hooks/cafe/useCafeMenu.ts`
  - `toggleCategory`, `toggleAvailability`, `updateItem` updated by `id` only → BLR row flipped, WTF row stayed stale, dedup would surface the stale one on next fetch
  - Fix: look up name, then `.eq('name', name)` to update all per-property siblings (matches `createItem`/`createCategory` already-standardised pattern). `updateItem` also strips `id`/`property_id`/`category_id` from the payload to avoid clobbering scoping
  - Status: **fixed**

- [x] **Delete option for menu items + categories — added then removed**
  - Added trash UI + cross-property `deleteItem`/`deleteCategory` on the hook to clean up diet pollution in one pass
  - After cleanup the user asked for delete to be removed (don't want staff hard-deleting via UI). Buttons + dead hook functions both gone
  - "Unavailable" toggle remains for soft-delete
  - Status: **fixed (removed after use)**

- [x] **Zo Meals cleaned out** — DB-side
  - 46 rows / 24 names (Poha, Roti, Dal, Mutter Paneer, etc) were sitting in Zo Meals — historical seed pollution, not from the current meal-plan flow
  - Hand-mapped → moved into Breakfast (Poha, Pancake, Paneer Bhurji, Scrambled Egg & Bread Toast, Breakfast) and Lunch & Dinner (everything else, mostly sabzis + staples)
  - Zo Meals now empty — reserved for the actual combo offerings (Zo Breakfast / Zo Lunch / Zo Dinner)
  - Verified `useCafeMealPlans.addItem` does NOT write to Zo Meals — no code fix needed
  - Status: **fixed**

- [x] **Diet categories cleaned up** — `Vegetarian` / `Non-Vegetarian` / `Egg` / `Other`
  - 263 rows reassigned by name-based classifier into real food categories (L&D 127, Beverages 89, Breakfast 76, Munchies 59, etc.)
  - 5 non-food stragglers left in diet categories: `#Diwali Special`, `Bud Pre`, `Dog Food`, `Ice Cubes`, `Vape` — kill via trash button in the UI when ready
  - Once empty, the diet categories themselves can be deleted via the new category trash button (will need an FK fix on `cafe_meal_plan_items.menu_item_id` first if any meal-plan rows point to leftover items — see below)
  - Status: **fixed**

- [ ] **`cafe_meal_plan_items.menu_item_id` FK blocks menu_item deletes** — schema
  - During cleanup, hit `23503` from `cafe_meal_plan_items_menu_item_id_fkey` when deleting a menu_item that's referenced from a meal plan
  - Same fix pattern as the cafe_order_items migration you just applied — but here `cafe_meal_plan_items` does NOT denormalize name, so `ON DELETE SET NULL` would leave broken rows. Recommendation: `ON DELETE CASCADE` (if the item is gone, drop the meal-plan row too)
  - Status: open — needs migration

- [x] **Kitchen alert now loops until accepted** — `apps/pms/src/lib/cafe/kitchen-alert.ts`, `apps/pms/src/hooks/cafe/useCafeRealtimeOrders.ts`
  - Old: 2 quick beeps on INSERT/UPDATE then silence — easy to miss in a noisy kitchen
  - New: pulses the cue (with 1.5s gap) for as long as any order is in `kitchen_status='new'`. Stops the instant staff accepts. Idempotent start/stop; auto-silences on leaving the kitchen page
  - `playKitchenAlert()` kept as one-shot for the "Test sound" button
  - Status: **fixed**

- [x] **"Being Prepared" wrongly included unpaid drafts** — `apps/website/src/pages/cafezomad/[tableId].tsx:541`
  - `activeOrders` filter excluded only ready/served/cancelled, so `draft` orders (created but never paid) appeared under "Being Prepared" even though they were never sent to the kitchen
  - Split into two buckets: `awaitingPaymentOrders` (drafts) and `prepOrders` (new/accepted/preparing). UI now renders separate sections with correct headers
  - Also: customer view only shows drafts < 1h old (Razorpay session keepalive is ~15m, so older drafts can't be resumed anyway)
  - Status: **fixed**

- [x] **Stale draft orders cleaned up** — DB-side
  - Deleted 8 abandoned drafts + 9 order_items rows (all >1h old, 3 already refunded by Razorpay)
  - Follow-up still open: scheduled sweep so this doesn't accumulate again
  - Status: **fixed (one-time)**

- [ ] **Add a draft-order sweeper** — schema / scheduled job
  - Currently relies on manual cleanup (just deleted 8). Drafts that don't get paid within ~15m are useless — Razorpay session is gone
  - Recommendation: pg_cron job that deletes `cafe_orders WHERE kitchen_status='draft' AND created_at < now() - interval '1 hour'` along with its order_items, every 10 minutes
  - 8 orders stuck in `kitchen_status=draft` (never paid / refunded), oldest ~470h
  - 5 × `draft / payment=pending`, 3 × `draft / payment=refunded`
  - Cause: draft-until-paid (migration `20260428_place_cafe_order_draft_until_paid.sql`) has no sweeper for abandoned drafts
  - Needs decision: one-time cleanup + scheduled sweep (Supabase cron), or expand draft TTL elsewhere
  - Status: open

---

## Cafezomad site

### To Delete
- [ ]

### Bugs
- [ ]

---

## Cross-cutting / Shared (libs/, configs, etc.)

- [ ]

---

## Merge checklist (before `fix/bugs` → `main`)
- [ ] All bugs above marked fixed
- [ ] `npx nx build pms` passes
- [ ] `npx nx build <cafezomad-app>` passes
- [ ] Manual smoke: customer order flow on mobile (`/cafe/order/[tableId]`)
- [ ] Manual smoke: kitchen board realtime updates
- [ ] No `console.log` left in changed files
- [ ] `BUGS.md` deleted
