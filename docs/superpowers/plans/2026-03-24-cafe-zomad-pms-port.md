# Cafe Zomad PMS Port — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port all 7 Cafe Zomad pages from the zohousecook prototype into the PMS monorepo app, using Ant Design components and direct Supabase calls.

**Architecture:** Pages follow existing PMS patterns — Pages Router, `Page`/`PageHeader`/`PageContent` wrappers, Ant Design components, `useAssociation()` for operator context. Data fetching uses Supabase JS client directly (no API routes needed — the PMS app is frontend-only, all server logic lives in Django or Supabase). Each page is wrapped in `ZoHouseGuard` for route protection.

**Tech Stack:** Next.js 14 (Pages Router), React 18, Ant Design 5, Supabase JS, TypeScript

**Reference codebase:** `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/` — all cafe pages, components, hooks, types, and utilities.

**Operator → Property mapping:** The PMS app uses operator codes (`BNGHO812`, `BNGS531`). Supabase cafe tables use `property_id` UUIDs. A mapping function is needed to bridge these.

---

## File Structure

```
apps/pms/src/
├── configs/
│   ├── zo-house-features.ts          # [EXISTS] Feature gating config
│   ├── supabase.ts                   # [EXISTS] Supabase client
│   └── index.ts                      # [EXISTS] Re-exports
├── types/
│   └── cafe.ts                       # [CREATE] All cafe type definitions
├── lib/
│   └── cafe/
│       ├── operator-map.ts           # [CREATE] Operator code → Supabase property_id mapping
│       ├── order-calculator.ts       # [CREATE] Price formatting (formatPaise)
│       └── kitchen-status.ts         # [CREATE] Status labels, colors, transitions
├── hooks/
│   └── cafe/
│       ├── useCafeAnalytics.ts       # [CREATE] Daily KPIs from Supabase
│       ├── useCafeMenu.ts            # [CREATE] Categories + menu items
│       ├── useCafeOrders.ts          # [CREATE] Order list with filters
│       ├── useCafeRealtimeOrders.ts  # [CREATE] Realtime kitchen board
│       ├── useCafeTables.ts          # [CREATE] Table list
│       ├── useCafeMealPlans.ts       # [CREATE] Meal plan CRUD
│       └── useIngredients.ts         # [CREATE] Inventory + stock
├── components/
│   └── cafe/
│       ├── OperatorPropertyMap.tsx    # [CREATE] Hook to map operator → property
│       ├── KitchenBoard.tsx          # [CREATE] Kanban order board
│       ├── MenuItemForm.tsx          # [CREATE] Add/edit menu item modal
│       ├── CreateOrderDialog.tsx     # [CREATE] Manual order creation
│       ├── OrderDetailModal.tsx      # [CREATE] Order detail view
│       ├── MealPlanCalendar.tsx      # [CREATE] Week calendar for meal plans
│       ├── InventoryTable.tsx        # [CREATE] Stock table with inline editing
│       ├── IngredientForm.tsx        # [CREATE] Add/edit ingredient modal
│       └── TableQRCard.tsx           # [CREATE] Table card with QR download
├── pages/
│   └── cafe/
│       ├── index.tsx                 # [CREATE] Dashboard
│       ├── kitchen.tsx               # [CREATE] Kitchen board
│       ├── menu.tsx                  # [CREATE] Menu editor
│       ├── orders.tsx                # [CREATE] Order history
│       ├── tables.tsx                # [CREATE] Table management
│       ├── meal-plan.tsx             # [CREATE] Meal planning
│       └── inventory.tsx             # [CREATE] Ingredient stock
└── components/helpers/app/
    └── ZoHouseGuard.tsx              # [EXISTS] Route guard
```

---

## Chunk 1: Foundation (Types, Utilities, Operator Mapping)

### Task 1: Create cafe type definitions

**Files:**
- Create: `apps/pms/src/types/cafe.ts`

Port all types from `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/types/cafe.ts`. These are pure TypeScript interfaces — no changes needed for the port.

- [ ] **Step 1: Create the types file**

