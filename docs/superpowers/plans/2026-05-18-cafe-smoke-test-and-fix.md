# Cafe Smoke Test & Fix Plan

**Date:** 2026-05-18
**Owner:** Cafe Ops
**Scope:** `apps/pms/src/pages/cafe/**` + `apps/website/src/pages/cafezomad/**` + all cafe hooks/libs/components + RPCs in `supabase/migrations/**`
**Goal:** Stop the "whole thing is chaos" — orders missing, menu duplicated, food credits never debited.

This doc is a workflow contract: **(1) Smoke-test matrix → (2) Bug catalogue → (3) Fix plan → (4) Post-fix verification.** Do them in that order. Each fix must check off both the matching bug row AND the matching verification step before being marked done.

> **Update 2026-05-18b — production routing correction.** The actual production customer route is `apps/website/src/pages/cafezomad/[tableId].tsx` (QR codes resolve to `https://zozozo.work/cafezomad/<table-id>`). The PMS-side `apps/pms/src/pages/cafe/order/[tableId].tsx` is a legacy/dev mirror that no production QR points at. The production cafezomad page already implements: `p_food_credit_paise` passing (line 554), user-phone-scoped order fetch (line 249), accepting_orders gate, visibility-paused polling, daily-limit gating, and a per-order credit-override slider via the `update_cafe_order_food_credits` RPC. Therefore:
> - **B1, B4, B5, B10 are NOT live bugs** — only legacy-page issues. Recommended action: delete `apps/pms/src/pages/cafe/order/[tableId].tsx` to remove the divergence.
> - **B2, B3, B6, B7, B9 are the real production bugs.** Phase 1 step 2 (customer credit UI) is dropped; Phase 3 (customer hardening) is reduced to "delete legacy page".

---

## 0. Working principles

- Cafe data lives in 2 properties: BLR (Koramangala) and WTF (Whitefield). Menu + meal-plans are *standardised* (rows are duplicated per property and meant to be in sync); inventory + orders are *per-property*.
- Money is stored in **paise**. Food-credit wallet balances are in *rupees* (integer). Don't mix units.
- Every order placement should funnel through the `place_cafe_order` RPC. Direct inserts are forbidden — they bypass the credit ledger, GST tail absorption, accepting-orders gate, and display-number race protection.
- Customer-facing route `/cafe/order/[tableId]` MUST stay unauthenticated for the menu browse path. Auth gate fires at Place-Order.

---

## 1. Smoke-test matrix

For each path: who exercises it, the golden-path steps, what to assert. The "Status" column reflects what we found during the 2026-05-18 inspection — **🔴 broken / 🟡 partial / 🟢 working / ⚪ untested**.

### 1.1 Admin pages

