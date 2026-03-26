import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth, useProfile, useQueryApi } from '@zo/auth'
import { supabase } from '../../config/supabase'
import { useFoodCreditBalance } from '../../hooks/useFoodCreditBalance'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(paise % 100 === 0 ? 0 : 2)}`
}

// ─── Inlined Types ────────────────────────────────────────────────────────────

interface MenuCategory {
  id: string
  property_id: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

interface MenuItem {
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

interface CafeTable {
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

interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  name: string
  price: number // paise, final unit price including customization deltas
  quantity: number
  customizations: Record<string, string | string[]> | null
  item_status: 'active' | 'cancelled'
  cancelled_at: string | null
}

interface CafeOrderWithItems {
  id: string
  property_id: string
  table_id: string | null
  customer_phone: string | null
  customer_name: string | null
  zo_user_id: string | null
  created_by: string | null
  mode: 'dine_in' | 'pickup' | 'room_service'
  kitchen_status: 'new' | 'accepted' | 'preparing' | 'ready' | 'served' | 'cancelled' | null
  display_number: number
  subtotal: number
  service_charge: number
  tax_amount: number
  total: number
  payment_status: 'pending' | 'paid' | 'refunded'
  payment_mode: 'razorpay' | 'cash' | 'zo_card'
  payment_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  order_items: OrderItem[]
  table?: CafeTable | null
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'menu' | 'cart' | 'wallet'

interface CartItem {
  menu_item_id: string
  name: string
  price: number
  quantity: number
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function OrderStatusBadge({ status }: { status: string | null }) {
  const config: Record<string, { bg: string; label: string }> = {
    new: { bg: 'bg-blue-100 text-blue-700', label: 'New' },
    accepted: { bg: 'bg-amber-100 text-amber-700', label: 'Accepted' },
    preparing: { bg: 'bg-orange-100 text-orange-700', label: 'Preparing' },
    ready: { bg: 'bg-green-100 text-green-700', label: 'Ready' },
    served: { bg: 'bg-stone-100 text-stone-500', label: 'Served' },
    cancelled: { bg: 'bg-red-100 text-red-700', label: 'Cancelled' },
  }
  const c =
    config[status || ''] || {
      bg: 'bg-stone-100 text-stone-500',
      label: status || 'Pending',
    }
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.bg}`}>
      {c.label}
    </span>
  )
}

// ─── Bio Hack Tab ─────────────────────────────────────────────────────────────

interface NutritionTotals {
  calories: number
  protein: number
  carbs: number
  fats: number
  fibre: number
  sugar: number
  items: number
}

const DAILY_TARGETS: NutritionTotals = {
  calories: 2200,
  protein: 60,
  carbs: 275,
  fats: 65,
  fibre: 30,
  sugar: 50,
  items: 0,
}