Copy all interfaces and type aliases from the zohousecook `cafe.ts`. This includes: `CafeProperty`, `MenuCategory`, `MenuItem`, `CustomizationGroup`, `CustomizationOption`, `CafeTable`, `KitchenStatus`, `PaymentStatus`, `PaymentMode`, `OrderMode`, `CafeOrder`, `OrderItem`, `CafeOrderWithItems`, `CreateOrderRequest`, `DailyAnalytics`, `MealPlan`, `MealPlanItem`, `MealPlanWithItems`, `CafeIngredient`, `IngredientStock`, `CafeIngredientWithStock`, and all request/response types.

- [ ] **Step 2: Commit**

```bash
git add apps/pms/src/types/cafe.ts
git commit -m "feat(pms): add cafe type definitions"
```

---

### Task 2: Create utility functions

**Files:**
- Create: `apps/pms/src/lib/cafe/order-calculator.ts`
- Create: `apps/pms/src/lib/cafe/kitchen-status.ts`
- Create: `apps/pms/src/lib/cafe/operator-map.ts`

- [ ] **Step 1: Create order-calculator.ts**

Port `formatPaise()` from zohousecook's `src/lib/cafe/order-calculator.ts`. This formats paise values as rupee strings (e.g., `12500` → `₹125`).

```ts
export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(paise % 100 === 0 ? 0 : 2)}`
}
```

- [ ] **Step 2: Create kitchen-status.ts**

Port kitchen status utilities from zohousecook's `src/lib/cafe/kitchen-status.ts`. Includes status labels, Ant Design tag colors, allowed transitions, and Kanban column definitions.

```ts
import type { KitchenStatus } from '../../types/cafe'

export const STATUS_LABELS: Record<KitchenStatus, string> = {
  new: 'New', accepted: 'Accepted', preparing: 'Preparing',
  ready: 'Ready', served: 'Served', cancelled: 'Cancelled',
}

export const STATUS_TAG_COLORS: Record<KitchenStatus, string> = {
  new: 'blue', accepted: 'cyan', preparing: 'orange',
  ready: 'green', served: 'default', cancelled: 'red',
}

export const KANBAN_COLUMNS: { key: string; label: string; statuses: KitchenStatus[] }[] = [
  { key: 'incoming', label: 'New / Accepted', statuses: ['new', 'accepted'] },
  { key: 'preparing', label: 'Preparing', statuses: ['preparing'] },
  { key: 'ready', label: 'Ready', statuses: ['ready'] },
]

export function getNextStatus(current: KitchenStatus): KitchenStatus | null {
  const flow: Record<string, KitchenStatus> = {
    new: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'served',
  }
  return flow[current] || null
}
```

- [ ] **Step 3: Create operator-map.ts**

This maps PMS operator codes to Supabase `cafe_properties` UUIDs. Initially hardcoded, later can be fetched dynamically.

```ts
import { supabase } from '../../configs/supabase'

// Cache: operator code → Supabase property_id
const operatorPropertyCache: Record<string, string> = {}

/**
 * Maps a PMS operator code (e.g., 'BNGHO812') to its Supabase cafe_properties UUID.
 * Fetches from Supabase on first call, then caches.
 */