| # | Route | Path | Status | Smoke steps | Assertions |
|---|-------|------|--------|-------------|------------|
| A1 | `/cafe` | `pages/cafe/index.tsx` | ⚪ untested | Open dashboard with property set. | Daily orders, revenue, AOV, popular items render without empty/loading flicker. Numbers match a SQL spot-check. |
| A2 | `/cafe/kitchen` | `pages/cafe/kitchen.tsx` | 🟡 partial (B4, B6) | (a) Toggle "Accepting orders" off → assert customer page shows closed. (b) Place an order from customer page → kitchen alert beeps, card appears. (c) Advance new→accepted→preparing→ready→served → card moves columns then disappears. (d) Cancel an accepted order with food_credit > 0 → wallet balance is restored AND food_credit_transactions has a 'refund' row. (e) Click "New Order" → see staff order dialog (see A2b). | Realtime updates fire without page reload. Sound unlocks on first click and persists across reloads. **(d) currently impossible** because no order has credit applied (see B1, B2). |
| A2b | Kitchen "New Order" dialog | `components/cafe/CreateOrderDialog.tsx` | 🔴 BROKEN (B1, B2, B8) | (a) Open dialog. (b) Confirm dropdown shows BLR items only (currently shows BLR + WTF). (c) Add an item, pick payment=zo_card, enter customer phone. (d) Submit. | Currently: NO phone field, NO credit input, NO property filter. Order is inserted directly bypassing `place_cafe_order`. **Must be rewritten.** |
| A3 | `/cafe/menu` | `pages/cafe/menu.tsx` | 🔴 BROKEN (B3) | (a) Open menu page with property set. (b) Toggle availability on any item → reload → assert state survives AND the same item is unavailable on customer page for BOTH properties. (c) Edit an item's name/price → assert WTF copy gets the same edit. (d) Add a category from BLR → assert it exists on WTF too. (e) Delete an item → assert all property copies are gone. | (b) and (c) **fail today** — `toggleAvailability` and `updateItem` only touch the row whose id was passed. The frontend hides the drift with name-based dedup, so admins can't see the inconsistency. |
| A4 | `/cafe/orders` | `pages/cafe/orders.tsx` | 🟡 partial (B5, B7) | (a) Open Orders tab → 25 orders/page renders <2s. (b) Filter by kitchen_status, change pages. (c) Click an order → drawer shows items, totals, $food line if applied. (d) Guests tab → aggregate per-phone with order count + total spend. (e) Export modal → 3 CSV downloads run without error and column names match FUDR. | (a) currently N+1 queries (50+ requests for 25 orders, see B7). $food line only renders when `food_credit_applied_paise>0` — never true today (see B1, B2). |
| A5 | `/cafe/tables` | `pages/cafe/tables.tsx` | ⚪ untested | (a) Create a table with code/label/area/capacity. (b) Generate QR. (c) Scan QR on phone → lands on `/cafe/order/<id>`. (d) Toggle table active/inactive → unavailable tables disappear from staff dialog. | QR points to the correct hostname/basePath. Inactive tables don't appear in customer header. |
| A6 | `/cafe/inventory` | `pages/cafe/inventory.tsx` | ⚪ untested | (a) BLR + WTF tabs both load distinct stock. (b) Mark an ingredient low_stock_threshold. (c) Accept an order whose recipe consumes that ingredient → assert stock decremented and low-stock alert fires below threshold. (d) Cancel the same order → assert stock restored. | Per-property data — switching tabs swaps the dataset. `inventory-deduct.ts` joins through `cafe_recipe_items` → `cafe_menu_items` — needs the correct property's menu_item_id (B2 leaks this). |
| A7 | `/cafe/meal-plan` | `pages/cafe/meal-plan.tsx` | 🟡 partial (current diff) | (a) Week grid renders B/L/D × 7. (b) Add an item to today's lunch → assert customer page Lunch card shows that item in the description within ~2s (realtime). (c) Import-from-notes parses comma/dash lists. (d) Slot timing edits persist. | Confirm `let plan` → `const plan` refactor didn't break the create-then-attach path. The plan list is fetched, slot is identified by date+meal_type. |
| A8 | `/cafe/food-credits` | `pages/cafe/food-credits.tsx` | 🔴 BROKEN (B1, B9) | (a) Stats render. (b) Search by phone → wallet detail + txn history. (c) Issue 100 $food to a new phone → wallet created with balance=100, 'issue' txn logged. (d) Cancel the issuance with a revoke → balance back to 0, 'revoke' txn logged. (e) Place an order using credits as that customer → assert 'spend' txn + balance decremented. (f) Cancel the same order → 'refund' txn + balance restored. | **(e) and (f) impossible today** — no flow debits credits (see B1, B2). "Total Spent" is permanently 0. Page load also pulls every transaction ever (B9). |

### 1.2 Customer-facing page

