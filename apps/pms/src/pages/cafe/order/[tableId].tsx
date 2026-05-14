import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@zo/auth'
import { supabase } from '../../../configs/supabase'
import { formatPaise } from '../../../lib/cafe/order-calculator'
import type {
  MenuItem,
  MenuCategory,
  CafeOrderWithItems,
} from '../../../types/cafe'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'menu' | 'orders' | 'cart' | 'wallet'

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
  // ── Auth ───────────────────────────────────────────────────────────────────
  // Login is only enforced at Place Order time, not on page load — customers
  // can browse the menu freely (low friction for QR-scan walk-ups).
  const router = useRouter()
  const { isLoggedIn, user, showLoginModal, logout } = useAuth()
  const cartStorageKey = `cafe_cart_${tableId}`

  // ── State ──────────────────────────────────────────────────────────────────
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [tableInfo, setTableInfo] = useState<{ code: string; label: string | null } | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<CafeOrderWithItems[]>([])
  const [isLoadingInit, setIsLoadingInit] = useState(true)

  const [cart, setCart] = useState<CartItem[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('menu')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Restore cart on mount — covers the flow where the user tapped Place
  // Order while logged out, got bounced through the login modal, and is
  // now back on this page with auth in hand.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.sessionStorage.getItem(cartStorageKey)
    if (!saved) return
    try {
      const items = JSON.parse(saved)
      if (Array.isArray(items) && items.length > 0) setCart(items)
    } catch { /* corrupt payload — ignore */ }
  }, [cartStorageKey])

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

  // ── Data: fetch + poll orders ──────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('cafe_orders')
      .select('*, order_items:cafe_order_items(*)')
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })

    if (data) setOrders(data as CafeOrderWithItems[])
  }, [tableId])

  useEffect(() => {
    fetchOrders()
    pollRef.current = setInterval(fetchOrders, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchOrders])

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const addToCart = (item: Pick<MenuItem, 'id' | 'name' | 'price'>) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id)
      if (existing) {
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
  // Goes through the place_cafe_order RPC (SECURITY DEFINER) rather than
  // direct table inserts. The 20260404 security migration dropped anon
  // INSERT policies on cafe_orders/cafe_order_items, so the old two-step
  // insert was failing under RLS — orders were silently lost from the
  // kitchen board. The RPC is atomic (no orphan rows), enforces the
  // accepting_orders flag, validates server-side prices, applies the GST
  // tail, and assigns display_number safely.
  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !propertyId || isOrdering) return

    // Auth gate — login is required before an order can be associated with
    // a customer. Persist the cart so the user lands back on a populated
    // cart screen after the login modal completes, instead of an empty one.
    if (!isLoggedIn || !user) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(cartStorageKey, JSON.stringify(cart))
      }
      showLoginModal(['mobile'], router.asPath)
      return
    }

    setIsOrdering(true)
    try {
      const fullName = [user.first_name, user.last_name]
        .filter(Boolean)
        .join(' ')
        .trim()
      const { data, error } = await supabase.rpc('place_cafe_order', {
        p_property_id: propertyId,
        p_table_id: tableId,
        p_customer_name: fullName || null,
        p_customer_phone: user.mobile_number || null,
        p_zo_user_id: user.id || null,
        p_items: cart.map((item) => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
        })),
        p_food_credit_paise: 0,
        p_customer_email: user.email_address || null,
        p_payment_mode: 'cash',
      })

      if (error) throw new Error(error.message)
      if (!data) throw new Error('Order did not reach the kitchen — please try again')

      setCart([])
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(cartStorageKey)
      }
      setOrderPlaced(true)
      setActiveTab('orders')
      await fetchOrders()
      setTimeout(() => setOrderPlaced(false), 3500)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to place order')
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
              <div className="w-9 h-9 bg-black rounded-2xl flex items-center justify-center">
                <span className="text-xs font-bold text-white font-mono">ZO</span>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-black">Cafe Zomad</h1>
            </div>
            <p className="text-[11px] text-black/60 font-medium tracking-[0.15em] uppercase mt-0.5 ml-[46px]">
              Table {tableInfo?.label || tableInfo?.code || '...'}
            </p>
          </div>
          {activeOrders.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-300 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              <span className="text-[11px] font-semibold text-black/80 tracking-wide">
                {activeOrders.length} active
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── Success Toast ────────────────────────────────────────────────────── */}
      {orderPlaced && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-green-400 text-black px-5 py-3.5 rounded-2xl text-sm font-semibold text-center shadow-2xl shadow-black/20 animate-in fade-in slide-in-from-top-2">
          Order placed! Kitchen has been notified.
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
                    <p className="text-center text-black/35 py-12 font-medium">
                      No items found
                    </p>
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

                    {/* Item cards */}
                    {items.map((item) => {
                      const inCart = cart.find((c) => c.menu_item_id === item.id)
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-4 rounded-2xl bg-white ring-1 ring-black/10 shadow-sm"
                        >
                          <div className="flex-1 min-w-0">
                            {/* Diet dot + name */}
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  item.diet === 'veg'
                                    ? 'bg-green-500'
                                    : item.diet === 'egg'
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                              />
                              <span className="font-bold text-sm text-black tracking-tight truncate">
                                {item.name}
                              </span>
                            </div>
                            {/* Description */}
                            {item.description && (
                              <p className="text-xs text-black/45 font-medium mt-0.5 ml-[18px] line-clamp-1">
                                {item.description}
                              </p>
                            )}
                            {/* Price + calories */}
                            <div className="flex items-center gap-3 mt-1.5 ml-[18px]">
                              <span className="text-sm font-bold text-black">
                                {formatPaise(item.price)}
                              </span>
                              {item.calories && (
                                <span className="text-[10px] text-black/35 font-medium font-mono">
                                  {item.calories} kcal
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Add to cart / quantity control */}
                          {!inCart ? (
                            <button
                              onClick={() => addToCart(item)}
                              className="shrink-0 px-4 py-2 bg-orange-500 rounded-xl text-black text-xs font-bold uppercase tracking-wider active:scale-95 active:translate-y-px transition-all"
                            >
                              ADD
                            </button>
                          ) : (
                            <div className="shrink-0 flex items-center rounded-xl bg-black overflow-hidden">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-9 h-9 flex items-center justify-center text-white font-bold text-lg active:bg-white/10 transition-colors"
                              >
                                -
                              </button>
                              <span className="text-white font-bold text-sm font-mono w-5 text-center">
                                {inCart.quantity}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                className="w-9 h-9 flex items-center justify-center text-white font-bold text-lg active:bg-white/10 transition-colors"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))
              })()}
            </div>
          </>
        )}

        {/* ── ORDERS TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="px-4 py-4 space-y-3">
            {orders.length === 0 ? (
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
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-black/35 font-medium">No orders yet</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold text-base text-black">
                      #{order.display_number}
                    </span>
                    <OrderStatusBadge status={order.kitchen_status} />
                  </div>
                  <div className="space-y-1.5">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-black/60 font-medium">
                          <span className="font-mono font-semibold">{item.quantity}×</span>{' '}
                          {item.name}
                        </span>
                        <span className="font-semibold text-black">
                          {formatPaise(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-black/10">
                    <span className="text-xs text-black/35 font-medium font-mono">
                      {new Date(order.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="font-bold text-base text-black">
                      {formatPaise(order.total)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
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

                {/* Place Order button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={isOrdering}
                  className="w-full bg-orange-500 text-black py-4 text-base font-bold tracking-wide rounded-2xl shadow-lg shadow-orange-500/25 active:scale-[0.98] active:translate-y-px transition-all disabled:opacity-50"
                >
                  {isOrdering ? 'Placing Order...' : `Place Order · ${formatPaise(totalAmount)}`}
                </button>

                <p className="text-center text-xs text-black/35 font-medium mt-3">
                  Pay at the counter after your meal
                </p>
              </>
            )}
          </div>
        )}

        {/* ── ACCOUNT TAB (profile + wallet placeholder) ──────────────────── */}
        {activeTab === 'wallet' && (
          <div className="px-4 py-4">
            {/* Profile card */}
            {isLoggedIn && user ? (
              <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-5 mb-4">
                <div className="flex items-center gap-4">
                  {/* Avatar circle with initial */}
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-black font-extrabold text-xl">
                    {(user.first_name?.[0] || user.mobile_number?.slice(-1) || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-black truncate">
                      {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'Zo Citizen'}
                    </p>
                    {user.mobile_number && (
                      <p className="text-sm text-black/55 font-medium mt-0.5 font-mono">
                        {user.mobile_number}
                      </p>
                    )}
                    {user.email_address && (
                      <p className="text-xs text-black/40 font-medium mt-0.5 truncate">
                        {user.email_address}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="mt-4 w-full py-2.5 rounded-xl bg-black/5 hover:bg-black/10 text-black/70 text-sm font-semibold transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-5 mb-4 text-center">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-7 h-7 text-orange-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-extrabold text-black tracking-tight">Sign in</h2>
                <p className="text-sm text-black/55 font-medium mt-1 mb-4">
                  Log in to see your profile and order history
                </p>
                <button
                  onClick={() => showLoginModal(['mobile'], router.asPath)}
                  className="w-full bg-orange-500 text-black py-3 rounded-2xl text-sm font-bold tracking-wide active:scale-[0.98] transition-all"
                >
                  Sign in with phone
                </button>
              </div>
            )}

            {/* Zo Card placeholder */}
            <div className="rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 p-6 text-black mb-4 text-center">
              <div className="w-14 h-14 bg-black/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-black/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-black">Zo Card</h2>
              <p className="text-sm text-black/60 font-medium mt-1">Prepaid wallet — coming soon</p>
            </div>

            <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-5 text-center">
              <p className="text-black/50 text-sm font-medium leading-relaxed">
                Zo Card lets you load credits and pay for meals, events, and more across all Zo House
                properties.
              </p>
              <p className="text-black/35 text-xs font-medium mt-3">
                ZoPassport integration coming soon.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Navigation ─────────────────────────────────────────────────── */}
      <nav className="shrink-0 fixed bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md rounded-full ring-1 ring-black/10 shadow-2xl shadow-black/20 z-40">
        <div className="flex items-center justify-around h-14 max-w-md mx-auto">
          {(
            [
              {
                key: 'menu' as Tab,
                badge: undefined as number | undefined,
                icon: (active: boolean) => (
                  <svg
                    className="w-6 h-6"
                    fill={active ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    strokeWidth={active ? 0 : 1.8}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={
                        active
                          ? 'M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 01-.53 1.28h-1.44v7.44a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5h-2.25v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-7.44H3.31a.75.75 0 01-.53-1.28l8.69-8.69z'
                          : 'm2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25'
                      }
                    />
                  </svg>
                ),
              },
              {
                key: 'orders' as Tab,
                badge: activeOrders.length > 0 ? activeOrders.length : undefined,
                icon: (active: boolean) => (
                  <svg
                    className="w-6 h-6"
                    fill={active ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    strokeWidth={active ? 0 : 1.8}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
              },
              {
                key: 'cart' as Tab,
                badge: totalItems > 0 ? totalItems : undefined,
                icon: (active: boolean) => (
                  <svg
                    className="w-6 h-6"
                    fill={active ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    strokeWidth={active ? 0 : 1.8}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                    />
                  </svg>
                ),
              },
              {
                key: 'wallet' as Tab,
                badge: undefined as number | undefined,
                icon: (active: boolean) => (
                  <svg
                    className="w-6 h-6"
                    fill={active ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    strokeWidth={active ? 0 : 1.8}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={
                        active
                          ? 'M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.75 20.118a8.25 8.25 0 0 1 16.5 0v.382a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75v-.382Z'
                          : 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z'
                      }
                    />
                  </svg>
                ),
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                activeTab === tab.key
                  ? 'text-orange-600 bg-orange-50'
                  : 'text-black/70 hover:text-black'
              }`}
            >
              {tab.badge !== undefined && (
                <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
              {tab.icon(activeTab === tab.key)}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