export async function getPropertyId(operatorCode: string): Promise<string | null> {
  if (operatorPropertyCache[operatorCode]) {
    return operatorPropertyCache[operatorCode]
  }

  const codeMap: Record<string, string> = {
    BNGHO812: 'BLR',  // Koramangala
    BNGS531: 'WTF',   // Whitefield
  }

  const propertyCode = codeMap[operatorCode]
  if (!propertyCode) return null

  const { data } = await supabase
    .from('cafe_properties')
    .select('id')
    .eq('code', propertyCode)
    .single()

  if (data?.id) {
    operatorPropertyCache[operatorCode] = data.id
  }
  return data?.id || null
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/pms/src/lib/cafe/
git commit -m "feat(pms): add cafe utilities — formatPaise, kitchen status, operator mapping"
```

---

### Task 3: Create a usePropertyId hook

**Files:**
- Create: `apps/pms/src/hooks/cafe/usePropertyId.ts`

Every cafe page needs to resolve the selected operator to a Supabase property_id. This hook wraps that.

- [ ] **Step 1: Create the hook**

```ts
import { useEffect, useState } from 'react'
import { useAssociation } from '../useAssociation'
import { getPropertyId } from '../../lib/cafe/operator-map'

export function usePropertyId() {
  const { selectedOperator } = useAssociation()
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const code = selectedOperator?.code
    if (!code) {
      setPropertyId(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    getPropertyId(code).then((id) => {
      setPropertyId(id)
      setIsLoading(false)
    })
  }, [selectedOperator?.code])

  return { propertyId, isLoading, operatorCode: selectedOperator?.code }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pms/src/hooks/cafe/usePropertyId.ts
git commit -m "feat(pms): add usePropertyId hook for operator → Supabase mapping"
```

---

## Chunk 2: Dashboard Page

### Task 4: Create useCafeAnalytics hook

**Files:**
- Create: `apps/pms/src/hooks/cafe/useCafeAnalytics.ts`

- [ ] **Step 1: Create the hook**

Fetches daily analytics from Supabase `cafe_daily_analytics` table (or computes from `cafe_orders` if no analytics table).

```ts
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../configs/supabase'
import type { DailyAnalytics } from '../../types/cafe'

export function useCafeAnalytics(propertyId: string | null) {
  const [analytics, setAnalytics] = useState<DailyAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!propertyId) { setIsLoading(false); return }
    setIsLoading(true)

    const today = new Date().toISOString().split('T')[0]

    // Get today's orders
    const { data: orders } = await supabase
      .from('cafe_orders')
      .select('id, total, kitchen_status')
      .eq('property_id', propertyId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    if (!orders) { setIsLoading(false); return }

    const activeStatuses = ['new', 'accepted', 'preparing', 'ready']
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
    const activeOrders = orders.filter(o => activeStatuses.includes(o.kitchen_status || '')).length

    // Get popular items
    const { data: orderItems } = await supabase
      .from('cafe_order_items')
      .select('name, quantity, order_id')
      .in('order_id', orders.map(o => o.id))
      .eq('item_status', 'active')

    const itemCounts: Record<string, number> = {}
    orderItems?.forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity
    })
    const popularItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    setAnalytics({
      total_orders: orders.length,
      total_revenue: totalRevenue,
      avg_order_value: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
      active_orders: activeOrders,
      popular_items: popularItems,
    })
    setIsLoading(false)
  }, [propertyId])

  useEffect(() => { fetch() }, [fetch])

  return { analytics, isLoading, refetch: fetch }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pms/src/hooks/cafe/useCafeAnalytics.ts
git commit -m "feat(pms): add useCafeAnalytics hook"
```

---

### Task 5: Create Dashboard page

**Files:**
- Create: `apps/pms/src/pages/cafe/index.tsx`

- [ ] **Step 1: Create the page**

Uses Ant Design `Card`, `Statistic`, `Table`, `Tag`, `Spin` components. Wrapped in `ZoHouseGuard` + `Page`/`PageHeader`/`PageContent`.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/app/cafe/page.tsx`

Key adaptations:
- Replace `PropertySelector` with `usePropertyId()` (auto-resolves from selected operator)
- Replace custom `.cafe-card` with Ant `Card`
- Replace custom table with Ant `Table`
- Use `Statistic` component for KPI cards
- Use `Tag` with `color="red"` for "live" badge