| # | Route | Path | Status | Smoke steps | Assertions |
|---|-------|------|--------|-------------|------------|
| C1 | `/cafe/order/[tableId]` | `pages/cafe/order/[tableId].tsx` | 🔴 BROKEN (B4, B5, B6, B10) | (a) Scan QR while logged out → menu browses freely, no login prompt. (b) Add items → cart badge updates. (c) Tap Place Order → login modal appears. Log in via phone OTP → return to populated cart. (d) Submit → order appears on Orders tab AND on `/cafe/kitchen`. (e) Open the page on a DIFFERENT phone scanning the same QR → assert previous customer's order is NOT visible. (f) Switch tabs (Menu/Orders/Cart/Account) → scroll position resets, no jank. (g) Today's B/L/D card description matches the meal-plan items for today. | (e) **fails today** — Orders tab is filtered only by `table_id`, leaks across customers. (a) Polls cafe_orders every 5s even while page is hidden (B5). |

### 1.3 Hooks (where bugs concentrate)

| Hook | File | Bugs touched | Test |
|------|------|--------------|------|
| `useCafeMenu` | `hooks/cafe/useCafeMenu.ts` | B3 | Cross-property cascade on update/toggle, drop the dedup hack once cascade is correct. |
| `useCafeOrders` | `hooks/cafe/useCafeOrders.ts` | B7 | N+1: replace with a single joined query. |
| `useCafeRealtimeOrders` | `hooks/cafe/useCafeRealtimeOrders.ts` | B6 (advance), dead code path for credits | Already correctly debit-on-place via RPC; dead `debitFoodCredits` on accept becomes live again *only after* B1 is fixed. |
| `useFoodCredits` | `hooks/cafe/useFoodCredits.ts` | B9 | Move stats aggregation to RPC/view; paginate transactions. |
| `useCafeMealPlans` | `hooks/cafe/useCafeMealPlans.ts` | ⚪ untested | Round-trip create/attach/detach an item; realtime via the channel subscription. |
| `useCafeTables` | `hooks/cafe/useCafeTables.ts` | ⚪ untested | CRUD + QR generation. |
| `useIngredients` | `hooks/cafe/useIngredients.ts` | ⚪ untested | Inventory CRUD + low-stock filter. |
| `usePropertyId` | `hooks/cafe/usePropertyId.ts` | ⚪ untested | Property switch reflects everywhere it's consumed. |

### 1.4 Library code

| File | Bugs touched | Test |
|------|--------------|------|
| `lib/cafe/order-calculator.ts` | none confirmed | Property-test: any cart subtotal ≥ 0 → GST = floor(subtotal\*0.05), total = subtotal + GST. Match the RPC's "absorb paise tail" rounding. |
| `lib/cafe/food-credit-debit.ts` | dead code today | After B1, exercise both debit and restore RPCs with real wallet rows; idempotency via unique index on (reference_id, type='spend'). |
| `lib/cafe/inventory-deduct.ts` | depends on B2 | After B2 fix, accept a multi-item order and assert per-ingredient delta matches the recipe. |
| `lib/cafe/kitchen-status.ts` | none confirmed | `getNextStatus` returns null at terminal states; `cancelled` is reachable from any non-terminal state. |
| `lib/cafe/kitchen-alert.ts` | recent diff | Sound unlock survives reload + works in background tabs. |
| `lib/cafe/operator-map.ts`, `phone-normalize.ts` | none confirmed | `normalizePhone` returns 10-digit strings; reject inputs that aren't IN mobile numbers. |
| `lib/cafe/export-fudr.ts` | depends on B5 fix? | Export 3 reports in date range, open in Excel, assert headers + row counts match SQL. |

### 1.5 API + RPCs

