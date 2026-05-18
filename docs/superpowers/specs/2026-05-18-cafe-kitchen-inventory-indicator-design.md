# Cafe Zomad — Kitchen Card "Can I Make This?" Indicator + Override

**Created:** 2026-05-18
**Status:** Design approved by cafe ops, ready for implementation plan
**Owner:** Cafe Ops
**Companion docs:** `docs/superpowers/specs/2026-05-17-cafe-kitchen-inventory-test-runbook.md` (test plan)
**Related PR:** #115 — `fix(cafe): don't restore inventory when cancelling a 'ready' order`

## Summary

Add a per-item inventory indicator and override button to every order card on the kitchen board. The chef sees at a glance whether they can make each item in the order, with the affected ingredients named explicitly when stock is short. Orders that can't be fully made require an explicit override to accept — preventing the chef from accidentally taking work they can't deliver, while still allowing them to override when they have stock the system doesn't know about. Overridden orders are flagged in the database so the operator can see purchasing gaps over time.

## Why we're building it

The inventory deduction already runs on Accept (`inventory-deduct.ts`), but the chef gets zero feedback from it. Items with no recipe deduct nothing silently. Insufficient stock clamps to 0 silently. Unit-mismatch recipes silently skip. The chef has no way to see, before accepting, whether the kitchen actually has the ingredients on hand. The result: orders get accepted that can't be fulfilled, customers wait, and the system has no record that "we ran out of eggs" three times this week.

This feature converts the silent inventory pipeline into a visible decision-support tool. No new auto-blocking — the chef stays in control. The system just makes the situation legible.

## Visual states (approved 2026-05-18)

Each order card shows three pieces of indicator information:

- **Per-item dot** — small colored dot next to each item line in the card
- **Summary line** — one human-readable sentence below the items naming the worst issue
- **Action buttons** — normal `Accept` / disabled `Accept` + `Override & Accept` depending on state

Four states, ranked best to worst:

| State | Dot | Summary | Accept button | Override button |
|---|---|---|---|---|
| **Green** | 🟢 | "All ingredients in stock" | Enabled (normal blue) | hidden |
| **Yellow** | 🟡 | "Pancakes — only 150g flour left, need 200g" | Enabled (normal blue) | hidden |
| **Red** | 🔴 | "Eggs Benedict — out of eggs (0 left, need 8)" | **Disabled (greyed out)** | **Visible (yellow)** |
| **Grey** | ⚪ | "Can't check stock — recipe missing for [item]" or "Can't check stock — recipe units don't match" | Enabled (normal blue) | hidden |

The card's overall state is the worst state across its items, with one nuance: grey is "can't compute," not "definitely bad," so grey items don't gate the Accept button. The ordering for *gating purposes* is:

1. If any item is **red** → card is red (Accept disabled, Override required)
2. Else if any item is **yellow** → card is yellow (Accept enabled, warning shown)
3. Else if any item is **green** and the rest are grey → card is green (Accept enabled, grey dots visible per item)
4. Else (all items grey) → card is grey (Accept enabled)

The summary line always names the worst computable issue (red beats yellow beats green for the summary), and any grey items contribute their own per-item tooltips.

## Computation logic

For each menu item in an order:

1. Look up the item's recipe rows in `cafe_recipe_items` (joins to `cafe_ingredients` for stock unit + name).
2. For each recipe ingredient: compute `needed = recipe_qty × order_item_qty`, converted to the ingredient's stock unit using the same `convertUnit` helper that `inventory-deduct.ts` already uses.
3. Look up `cafe_ingredient_stock.current_stock` for the property × ingredient.
4. Compute the per-ingredient state:
   - `available ≥ needed` → green for this ingredient
   - `0 < available < needed` → yellow
   - `available == 0 OR row missing` → red
   - `convertUnit returns null` → grey (this entire item is grey)
   - If item has no recipe at all → grey (this entire item is grey)
5. The item's state is the worst of its ingredient states.
6. The card's state is the worst of its item states.

The summary line names the *worst-affected* ingredient on the *worst-affected* item, so the chef sees the most actionable info first. Example: "Eggs Benedict — out of eggs (0 left, need 8)" tells them the dish, the ingredient, and the gap.

## Override behavior

When the card state is red:

1. The normal **Accept** button is greyed out (`disabled`, dimmed background). Clicking it does nothing.
2. **Override & Accept** button appears in its place, styled yellow to signal "you're taking a deliberate exception."
3. Clicking it opens a small confirmation:
   > "Some ingredients are out of stock for this order. Accepting will deduct the available stock and clamp the rest to 0. Continue?"
   > [Cancel] [Yes, Override]