```tsx
import { Card, Col, Row, Spin, Statistic, Table, Tag } from 'antd'
import { NextPage } from 'next'
import React from 'react'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import { useCafeAnalytics } from '../../hooks/cafe/useCafeAnalytics'
import { usePropertyId } from '../../hooks/cafe/usePropertyId'
import { formatPaise } from '../../lib/cafe/order-calculator'

const CafeDashboard: NextPage = () => {
  const { propertyId, isLoading: isLoadingProperty } = usePropertyId()
  const { analytics, isLoading } = useCafeAnalytics(propertyId)

  const columns = [
    { title: 'Item', dataIndex: 'name', key: 'name' },
    { title: 'Qty Sold', dataIndex: 'count', key: 'count', align: 'right' as const },
  ]

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Cafe Zomad" icon="Food" />
        <PageContent>
          {isLoading || isLoadingProperty ? (
            <div className="flex justify-center py-20"><Spin size="large" /></div>
          ) : analytics ? (
            <>
              <Row gutter={[16, 16]} className="mb-8">
                <Col xs={12} md={6}>
                  <Card><Statistic title="Orders Today" value={analytics.total_orders} /></Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card><Statistic title="Revenue" value={formatPaise(analytics.total_revenue)} /></Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card><Statistic title="Avg Order" value={formatPaise(analytics.avg_order_value)} /></Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card>
                    <Statistic
                      title="Active Orders"
                      value={analytics.active_orders}
                      suffix={analytics.active_orders > 0 ? <Tag color="red">live</Tag> : null}
                    />
                  </Card>
                </Col>
              </Row>
              {analytics.popular_items.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold mb-3 text-zui-silver">Popular Items Today</h3>
                  <Table
                    dataSource={analytics.popular_items}
                    columns={columns}
                    rowKey="name"
                    pagination={false}
                    size="small"
                  />
                </>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-zui-silver">No data available</div>
          )}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  )
}

export default CafeDashboard
```

- [ ] **Step 2: Verify page loads at http://localhost:4204/cafe**

Run: Navigate to the page in browser, confirm it renders without errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pms/src/pages/cafe/index.tsx
git commit -m "feat(pms): add Cafe Zomad dashboard page"
```

---

## Chunk 3: Menu Page

### Task 6: Create useCafeMenu hook

**Files:**
- Create: `apps/pms/src/hooks/cafe/useCafeMenu.ts`

- [ ] **Step 1: Create the hook**

Fetches categories and menu items from Supabase. Menu is standardised (not per-property) — uses the first property's categories.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/hooks/useCafeMenu.ts`

- [ ] **Step 2: Commit**

```bash
git add apps/pms/src/hooks/cafe/useCafeMenu.ts
git commit -m "feat(pms): add useCafeMenu hook"
```

---

### Task 7: Create MenuItemForm component

**Files:**
- Create: `apps/pms/src/components/cafe/MenuItemForm.tsx`

- [ ] **Step 1: Create the component**

Ant Design `Modal` + `Form` with fields: name, price, diet (radio), description, image_url, calories, daily_limit, is_available toggle. Uses `Form.useForm()` for validation.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/components/cafe/menu-item-form.tsx`

- [ ] **Step 2: Commit**

```bash
git add apps/pms/src/components/cafe/MenuItemForm.tsx
git commit -m "feat(pms): add MenuItemForm component"
```

---

### Task 8: Create Menu page

**Files:**
- Create: `apps/pms/src/pages/cafe/menu.tsx`

- [ ] **Step 1: Create the page**

Layout: left sidebar with category list + right area with item grid. Uses Ant Design `Card`, `Switch`, `Input.Search`, `Tag`, `Button`, `Modal`, `Empty`.

Key features:
- Category list (sidebar on desktop, horizontal scroll on mobile)
- Search bar with debounce
- Grid of menu item cards with availability toggle
- Add/edit item via `MenuItemForm` modal
- Add category inline

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/app/cafe/menu/page.tsx`

- [ ] **Step 2: Verify page loads at http://localhost:4204/cafe/menu**

- [ ] **Step 3: Commit**

```bash
git add apps/pms/src/pages/cafe/menu.tsx
git commit -m "feat(pms): add Menu page"
```

---

## Chunk 4: Orders + Kitchen

### Task 9: Create useCafeOrders hook

**Files:**
- Create: `apps/pms/src/hooks/cafe/useCafeOrders.ts`

- [ ] **Step 1: Create the hook**