| Surface | Path | Test |
|---------|------|------|
| `place_cafe_order` RPC | `supabase/migrations/20260517_place_cafe_order_p_notes.sql` | The currently active version (latest). Smoke: (1) zero-credit happy path, (2) credit < total, (3) credit ≥ total (sets payment_mode=zo_card, payment_status=paid), (4) credit > balance → raises insufficient_balance, (5) accepting_orders=false → raises closed. |
| `debit_food_credits`/`restore_food_credits` RPCs | `supabase/migrations/20260326_food_credits.sql` | Concurrent calls don't double-debit. Idempotency via the unique index on `(reference_id, type='spend')`. |
| `/api/cafe/ai-fill` | `pages/api/cafe/ai-fill.ts` | Submit a name + minimal description → returns price/diet/calories suggestion. Handle OpenAI quota errors gracefully. |
| `/api/cafe/create-razorpay-order` | `pages/api/cafe/create-razorpay-order.ts` | After `place_cafe_order` returns a draft order id, this endpoint creates the Razorpay order. Webhook capture flips payment_status. |

---

## 2. Bug catalogue (confirmed during 2026-05-18 inspection)

Severity: 🟥 P0 (data/money loss) / 🟧 P1 (visible chaos) / 🟨 P2 (perf, future debt)

### 🟥 B1 — Customer order page never applies food credits
- **Where:** `apps/pms/src/pages/cafe/order/[tableId].tsx:315`
- **Symptom:** `p_food_credit_paise: 0` is hard-coded. The wallet tab is a "coming soon" placeholder.
- **Effect:** No order placed by a customer ever debits a wallet, regardless of their balance.
- **Fix sketch:** Add a credit-redeem UI in the Cart tab (visible only when the logged-in user has a wallet). Show balance, allow opting in up to min(balance, cart subtotal). Pass that paise value to the RPC.
- **Pairs with:** B2 (staff side), B10.

### 🟥 B2 — Staff "New Order" dialog bypasses `place_cafe_order` RPC
- **Where:** `apps/pms/src/components/cafe/CreateOrderDialog.tsx:120-190`
- **Symptoms:**
  - (a) Direct `cafe_orders` + `cafe_order_items` inserts instead of calling the RPC.
  - (b) Lines 51-52: menu fetch has **no `propertyId` filter** → dropdown lists items from both properties, and a chosen `menu_item_id` may belong to the OTHER property than the order's `property_id`.
  - (c) No `customer_phone` field → no way to look up a wallet for zo_card payment.
  - (d) No food-credit amount input → `food_credit_applied_paise` is never set even when `payment_mode='zo_card'` is chosen.
  - (e) Lines 129-137: read-last-then-add-one on `display_number` is a race; `.single()` throws PGRST116 when zero orders exist.
  - (f) Lines 145-179: two-phase insert (order then items) is non-atomic — failure midway leaves an orphan order row.
- **Effect:** Wallets are never debited when staff records a zo_card payment. Cross-property item leakage breaks inventory + analytics. Concurrent orders collide on display_number.
- **Fix sketch:** Replace the direct inserts with `supabase.rpc('place_cafe_order', { ... })`. Add a phone field; when it matches a wallet, show balance and a credit-amount input. Filter menu fetch by `propertyId`.

### 🟧 B3 — Menu update + toggleAvailability don't cascade across properties
- **Where:** `apps/pms/src/hooks/cafe/useCafeMenu.ts:149-156` (`updateItem`), `209-216` (`toggleAvailability`)
- **Symptoms:** Both update only the row whose id was passed. `createItem` and `deleteItem` correctly cascade across same-named categories in all properties. The hook also dedupes by lowercase name (`73-80`) which *hides* the resulting drift from admins.
- **Effect:** Marking "Masala Dosa" unavailable in the admin removes it from BLR's customer page but keeps it available on WTF's — and no one sees the inconsistency because of the dedup.
- **Fix sketch:** Make `updateItem` and `toggleAvailability` look up all sibling rows (same name across matching-name categories) and update them in one query. Drop the name-based dedup once cascade is correct; rely on `propertyId` filter for property-scoped views and a server-side `DISTINCT ON (name)` for the standardised view.