4. On confirm, the order advances to `accepted` exactly like a normal Accept — same Supabase update, same `deductInventoryForOrder` call (which already clamps negative stock to 0). The only difference is the new database flag.

## Schema change

One new column on `cafe_orders`:

```sql
ALTER TABLE cafe_orders
ADD COLUMN accepted_with_override boolean NOT NULL DEFAULT false;
```

Migration file: `supabase/migrations/2026-05-18_cafe_orders_accepted_with_override.sql`.

When a chef hits **Override & Accept**, the existing `cafe_orders.kitchen_status = 'accepted'` update also sets `accepted_with_override = true`. No other use of this field in v1 — purely for reporting.

## Reporting

Operator can run this in Supabase Dashboard at month-end to see which items chronically need overrides:

```sql
SELECT
  date_trunc('day', co.created_at) AS day,
  mi.name AS menu_item,
  COUNT(*) AS override_count
FROM cafe_orders co
JOIN cafe_order_items coi ON coi.order_id = co.id
JOIN cafe_menu_items mi ON mi.id = coi.menu_item_id
WHERE co.accepted_with_override = true
  AND co.created_at > now() - interval '30 days'
  AND co.property_id = '<PROPERTY_UUID>'
GROUP BY day, mi.name
ORDER BY day DESC, override_count DESC;
```

A dedicated reporting page is out of scope for v1. The SQL above is the deliverable; if reports get repetitive we can build a UI later.

## Data flow

```
[Kitchen page loads / property selected]
        ↓
[useInventoryStatus(propertyId)]  ← NEW hook
   ├─ Fetches cafe_ingredient_stock for this property
   ├─ Fetches cafe_recipe_items for menu items currently on the board
   └─ Subscribes to Supabase Realtime on:
        - cafe_ingredient_stock (any UPDATE for this property)
        - cafe_recipe_items (any change)
        ↓ returns { stockMap, recipeMap }
[KitchenBoard]
   └─ For each visible order:
        useMemo(() => computeOrderInventoryStatus(order, stockMap, recipeMap))
        ↓ returns { cardState, perItemStates, summaryLine }
[OrderCard]
   └─ Renders dots, summary line, buttons (Accept/Override) per state
        ↓ on Override click
[useCafeRealtimeOrders.acceptWithOverride(orderId)]  ← NEW
   ├─ Same as advanceStatus(orderId, 'new') BUT also sets accepted_with_override = true
   └─ deductInventoryForOrder runs as today (clamps to 0)
```

Live recomputation: when another order's Accept fires and stock drops, all visible cards re-render with new indicator states because they read from the same `stockMap`.

## Files affected

### New files

- `apps/pms/src/lib/cafe/inventory-check.ts`
  Pure function `computeOrderInventoryStatus(order, stockMap, recipeMap) → InventoryStatus`. No I/O. Easy to unit test. Reuses the `convertUnit` helper from `inventory-deduct.ts` (extracted to a shared location if needed).

- `apps/pms/src/hooks/cafe/useInventoryStatus.ts`
  Fetches stock + recipes for the current property, subscribes to Supabase Realtime on `cafe_ingredient_stock`, returns `{ stockMap, recipeMap, isLoading }`. Mirrors the pattern of `useCafeRealtimeOrders`.

- `supabase/migrations/2026-05-18_cafe_orders_accepted_with_override.sql`
  Adds the `accepted_with_override` column.

### Modified files

- `apps/pms/src/types/cafe.ts`
  Add `accepted_with_override: boolean` to the `CafeOrder` interface. Add new `InventoryStatus` and `ItemInventoryStatus` types.

- `apps/pms/src/components/cafe/KitchenBoard.tsx`
  Call `useInventoryStatus(propertyId)`. Pass `stockMap` and `recipeMap` to each `OrderCard`. OrderCard computes its own status via `useMemo`. Add the indicator UI to OrderCard (dots, summary line, conditional Override button).

- `apps/pms/src/hooks/cafe/useCafeRealtimeOrders.ts`
  Add `acceptWithOverride(orderId)` method to the returned interface. Implementation is the same as the existing `advanceStatus(orderId, 'new' → 'accepted')` path but also passes `accepted_with_override: true` in the Supabase update.

### Untouched (intentionally)

