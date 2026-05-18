# Cafe Kitchen Inventory Indicator + Override — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-item inventory indicator (green/yellow/red/grey) and "Override & Accept" button to every kitchen-board order card, so chefs see whether they have stock to make each item before accepting, and overridden accepts are flagged for ops reporting.

**Architecture:** Pure-function logic (`inventory-check.ts`) takes an order + a stock/recipe context and returns per-item + card states. A hook (`useInventoryStatus`) fetches stock + recipes once per property and subscribes to Supabase Realtime so card colors recompute live as other orders deduct stock. The kitchen board's `OrderCard` reads the status via `useMemo`, renders dots + summary, and either enables Accept or shows Override & Accept depending on card state. Override paths call a new `acceptWithOverride` hook method that sets a new `cafe_orders.accepted_with_override` boolean.

**Tech Stack:** Next.js (Pages Router) · Supabase (Postgres + Realtime) · TypeScript · Ant Design · Jest (unit tests for pure logic)

**Spec:** `docs/superpowers/specs/2026-05-18-cafe-kitchen-inventory-indicator-design.md`

---

## File Structure

**New files:**
- `supabase/migrations/2026-05-18_cafe_orders_accepted_with_override.sql` — adds the new column
- `apps/pms/src/lib/cafe/unit-conversion.ts` — extracted shared `convertUnit` helper (currently private inside `inventory-deduct.ts`)
- `apps/pms/src/lib/cafe/__tests__/unit-conversion.test.ts` — unit tests for `convertUnit`
- `apps/pms/src/lib/cafe/inventory-check.ts` — pure function `computeOrderInventoryStatus`
- `apps/pms/src/lib/cafe/__tests__/inventory-check.test.ts` — unit tests for the pure logic
- `apps/pms/src/hooks/cafe/useInventoryStatus.ts` — fetches stock + recipes, subscribes to Realtime

**Modified files:**
- `apps/pms/src/types/cafe.ts` — add `accepted_with_override` to `CafeOrder`, add new indicator types
- `apps/pms/src/lib/cafe/inventory-deduct.ts` — import `convertUnit` from the new shared module (no behavior change)
- `apps/pms/src/hooks/cafe/useCafeRealtimeOrders.ts` — add `acceptWithOverride` method
- `apps/pms/src/components/cafe/KitchenBoard.tsx` — call `useInventoryStatus`, pass context to OrderCard, render dots + summary + conditional Override button

---

## Task 1: Schema migration — add `accepted_with_override` column

**Files:**
- Create: `supabase/migrations/2026-05-18_cafe_orders_accepted_with_override.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 2026-05-18: Track orders accepted via the chef's Override & Accept path.
-- Set to true when the kitchen lacks sufficient stock for at least one
-- ingredient at accept time but the chef chooses to accept anyway.
-- Used for ops reporting (chronic understock detection).

ALTER TABLE cafe_orders
ADD COLUMN accepted_with_override boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN cafe_orders.accepted_with_override IS
  'true when the chef accepted this order via Override & Accept (insufficient stock at accept time). Defaults to false. Used for ops reporting only.';
```

- [ ] **Step 2: Apply the migration via Supabase CLI**

```bash
npx supabase migration up
```

Expected: migration runs and prints `Applying migration 2026-05-18_cafe_orders_accepted_with_override.sql...`. If the Supabase CLI isn't linked locally, apply via the Supabase Dashboard SQL editor by pasting the SQL above.

- [ ] **Step 3: Verify column exists**

In Supabase Dashboard SQL editor:
```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'cafe_orders' AND column_name = 'accepted_with_override';
```

Expected: one row, `boolean`, `false`, `NO`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/2026-05-18_cafe_orders_accepted_with_override.sql
git commit -m "feat(cafe): add cafe_orders.accepted_with_override column"
```

---

## Task 2: Update TypeScript types

**Files:**
- Modify: `apps/pms/src/types/cafe.ts`

- [ ] **Step 1: Add the new field to `CafeOrder`**

Find the `CafeOrder` interface in `apps/pms/src/types/cafe.ts`. Add this field to the interface (anywhere, but next to other accept-related fields if any):

```ts
export interface CafeOrder {
  // ... existing fields ...
  /** true when the chef accepted via Override & Accept (insufficient stock at accept time). Used for ops reporting only. */
  accepted_with_override: boolean
}
```

- [ ] **Step 2: Add indicator types at the bottom of the file**

Append to `apps/pms/src/types/cafe.ts`:

```ts
// ---------------------------------------------------------------------------
// Kitchen-card inventory indicator (see docs/superpowers/specs/2026-05-18-...)
// ---------------------------------------------------------------------------

/** Inventory state for a single order item or for an order overall. */
export type InventoryItemState = 'green' | 'yellow' | 'red' | 'grey'

/** Why an item is in the 'grey' (can't-compute) state. */
export type GreyReason = 'no_recipe' | 'unit_mismatch'

export interface OrderItemInventoryStatus {
  orderItemId: string
  menuItemId: string
  menuItemName: string
  state: InventoryItemState
  /** Set only when state === 'grey'. */
  greyReason?: GreyReason
  /** Set only when state === 'yellow' or 'red'. The ingredient driving the state. */
  worstIngredient?: {
    name: string
    needed: number
    available: number
    unit: IngredientUnit
  }
}

export interface OrderInventoryStatus {
  /** Card-level state. Worst of items' red/yellow/green, ignoring grey items unless all are grey. */
  cardState: InventoryItemState
  items: OrderItemInventoryStatus[]
  /** Human-readable summary line shown below the items on the card. */
  summary: string
}

/** Context passed to computeOrderInventoryStatus. Built by useInventoryStatus. */
export interface InventoryStatusContext {
  /** ingredient_id → current_stock (in the ingredient's stock unit) */
  stockMap: Map<string, number>
  /** ingredient_id → { name, unit (stock unit) } */
  ingredientMap: Map<string, { name: string; unit: IngredientUnit }>
  /** menu_item_id → list of recipe rows */
  recipeMap: Map<string, RecipeRow[]>
}