### 🟧 B4 — Customer Orders tab leaks across customers
- **Where:** `apps/pms/src/pages/cafe/order/[tableId].tsx:235-242`
- **Symptom:** Orders are filtered only by `table_id`, no per-user filter, no date filter. A new customer scanning the same QR sees the previous customer's `customer_name` / `customer_phone` and full order history.
- **Effect:** Privacy leak + cluttered Orders tab.
- **Fix sketch:** When logged in, filter `eq('zo_user_id', user.id)` (the RPC already writes this). When logged out, fall back to `eq('table_id', tableId).gte('created_at', startOfToday)`.

### 🟧 B5 — Customer page polls cafe_orders every 5s, no visibility pause
- **Where:** `apps/pms/src/pages/cafe/order/[tableId].tsx:244-250`
- **Symptom:** `setInterval(fetchOrders, 5000)` runs forever, including when the tab is hidden, including from every customer device.
- **Effect:** Battery + bandwidth waste; Supabase quota strain proportional to concurrent customers.
- **Fix sketch:** Swap for a Supabase realtime channel filtered by `table_id` (or `zo_user_id` once B4 is in). Keep a minimum 60s safety poll for connection-loss resilience, and gate it on `document.visibilityState === 'visible'`.

### 🟧 B6 — `advanceStatus` race / inventory + credit debit ordering
- **Where:** `apps/pms/src/hooks/cafe/useCafeRealtimeOrders.ts:186-235`
- **Symptom:** On accept, the optimistic UI update fires before the DB write; if the write fails the local state reverts, but the inventory and credit debit jobs are dispatched whether or not the second write that follows succeeds. The credit-debit call is also currently dead code (always 0 paise, see B1, B2). And the kitchen `advanceStatus` writes via direct `.update()` instead of an RPC, so we can't enforce monotonic state transitions server-side.
- **Effect:** After B1/B2 fixes, a stale tab could double-advance an order, or skip a transition.
- **Fix sketch:** Introduce a SECURITY DEFINER RPC `advance_kitchen_status(p_order_id, p_expected_status)` that asserts current status matches before updating. Debit credits/inventory inside the RPC's transaction.

### 🟨 B7 — `useCafeOrders` N+1 queries
- **Where:** `apps/pms/src/hooks/cafe/useCafeOrders.ts:61-83`
- **Symptom:** For each order, runs separate queries for items and table. 25 orders/page → 50+ round-trips.
- **Fix sketch:** Replace with a single joined query: `.select('*, order_items:cafe_order_items(*), table:cafe_tables(code,label)')`. Same fix applies to `useCafeRealtimeOrders.fetchAllOrders` (`18-39`, `46-87`).

### 🟨 B8 — `display_number` race + `.single()` crash on empty
- **Where:** `apps/pms/src/components/cafe/CreateOrderDialog.tsx:129-137`
- **Symptom:** Two concurrent staff orders read the same last-number and both add 1. `.single()` raises PGRST116 when the property has zero orders.
- **Fix sketch:** Goes away once B2 is fixed — `place_cafe_order` assigns `display_number` atomically via a sequence-or-CTE pattern (see migration 20260517).

### 🟨 B9 — `useFoodCredits.fetchStats` pulls every transaction row
- **Where:** `apps/pms/src/hooks/cafe/useFoodCredits.ts:41-54`
- **Symptom:** `select('type, amount')` with no aggregation/pagination — payload grows linearly with txn count.
- **Fix sketch:** Create a Postgres view `food_credit_summary` (sum by type, sum of balances) and select from it. Same for `fetchRecent`'s 20-row pull — already paginated, fine.

### 🟨 B10 — Wallet placeholder copy on customer page misleads
- **Where:** `apps/pms/src/pages/cafe/order/[tableId].tsx:922-951`
- **Symptom:** Wallet tab says "Zo Card prepaid wallet — coming soon" and "ZoPassport integration coming soon" but a working `food_credit_wallets` table exists today.
- **Fix sketch:** After B1, the tab becomes the actual wallet view (balance, recent spends, opt-in toggle).