function BioHackTab({
  isLoggedIn,
  user,
  showLoginModal,
}: {
  isLoggedIn: boolean | null
  user: { id: string; first_name: string; last_name: string; mobile_number: string; wallet_address: string; membership: string } | null
  showLoginModal: () => void
}) {
  const { profile } = useProfile()
  const { balance: foodCreditBalance } = useFoodCreditBalance(user?.mobile_number || null)
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([])
  const [todayNutrition, setTodayNutrition] = useState<NutritionTotals | null>(null)
  const [mealLog, setMealLog] = useState<{ name: string; qty: number; cal: number; protein: number; time: string }[]>([])
  const [orderHistory, setOrderHistory] = useState<{ id: string; display_number: number; total: number; kitchen_status: string; created_at: string; order_items: { name: string; quantity: number; id?: string; price?: number }[] }[]>([])

  // Fetch ALL menu items (across all properties) for nutrition lookup
  useEffect(() => {
    supabase.from('cafe_menu_items').select('id, name, calories, protein, carbs, fats, fibre, sugar').then(({ data }) => {
      if (data) setAllMenuItems(data as MenuItem[])
    })
  }, [])

  // Calculate today's nutrition — user-level, all properties
  useEffect(() => {
    if (!user?.mobile_number || allMenuItems.length === 0) return

    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000
    const istNow = new Date(now.getTime() + istOffset)
    const todayStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - istOffset)

    const rawPhone = user.mobile_number || ''
    const phone = rawPhone.replace(/^\+?91/, '').replace(/\D/g, '')

    supabase
      .from('cafe_orders')
      .select('created_at, order_items:cafe_order_items(menu_item_id, quantity, name)')
      .eq('customer_phone', phone)
      .not('kitchen_status', 'eq', 'cancelled')
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data) return

        const menuMapById = new Map(allMenuItems.map((m) => [m.id, m]))
        const menuMapByName = new Map(allMenuItems.map((m) => [m.name.toLowerCase().trim(), m]))
        const totals: NutritionTotals = { calories: 0, protein: 0, carbs: 0, fats: 0, fibre: 0, sugar: 0, items: 0 }
        const log: typeof mealLog = []

        for (const order of data) {
          const items = (order.order_items as { menu_item_id: string; quantity: number; name: string }[]) || []
          for (const oi of items) {
            const menu = menuMapById.get(oi.menu_item_id) || menuMapByName.get((oi.name || '').toLowerCase().trim())
            const hasNutrition = !!menu && menu.calories != null
            const qty = oi.quantity || 1
            if (hasNutrition) {
              totals.calories += (menu!.calories || 0) * qty
              totals.protein += (menu!.protein || 0) * qty
              totals.carbs += (menu!.carbs || 0) * qty
              totals.fats += (menu!.fats || 0) * qty
              totals.fibre += (menu!.fibre || 0) * qty
              totals.sugar += (menu!.sugar || 0) * qty
            }
            totals.items += qty
            log.push({
              name: oi.name,
              qty,
              cal: hasNutrition ? (menu!.calories || 0) * qty : -1,
              protein: hasNutrition ? (menu!.protein || 0) * qty : -1,
              time: new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            })
          }
        }

        setTodayNutrition(totals)
        setMealLog(log)
      })

    // Order history (last 20)
    supabase
      .from('cafe_orders')
      .select('id, display_number, total, kitchen_status, created_at, order_items:cafe_order_items(id, name, quantity, price)')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setOrderHistory(data as typeof orderHistory)
      })
  }, [user?.id, user?.mobile_number, allMenuItems])

  const p = profile as {
    nickname?: string; avatar_url?: string; first_name?: string; last_name?: string;
    experience?: number; level?: number; level_percent?: number; bio?: string;
    membership?: string; work_role?: string
  } | undefined
  const displayName = p?.nickname || (user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '') || 'Citizen'
  const avatarUrl = p?.avatar_url
  const balance = foodCreditBalance

  const nt = todayNutrition || { calories: 0, protein: 0, carbs: 0, fats: 0, fibre: 0, sugar: 0, items: 0 }

  function MacroRing({ label, value, target, color, unit }: { label: string; value: number; target: number; color: string; unit: string }) {
    const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0)
    const r = 28
    const circ = 2 * Math.PI * r
    const offset = circ - (pct / 100) * circ
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={r} fill="none" stroke="#0000000d" strokeWidth="5" />
            <circle
              cx="32" cy="32" r={r} fill="none"
              stroke={color} strokeWidth="5"
              strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-black">{Math.round(value)}</span>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-black/50 mt-1">{label}</span>
        <span className="text-[9px] text-black/30 font-medium">/ {target}{unit}</span>
      </div>
    )
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="px-4 py-4">
        <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-black mb-1">Bio Hack</h3>
          <p className="text-sm text-black/50 font-medium mb-5">
            Sign in to track your nutrition from every meal at Zo House
          </p>
          <button
            onClick={() => showLoginModal()}
            className="px-6 py-3 bg-orange-500 text-black text-sm font-bold rounded-xl active:scale-95 transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-3">
      {/* Profile Card */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 p-5 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-black/15 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-white/30">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-black text-white/80">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-extrabold text-black tracking-tight truncate">{displayName}</h2>
            {p?.work_role && (
              <p className="text-[11px] text-black/50 font-medium truncate">{p.work_role}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-black/15 rounded-full text-[10px] font-bold text-black/70 uppercase tracking-wider">
                {p?.membership || user.membership || 'Member'}
              </span>
              {p?.level != null && (
                <span className="text-[10px] font-bold text-black/50">Lvl {p.level}</span>
              )}
            </div>
          </div>
          {balance != null && (
            <div className="text-right shrink-0">
              <p className="text-lg font-extrabold text-black">{balance.toLocaleString()}</p>
              <p className="text-[9px] text-black/50 font-semibold uppercase tracking-wider">$food</p>
            </div>
          )}
        </div>
        {p?.level_percent != null && (
          <div className="relative mt-3">
            <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
              <div className="h-full bg-black/30 rounded-full transition-all" style={{ width: `${p.level_percent}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-[9px] font-semibold text-black/40">
              <span>{p.experience?.toLocaleString() || 0} XP</span>
              <span>Level {(p.level || 0) + 1}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bio Hack Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-black tracking-tight">Bio Hack</h2>
          <p className="text-[11px] text-black/40 font-medium">
            {displayName}&apos;s nutrition today
          </p>
        </div>
        <div className="px-3 py-1.5 bg-orange-100 rounded-full">
          <span className="text-[11px] font-bold text-orange-700">
            {nt.items} item{nt.items !== 1 ? 's' : ''} logged
          </span>
        </div>
      </div>

      {/* Calorie Hero Card */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 p-5 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-xs font-semibold text-black/50 uppercase tracking-widest mb-1">Calories Today</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-black tracking-tighter">
              {Math.round(nt.calories).toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-black/50 mb-1">/ {DAILY_TARGETS.calories} kcal</span>
          </div>
          {/* Calorie bar */}
          <div className="mt-3 h-2.5 bg-black/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (nt.calories / DAILY_TARGETS.calories) * 100)}%`,
                background: nt.calories > DAILY_TARGETS.calories ? '#ef4444' : '#000000aa',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] font-semibold text-black/40">
            <span>{Math.round((nt.calories / DAILY_TARGETS.calories) * 100)}% of daily goal</span>
            <span>{Math.max(0, DAILY_TARGETS.calories - Math.round(nt.calories))} remaining</span>
          </div>
        </div>
      </div>

      {/* Macro Rings */}
      <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4">
        <h3 className="text-xs font-bold text-black/60 uppercase tracking-widest mb-3">Macros</h3>
        <div className="grid grid-cols-5 gap-1">
          <MacroRing label="Protein" value={nt.protein} target={DAILY_TARGETS.protein} color="#f97316" unit="g" />
          <MacroRing label="Carbs" value={nt.carbs} target={DAILY_TARGETS.carbs} color="#3b82f6" unit="g" />
          <MacroRing label="Fats" value={nt.fats} target={DAILY_TARGETS.fats} color="#eab308" unit="g" />
          <MacroRing label="Fibre" value={nt.fibre} target={DAILY_TARGETS.fibre} color="#22c55e" unit="g" />
          <MacroRing label="Sugar" value={nt.sugar} target={DAILY_TARGETS.sugar} color="#ef4444" unit="g" />
        </div>
      </div>

      {/* Meal Log */}
      {mealLog.length > 0 && (
        <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4">
          <h3 className="text-xs font-bold text-black/60 uppercase tracking-widest mb-3">
            Today&apos;s Meals
          </h3>
          <div className="space-y-2">
            {mealLog.map((meal, idx) => (
              <div key={idx} className="flex items-center gap-3 py-1.5">
                <span className="text-[10px] font-mono text-black/30 w-10 shrink-0">{meal.time}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-black truncate block">
                    {meal.qty > 1 && <span className="font-mono text-black/40">{meal.qty}× </span>}
                    {meal.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  {meal.cal >= 0 ? (
                    <>
                      <span className="text-xs font-bold text-black">{meal.cal} kcal</span>
                      <span className="text-[10px] text-orange-500 font-semibold ml-1">{meal.protein}g P</span>
                    </>
                  ) : (
                    <span className="text-[10px] text-black/30 font-medium">no nutrition data</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no meals logged */}
      {mealLog.length === 0 && (
        <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-6 text-center">
          <p className="text-sm text-black/40 font-medium">
            No meals logged today. Order from the menu to start tracking.
          </p>
        </div>
      )}

      {/* Order History */}
      {orderHistory.length > 0 && (
        <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4">
          <h3 className="text-xs font-bold text-black/60 uppercase tracking-widest mb-3">
            Order History
          </h3>
          <div className="space-y-3">
            {orderHistory.map((order) => (
              <div key={order.id} className="rounded-xl bg-black/[0.02] ring-1 ring-black/5 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-sm text-black">
                    #{order.display_number}
                  </span>
                  <OrderStatusBadge status={order.kitchen_status} />
                </div>
                <div className="space-y-1">
                  {order.order_items?.map((item, idx) => (
                    <div key={item.id || idx} className="flex justify-between text-xs">
                      <span className="text-black/50 font-medium">
                        <span className="font-mono font-semibold">{item.quantity}×</span>{' '}
                        {item.name}
                      </span>
                      {item.price != null && (
                        <span className="font-semibold text-black/70">
                          {formatPaise(item.price * item.quantity)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/5">
                  <span className="text-[10px] text-black/30 font-medium font-mono">
                    {new Date(order.created_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="font-bold text-sm text-black">
                    {formatPaise(order.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CustomerOrderPage() {
  const router = useRouter()
  const { tableId } = router.query
  const tableIdStr = typeof tableId === 'string' ? tableId : null

  if (!tableIdStr) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f5f0e8]">
        <div className="w-10 h-10 border-[3px] border-black/80 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <CustomerOrderContent tableId={tableIdStr} />
}

// ─── Content ───────────────────────────────────────────────────────────────────

function CustomerOrderContent({ tableId }: { tableId: string }) {
  const { user, isLoggedIn, showLoginModal } = useAuth()

  // ── State ──────────────────────────────────────────────────────────────────
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [tableInfo, setTableInfo] = useState<{ code: string; label: string | null } | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<CafeOrderWithItems[]>([])
  const [isLoadingInit, setIsLoadingInit] = useState(true)

  const [cart, setCart] = useState<CartItem[]>([])
  const [foodCreditAmount, setFoodCreditAmount] = useState(0)
  const [activeTab, setActiveTab] = useState<Tab>('menu')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // $food credits
  const { balance: foodBalance } = useFoodCreditBalance(user?.mobile_number || null)

  // ── Data: fetch table + property + menu ────────────────────────────────────
  useEffect(() => {
    async function init() {
      setIsLoadingInit(true)
      try {
        // Get table to find property_id
        const { data: table } = await supabase
          .from('cafe_tables')
          .select('id, property_id, code, label')
          .eq('id', tableId)
          .single()

        if (!table) return
        setPropertyId(table.property_id)
        setTableInfo({ code: table.code, label: table.label })

        // Fetch categories and items in parallel
        const [{ data: cats }, { data: items }] = await Promise.all([
          supabase
            .from('cafe_menu_categories')
            .select('*')
            .eq('property_id', table.property_id)
            .eq('is_active', true)
            .order('sort_order'),
          supabase
            .from('cafe_menu_items')
            .select('*')
            .eq('property_id', table.property_id)
            .eq('is_available', true)
            .order('sort_order'),
        ])

        setCategories((cats as MenuCategory[]) || [])
        setMenuItems((items as MenuItem[]) || [])
      } finally {
        setIsLoadingInit(false)
      }
    }
    init()
  }, [tableId])

  // Refetch menu when user returns to tab (catches chef availability/image changes)
  useEffect(() => {
    if (!propertyId) return
    const onVisible = async () => {
      if (document.hidden) return
      const [{ data: cats }, { data: items }] = await Promise.all([
        supabase.from('cafe_menu_categories').select('*').eq('property_id', propertyId).eq('is_active', true).order('sort_order'),
        supabase.from('cafe_menu_items').select('*').eq('property_id', propertyId).eq('is_available', true).order('sort_order'),
      ])
      if (cats) setCategories(cats as MenuCategory[])
      if (items) setMenuItems(items as MenuItem[])
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [propertyId])

  // ── Session order tracking (only show this user's orders) ─────────────────
  const storageKey = `cafezomad_orders_${tableId}`

  const getMyOrderIds = useCallback((): string[] => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]')
    } catch { return [] }
  }, [storageKey])

  const saveOrderId = useCallback((orderId: string) => {
    const ids = getMyOrderIds()
    if (!ids.includes(orderId)) {
      localStorage.setItem(storageKey, JSON.stringify([...ids, orderId]))
    }
  }, [getMyOrderIds, storageKey])

  // ── Data: fetch + poll orders (session IDs + user ID for logged-in users) ──
  const fetchOrders = useCallback(async () => {
    const myIds = getMyOrderIds()

    // Build query: session orders OR user's orders at this property
    let query = supabase
      .from('cafe_orders')
      .select('*, order_items:cafe_order_items(*)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (user?.id && propertyId) {
      // Logged in — get orders by user ID or phone at this property, plus session orders
      const rawPh = user.mobile_number || ''
      const phoneCleaned = rawPh.replace(/^\+?91/, '').replace(/\D/g, '')
      if (myIds.length > 0 && phoneCleaned) {
        query = query.or(`customer_phone.eq.${phoneCleaned},id.in.(${myIds.join(',')})`)
          .eq('property_id', propertyId)
      } else if (phoneCleaned) {
        query = query.eq('customer_phone', phoneCleaned).eq('property_id', propertyId)
      } else if (myIds.length > 0) {
        query = query.in('id', myIds).eq('property_id', propertyId)
      }
    } else if (myIds.length > 0) {
      query = query.in('id', myIds)
    } else {
      setOrders([])
      return
    }

    const { data } = await query
    if (data) setOrders(data as CafeOrderWithItems[])
  }, [getMyOrderIds, user?.id, propertyId])

  // Fix #6: Only poll when tab is visible
  useEffect(() => {
    fetchOrders()

    const startPolling = () => {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(fetchOrders, 5000)
    }
    const stopPolling = () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }

    const handleVisibility = () => {
      if (document.hidden) { stopPolling() } else { fetchOrders(); startPolling() }
    }

    startPolling()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchOrders])

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const MAX_QTY_PER_ITEM = 10

  const addToCart = (item: Pick<MenuItem, 'id' | 'name' | 'price'>) => {
    // Verify item is still in the loaded menu (not removed/unavailable)
    const menuItem = menuItems.find((m) => m.id === item.id)
    if (!menuItem || !menuItem.is_available) return

    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id)
      if (existing) {
        const limit = menuItem.daily_limit ?? MAX_QTY_PER_ITEM
        if (existing.quantity >= limit) return prev
        return prev.map((c) =>
          c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === menuItemId)
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.menu_item_id === menuItemId ? { ...c, quantity: c.quantity - 1 } : c
        )
      }
      return prev.filter((c) => c.menu_item_id !== menuItemId)
    })
  }

  // ── Place Order ────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !propertyId || isOrdering) return

    // Require login before ordering
    if (!isLoggedIn || !user) {
      showLoginModal()
      return
    }

    setIsOrdering(true)
    try {
      // 1. Re-validate cart items are still available and prices haven't changed
      const cartItemIds = cart.map((c) => c.menu_item_id)
      const { data: freshItems } = await supabase
        .from('cafe_menu_items')
        .select('id, name, price, is_available')
        .in('id', cartItemIds)

      if (!freshItems) throw new Error('Could not verify menu items')

      const freshMap = new Map(freshItems.map((i) => [i.id, i]))
      const unavailable: string[] = []
      const priceChanged: string[] = []

      for (const cartItem of cart) {
        const fresh = freshMap.get(cartItem.menu_item_id)
        if (!fresh || !fresh.is_available) {
          unavailable.push(cartItem.name)
        } else if (fresh.price !== cartItem.price) {
          priceChanged.push(cartItem.name)
        }
      }

      if (unavailable.length > 0) {
        throw new Error(`No longer available: ${unavailable.join(', ')}. Remove them and try again.`)
      }

      // Use fresh prices for the order
      const validatedCart = cart.map((c) => ({
        ...c,
        price: freshMap.get(c.menu_item_id)?.price ?? c.price,
      }))
      const totalAmount = validatedCart.reduce((sum, c) => sum + c.price * c.quantity, 0)

      // 2. Use timestamp-based display number to avoid race conditions
      // Format: last 4 digits of epoch seconds — cycles every ~2.7 hours, unique enough for a cafe
      const displayNumber = Math.floor(Date.now() / 1000) % 10000

      // 3. Insert order with user identity
      const { data: order, error: orderError } = await supabase
        .from('cafe_orders')
        .insert({
          property_id: propertyId,
          table_id: tableId,
          customer_name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : null,
          customer_phone: user.mobile_number || null,
          zo_user_id: user.id || null,
          mode: 'dine_in',
          kitchen_status: 'new',
          display_number: displayNumber,
          subtotal: totalAmount,
          service_charge: 0,
          tax_amount: 0,
          total: totalAmount,
          payment_status: 'pending',
          payment_mode: 'cash',
          food_credit_applied_paise: foodCreditAmount * 100,
        })
        .select()
        .single()

      if (orderError || !order) {
        throw new Error(orderError?.message || 'Failed to create order')
      }

      // 4. Insert order items with validated prices
      const { error: itemsError } = await supabase.from('cafe_order_items').insert(
        validatedCart.map((item) => ({
          order_id: order.id,
          menu_item_id: item.menu_item_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          item_status: 'active',
        }))
      )

      if (itemsError) {
        throw new Error(itemsError.message)
      }

      // Success — save order ID to this session and update cart with fresh prices
      saveOrderId(order.id)
      setCart([])
      setFoodCreditAmount(0)
      setOrderPlaced(true)
      setActiveTab('wallet')
      fetchOrders()
      setTimeout(() => setOrderPlaced(false), 3500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to place order'
      setErrorToast(msg)
      setTimeout(() => setErrorToast(null), 5000)
    } finally {
      setIsOrdering(false)
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const activeOrders = orders.filter(
    (o) => o.kitchen_status && !['ready', 'served', 'cancelled'].includes(o.kitchen_status)
  )
  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0)
  const totalAmount = cart.reduce((sum, c) => sum + c.price * c.quantity, 0)

  const searchedItems = searchQuery.trim()
    ? menuItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : menuItems

  const filteredItems = activeCategory
    ? searchedItems.filter((item) => item.category_id === activeCategory)
    : searchedItems

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (isLoadingInit || !propertyId) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f5f0e8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-black/80 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-black/60 font-semibold tracking-wide">Loading menu...</p>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen tap-transparent bg-[#f5f0e8]">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="shrink-0 bg-orange-500 px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/cafezomad/logo.png" alt="Cafe Zomad" className="w-9 h-9 rounded-2xl object-contain bg-white p-1" />
              <h1 className="text-xl font-extrabold tracking-tight text-black">Cafe Zomad</h1>
            </div>
            <p className="text-[11px] text-black/60 font-medium tracking-[0.15em] uppercase mt-0.5 ml-[46px]">
              Table {tableInfo?.label || tableInfo?.code || '...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeOrders.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-300 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                <span className="text-[11px] font-semibold text-black/80 tracking-wide">
                  {activeOrders.length} active
                </span>
              </div>
            )}
            {isLoggedIn && user ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 rounded-full">
                <span className="text-[11px] font-semibold text-black/70">
                  {user.first_name || user.mobile_number || 'Guest'}
                </span>
              </div>
            ) : (
              <button
                onClick={() => showLoginModal()}
                className="px-3 py-1.5 bg-black rounded-full text-[11px] font-semibold text-white"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Toasts ─────────────────────────────────────────────────────────── */}
      {orderPlaced && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-green-400 text-black px-5 py-3.5 rounded-2xl text-sm font-semibold text-center shadow-2xl shadow-black/20 animate-in fade-in slide-in-from-top-2">
          Order placed! Kitchen has been notified.
        </div>
      )}
      {errorToast && (
        <div
          className="fixed top-4 left-4 right-4 z-50 bg-red-400 text-white px-5 py-3.5 rounded-2xl text-sm font-semibold text-center shadow-2xl shadow-black/20 cursor-pointer"
          onClick={() => setErrorToast(null)}
        >
          {errorToast}
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-28">

        {/* ── MENU TAB ──────────────────────────────────────────────────────── */}
        {activeTab === 'menu' && (
          <>
            {/* Search bar */}
            {showSearch && (
              <div className="sticky top-0 z-10 px-4 py-2.5 bg-[#f5f0e8]/95 backdrop-blur-sm">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu..."
                    className="w-full pl-9 pr-9 py-2.5 text-sm bg-white rounded-2xl ring-1 ring-black/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 placeholder:text-black/30"
                  />
                  <button
                    onClick={() => {
                      setShowSearch(false)
                      setSearchQuery('')
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* FAB buttons — search + category filter */}
            <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2">
              {/* Category popup */}
              {showCategories && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                    onClick={() => setShowCategories(false)}
                  />
                  <div className="relative z-50 mb-3 bg-white rounded-2xl ring-1 ring-black/10 shadow-2xl shadow-black/20 p-2 w-48 max-h-[50vh] overflow-y-auto">
                    <button
                      onClick={() => {
                        setActiveCategory(null)
                        setShowCategories(false)
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                        !activeCategory
                          ? 'bg-orange-500 text-black font-semibold'
                          : 'text-black/70 hover:bg-black/5'
                      }`}
                    >
                      All
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setActiveCategory(cat.id)
                          setShowCategories(false)
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                          activeCategory === cat.id
                            ? 'bg-orange-500 text-black font-semibold'
                            : 'text-black/70 hover:bg-black/5'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Search FAB */}
              <button
                onClick={() => {
                  setShowSearch((v) => !v)
                  if (showSearch) setSearchQuery('')
                }}
                className={`w-12 h-12 text-black rounded-2xl ring-1 ring-black/10 shadow-lg shadow-black/15 flex items-center justify-center active:scale-95 transition-all ${
                  showSearch ? 'bg-orange-500' : 'bg-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </button>

              {/* Category filter FAB */}
              <button
                onClick={() => setShowCategories((v) => !v)}
                className="w-12 h-12 bg-yellow-300 text-black rounded-2xl ring-1 ring-black/10 shadow-lg shadow-black/15 flex items-center justify-center active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6h16.5M3.75 12h16.5M3.75 18h16.5" />
                </svg>
              </button>
            </div>

            {/* Active category chip */}
            {activeCategory && (
              <div className="px-4 pt-3 pb-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 rounded-full text-xs font-semibold text-black">
                  {categories.find((c) => c.id === activeCategory)?.name}
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="ml-0.5 text-black/60 hover:text-black"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              </div>
            )}

            {/* Menu items grouped by category */}
            <div className="px-4 py-4 space-y-3">
              {(() => {
                const categoryMap = new Map<string, { name: string; items: typeof filteredItems }>()
                for (const item of filteredItems) {
                  const catId = item.category_id || 'uncategorized'
                  if (!categoryMap.has(catId)) {
                    const cat = categories.find((c) => c.id === catId)
                    categoryMap.set(catId, { name: cat?.name || 'Other', items: [] })
                  }
                  categoryMap.get(catId)!.items.push(item)
                }

                if (categoryMap.size === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <svg className="w-12 h-12 text-black/15" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                      <p className="text-black/35 font-medium text-sm">
                        {searchQuery.trim()
                          ? `No items matching "${searchQuery}"`
                          : menuItems.length === 0
                          ? 'Menu is being prepared — check back soon!'
                          : 'No items in this category'}
                      </p>
                    </div>
                  )
                }

                return Array.from(categoryMap.entries()).map(([catId, { name, items }]) => (
                  <div key={catId} className="space-y-3">
                    {/* Category section header */}
                    {!activeCategory && (
                      <div className="flex items-center gap-3 pt-3 first:pt-0">
                        <h2 className="text-xs font-semibold text-black/40 uppercase tracking-widest shrink-0">
                          {name}
                        </h2>
                        <div className="flex-1 h-px bg-black/10" />
                      </div>
                    )}

                    {/* Item cards — 2-col square grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {items.map((item) => {
                        const inCart = cart.find((c) => c.menu_item_id === item.id)
                        return (
                          <div key={item.id} className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm overflow-hidden">
                            {/* Square image */}
                            <div className="aspect-square bg-stone-100 relative">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-black/15 text-3xl font-bold">{item.name.charAt(0)}</div>
                              )}
                              <span className={`absolute top-2 left-2 w-3 h-3 rounded-full ring-2 ring-white ${item.diet === 'veg' ? 'bg-green-500' : item.diet === 'egg' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                            </div>
                            {/* Info */}
                            <div className="p-3">
                              <p className="font-bold text-sm text-black tracking-tight truncate">{item.name}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-sm font-bold text-black">{formatPaise(item.price)}</span>
                                {item.calories != null && <span className="text-[10px] text-black/40 font-mono">{item.calories} kcal</span>}
                              </div>
                              {(item.protein != null || item.carbs != null || item.fats != null) && (
                                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                  {item.protein != null && <span className="text-[9px] text-orange-600/70 font-semibold font-mono bg-orange-50 px-1.5 py-0.5 rounded">{item.protein}g P</span>}
                                  {item.carbs != null && <span className="text-[9px] text-blue-600/70 font-semibold font-mono bg-blue-50 px-1.5 py-0.5 rounded">{item.carbs}g C</span>}
                                  {item.fats != null && <span className="text-[9px] text-amber-600/70 font-semibold font-mono bg-amber-50 px-1.5 py-0.5 rounded">{item.fats}g F</span>}
                                </div>
                              )}
                              {/* Cart control */}
                              <div className="mt-2.5">
                                {!inCart ? (
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-full py-2 bg-orange-500 rounded-xl text-black text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-all"
                                  >
                                    ADD
                                  </button>
                                ) : (
                                  <div className="flex items-center justify-center rounded-xl bg-black overflow-hidden">
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="w-10 h-9 flex items-center justify-center text-white font-bold text-lg active:bg-white/10 transition-colors"
                                    >
                                      -
                                    </button>
                                    <span className="text-white font-bold text-sm font-mono w-6 text-center">
                                      {inCart.quantity}
                                    </span>
                                    <button
                                      onClick={() => addToCart(item)}
                                      className="w-10 h-9 flex items-center justify-center text-white font-bold text-lg active:bg-white/10 transition-colors"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </>
        )}

        {/* ── CART TAB ──────────────────────────────────────────────────────── */}
        {activeTab === 'cart' && (
          <div className="px-4 py-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <svg
                  className="w-12 h-12 text-black/20"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
                <p className="text-black/35 font-medium">Your cart is empty</p>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="mt-2 px-5 py-2.5 bg-orange-500 text-black text-sm font-bold rounded-xl active:scale-95 transition-all"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                {/* Cart items */}
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div
                      key={item.menu_item_id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white ring-1 ring-black/10 shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-black truncate">{item.name}</p>
                        <p className="text-sm text-black/45 font-medium">
                          {formatPaise(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-xl bg-black/5 overflow-hidden ring-1 ring-black/10">
                          <button
                            onClick={() => removeFromCart(item.menu_item_id)}
                            className="w-9 h-9 flex items-center justify-center font-bold text-lg text-black active:bg-black/10 transition-colors"
                          >
                            -
                          </button>
                          <span className="font-bold text-sm font-mono w-5 text-center text-black">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              addToCart({
                                id: item.menu_item_id,
                                name: item.name,
                                price: item.price,
                              })
                            }
                            className="w-9 h-9 flex items-center justify-center font-bold text-lg text-black active:bg-black/10 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-bold w-16 text-right text-black">
                          {formatPaise(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bill summary */}
                <div className="rounded-2xl bg-yellow-200 ring-1 ring-black/10 p-4 mb-4">
                  <h3 className="font-bold text-sm text-black mb-3">Bill Summary</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-black/50 font-medium">Subtotal</span>
                      <span className="font-semibold text-black">{formatPaise(totalAmount)}</span>
                    </div>
                    <div className="text-xs text-black/35 font-medium">
                      Taxes &amp; charges included
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-black/15">
                    <span className="font-bold text-black">Total</span>
                    <span className="text-xl font-extrabold text-black">
                      {formatPaise(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* $food Credits slider */}
                {foodBalance > 0 && (
                  <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: '#cfff50', fontWeight: 600, fontSize: 14 }}>$food Balance</span>
                      <span style={{ color: '#cfff50', fontFamily: 'monospace', fontWeight: 700 }}>{foodBalance}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.min(foodBalance, Math.floor(totalAmount / 100))}
                      value={foodCreditAmount}
                      onChange={(e) => setFoodCreditAmount(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#cfff50' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
                      <span style={{ color: '#aaa' }}>Apply: ₹{foodCreditAmount}</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>
                        To pay: {formatPaise(totalAmount - foodCreditAmount * 100)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Place Order button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={isOrdering}
                  className="w-full bg-orange-500 text-black py-4 text-base font-bold tracking-wide rounded-2xl shadow-lg shadow-orange-500/25 active:scale-[0.98] active:translate-y-px transition-all disabled:opacity-50"
                >
                  {isOrdering ? 'Placing Order...' : `Place Order · ${formatPaise(totalAmount - foodCreditAmount * 100)}`}
                </button>

                <p className="text-center text-xs text-black/35 font-medium mt-3">
                  {foodCreditAmount > 0
                    ? `₹${foodCreditAmount} $food applied · pay ₹${Math.ceil((totalAmount - foodCreditAmount * 100) / 100)} at counter`
                    : 'Pay at the counter after your meal'
                  }
                </p>
              </>
            )}
          </div>
        )}

        {/* ── BIO HACK TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'wallet' && (
          <BioHackTab
            isLoggedIn={isLoggedIn}
            user={user}
            showLoginModal={showLoginModal}
          />
        )}
      </div>

      {/* ── Go to Cart floating bar ────────────────────────────────────────────── */}
      {totalItems > 0 && activeTab !== 'cart' && (
        <button
          onClick={() => setActiveTab('cart')}
          className="fixed bottom-24 left-5 right-5 z-50 bg-orange-500 text-black px-5 py-3.5 rounded-2xl shadow-2xl shadow-orange-500/30 flex items-center justify-between active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="bg-black text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
            <span className="font-bold text-sm">View Cart</span>
          </div>
          <span className="font-extrabold text-base">{formatPaise(totalAmount)}</span>
        </button>
      )}

      {/* ── Bottom Navigation ─────────────────────────────────────────────────── */}
      <nav className="shrink-0 fixed bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md rounded-full ring-1 ring-black/10 shadow-2xl shadow-black/20 z-40">
        <div className="flex items-center justify-around h-14 max-w-md mx-auto">
          {(
            [
              {
                key: 'menu' as Tab,
                label: 'Menu',
                badge: undefined as number | undefined,
                icon: (active: boolean) => (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.2 : 1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                ),
              },
              {
                key: 'cart' as Tab,
                label: 'Cart',
                badge: totalItems > 0 ? totalItems : undefined,
                icon: (active: boolean) => (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.2 : 1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                ),
              },
              {
                key: 'wallet' as Tab,
                label: 'Bio Hack',
                badge: undefined,
                icon: (active: boolean) => (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.2 : 1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                ),
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-2xl transition-all ${
                activeTab === tab.key
                  ? 'text-orange-600'
                  : 'text-black/50'
              }`}
            >
              {tab.badge !== undefined && (
                <span className="absolute -top-0.5 right-0.5 bg-orange-500 text-white text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
              {tab.icon(activeTab === tab.key)}
              <span className="text-[9px] font-semibold tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