Fetches orders with items joined, supports status filtering and pagination.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/hooks/useCafeOrders.ts`

- [ ] **Step 2: Commit**

```bash
git add apps/pms/src/hooks/cafe/useCafeOrders.ts
git commit -m "feat(pms): add useCafeOrders hook"
```

---

### Task 10: Create Orders page

**Files:**
- Create: `apps/pms/src/pages/cafe/orders.tsx`

- [ ] **Step 1: Create the page**

Uses Ant Design `Table`, `Tag`, `Segmented` (for status filter), pagination. Columns: #, Time, Table, Items, Total, Status, Payment.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/app/cafe/orders/page.tsx`

- [ ] **Step 2: Commit**

```bash
git add apps/pms/src/pages/cafe/orders.tsx
git commit -m "feat(pms): add Orders page"
```

---

### Task 11: Create useCafeRealtimeOrders hook + KitchenBoard component

**Files:**
- Create: `apps/pms/src/hooks/cafe/useCafeRealtimeOrders.ts`
- Create: `apps/pms/src/components/cafe/KitchenBoard.tsx`

- [ ] **Step 1: Create the realtime hook**

Uses Supabase Realtime subscription on `cafe_orders` table. Fetches initial orders, then updates on INSERT/UPDATE events.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/hooks/useCafeRealtimeOrders.ts`

- [ ] **Step 2: Create KitchenBoard component**

3-column Kanban layout (New/Accepted | Preparing | Ready). Each order card shows: display number, time, items, table code, advance/cancel buttons. Audio notification on new orders.

Uses Ant Design `Card`, `Button`, `Tag`, `Badge`.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/components/cafe/kitchen-board.tsx`

- [ ] **Step 3: Commit**

```bash
git add apps/pms/src/hooks/cafe/useCafeRealtimeOrders.ts apps/pms/src/components/cafe/KitchenBoard.tsx
git commit -m "feat(pms): add KitchenBoard with realtime order tracking"
```

---

### Task 12: Create Kitchen page

**Files:**
- Create: `apps/pms/src/pages/cafe/kitchen.tsx`

- [ ] **Step 1: Create the page**

Full-viewport dark background page with `KitchenBoard`, plus buttons to create manual orders and toggle sound.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/app/cafe/kitchen/page.tsx`

- [ ] **Step 2: Commit**

```bash
git add apps/pms/src/pages/cafe/kitchen.tsx
git commit -m "feat(pms): add Kitchen page with live order board"
```

---

## Chunk 5: Tables, Meal Plan, Inventory

### Task 13: Create Tables page

**Files:**
- Create: `apps/pms/src/hooks/cafe/useCafeTables.ts`
- Create: `apps/pms/src/components/cafe/TableQRCard.tsx`
- Create: `apps/pms/src/pages/cafe/tables.tsx`

- [ ] **Step 1: Create useCafeTables hook**

Fetches tables from Supabase, supports create/toggle/update.

- [ ] **Step 2: Create TableQRCard component**

Card showing table code, label, area, capacity, QR download button, active toggle.

- [ ] **Step 3: Create Tables page**

Add table form at top + grid of `TableQRCard` components grouped by area.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/app/cafe/tables/page.tsx`

- [ ] **Step 4: Commit**

```bash
git add apps/pms/src/hooks/cafe/useCafeTables.ts apps/pms/src/components/cafe/TableQRCard.tsx apps/pms/src/pages/cafe/tables.tsx
git commit -m "feat(pms): add Tables page with QR code generation"
```

---

### Task 14: Create Meal Plan page

**Files:**
- Create: `apps/pms/src/hooks/cafe/useCafeMealPlans.ts`
- Create: `apps/pms/src/components/cafe/MealPlanCalendar.tsx`
- Create: `apps/pms/src/pages/cafe/meal-plan.tsx`

- [ ] **Step 1: Create useCafeMealPlans hook**

Complex hook with CRUD methods + copy functionality. Fetches plans by date range with joined items.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/hooks/useCafeMealPlans.ts`

- [ ] **Step 2: Create MealPlanCalendar component**

Week view with meal type rows (breakfast/lunch/dinner), item slots, add/remove buttons.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/components/cafe/meal-plan-calendar.tsx` and related sub-components.

