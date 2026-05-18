// src/types/cafe.ts

// --- Database row types ---

export interface CafeProperty {
  id: string
  name: string
  code: string
  config: PropertyConfig
  created_at: string
}

export interface PropertyConfig {
  operating_hours: { open: string; close: string }
  service_charge_percent: number
  tax_inclusive: boolean
  modes: { dine_in: boolean; pickup: boolean; room_service: boolean }
}


export interface MenuCategory {
  id: string
  property_id: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface MenuItem {
  id: string
  category_id: string
  property_id: string
  name: string
  description: string | null
  price: number // paise
  image_url: string | null
  diet: 'veg' | 'non_veg' | 'egg'
  is_available: boolean
  daily_limit: number | null
  customizations: CustomizationGroup[] | null
  sort_order: number
  calories: number | null
  protein: number | null
  carbs: number | null
  fats: number | null
  fibre: number | null
  sugar: number | null
  recipe: string | null
  ingredients: string | null
  created_at: string
  /** When set, the item is soft-deleted and hidden from live menu listings. */
  deleted_at: string | null
}

export interface CustomizationGroup {
  group: string
  options: CustomizationOption[]
  required: boolean
  max_select: number
}

export interface CustomizationOption {
  name: string
  price_delta: number // paise
}

export interface CafeTable {
  id: string
  property_id: string
  code: string
  label: string | null
  area: string
  capacity: number
  is_active: boolean
  qr_data: string
  created_at: string
}

export type KitchenStatus = 'draft' | 'new' | 'accepted' | 'preparing' | 'ready' | 'served' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'
export type PaymentMode = 'razorpay' | 'cash' | 'zo_card'

// ── $food Credits ──

export interface FoodCreditWallet {
  id: string
  phone: string
  name: string | null
  balance: number
  created_at: string
  updated_at: string
}

export interface FoodCreditTransaction {
  id: string
  wallet_id: string
  type: 'issue' | 'spend' | 'revoke' | 'refund'
  amount: number
  balance_after: number
  reference_type: string | null
  reference_id: string | null
  note: string | null
  created_by: string | null
  created_at: string
}

export type OrderMode = 'dine_in' | 'pickup' | 'room_service'

export interface CafeOrder {
  id: string
  property_id: string
  table_id: string | null
  customer_phone: string | null
  customer_name: string | null
  customer_email: string | null
  zo_user_id: string | null
  created_by: string | null
  mode: OrderMode
  kitchen_status: KitchenStatus | null
  display_number: number
  // FUDR-style human-readable ID: <property_code><YYMMDD>-<seq> (populated by RPC in PR B)
  human_order_id: string | null
  subtotal: number
  service_charge: number
  tax_amount: number
  total: number
  payment_status: PaymentStatus
  payment_mode: PaymentMode
  payment_id: string | null
  // Gateway fee breakdown (Razorpay). NULL = wallet-only or webhook pending.
  gateway_fee_paise: number | null
  gateway_gst_paise: number | null
  notes: string | null
  food_credit_applied_paise: number
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  name: string
  price: number // paise, final unit per-unit price including customization deltas
  quantity: number
  customizations: Record<string, string | string[]> | null
  item_status: 'active' | 'cancelled'
  cancelled_at: string | null
  // Per-item free-text (e.g. "Item not available" when kitchen flags a line)
  remark: string | null
}

// --- Joined types for UI ---

export interface CafeOrderWithItems extends CafeOrder {
  order_items: OrderItem[]
  table?: CafeTable | null
}

// --- Request types ---

export interface CreateOrderRequest {
  property_id: string
  table_id?: string | null
  customer_phone?: string
  customer_name?: string
  mode: OrderMode
  payment_mode: PaymentMode
  notes?: string
  items: CreateOrderItemRequest[]
}

export interface CreateOrderItemRequest {
  menu_item_id: string
  quantity: number
  customizations?: Record<string, string | string[]>
}

// --- Analytics ---

export interface DailyAnalytics {
  total_orders: number
  total_revenue: number // paise
  avg_order_value: number // paise
  active_orders: number
  popular_items: { name: string; count: number }[]
}

// --- Meal Plan types ---

export type MealType = 'breakfast' | 'lunch' | 'dinner'

export interface MealPlan {
  id: string
  date: string
  meal_type: MealType
  serving_start: string
  serving_end: string
  notes: string | null
  image_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface MealPlanItem {
  id: string
  meal_plan_id: string
  menu_item_id: string
  sort_order: number
}

export interface MealPlanItemWithMenu extends MealPlanItem {
  menu_item: MenuItem
}

export interface MealPlanWithItems extends MealPlan {
  items: MealPlanItemWithMenu[]
}

export interface CreateMealPlanRequest {
  date: string
  meal_type: MealType
  serving_start: string
  serving_end: string
  notes?: string
}

export interface CopyMealPlansRequest {
  source_from: string
  source_to: string
  target_from: string
}

export interface CopyMealPlansResponse {
  created: number
  skipped: number
}

// --- Kitchen Inventory types ---

export type IngredientUnit = 'kg' | 'g' | 'liter' | 'ml' | 'pieces' | 'tbsp' | 'tsp' | 'cups' | 'slice'

export interface CafeIngredient {
  id: string
  code: string
  name: string
  category: string
  unit: IngredientUnit
  unit_cost_paise: number | null
  supplier: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface IngredientStock {
  id: string
  ingredient_id: string
  property_id: string
  current_stock: number
  min_stock: number | null
  updated_at: string
}

export interface IngredientStockWithProperty extends IngredientStock {
  property_code: string
}

export interface CafeIngredientWithStock extends CafeIngredient {
  stock: IngredientStockWithProperty[]
}

export interface CafeRecipeItem {
  id: string
  menu_item_id: string
  ingredient_id: string
  quantity: number
  unit: IngredientUnit
  created_at: string
}

export interface RecipeItemWithIngredient extends CafeRecipeItem {
  ingredient: Pick<CafeIngredient, 'id' | 'code' | 'name' | 'category' | 'unit'>
}

export interface CreateIngredientRequest {
  code?: string
  name: string
  category: string
  unit: IngredientUnit
  unit_cost_paise?: number | null
  supplier?: string | null
}

export interface UpdateStockRequest {
  property_id: string
  current_stock: number
  min_stock?: number | null
}

export interface CreateRecipeItemRequest {
  ingredient_id: string
  quantity: number
  unit: IngredientUnit
}
