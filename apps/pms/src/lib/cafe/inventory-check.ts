import type {
  CafeOrderWithItems,
  IngredientUnit,
  InventoryItemState,
  InventoryStatusContext,
  OrderInventoryStatus,
  OrderItemInventoryStatus,
  OrderItem,
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
  orderItem: OrderItem,
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

  // Find the item driving the worst state.
  const target =
    items.find((i) => i.state === cardState && i.worstIngredient) ||
    items.find((i) => i.state === cardState)

  if (!target) return ''

  if (target.worstIngredient) {
    const w = target.worstIngredient
    if (target.state === 'red') {
      return `${target.menuItemName} — out of ${w.name} (${formatQty(w.available)} left, need ${formatQty(w.needed)})`
    }
    return `${target.menuItemName} — only ${formatQty(w.available)}${w.unit} ${w.name} left, need ${formatQty(w.needed)}${w.unit}`
  }

  return ''
}

function formatQty(n: number): string {
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(2).replace(/\.?0+$/, '')
}