- [ ] **Step 3: Create Meal Plan page**

Week navigation + `MealPlanCalendar` + copy week button.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/app/cafe/meal-plan/page.tsx`

- [ ] **Step 4: Commit**

```bash
git add apps/pms/src/hooks/cafe/useCafeMealPlans.ts apps/pms/src/components/cafe/MealPlanCalendar.tsx apps/pms/src/pages/cafe/meal-plan.tsx
git commit -m "feat(pms): add Meal Plan page with week calendar"
```

---

### Task 15: Create Inventory page

**Files:**
- Create: `apps/pms/src/hooks/cafe/useIngredients.ts`
- Create: `apps/pms/src/components/cafe/InventoryTable.tsx`
- Create: `apps/pms/src/components/cafe/IngredientForm.tsx`
- Create: `apps/pms/src/pages/cafe/inventory.tsx`

- [ ] **Step 1: Create useIngredients hook**

Fetches ingredients with stock levels per property. Supports create, update, stock update.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/hooks/useIngredients.ts`

- [ ] **Step 2: Create InventoryTable component**

Ant Design `Table` with inline editable stock cells. Columns: Code, Name, Category, Unit, Cost, Stock (per property), Min Stock, Supplier.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/components/cafe/inventory-table.tsx`

- [ ] **Step 3: Create IngredientForm component**

Ant Design `Modal` + `Form` for add/edit ingredient.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/components/cafe/ingredient-form.tsx`

- [ ] **Step 4: Create Inventory page**

Outlet tabs (BLR/WTF), low stock alerts, search, category filters, table, add ingredient button.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/app/cafe/inventory/page.tsx`

- [ ] **Step 5: Commit**

```bash
git add apps/pms/src/hooks/cafe/useIngredients.ts apps/pms/src/components/cafe/InventoryTable.tsx apps/pms/src/components/cafe/IngredientForm.tsx apps/pms/src/pages/cafe/inventory.tsx
git commit -m "feat(pms): add Inventory page with stock tracking"
```

---

## Chunk 6: Supporting Components + Final Integration

### Task 16: Create shared cafe components

**Files:**
- Create: `apps/pms/src/components/cafe/CreateOrderDialog.tsx`
- Create: `apps/pms/src/components/cafe/OrderDetailModal.tsx`

- [ ] **Step 1: Create CreateOrderDialog**

Ant Design `Modal` with table selector, menu item picker, quantity inputs. For manual order creation by kitchen staff.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/components/cafe/create-order-dialog.tsx`

- [ ] **Step 2: Create OrderDetailModal**

Ant Design `Modal` showing full order details: items, quantities, prices, status, payment info, timestamps.

Reference: `/Users/samuraizan/samuraidojo/zohouse/zohousecook/src/components/cafe/order-detail-modal.tsx`

- [ ] **Step 3: Commit**

```bash
git add apps/pms/src/components/cafe/CreateOrderDialog.tsx apps/pms/src/components/cafe/OrderDetailModal.tsx
git commit -m "feat(pms): add CreateOrderDialog and OrderDetailModal"
```

---

### Task 17: Final verification

- [ ] **Step 1: Verify all pages load**

Navigate to each page in browser and confirm no errors:
- http://localhost:4204/cafe → Dashboard
- http://localhost:4204/cafe/kitchen → Kitchen Board
- http://localhost:4204/cafe/menu → Menu Editor
- http://localhost:4204/cafe/orders → Order History
- http://localhost:4204/cafe/tables → Table Management
- http://localhost:4204/cafe/meal-plan → Meal Planner
- http://localhost:4204/cafe/inventory → Inventory

- [ ] **Step 2: Verify gating works**

Switch to a non-Zo House property → confirm cafe pages redirect to /overview and sidebar links disappear.

- [ ] **Step 3: Commit all remaining changes**

```bash
git add -A
git commit -m "feat(pms): complete Cafe Zomad module — all 7 pages ported"
```