### Also note (lower-priority hygiene)
- Inconsistent error UX between customer page (`alert()`) and admin pages (antd `message`). Standardise.
- Dialog uses raw `<input>` for notes (`CreateOrderDialog.tsx:343`) while everything else is antd `<Input>` — visual inconsistency.

---

## 3. Fix plan

Order matters: fix B2 first because it unblocks A2/A5 verification and makes the credit ledger writable. Then B1 (customer side). Then the cascade fix B3. Then customer-page hardening B4/B5. Performance and cleanup after.

### Phase 1 — Stop the money leak (RPC funnelling)
1. **B2:** Rewrite `CreateOrderDialog` to call `place_cafe_order` RPC.
   - Add `customer_phone` input. When phone matches a wallet, render a "$food balance: N" line plus a "Apply $food" number input (0..min(balance, subtotal)).
   - Filter `cafe_menu_items` and `cafe_menu_categories` by `propertyId`.
   - Pass `p_food_credit_paise = appliedCreditRupees * 100`, `p_customer_phone`, `p_customer_name`, `p_zo_user_id = null` (staff entry), `p_items`, `p_payment_mode`.
   - Remove the local `display_number` lookup, GST math, and direct inserts.
   - Files touched: `apps/pms/src/components/cafe/CreateOrderDialog.tsx`.
2. **B1 + B10:** Add credit UI to customer page.
   - On login, in `useEffect`, fetch wallet by `normalizePhone(user.mobile_number)`. Stash balance.
   - In Cart tab, show a "Apply $food (you have N)" toggle that opens an InputNumber (0..min(balance, totalAmount/100)).
   - Replace the placeholder wallet tab with the real wallet view (balance, last 20 transactions filtered by `wallet_id`).
   - Pass `p_food_credit_paise = appliedRupees * 100` to the RPC.
   - Files touched: `apps/pms/src/pages/cafe/order/[tableId].tsx`.

### Phase 2 — Standardisation cascade (no more menu drift)
3. **B3:** Cascade `updateItem` + `toggleAvailability` across same-named siblings.
   - Mirror the logic already in `deleteItem` (look up name → matching-name categories across properties → update all sibling rows).
   - Drop the dedup in `fetchData` once cascade is confirmed.
   - Files touched: `apps/pms/src/hooks/cafe/useCafeMenu.ts`.

### Phase 3 — Customer page hardening
4. **B4:** Filter customer Orders tab by user (when logged in) or by today's date (logged-out, on-table view).
   - Files touched: `apps/pms/src/pages/cafe/order/[tableId].tsx` (`fetchOrders`).
5. **B5:** Replace 5s polling with Supabase realtime channel on `cafe_orders` filtered by `zo_user_id` or `table_id`. Gate any fallback poll on `document.visibilityState === 'visible'`.
   - Files touched: `apps/pms/src/pages/cafe/order/[tableId].tsx`.

### Phase 4 — Server-side correctness for kitchen ops
6. **B6:** Add SECURITY DEFINER RPC `advance_kitchen_status(p_order_id, p_expected_status)` with an assertion, and switch `useCafeRealtimeOrders.advanceStatus` to it. Move credit/inventory side-effects inside the RPC's transaction (call `debit_food_credits` from SQL).
   - Files touched: `supabase/migrations/2026XXXX_advance_kitchen_status.sql` (new), `apps/pms/src/hooks/cafe/useCafeRealtimeOrders.ts`, `apps/pms/src/lib/cafe/food-credit-debit.ts` (delete now-dead client-side calls).

### Phase 5 — Performance + cleanup
7. **B7:** Joined query in `useCafeOrders` + `useCafeRealtimeOrders.fetchAllOrders`.
   - Files touched: those two hooks.