- `apps/pms/src/lib/cafe/inventory-deduct.ts` — the deduction logic stays exactly as is. No need to know whether the accept was an override or not; the deduction is the same operation either way.
- `apps/pms/src/pages/cafe/kitchen.tsx` — no changes; it just renders the KitchenBoard.

## Edge cases

| Case | Behavior |
|---|---|
| Order item has no recipe row | Item dot is grey, tooltip says "no recipe configured." Doesn't change card state to red. |
| Recipe row exists but `convertUnit` returns null (e.g., recipe says `g`, ingredient stocked in `pieces`) | Item dot is grey, tooltip says "recipe units don't match stock." |
| Stock row missing entirely (never created at this property) | Treated as `current_stock = 0` for that ingredient → red. |
| All items on order are grey | Card overall state is grey. Accept still enabled. No override flow. |
| Mixed grey + green items | Card state is green for the green items; grey items render with grey dot + tooltip. Accept enabled. |
| Mixed grey + red items | Card state is red. Override required. Grey items don't gate accept on their own. |
| Stock value falls AFTER the order was placed but BEFORE chef accepts (e.g., another order took the last eggs) | Indicator recomputes live. Card may go from green → yellow → red while sitting unaccepted. |
| Chef accepts a green order; while preparing, stock for that ingredient hits 0 via another order | No retroactive change to this card; it's already accepted. Future cards reflect new reality. |
| Overridden order gets cancelled before completing (`accepted → cancelled` or `preparing → cancelled`) | Inventory restores normally (per existing logic + PR #115). The `accepted_with_override` flag stays on the order row regardless — it's history. |
| Two chefs hit accept at the same time on different orders sharing an ingredient | Out of scope per cafe ops decision: one chef per kitchen, one kitchen per property. |

## Testing

Builds on the runbook in `docs/superpowers/specs/2026-05-17-cafe-kitchen-inventory-test-runbook.md`. New test sections to add when that runbook is updated:

- **Indicator color correctness:** for each scenario in the runbook (1, 5, 6 especially), verify the card renders the correct dot colors and summary line.
- **Override button visibility:** in Section 5 (insufficient stock), verify the normal Accept is disabled and the Override button appears. Verify clicking the disabled Accept does nothing.
- **Override flag persistence:** after using Override & Accept, query `SELECT accepted_with_override FROM cafe_orders WHERE id = '<order_id>'` — should be `true`.
- **Live recomputation:** with two orders on the board (both requiring the same ingredient), accept the first → verify the second's indicator recomputes from green → yellow or yellow → red as expected.

## Out of scope for v1

These are reasonable future extensions but not in this design:

- Auto-disabling menu items when an ingredient hits 0 (customer side at `/cafe/order/[tableId]`). Right now customers can still order; chef has to override or cancel.
- A dedicated overrides-report page (the SQL above is the v1 reporting story).
- Surfacing the override flag anywhere in the UI after the fact (e.g., in `/cafe/orders` history). The flag exists in the DB; reading it is a future polish.
- Surfacing the `skipped` deductions from `inventory-deduct.ts` for already-accepted orders (e.g., "this order had a unit-mismatch ingredient that wasn't deducted — restock check needed"). The indicator handles pre-accept visibility, not post-accept reconciliation.

## Implementation order (for the writing-plans phase)

A defensible order to land this in small, reviewable chunks:

1. **Schema migration** — add the `accepted_with_override` column. Standalone, deployable on its own.
2. **Pure logic + types** — `inventory-check.ts` and the new types in `cafe.ts`. Unit-testable in isolation, no UI changes yet.
3. **Hook** — `useInventoryStatus`. Returns the maps. No UI changes yet.
4. **UI: indicator only** — add dots + summary line to `OrderCard`. No override button yet; Accept still works for all states.
5. **UI: override button + accept disabling** — final piece. Wires `acceptWithOverride` through `useCafeRealtimeOrders`.

Each step ships independently and is safe to roll back. The `writing-plans` skill will decompose each into specific tasks.

## Final notes

- The indicator is **decision support, not gatekeeping.** Even in red, the chef can override. The system never blocks the chef — it only makes the constraint visible.
- The grey state is critical: a chef looking at a grey item should know "the system can't help me here; check the recipe / ingredient setup." This is the wedge that surfaces the silent-skip bugs the test runbook is designed to catch.
- The override flag is the smallest possible reporting hook. We can layer richer reporting later (which ingredient was short, which chef, etc.) once we know what's worth tracking.