export interface RecipeRow {
  ingredientId: string
  quantity: number
  unit: IngredientUnit
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit -p apps/pms/tsconfig.json
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/pms/src/types/cafe.ts
git commit -m "feat(cafe): add inventory indicator types + accepted_with_override field"
```

---

## Task 3: Extract `convertUnit` to a shared module

The `convertUnit` function is currently private inside `inventory-deduct.ts`. Extract it so `inventory-check.ts` can reuse it without duplication.

**Files:**
- Create: `apps/pms/src/lib/cafe/unit-conversion.ts`
- Create: `apps/pms/src/lib/cafe/__tests__/unit-conversion.test.ts`
- Modify: `apps/pms/src/lib/cafe/inventory-deduct.ts:9-54` (remove the local `convertUnit`, replace with import)

- [ ] **Step 1: Write the test file first**

Create `apps/pms/src/lib/cafe/__tests__/unit-conversion.test.ts`:

```ts
import { convertUnit } from '../unit-conversion'

describe('convertUnit', () => {
  it('returns the amount unchanged when units are identical', () => {
    expect(convertUnit(100, 'g', 'g')).toBe(100)
    expect(convertUnit(2, 'pieces', 'pieces')).toBe(2)
  })

  it('converts grams to kilograms', () => {
    expect(convertUnit(1000, 'g', 'kg')).toBe(1)
    expect(convertUnit(250, 'g', 'kg')).toBe(0.25)
  })

  it('converts kilograms to grams', () => {
    expect(convertUnit(1, 'kg', 'g')).toBe(1000)
  })

  it('converts milliliters to liters', () => {
    expect(convertUnit(500, 'ml', 'liter')).toBe(0.5)
  })

  it('converts tsp/tbsp/cups to ml-based units', () => {
    expect(convertUnit(1, 'tsp', 'ml')).toBe(5)
    expect(convertUnit(1, 'tbsp', 'ml')).toBe(15)
    expect(convertUnit(1, 'cups', 'ml')).toBe(240)
  })

  it('treats pieces and slice as interchangeable countables', () => {
    expect(convertUnit(2, 'pieces', 'slice')).toBe(2)
    expect(convertUnit(3, 'slice', 'pieces')).toBe(3)
  })

  it('returns null when units are incompatible (weight ↔ countable)', () => {
    expect(convertUnit(100, 'g', 'pieces')).toBeNull()
    expect(convertUnit(1, 'pieces', 'kg')).toBeNull()
  })

  it('returns null when units are incompatible (weight ↔ volume)', () => {
    expect(convertUnit(100, 'g', 'ml')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npx nx test pms --testPathPattern=unit-conversion
```

Expected: FAIL with `Cannot find module '../unit-conversion'`.

- [ ] **Step 3: Create the shared module**

Create `apps/pms/src/lib/cafe/unit-conversion.ts`:

```ts
import type { IngredientUnit } from '../../types/cafe'

/**
 * Convert a quantity from one unit to another.
 * Recipes use small units (g, ml), stock uses large units (kg, liter).
 * Returns the amount in stockUnit, or null if units are incompatible.
 *
 * Extracted from inventory-deduct.ts so inventory-check.ts can reuse it
 * without duplication.
 */
export function convertUnit(
  amount: number,
  recipeUnit: IngredientUnit,
  stockUnit: IngredientUnit,
): number | null {
  if (recipeUnit === stockUnit) return amount

  const toGrams: Partial<Record<IngredientUnit, number>> = {
    g: 1,
    kg: 1000,
  }
  if (toGrams[recipeUnit] != null && toGrams[stockUnit] != null) {
    return (amount * toGrams[recipeUnit]!) / toGrams[stockUnit]!
  }

  const toMl: Partial<Record<IngredientUnit, number>> = {
    ml: 1,
    liter: 1000,
    tsp: 5,
    tbsp: 15,
    cups: 240,
  }
  if (toMl[recipeUnit] != null && toMl[stockUnit] != null) {
    return (amount * toMl[recipeUnit]!) / toMl[stockUnit]!
  }

  const countable: IngredientUnit[] = ['pieces', 'slice']
  if (countable.includes(recipeUnit) && countable.includes(stockUnit)) {
    return amount
  }

  return null
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
npx nx test pms --testPathPattern=unit-conversion
```

Expected: PASS, all 8 test cases green.

- [ ] **Step 5: Update `inventory-deduct.ts` to use the shared `convertUnit`**

In `apps/pms/src/lib/cafe/inventory-deduct.ts`:

1. Replace the import line at the top:

```ts
// Before:
import { supabase } from '../../configs/supabase'
import type { IngredientUnit } from '../../types/cafe'

// After:
import { supabase } from '../../configs/supabase'
import type { IngredientUnit } from '../../types/cafe'
import { convertUnit } from './unit-conversion'
```

2. Delete the entire local `convertUnit` function (lines roughly 9-54, the `function convertUnit(...)` block). Leave the rest of the file unchanged.

- [ ] **Step 6: Type-check + re-run tests**

```bash
npx tsc --noEmit -p apps/pms/tsconfig.json
npx nx test pms --testPathPattern=unit-conversion
```

Expected: typecheck clean. All 8 unit-conversion tests still pass.

- [ ] **Step 7: Commit**

```bash
git add apps/pms/src/lib/cafe/unit-conversion.ts \
        apps/pms/src/lib/cafe/__tests__/unit-conversion.test.ts \
        apps/pms/src/lib/cafe/inventory-deduct.ts
git commit -m "refactor(cafe): extract convertUnit to shared unit-conversion.ts + tests"
```

---

## Task 4: Pure inventory-check logic

**Files:**
- Create: `apps/pms/src/lib/cafe/inventory-check.ts`
- Create: `apps/pms/src/lib/cafe/__tests__/inventory-check.test.ts`

- [ ] **Step 1: Write the test file first**

Create `apps/pms/src/lib/cafe/__tests__/inventory-check.test.ts`:

```ts
import { computeOrderInventoryStatus } from '../inventory-check'
import type {
  CafeOrderWithItems,
  InventoryStatusContext,
} from '../../../types/cafe'

function makeCtx(opts: {
  stock?: Record<string, number>
  ingredients?: Record<string, { name: string; unit: string }>
  recipes?: Record<string, Array<{ ingredientId: string; quantity: number; unit: string }>>
}): InventoryStatusContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {
    stockMap: new Map(Object.entries(opts.stock || {})),
    ingredientMap: new Map(Object.entries(opts.ingredients || {})) as any,
    recipeMap: new Map(Object.entries(opts.recipes || {})) as any,
  }
}

function makeOrder(items: Array<{ id: string; menuItemId: string; name: string; qty: number }>): CafeOrderWithItems {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {
    id: 'order-1',
    order_items: items.map((i) => ({
      id: i.id,
      menu_item_id: i.menuItemId,
      name: i.name,
      quantity: i.qty,
      item_status: 'active',
    })),
  } as any
}

describe('computeOrderInventoryStatus', () => {
  it('returns green when every ingredient has enough stock', () => {
    const order = makeOrder([{ id: 'oi-1', menuItemId: 'mi-1', name: 'Pancakes', qty: 1 }])
    const ctx = makeCtx({
      stock: { 'ing-flour': 500 },
      ingredients: { 'ing-flour': { name: 'Flour', unit: 'g' } },
      recipes: { 'mi-1': [{ ingredientId: 'ing-flour', quantity: 100, unit: 'g' }] },
    })

    const result = computeOrderInventoryStatus(order, ctx)
    expect(result.cardState).toBe('green')
    expect(result.items[0].state).toBe('green')
    expect(result.summary).toMatch(/all ingredients/i)
  })

  it('returns yellow when stock is positive but less than needed', () => {
    const order = makeOrder([{ id: 'oi-1', menuItemId: 'mi-1', name: 'Pancakes', qty: 1 }])
    const ctx = makeCtx({
      stock: { 'ing-flour': 50 },
      ingredients: { 'ing-flour': { name: 'Flour', unit: 'g' } },
      recipes: { 'mi-1': [{ ingredientId: 'ing-flour', quantity: 100, unit: 'g' }] },
    })

    const result = computeOrderInventoryStatus(order, ctx)
    expect(result.cardState).toBe('yellow')
    expect(result.items[0].state).toBe('yellow')
    expect(result.items[0].worstIngredient).toEqual({
      name: 'Flour', needed: 100, available: 50, unit: 'g',
    })
    expect(result.summary).toContain('Flour')
  })

  it('returns red when stock is zero', () => {
    const order = makeOrder([{ id: 'oi-1', menuItemId: 'mi-1', name: 'Eggs Benedict', qty: 1 }])
    const ctx = makeCtx({
      stock: { 'ing-eggs': 0 },
      ingredients: { 'ing-eggs': { name: 'Eggs', unit: 'pieces' } },
      recipes: { 'mi-1': [{ ingredientId: 'ing-eggs', quantity: 4, unit: 'pieces' }] },
    })

    const result = computeOrderInventoryStatus(order, ctx)
    expect(result.cardState).toBe('red')
    expect(result.items[0].state).toBe('red')
    expect(result.summary).toContain('Eggs')
  })

  it('returns red when stock row is missing entirely', () => {
    const order = makeOrder([{ id: 'oi-1', menuItemId: 'mi-1', name: 'Eggs Benedict', qty: 1 }])
    const ctx = makeCtx({
      stock: {}, // no row for ing-eggs
      ingredients: { 'ing-eggs': { name: 'Eggs', unit: 'pieces' } },
      recipes: { 'mi-1': [{ ingredientId: 'ing-eggs', quantity: 4, unit: 'pieces' }] },
    })

    expect(computeOrderInventoryStatus(order, ctx).cardState).toBe('red')
  })

  it('returns grey with reason=no_recipe when the item has no recipe', () => {
    const order = makeOrder([{ id: 'oi-1', menuItemId: 'mi-1', name: 'Mystery Item', qty: 1 }])
    const ctx = makeCtx({
      stock: {},
      ingredients: {},
      recipes: {}, // no recipe for mi-1
    })

    const result = computeOrderInventoryStatus(order, ctx)
    expect(result.items[0].state).toBe('grey')
    expect(result.items[0].greyReason).toBe('no_recipe')
    expect(result.cardState).toBe('grey')
  })

  it('returns grey with reason=unit_mismatch when units are incompatible', () => {
    const order = makeOrder([{ id: 'oi-1', menuItemId: 'mi-1', name: 'Weird Recipe', qty: 1 }])
    const ctx = makeCtx({
      stock: { 'ing-eggs': 10 },
      ingredients: { 'ing-eggs': { name: 'Eggs', unit: 'pieces' } },
      recipes: { 'mi-1': [{ ingredientId: 'ing-eggs', quantity: 100, unit: 'g' }] }, // g → pieces incompatible
    })

    const result = computeOrderInventoryStatus(order, ctx)
    expect(result.items[0].state).toBe('grey')
    expect(result.items[0].greyReason).toBe('unit_mismatch')
  })

  it('uses recipe_qty × order_qty when computing need', () => {
    const order = makeOrder([{ id: 'oi-1', menuItemId: 'mi-1', name: 'Pancakes', qty: 3 }])
    const ctx = makeCtx({
      stock: { 'ing-flour': 250 },
      ingredients: { 'ing-flour': { name: 'Flour', unit: 'g' } },
      recipes: { 'mi-1': [{ ingredientId: 'ing-flour', quantity: 100, unit: 'g' }] }, // need 300g for qty=3
    })

    const result = computeOrderInventoryStatus(order, ctx)
    expect(result.cardState).toBe('yellow')
    expect(result.items[0].worstIngredient?.needed).toBe(300)
    expect(result.items[0].worstIngredient?.available).toBe(250)
  })

  it('returns the worst state across items (red beats yellow beats green)', () => {
    const order = makeOrder([
      { id: 'oi-1', menuItemId: 'mi-green', name: 'Coffee', qty: 1 },
      { id: 'oi-2', menuItemId: 'mi-yellow', name: 'Pancakes', qty: 1 },
      { id: 'oi-3', menuItemId: 'mi-red', name: 'Eggs Benedict', qty: 1 },
    ])
    const ctx = makeCtx({
      stock: { 'ing-coffee': 1000, 'ing-flour': 50, 'ing-eggs': 0 },
      ingredients: {
        'ing-coffee': { name: 'Coffee', unit: 'g' },
        'ing-flour':  { name: 'Flour',  unit: 'g' },
        'ing-eggs':   { name: 'Eggs',   unit: 'pieces' },
      },
      recipes: {
        'mi-green':  [{ ingredientId: 'ing-coffee', quantity: 20,  unit: 'g' }],
        'mi-yellow': [{ ingredientId: 'ing-flour',  quantity: 100, unit: 'g' }],
        'mi-red':    [{ ingredientId: 'ing-eggs',   quantity: 4,   unit: 'pieces' }],
      },
    })

    const result = computeOrderInventoryStatus(order, ctx)
    expect(result.cardState).toBe('red')
    expect(result.summary).toContain('Eggs')
  })

  it('returns green when remaining items are green and only grey items are mixed in', () => {
    const order = makeOrder([
      { id: 'oi-1', menuItemId: 'mi-green', name: 'Coffee', qty: 1 },
      { id: 'oi-2', menuItemId: 'mi-norec', name: 'Mystery', qty: 1 },
    ])
    const ctx = makeCtx({
      stock: { 'ing-coffee': 1000 },
      ingredients: { 'ing-coffee': { name: 'Coffee', unit: 'g' } },
      recipes: { 'mi-green': [{ ingredientId: 'ing-coffee', quantity: 20, unit: 'g' }] },
    })

    const result = computeOrderInventoryStatus(order, ctx)
    expect(result.cardState).toBe('green')
    expect(result.items[0].state).toBe('green')
    expect(result.items[1].state).toBe('grey')
    expect(result.items[1].greyReason).toBe('no_recipe')
  })

  it('returns grey when ALL items are grey', () => {
    const order = makeOrder([
      { id: 'oi-1', menuItemId: 'mi-norec-1', name: 'Item A', qty: 1 },
      { id: 'oi-2', menuItemId: 'mi-norec-2', name: 'Item B', qty: 1 },
    ])
    const ctx = makeCtx({ stock: {}, ingredients: {}, recipes: {} })

    expect(computeOrderInventoryStatus(order, ctx).cardState).toBe('grey')
  })

  it('ignores cancelled order items when computing state', () => {
    const order: CafeOrderWithItems = {
      id: 'order-1',
      order_items: [
        { id: 'oi-1', menu_item_id: 'mi-red', name: 'Eggs', quantity: 1, item_status: 'cancelled' },
        { id: 'oi-2', menu_item_id: 'mi-green', name: 'Coffee', quantity: 1, item_status: 'active' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any,
    } as any
    const ctx = makeCtx({
      stock: { 'ing-coffee': 1000, 'ing-eggs': 0 },
      ingredients: {
        'ing-coffee': { name: 'Coffee', unit: 'g' },
        'ing-eggs':   { name: 'Eggs',   unit: 'pieces' },
      },
      recipes: {
        'mi-red':   [{ ingredientId: 'ing-eggs',   quantity: 4,  unit: 'pieces' }],
        'mi-green': [{ ingredientId: 'ing-coffee', quantity: 20, unit: 'g' }],
      },
    })

    // Eggs item is cancelled — should not affect card state
    expect(computeOrderInventoryStatus(order, ctx).cardState).toBe('green')
  })

  it('picks the worst ingredient when a recipe has multiple ingredients', () => {
    const order = makeOrder([{ id: 'oi-1', menuItemId: 'mi-1', name: 'Burger', qty: 1 }])
    const ctx = makeCtx({
      stock: { 'ing-bun': 100, 'ing-patty': 0, 'ing-cheese': 50 },
      ingredients: {
        'ing-bun':    { name: 'Bun',    unit: 'pieces' },
        'ing-patty':  { name: 'Patty',  unit: 'pieces' },
        'ing-cheese': { name: 'Cheese', unit: 'g' },
      },
      recipes: {
        'mi-1': [
          { ingredientId: 'ing-bun',    quantity: 1,  unit: 'pieces' },
          { ingredientId: 'ing-patty',  quantity: 1,  unit: 'pieces' },
          { ingredientId: 'ing-cheese', quantity: 30, unit: 'g' },
        ],
      },
    })

    const result = computeOrderInventoryStatus(order, ctx)
    expect(result.cardState).toBe('red')
    expect(result.items[0].worstIngredient?.name).toBe('Patty')
  })
})
```

- [ ] **Step 2: Run the tests — expect them all to fail**

```bash
npx nx test pms --testPathPattern=inventory-check
```

Expected: FAIL with `Cannot find module '../inventory-check'`.

- [ ] **Step 3: Implement `inventory-check.ts`**

Create `apps/pms/src/lib/cafe/inventory-check.ts`:

```ts
import type {
  CafeOrderWithItems,
  IngredientUnit,
  InventoryItemState,
  InventoryStatusContext,
  OrderInventoryStatus,
  OrderItemInventoryStatus,
} from '../../types/cafe'
import { convertUnit } from './unit-conversion'

const STATE_ORDER: Record<InventoryItemState, number> = {
  green: 0,
  yellow: 1,
  red: 2,
  grey: 0, // grey is "can't compute" — doesn't gate accept; ignored unless it's all we have
}

/**
 * Pure function. Given an order + a stock/recipe context, returns the inventory
 * state for each active order item, plus a card-level state and summary line.
 *
 * Rules (from spec 2026-05-18):
 * - green:  available >= needed for every ingredient on this item
 * - yellow: every ingredient has some stock, but at least one has available < needed
 * - red:    at least one ingredient has available == 0 or no stock row
 * - grey:   item has no recipe, OR a recipe ingredient's units don't convert
 *
 * Card state is the worst of items' red/yellow/green. Grey items don't gate;
 * a card is grey only if EVERY item is grey.
 */
export function computeOrderInventoryStatus(
  order: CafeOrderWithItems,
  ctx: InventoryStatusContext,
): OrderInventoryStatus {
  const activeItems = (order.order_items || []).filter(
    (oi) => oi.item_status === 'active',
  )

  const itemStatuses: OrderItemInventoryStatus[] = activeItems.map((oi) =>
    computeItemStatus(oi, ctx),
  )

  // Card state: worst of red/yellow/green among non-grey items. If all grey, grey.
  const nonGrey = itemStatuses.filter((s) => s.state !== 'grey')
  let cardState: InventoryItemState
  if (nonGrey.length === 0) {
    cardState = 'grey'
  } else {
    cardState = nonGrey.reduce<InventoryItemState>((worst, s) => {
      return STATE_ORDER[s.state] > STATE_ORDER[worst] ? s.state : worst
    }, 'green')
  }

  const summary = buildSummary(cardState, itemStatuses)

  return { cardState, items: itemStatuses, summary }
}

function computeItemStatus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orderItem: any,
  ctx: InventoryStatusContext,
): OrderItemInventoryStatus {
  const base = {
    orderItemId: orderItem.id,
    menuItemId: orderItem.menu_item_id,
    menuItemName: orderItem.name,
  }

  const recipe = ctx.recipeMap.get(orderItem.menu_item_id)
  if (!recipe || recipe.length === 0) {
    return { ...base, state: 'grey', greyReason: 'no_recipe' }
  }

  let worst: { state: InventoryItemState; ing?: OrderItemInventoryStatus['worstIngredient'] } = {
    state: 'green',
  }

  for (const r of recipe) {
    const ingredient = ctx.ingredientMap.get(r.ingredientId)
    const stockUnit: IngredientUnit = ingredient?.unit || r.unit
    const needed = convertUnit(r.quantity * orderItem.quantity, r.unit, stockUnit)

    if (needed === null) {
      // Whole item is grey if any of its ingredients has a unit mismatch.
      return { ...base, state: 'grey', greyReason: 'unit_mismatch' }
    }

    const available = ctx.stockMap.get(r.ingredientId) ?? 0
    const ingredientName = ingredient?.name || 'Unknown'

    let state: InventoryItemState
    if (available >= needed) state = 'green'
    else if (available > 0) state = 'yellow'
    else state = 'red'

    if (STATE_ORDER[state] > STATE_ORDER[worst.state]) {
      worst = {
        state,
        ing: { name: ingredientName, needed, available, unit: stockUnit },
      }
    }
  }

  if (worst.state === 'green') {
    return { ...base, state: 'green' }
  }
  return { ...base, state: worst.state, worstIngredient: worst.ing }
}

function buildSummary(
  cardState: InventoryItemState,
  items: OrderItemInventoryStatus[],
): string {
  if (cardState === 'green') return 'All ingredients in stock'
  if (cardState === 'grey') return 'Cannot check stock — recipe missing for some items'

  // Find the item driving the worst state, prefer red over yellow.
  const target =
    items.find((i) => i.state === cardState && i.worstIngredient) ||
    items.find((i) => i.state === cardState)

  if (!target) return ''

  if (target.state === 'grey') {
    return target.greyReason === 'unit_mismatch'
      ? `Cannot check stock for ${target.menuItemName} — recipe units don't match`
      : `Cannot check stock for ${target.menuItemName} — no recipe`
  }

  if (target.worstIngredient) {
    const w = target.worstIngredient
    if (target.state === 'red') {
      return `${target.menuItemName} — out of ${w.name} (${w.available} left, need ${formatQty(w.needed)})`
    }
    return `${target.menuItemName} — only ${formatQty(w.available)}${w.unit} ${w.name} left, need ${formatQty(w.needed)}${w.unit}`
  }

  return ''
}

function formatQty(n: number): string {
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(2).replace(/\.?0+$/, '')
}
```

- [ ] **Step 4: Run the tests — expect them all to pass**

```bash
npx nx test pms --testPathPattern=inventory-check
```

Expected: PASS, all 12 test cases green.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit -p apps/pms/tsconfig.json
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/pms/src/lib/cafe/inventory-check.ts \
        apps/pms/src/lib/cafe/__tests__/inventory-check.test.ts
git commit -m "feat(cafe): pure computeOrderInventoryStatus + unit tests"
```

---

## Task 5: `useInventoryStatus` hook

Fetches stock and recipes for the current property, subscribes to Supabase Realtime so updates flow through automatically.

**Files:**
- Create: `apps/pms/src/hooks/cafe/useInventoryStatus.ts`

- [ ] **Step 1: Create the hook**

Create `apps/pms/src/hooks/cafe/useInventoryStatus.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../configs/supabase'
import type {
  IngredientUnit,
  InventoryStatusContext,
  RecipeRow,
} from '../../types/cafe'

interface UseInventoryStatusResult extends InventoryStatusContext {
  isLoading: boolean
}

const EMPTY_CTX: InventoryStatusContext = {
  stockMap: new Map(),
  ingredientMap: new Map(),
  recipeMap: new Map(),
}

/**
 * Fetches inventory + recipe data for the property and subscribes to Realtime
 * changes on cafe_ingredient_stock so kitchen-card indicators update live as
 * other orders deduct stock.
 *
 * Returns three maps usable by computeOrderInventoryStatus:
 *  - stockMap:      ingredient_id → current_stock (in stock unit)
 *  - ingredientMap: ingredient_id → { name, unit }
 *  - recipeMap:     menu_item_id  → recipe rows
 */
export function useInventoryStatus(
  propertyId: string | null,
): UseInventoryStatusResult {
  const [ctx, setCtx] = useState<InventoryStatusContext>(EMPTY_CTX)
  const [isLoading, setIsLoading] = useState(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchAll = useCallback(async () => {
    if (!propertyId) {
      setCtx(EMPTY_CTX)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      // 1. Ingredients (id, name, stock unit) — fetched globally because
      //    cafe_ingredients isn't per-property; cheap (few hundred rows max).
      const { data: ingredients } = await supabase
        .from('cafe_ingredients')
        .select('id, name, unit')

      const ingredientMap = new Map<string, { name: string; unit: IngredientUnit }>()
      for (const i of ingredients || []) {
        ingredientMap.set(i.id, { name: i.name, unit: i.unit as IngredientUnit })
      }

      // 2. Stock for THIS property only.
      const { data: stock } = await supabase
        .from('cafe_ingredient_stock')
        .select('ingredient_id, current_stock')
        .eq('property_id', propertyId)

      const stockMap = new Map<string, number>()
      for (const s of stock || []) {
        stockMap.set(s.ingredient_id, Number(s.current_stock))
      }

      // 3. All recipes globally — recipes are not per-property, cheap.
      const { data: recipes } = await supabase
        .from('cafe_recipe_items')
        .select('menu_item_id, ingredient_id, quantity, unit')

      const recipeMap = new Map<string, RecipeRow[]>()
      for (const r of recipes || []) {
        const rows = recipeMap.get(r.menu_item_id) || []
        rows.push({
          ingredientId: r.ingredient_id,
          quantity: Number(r.quantity),
          unit: r.unit as IngredientUnit,
        })
        recipeMap.set(r.menu_item_id, rows)
      }

      setCtx({ stockMap, ingredientMap, recipeMap })
    } catch (err) {
      console.error('useInventoryStatus fetch error:', err)
      setCtx(EMPTY_CTX)
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  // Initial + refetch on property change
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Live updates: when cafe_ingredient_stock changes for this property,
  // patch the stockMap in place so visible cards recompute.
  useEffect(() => {
    if (!propertyId) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(`kitchen-inventory-${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cafe_ingredient_stock',
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = (payload.new as any) || (payload.old as any)
          if (!row?.ingredient_id) return
          setCtx((prev) => {
            const next = new Map(prev.stockMap)
            if (payload.eventType === 'DELETE') {
              next.delete(row.ingredient_id)
            } else {
              next.set(row.ingredient_id, Number(row.current_stock))
            }
            return { ...prev, stockMap: next }
          })
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [propertyId])

  return { ...ctx, isLoading }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p apps/pms/tsconfig.json
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pms/src/hooks/cafe/useInventoryStatus.ts
git commit -m "feat(cafe): useInventoryStatus hook with live stock subscription"
```

---

## Task 6: Add `acceptWithOverride` to `useCafeRealtimeOrders`

**Files:**
- Modify: `apps/pms/src/hooks/cafe/useCafeRealtimeOrders.ts`

- [ ] **Step 1: Update the result interface**

In `apps/pms/src/hooks/cafe/useCafeRealtimeOrders.ts`, find the `UseCafeRealtimeOrdersResult` interface (around line 11-16) and add `acceptWithOverride`:

```ts
// Before:
interface UseCafeRealtimeOrdersResult {
  orders: CafeOrderWithItems[]
  isLoading: boolean
  advanceStatus: (orderId: string, currentStatus: KitchenStatus) => Promise<void>
  cancelOrder: (orderId: string) => Promise<void>
}

// After:
interface UseCafeRealtimeOrdersResult {
  orders: CafeOrderWithItems[]
  isLoading: boolean
  advanceStatus: (orderId: string, currentStatus: KitchenStatus) => Promise<void>
  acceptWithOverride: (orderId: string) => Promise<void>
  cancelOrder: (orderId: string) => Promise<void>
}
```

- [ ] **Step 2: Implement `acceptWithOverride` inside the hook**

Inside the `useCafeRealtimeOrders` function body, *after* the `advanceStatus` definition, add this new method:

```ts
const acceptWithOverride = useCallback(async (orderId: string) => {
  // Optimistic UI: same as advanceStatus(orderId, 'new') would do, but we
  // also flip accepted_with_override=true on the row so ops can spot
  // chronic-understock dishes in reporting later.
  setOrders((prev) =>
    prev.map((o) =>
      o.id === orderId
        ? { ...o, kitchen_status: 'accepted', accepted_with_override: true }
        : o,
    ),
  )

  const { error } = await supabase
    .from('cafe_orders')
    .update({ kitchen_status: 'accepted', accepted_with_override: true })
    .eq('id', orderId)

  if (error) {
    console.error('acceptWithOverride error:', error)
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, kitchen_status: 'new', accepted_with_override: false }
          : o,
      ),
    )
    return
  }

  // Same downstream side-effects as a normal Accept: deduct inventory
  // (clamps to 0 when stock is insufficient, which is the whole point of
  // override) and debit food credits.
  const { data: orderRow } = await supabase
    .from('cafe_orders')
    .select('property_id')
    .eq('id', orderId)
    .single()

  if (orderRow?.property_id) {
    deductInventoryForOrder(orderId, orderRow.property_id).catch((err) =>
      console.error('Inventory deduction failed:', err),
    )
  }

  debitFoodCredits(orderId).catch((err) =>
    console.error('Food credit debit failed:', err),
  )
}, [])
```

- [ ] **Step 3: Export it from the hook**

Find the `return` statement at the bottom of `useCafeRealtimeOrders` and add `acceptWithOverride` to the returned object:

```ts
return {
  orders,
  isLoading,
  advanceStatus,
  acceptWithOverride,  // ← new
  cancelOrder,
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit -p apps/pms/tsconfig.json
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/pms/src/hooks/cafe/useCafeRealtimeOrders.ts
git commit -m "feat(cafe): acceptWithOverride method on useCafeRealtimeOrders"
```

---

## Task 7: Indicator UI on the kitchen card (read-only)

Display the dots, item-level rendering, and summary line. **Don't disable Accept or wire override yet** — Task 8 does that. Splitting lets you visually verify the indicator works in isolation.

**Files:**
- Modify: `apps/pms/src/components/cafe/KitchenBoard.tsx`

- [ ] **Step 1: Import the hook and helpers at the top of KitchenBoard.tsx**

Add to the existing imports:

```ts
import { useCafeRealtimeOrders } from '../../hooks/cafe/useCafeRealtimeOrders'
import { useInventoryStatus } from '../../hooks/cafe/useInventoryStatus'
import { computeOrderInventoryStatus } from '../../lib/cafe/inventory-check'
import type { InventoryItemState, OrderInventoryStatus } from '../../types/cafe'
```

(The first import already exists — make sure you don't duplicate it. The other three are new.)

- [ ] **Step 2: Wire the hook into `KitchenBoard`**

Inside the `KitchenBoard` component, right after the existing `useCafeRealtimeOrders` call, add:

```ts
const invCtx = useInventoryStatus(propertyId)
```

- [ ] **Step 3: Pass it through to OrderCard**

Update the `OrderCardProps` interface (find it near the bottom of the file):

```ts
interface OrderCardProps {
  order: CafeOrderWithItems
  onAdvance: (orderId: string, currentStatus: KitchenStatus) => Promise<void>
  onCancel: (orderId: string) => Promise<void>
  onViewDetail?: (order: CafeOrderWithItems) => void
  invCtx: ReturnType<typeof useInventoryStatus>     // ← new
}
```

And in the two places `<OrderCard ... />` is rendered (mobile + desktop blocks), pass `invCtx`:

```tsx
<OrderCard
  key={order.id}
  order={order}
  onAdvance={advanceStatus}
  onCancel={cancelOrder}
  onViewDetail={onViewDetail}
  invCtx={invCtx}                                   // ← new
/>
```

- [ ] **Step 4: Compute the status inside OrderCard and render the indicator**

Inside the `OrderCard` function, near the top (after the existing `status`, `advanceLabel`, `customerLabel`, `tableLabel`, `activeItems` derivations), add:

```ts
const inventoryStatus: OrderInventoryStatus = React.useMemo(
  () => computeOrderInventoryStatus(order, invCtx),
  [order, invCtx],
)

const itemStateByOrderItemId = React.useMemo(() => {
  const m = new Map<string, InventoryItemState>()
  for (const s of inventoryStatus.items) m.set(s.orderItemId, s.state)
  return m
}, [inventoryStatus])
```

(You'll need to make sure `React` is imported as default at the top — the existing code already does `import React, { useState } from 'react'`, so this is fine.)

- [ ] **Step 5: Update the items list to show dots**

Find the items-rendering block inside `OrderCard`:

```tsx
{/* Items list */}
<div style={{ marginBottom: 8 }}>
  {activeItems.map((item) => (
    <div
      key={item.id}
      style={{
        fontSize: 13,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: '1.6',
      }}
    >
      {item.name} &times; {item.quantity}
    </div>
  ))}
</div>
```

Replace it with:

```tsx
{/* Items list with inventory dots */}
<div style={{ marginBottom: 8 }}>
  {activeItems.map((item) => {
    const state = itemStateByOrderItemId.get(item.id) || 'grey'
    return (
      <div
        key={item.id}
        style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.75)',
          lineHeight: '1.6',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
        title={
          state === 'grey'
            ? "Can't check stock for this item"
            : state === 'red'
              ? 'Out of stock for at least one ingredient'
              : state === 'yellow'
                ? 'Stock is running low'
                : 'All ingredients in stock'
        }
      >
        <InventoryDot state={state} />
        <span>{item.name} &times; {item.quantity}</span>
      </div>
    )
  })}
</div>

{/* Summary line — only render if we have something useful to say */}
{inventoryStatus.summary && (
  <div
    style={{
      fontSize: 11,
      padding: '5px 8px',
      borderRadius: 5,
      marginBottom: 8,
      ...SUMMARY_STYLE[inventoryStatus.cardState],
    }}
  >
    {SUMMARY_PREFIX[inventoryStatus.cardState]} {inventoryStatus.summary}
  </div>
)}
```

- [ ] **Step 6: Add the `InventoryDot` component + styles**

At the bottom of `KitchenBoard.tsx` (outside `KitchenBoard` and `OrderCard`), add:

```tsx
const DOT_COLOR: Record<InventoryItemState, string> = {
  green:  '#52c41a',
  yellow: '#faad14',
  red:    '#ff4d4f',
  grey:   '#8c8c8c',
}

const SUMMARY_STYLE: Record<InventoryItemState, React.CSSProperties> = {
  green:  { background: 'rgba(82,196,26,0.10)',  color: '#95df72', border: '1px solid rgba(82,196,26,0.25)' },
  yellow: { background: 'rgba(250,173,20,0.12)', color: '#f5c451', border: '1px solid rgba(250,173,20,0.35)' },
  red:    { background: 'rgba(255,77,79,0.12)',  color: '#ff8585', border: '1px solid rgba(255,77,79,0.35)' },
  grey:   { background: 'rgba(140,140,140,0.10)', color: '#bfbfbf', border: '1px solid rgba(140,140,140,0.25)' },
}

const SUMMARY_PREFIX: Record<InventoryItemState, string> = {
  green:  '✓',
  yellow: '⚠',
  red:    '✕',
  grey:   '⦿',
}

function InventoryDot({ state }: { state: InventoryItemState }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: DOT_COLOR[state],
        flexShrink: 0,
      }}
    />
  )
}
```

- [ ] **Step 7: Type-check + build the app**

```bash
npx tsc --noEmit -p apps/pms/tsconfig.json
npx nx build pms
```

Expected: typecheck clean, build succeeds.

- [ ] **Step 8: Manual smoke check (local)**

Run dev server: `npx nx serve pms`. Open `/cafe/kitchen` for the test property. You should see:

- Each item row prefixed with a colored dot (green = all good, grey = no recipe found, etc.)
- A summary line below the items in the matching color
- Accept button still works normally (no disabling yet — that's Task 8)

If the dots are all grey for every item: it means `cafe_recipe_items` is empty or the property doesn't have a matching `cafe_ingredient_stock` row. That's a data-setup issue, not a bug — flag and move on.

- [ ] **Step 9: Commit**

```bash
git add apps/pms/src/components/cafe/KitchenBoard.tsx
git commit -m "feat(cafe): kitchen-card inventory indicator dots + summary"
```

---

## Task 8: Override button + disable Accept on red state

The final piece. Disables the normal Accept on red-state cards and shows "Override & Accept" instead, with a confirmation modal.

**Files:**
- Modify: `apps/pms/src/components/cafe/KitchenBoard.tsx`

- [ ] **Step 1: Pass `acceptWithOverride` from KitchenBoard to OrderCard**

In `KitchenBoard`, the existing destructuring is:

```ts
const { orders, isLoading, advanceStatus, cancelOrder } = useCafeRealtimeOrders(propertyId)
```

Add `acceptWithOverride`:

```ts
const { orders, isLoading, advanceStatus, acceptWithOverride, cancelOrder } =
  useCafeRealtimeOrders(propertyId)
```

Update `OrderCardProps`:

```ts
interface OrderCardProps {
  order: CafeOrderWithItems
  onAdvance: (orderId: string, currentStatus: KitchenStatus) => Promise<void>
  onCancel: (orderId: string) => Promise<void>
  onOverride: (orderId: string) => Promise<void>   // ← new
  onViewDetail?: (order: CafeOrderWithItems) => void
  invCtx: ReturnType<typeof useInventoryStatus>
}
```

And both `<OrderCard .../>` call sites get `onOverride={acceptWithOverride}`.

- [ ] **Step 2: Import Antd's `Modal` at the top of KitchenBoard.tsx**

The existing import already has Badge, Button, Card, Space, Tag, Typography. Add `Modal`:

```ts
import { Badge, Button, Card, Modal, Space, Tag, Typography } from 'antd'
```

- [ ] **Step 3: Update OrderCard's action row to handle the red state**

Find the existing action-buttons block inside `OrderCard`:

```tsx
{/* Action buttons */}
<div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
  {advanceLabel && (
    <Button
      type="primary"
      size="small"
      style={{ flex: 1 }}
      onClick={(e) => { e.stopPropagation(); onAdvance(order.id, status) }}
    >
      {advanceLabel}
    </Button>
  )}
  <Button
    danger
    size="small"
    type="text"
    onClick={(e) => { e.stopPropagation(); onCancel(order.id) }}
    style={{ fontSize: 11 }}
  >
    Cancel
  </Button>
</div>
```

Replace with:

```tsx
{/* Action buttons */}
<div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
  {advanceLabel && status === 'new' && inventoryStatus.cardState === 'red' ? (
    <>
      <Button
        size="small"
        disabled
        style={{ flex: 1 }}
        title="Out of stock for at least one ingredient — use Override & Accept"
      >
        Accept
      </Button>
      <Button
        size="small"
        style={{
          flex: 1,
          background: 'rgba(250,173,20,0.20)',
          color: '#f5c451',
          border: '1px solid rgba(250,173,20,0.6)',
        }}
        onClick={(e) => {
          e.stopPropagation()
          Modal.confirm({
            title: 'Override & Accept this order?',
            content: inventoryStatus.summary
              ? `${inventoryStatus.summary}. Accepting will deduct what's available and clamp the rest to 0.`
              : "Accepting will deduct what's available and clamp the rest to 0.",
            okText: 'Yes, Override',
            cancelText: 'Cancel',
            onOk: () => onOverride(order.id),
          })
        }}
      >
        Override &amp; Accept
      </Button>
    </>
  ) : (
    advanceLabel && (
      <Button
        type="primary"
        size="small"
        style={{ flex: 1 }}
        onClick={(e) => { e.stopPropagation(); onAdvance(order.id, status) }}
      >
        {advanceLabel}
      </Button>
    )
  )}
  <Button
    danger
    size="small"
    type="text"
    onClick={(e) => { e.stopPropagation(); onCancel(order.id) }}
    style={{ fontSize: 11 }}
  >
    Cancel
  </Button>
</div>
```

The override branch fires only when:
- The order is at the `new` → `accepted` step (`advanceLabel` is truthy and `status === 'new'`)
- The card state is `red`

All other states use the existing Accept path.

- [ ] **Step 4: Type-check + build**

```bash
npx tsc --noEmit -p apps/pms/tsconfig.json
npx nx build pms
```

Expected: typecheck clean, build succeeds.

- [ ] **Step 5: Manual end-to-end smoke check (local)**

Run dev server: `npx nx serve pms`. On `/cafe/kitchen`:

1. Set one ingredient's stock to 0 in the Supabase Dashboard for the test property.
2. Place an order that needs that ingredient. The order card should appear with a red dot on that item and the summary "X — out of Y…"
3. Normal Accept button should be greyed/disabled.
4. Override & Accept appears. Clicking it should open a confirmation modal.
5. Click "Yes, Override" → order moves to Accepted column.
6. In Supabase Dashboard: `SELECT id, accepted_with_override FROM cafe_orders WHERE id = '<order_id>'` — should be `true`.
7. Cancel the override-accepted order. Inventory restoration should still work (PR #115's rule: restored if cancelled from accepted/preparing, not from ready).

- [ ] **Step 6: Commit**

```bash
git add apps/pms/src/components/cafe/KitchenBoard.tsx
git commit -m "feat(cafe): override & accept button for out-of-stock orders"
```

---

## After all tasks: open PR

```bash
git push -u origin <your-branch-name>
gh pr create --title "feat(cafe): kitchen-card inventory indicator + override & accept" \
  --reviewer Samuraizan \
  --body "Implements the design from docs/superpowers/specs/2026-05-18-cafe-kitchen-inventory-indicator-design.md (PR #117).

## What ships

- New cafe_orders.accepted_with_override column (migration in supabase/migrations/)
- New apps/pms/src/lib/cafe/{unit-conversion,inventory-check}.ts (pure logic) with 20 unit tests
- New apps/pms/src/hooks/cafe/useInventoryStatus.ts (live-updating stock+recipe context)
- New acceptWithOverride method on useCafeRealtimeOrders
- KitchenBoard renders per-item dots, summary line, and conditional Override & Accept button

## Test plan

- [ ] Unit tests pass: \`npx nx test pms\`
- [ ] Build passes: \`npx nx build pms\`
- [ ] Manual smoke (see task 7 + 8 steps in the plan): set ingredient stock to 0, place order, verify red dot + override flow + DB flag = true
- [ ] No regression on existing flows (green-state orders behave exactly like before)"
```

---

## Self-review notes (from plan author)

- **Spec coverage:** every section of the design spec (visual states, computation logic, override behavior, schema, data flow, edge cases, file-level breakdown, implementation order) maps to a task above. ✓
- **Type consistency:** `InventoryItemState`, `OrderInventoryStatus`, `OrderItemInventoryStatus`, `InventoryStatusContext`, `RecipeRow` are defined once in `types/cafe.ts` (Task 2) and used unchanged across Tasks 4, 5, 7, 8. ✓
- **No placeholders:** every step shows exact code, exact paths, exact commands. ✓
- **Tests:** pure logic (Tasks 3, 4) has unit tests; hook + UI verified via manual smoke check referencing the test runbook (`docs/superpowers/specs/2026-05-17-cafe-kitchen-inventory-test-runbook.md`).
- **Schema risk:** additive boolean column with default `false` — backward compatible, safe additive migration.
- **Rollout:** each task commits independently; Tasks 1–6 ship working state without UI changes; Task 7 ships visible indicator with no behavior change to Accept; Task 8 adds the override flow last.