8. **B9:** Add a Postgres view `food_credit_summary`, point `useFoodCredits.fetchStats` at it.
   - Files touched: `supabase/migrations/2026XXXX_food_credit_summary_view.sql` (new), `apps/pms/src/hooks/cafe/useFoodCredits.ts`.
9. Hygiene: standardise error UX (replace `alert()` with the same toast component), swap raw `<input>` for antd `<Input>` in `CreateOrderDialog`.

### Phase 6 — Build + manual smoke
- `npx nx build pms` must pass after every phase.
- After Phases 1-2, run the **smoke tests in section 1** for paths A2b, A3, A8, C1 end-to-end on both properties.
- After Phase 4, re-run A2 and A8 (cancel + restore + double-advance protection).

---

## 4. Post-fix verification

Each row below maps a bug to the exact assertions that must pass after its fix lands. This becomes the regression checklist.

| Bug | Verification |
|-----|--------------|
| B1 | (1) Customer logs in, sees wallet balance on Cart tab. (2) Applies 50 $food on a ₹200 order, places it. (3) `cafe_orders.food_credit_applied_paise = 5000`. (4) `food_credit_wallets.balance` decremented by 50. (5) New `food_credit_transactions` row with type='spend', amount=50, reference_id=<order id>. (6) Cancelling the order restores both balance and a 'refund' txn. |
| B2 | (1) Staff opens dialog, menu dropdown lists ONLY current property's items (count matches `SELECT count(*) FROM cafe_menu_items WHERE property_id=? AND is_available=true`). (2) Phone field accepts 10 digits, balance loads. (3) Submitting creates the order via RPC (verify by SQL: `payment_mode`, `food_credit_applied_paise`, `tax_amount`, `display_number` all set correctly). (4) Concurrent dialog submissions get distinct display_numbers. (5) Empty-property submission works (no PGRST116). |
| B3 | (1) Toggle availability off in admin → both BLR and WTF customer pages stop showing the item. (2) Edit price → both copies update. (3) Add a category → exists in both properties. (4) Drop dedup hack → admin menu count = sum of property counts ÷ 2 (or use a view to show 1 row per name). |
| B4 | (1) Customer A places an order at table T. (2) Customer A logs out, Customer B scans table T's QR and logs in. (3) Customer B's Orders tab is empty. (4) Customer A logging back in still sees their order. |
| B5 | (1) Open customer page, switch to a different tab. (2) Network panel shows zero `cafe_orders` requests while hidden. (3) New order placed from another device → appears within 2s when the customer tab is foregrounded. |
| B6 | (1) Open two staff browser tabs on the same kitchen board. (2) Both advance the same order at once. (3) Exactly one transition succeeds; the other gets a graceful error. (4) Inventory delta and credit debit each fire exactly once. |
| B7 | (1) Network panel: opening `/cafe/orders` issues ≤3 requests total (orders + counts + tables join), not 50+. (2) Page renders <2s with 25 orders. |
| B8 | Falls out of B2. Re-verify: concurrent staff inserts get distinct numbers via the RPC's atomic assignment. |
| B9 | (1) Open `/cafe/food-credits` with 10k transactions in the DB. (2) Stats card renders <1s. (3) Network panel: stats request returns <5KB (single aggregate row). |
| B10 | Falls out of B1 — verify the wallet tab no longer shows "coming soon". |

---

## 5. Tracking

Tasks are mirrored in the session task list (`TaskList`). One task per phase; each phase's tasks marked completed only when its verification step in section 4 passes.

When this plan is done, update `.claude/docs/teams/cafe-ops.md` with:
- The new pattern: "All order placement funnels through `place_cafe_order` RPC. Direct inserts forbidden."
- The new pattern: "Menu writes must cascade across same-named sibling rows. Pattern lives in `useCafeMenu`."
- The new gotcha: "Customer page filters orders by `zo_user_id` (logged-in) or `(table_id, today)` (logged-out) — never by `table_id` alone."
