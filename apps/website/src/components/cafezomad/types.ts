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
  customizations: unknown | null
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

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  name: string
  price: number
  quantity: number
  customizations: Record<string, string | string[]> | null
  item_status: 'active' | 'cancelled'
  cancelled_at: string | null
}

export interface CafeOrderWithItems {
  id: string
  property_id: string
  table_id: string | null
  customer_phone: string | null
  customer_name: string | null
  zo_user_id: string | null
  created_by: string | null
  mode: 'dine_in' | 'pickup' | 'room_service'
  kitchen_status: 'draft' | 'new' | 'accepted' | 'preparing' | 'ready' | 'served' | 'cancelled' | null
  display_number: number
  subtotal: number
  service_charge: number
  tax_amount: number
  total: number
  payment_status: 'pending' | 'paid' | 'refunded'
  payment_mode: 'razorpay' | 'cash' | 'zo_card'
  payment_id: string | null
  razorpay_order_id: string | null
  food_credit_applied_paise: number
  notes: string | null
  created_at: string
  updated_at: string
  order_items: OrderItem[]
  table?: CafeTable | null
}

export type Tab = 'menu' | 'cart' | 'orders' | 'wallet'

export interface CartItem {
  menu_item_id: string
  name: string
  price: number
  quantity: number
}

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(paise % 100 === 0 ? 0 : 2)}`
}
