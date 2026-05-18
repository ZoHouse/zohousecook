import { computeOrderInventoryStatus } from '../inventory-check'
import type {
  CafeOrderWithItems,
  IngredientUnit,
  InventoryStatusContext,
  RecipeRow,
} from '../../../types/cafe'

function makeCtx(opts: {
  stock?: Record<string, number>
  ingredients?: Record<string, { name: string; unit: IngredientUnit }>
  recipes?: Record<string, RecipeRow[]>
}): InventoryStatusContext {
  return {
    stockMap: new Map(Object.entries(opts.stock || {})),
    ingredientMap: new Map(Object.entries(opts.ingredients || {})),
    recipeMap: new Map(Object.entries(opts.recipes || {})),
  }
}

function makeOrder(
  items: Array<{ id: string; menuItemId: string; name: string; qty: number }>,
): CafeOrderWithItems {
  return {
    id: 'order-1',
    order_items: items.map((i) => ({
      id: i.id,
      menu_item_id: i.menuItemId,
      name: i.name,
      quantity: i.qty,
      item_status: 'active',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
