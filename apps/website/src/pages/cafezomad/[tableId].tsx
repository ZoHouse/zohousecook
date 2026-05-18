import { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Script from 'next/script'
import { useAuth, useProfile } from '@zo/auth'
import { supabase } from '../../config/supabase'
import { useFoodCreditBalance } from '../../hooks/useFoodCreditBalance'
import { BioHackTab } from '../../components/cafezomad/BioHackTab'
import { OrderStatusBadge } from '../../components/cafezomad/OrderStatusBadge'
import { formatPaise } from '../../components/cafezomad/types'
import type { MenuCategory, MenuItem, CafeOrderWithItems, CartItem, Tab } from '../../components/cafezomad/types'
import cafeZomadLogo from '../../assets/cafezomad/logo.png'
import appleTouchIcon from '../../components/cafezomad/assets/favicons/apple-touch-icon.png'
import cafezomadIcon192 from '../../components/cafezomad/assets/favicons/cafezomad-icon-192.png'
import cafezomadIcon512 from '../../components/cafezomad/assets/favicons/cafezomad-icon-512.png'

interface CreateRazorpayOrderResponse {
  razorpay_order_id: string
  amount: number
  currency: string
  key_id: string
  cafe_order_id: string
  display_number: number
  prefill: { name: string | null; contact: string | null; email: string | null }
}

function normalizePhone(phone: string | null | undefined): string | null {
  const normalized = (phone || '').replace(/\D/g, '').slice(-10)
  return normalized.length === 10 ? normalized : null
}

function cleanNickname(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/\.zo$/i, '').trim()
  return cleaned || null
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
  const { profile } = useProfile()

  // ── State ──────────────────────────────────────────────────────────────────
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [tableInfo, setTableInfo] = useState<{ code: string; label: string | null } | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<CafeOrderWithItems[]>([])
  const [isLoadingInit, setIsLoadingInit] = useState(true)
  // Per-property "accepting orders" gate — pulled from cafe_properties.
  // null = unknown (still loading); true = open; false = paused (kitchen
  // toggled it off via /pm/cafe/kitchen). When false we replace the menu/cart
  // surface with a closed splash so customers don't fill carts that the RPC
  // is just going to reject.
  const [acceptingOrders, setAcceptingOrders] = useState<boolean | null>(null)

  // Cart persisted in localStorage so it survives page refresh
  const cartKey = `cafezomad_cart_${tableId}`
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(cartKey)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [foodCreditAmount, setFoodCreditAmount] = useState(0)
  // Per-draft-order slider value (in rupees). Default falls back to the order's
  // existing food_credit_applied_paise / 100 when undefined.
  const [draftCreditOverrides, setDraftCreditOverrides] = useState<Record<string, number>>({})
  const [activeTab, setActiveTab] = useState<Tab>('menu')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  // Today's meal plan text per slot, read from cafe_meal_plans.notes. Shown
  // as the description of the matching "Breakfast" / "Lunch" / "Dinner" menu
  // items so customers see what's actually being served today.
  const [todayPlanText, setTodayPlanText] = useState<{ breakfast: string; lunch: string; dinner: string }>({
    breakfast: '', lunch: '', dinner: '',
  })
  const [isOrdering, setIsOrdering] = useState(false)
  const [paymentInFlight, setPaymentInFlight] = useState<{ orderId: string; status: 'opening' | 'awaiting' | 'confirming' } | null>(null)
  const [orderPlaced, setOrderPlaced] = useState<{ id: string; display_number: number; total: number; kitchen_status: string } | null>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)
  // Track today's sold count for items with daily_limit
  const [dailySold, setDailySold] = useState<Record<string, number>>({})

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Persist cart to localStorage on every change
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem(cartKey, JSON.stringify(cart))
    } else {
      localStorage.removeItem(cartKey)
    }
  }, [cart, cartKey])

  // $food credits
  const { balance: foodBalance, refresh: refreshFoodBalance } = useFoodCreditBalance(user?.mobile_number || null)

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

        // Fetch categories, items, and the property's accepting_orders flag
        // in parallel. The flag drives the closed-splash; if the cafe paused
        // ordering, we don't bother to render the menu at all.
        const [{ data: cats }, { data: items }, { data: prop }] = await Promise.all([
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
          supabase
            .from('cafe_properties')
            .select('accepting_orders')
            .eq('id', table.property_id)
            .maybeSingle(),
        ])

        setAcceptingOrders(prop?.accepting_orders ?? true)

        setCategories((cats as MenuCategory[]) || [])
        setMenuItems((items as MenuItem[]) || [])

        // Fetch today's sold counts for items with daily limits
        const limitedItems = ((items as MenuItem[]) || []).filter((i) => i.daily_limit != null)
        if (limitedItems.length > 0) {
          const now = new Date()
          const istOffset = 5.5 * 60 * 60 * 1000
          const istNow = new Date(now.getTime() + istOffset)
          const todayStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - istOffset)

          const { data: todayOrders } = await supabase
            .from('cafe_order_items')
            .select('menu_item_id, quantity, order:cafe_orders!inner(property_id, kitchen_status, created_at)')
            .in('menu_item_id', limitedItems.map((i) => i.id))
            .eq('item_status', 'active')
            .gte('order.created_at', todayStart.toISOString())
            .neq('order.kitchen_status', 'cancelled')

          if (todayOrders) {
            const counts: Record<string, number> = {}
            for (const row of todayOrders) {
              counts[row.menu_item_id] = (counts[row.menu_item_id] || 0) + row.quantity
            }
            setDailySold(counts)
          }
        }
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

  // ── Data: fetch + poll orders ─────────────────────────────────────────────
  // When logged in, strictly filter by the signed-in user's phone — session
  // storage IDs from a previous user on the same device are NOT included.
  // Without this guard, switching accounts on the same device leaks the
  // previous user's pending orders (and Razorpay prefill comes from those
  // orders' customer_phone, which is confusing).
  const fetchOrders = useCallback(async () => {
    let query = supabase
      .from('cafe_orders')
      .select('*, order_items:cafe_order_items(*)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (user?.id && propertyId) {
      const phoneCleaned = normalizePhone(user.mobile_number || null) || ''
      if (!phoneCleaned) {
        // Logged in but no phone → can't safely scope orders. Show none.
        setOrders([])
        return
      }
      query = query.eq('customer_phone', phoneCleaned).eq('property_id', propertyId)
    } else {
      setOrders([])
      return
    }

    const { data } = await query
    if (data) setOrders(data as CafeOrderWithItems[])
  }, [user?.id, user?.mobile_number, propertyId])

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

  // ── Today's meal plan text (drives the Breakfast/Lunch/Dinner descriptions)
  useEffect(() => {
    const fetchTodayPlan = () => {
      const d = new Date()
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      supabase
        .from('cafe_meal_plans')
        .select('meal_type, notes')
        .eq('date', today)
        .then(({ data }) => {
          const next = { breakfast: '', lunch: '', dinner: '' }
          for (const plan of (data || []) as { meal_type: 'breakfast' | 'lunch' | 'dinner'; notes: string | null }[]) {
            if (plan.meal_type in next) next[plan.meal_type] = plan.notes || ''
          }
          setTodayPlanText(next)
        })
    }
    fetchTodayPlan()
    const ch = supabase
      .channel('cafezomad-table-meal-plan')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafe_meal_plans' }, () => fetchTodayPlan())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const MAX_QTY_PER_ITEM = 10

  const requireLoginForOrdering = () => {
    if (isLoggedIn && user) return true
    showLoginModal(undefined, typeof window !== 'undefined' ? window.location.pathname : undefined)
    return false
  }

  const addToCart = (item: Pick<MenuItem, 'id' | 'name' | 'price'>) => {
    if (!requireLoginForOrdering()) return

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

  // Subscribe to a single cafe_orders row for the payment_status='paid' flip
  // that the Razorpay webhook (apps/pms/src/pages/api/cafe/razorpay-webhook.ts)
  // writes once payment.captured arrives. We unsubscribe as soon as we see it
  // (or after a timeout fallback that still completes the success state — the
  // existing 5s polling will catch up if Realtime is unreliable).
  const waitForPaymentCaptured = useCallback((cafeOrderId: string): Promise<void> => {
    return new Promise((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        try { channel.unsubscribe() } catch { /* noop */ }
        clearTimeout(fallback)
        resolve()
      }

      const channel = supabase
        .channel(`cafe_order_payment_${cafeOrderId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'cafe_orders', filter: `id=eq.${cafeOrderId}` },
          (payload: { new: { payment_status?: string } }) => {
            if (payload.new?.payment_status === 'paid') finish()
          },
        )
        .subscribe()

      // Fallback: after 30s, give up the realtime wait. The polling refresh
      // (every 5s when tab is visible) will surface the eventual state, and
      // we don't want to block the UI forever if Realtime is degraded.
      const fallback = setTimeout(finish, 30_000)
    })
  }, [])

  // Open Razorpay Checkout for an existing pending razorpay cafe_order. Used
  // both from the Place Order flow (right after RPC creates the row) and from
  // the "Complete payment" CTA on the orders tab when a customer dismissed the
  // modal earlier without paying.
  const openRazorpayCheckout = useCallback(async (cafeOrderId: string) => {
    setPaymentInFlight({ orderId: cafeOrderId, status: 'opening' })
    try {
      const resp = await fetch('/pm/api/cafe/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafe_order_id: cafeOrderId }),
      })

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({ error: 'Payment setup failed' }))
        throw new Error(errBody.error || 'Payment setup failed')
      }

      const cfg = (await resp.json()) as CreateRazorpayOrderResponse

      if (typeof window === 'undefined' || !window.Razorpay) {
        throw new Error('Payment SDK not loaded — refresh and try again')
      }

      setPaymentInFlight({ orderId: cafeOrderId, status: 'awaiting' })

      const checkout = new window.Razorpay({
        key: cfg.key_id,
        amount: cfg.amount,
        currency: cfg.currency,
        order_id: cfg.razorpay_order_id,
        name: 'Cafe Zomad',
        description: `Order #${cfg.display_number}`,
        notes: { cafe_order_id: cafeOrderId },
        prefill: {
          name: cfg.prefill.name || undefined,
          contact: cfg.prefill.contact || undefined,
          email: cfg.prefill.email || undefined,
        },
        theme: { color: '#f97316' },
        handler: async () => {
          // Razorpay says payment captured client-side. The webhook is the
          // server-side truth; wait for it to flip payment_status='paid'.
          setPaymentInFlight({ orderId: cafeOrderId, status: 'confirming' })
          await waitForPaymentCaptured(cafeOrderId)
          setPaymentInFlight(null)
          fetchOrders()
        },
        modal: {
          ondismiss: () => {
            // User closed the modal without paying. Order stays pending; the
            // orders tab will show the "Complete payment" CTA so they can
            // retry. We do NOT auto-cancel — staff sees it and can still
            // collect cash if the customer changes their mind.
            setPaymentInFlight(null)
          },
        },
      })
      checkout.open()
    } catch (err) {
      setPaymentInFlight(null)
      const msg = err instanceof Error ? err.message : 'Could not start payment'
      setErrorToast(msg)
      setTimeout(() => setErrorToast(null), 5000)
    }
  }, [fetchOrders, waitForPaymentCaptured])

  // Complete a draft order's payment. Reads the per-order slider state
  // (draftCreditOverrides) and, if the customer changed how many credits to
  // apply, calls update_cafe_order_food_credits to persist that delta before
  // kicking off Razorpay. If the new credit total fully covers the order,
  // the RPC flips it to zo_card/paid server-side and we skip Razorpay.
  const completeDraftPayment = useCallback(async (order: CafeOrderWithItems) => {
    // ceil — matches the slider rendering math (an over-cover order stores
    // food_credit_applied_paise above the order's net total).
    const existingCreditsRupees = Math.ceil((order.food_credit_applied_paise || 0) / 100)
    const localCreditsRupees = draftCreditOverrides[order.id] ?? existingCreditsRupees

    setPaymentInFlight({ orderId: order.id, status: 'opening' })
    try {
      if (localCreditsRupees !== existingCreditsRupees) {
        const newPaise = localCreditsRupees * 100
        const { data, error } = await supabase.rpc('update_cafe_order_food_credits', {
          p_cafe_order_id: order.id,
          p_food_credit_paise: newPaise,
        })
        if (error) {
          throw new Error(error.message.replace(/^.*RAISE EXCEPTION:\s*/, ''))
        }
        // Wallet balance just changed server-side; refresh the local hook.
        refreshFoodBalance()
        if (data?.payment_status === 'paid') {
          setPaymentInFlight(null)
          fetchOrders()
          return
        }
      }

      // Still need Razorpay for the remaining amount.
      await openRazorpayCheckout(order.id)
    } catch (err) {
      setPaymentInFlight(null)
      const msg = err instanceof Error ? err.message : 'Could not complete payment'
      setErrorToast(msg)
      setTimeout(() => setErrorToast(null), 5000)
    }
  }, [draftCreditOverrides, fetchOrders, refreshFoodBalance, openRazorpayCheckout])

  // ── Place Order (via server-side RPC — validates prices, limits, credits) ──
  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !propertyId || isOrdering) return

    // Require login before ordering
    if (!requireLoginForOrdering()) return
    const authUser = user
    if (!authUser) return

    setIsOrdering(true)
    try {
      const customerName = authUser.first_name
        ? `${authUser.first_name} ${authUser.last_name || ''}`.trim()
        : cleanNickname(profile?.selected_nickname)
          || cleanNickname(profile?.custom_nickname)
          || cleanNickname(profile?.ens_nickname)
          || cleanNickname(profile?.nickname)
          || null
      const customerPhone = normalizePhone(authUser.mobile_number || null)
      const customerEmail = authUser.email_address || null

      // Resolve payment mode: full credit coverage → 'zo_card' (no money
      // moves), else 'razorpay'. The RPC also enforces this server-side; we
      // pass an explicit value so 'razorpay' is the path even when amountToPay
      // is somehow misreported. 'cash' is no longer offered customer-side —
      // staff orders can still pick cash via CreateOrderDialog.
      const amountToPay = Math.max(0, totalAmount - foodCreditAmount * 100)
      const resolvedMode: 'razorpay' | 'cash' = amountToPay > 0 ? 'razorpay' : 'cash'

      // Call server-side RPC — all validation happens in Postgres:
      // • Checks item availability & uses server-side prices
      // • Enforces daily limits per item
      // • Validates food credits (actual debit happens on kitchen acceptance)
      const { data, error } = await supabase.rpc('place_cafe_order', {
        p_property_id: propertyId,
        p_table_id: tableId,
        p_customer_name: customerName,
        p_customer_phone: customerPhone,
        p_customer_email: customerEmail,
        p_zo_user_id: authUser.id || null,
        p_items: cart.map((c) => ({
          menu_item_id: c.menu_item_id,
          quantity: c.quantity,
        })),
        p_food_credit_paise: foodCreditAmount * 100,
        p_payment_mode: resolvedMode,
      })

      if (error) {
        // Parse Postgres exception messages into user-friendly text
        const msg = error.message || 'Failed to place order'
        throw new Error(msg.replace(/^.*RAISE EXCEPTION:\s*/, ''))
      }

      // Success — save order ID to this session
      saveOrderId(data.id)
      setCart([])
      setFoodCreditAmount(0)
      setOrderPlaced({
        id: data.id,
        display_number: data.display_number,
        total: data.total,
        kitchen_status: data.kitchen_status,
      })
      setActiveTab('orders')
      fetchOrders()

      // If the resolved mode is Razorpay AND the order still owes money,
      // open Checkout immediately. Full-credit-coverage rows resolve to
      // 'zo_card' server-side and skip this branch.
      if (data.payment_mode === 'razorpay' && data.total > 0) {
        // Don't await — let the modal lifecycle handle setIsOrdering state
        // via paymentInFlight; we still want to clear the cart UI immediately.
        openRazorpayCheckout(data.id)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to place order'
      setErrorToast(msg)
      setTimeout(() => setErrorToast(null), 5000)
    } finally {
      setIsOrdering(false)
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  // Drafts are unpaid — they were never sent to the kitchen. Bucket them
  // separately so the "Being Prepared" header reflects actual kitchen flow.
  // Hide ancient abandoned drafts from the customer view — Razorpay only keeps
  // a payment session alive ~15min, so anything older won't reopen anyway.
  const awaitingPaymentOrders = orders.filter(
    (o) => o.kitchen_status === 'draft' && (Date.now() - new Date(o.created_at).getTime()) < 60 * 60 * 1000
  )
  const prepOrders = orders.filter(
    (o) => o.kitchen_status && ['new', 'accepted', 'preparing'].includes(o.kitchen_status)
  )
  const activeOrders = [...awaitingPaymentOrders, ...prepOrders]
  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0)
  // Cart math: subtotal is the sum of item prices (paise); GST is 5% of
  // subtotal floored to nearest paise — must match place_cafe_order RPC's
  // `v_tax_amount := floor(v_cart_total * 0.05)`. totalAmount is what we
  // actually collect — every UI amount must derive from it, never from the
  // subtotal alone, or the FE undercharges visually vs what Razorpay debits.
  const cartSubtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0)
  const cartTaxAmount = Math.floor(cartSubtotal * 0.05)
  const totalAmount = cartSubtotal + cartTaxAmount

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
      <div className="flex flex-col h-screen bg-[#f5f0e8]">
        {/* Skeleton header */}
        <div className="shrink-0 bg-orange-500 px-5 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/30 animate-pulse" />
            <div className="h-5 w-28 bg-white/30 rounded animate-pulse" />
          </div>
          <div className="h-3 w-40 bg-white/20 rounded mt-1.5 animate-pulse" />
        </div>
        {/* Skeleton category tabs */}
        <div className="flex gap-2 px-4 py-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 bg-black/5 rounded-full animate-pulse" />
          ))}
        </div>
        {/* Skeleton menu cards */}
        <div className="grid grid-cols-2 gap-3 px-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl ring-1 ring-black/5 p-3 animate-pulse">
              <div className="w-full h-24 bg-black/5 rounded-xl mb-2" />
              <div className="h-4 w-3/4 bg-black/10 rounded mb-1" />
              <div className="h-3 w-1/2 bg-black/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Closed splash — staff has paused orders for this property ────────────
  if (acceptingOrders === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f0e8] px-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white p-3 mb-6 shadow-xl shadow-black/10">
          <img src={cafeZomadLogo.src} alt="Cafe Zomad" className="w-full h-full object-contain" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 ring-1 ring-red-200 mb-4">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-red-700">Closed</span>
        </div>
        <h1 className="text-2xl font-extrabold text-black mb-2">We're not taking orders right now</h1>
        <p className="text-sm text-black/50 font-medium max-w-xs mb-6">
          The kitchen has paused new orders for the moment. Try again in a bit, or come over to the counter — staff can help in person.
        </p>
        <p className="text-[10px] text-black/30 font-mono uppercase tracking-widest">
          Table {tableInfo?.label || tableInfo?.code || '—'}
        </p>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen tap-transparent bg-[#f5f0e8]">
      <Head>
        <link rel="apple-touch-icon" href={appleTouchIcon.src} />
        <link rel="apple-touch-icon" sizes="180x180" href={appleTouchIcon.src} />
        <link rel="icon" type="image/png" sizes="192x192" href={cafezomadIcon192.src} />
        <link rel="icon" type="image/png" sizes="512x512" href={cafezomadIcon512.src} />
        <meta name="apple-mobile-web-app-title" content="Cafe Zomad" />
      </Head>
      {/* Razorpay Checkout — lazy-loaded; window.Razorpay populated on script ready */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="shrink-0 bg-orange-500 px-5 pt-4 pb-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <img src={cafeZomadLogo.src} alt="Cafe Zomad" className="w-9 h-9 rounded-2xl object-contain bg-white p-1" />
              <h1 className="text-xl font-extrabold tracking-tight text-black">Cafe Zomad</h1>
            </div>
            <p className="text-[11px] text-black/60 font-medium tracking-[0.15em] uppercase mt-0.5 ml-[46px]">
              Table {tableInfo?.label || tableInfo?.code || '...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn && user ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 rounded-full">
                <span className="text-[11px] font-semibold text-black/70">
                  {user.first_name
                    || cleanNickname(profile?.selected_nickname)
                    || cleanNickname(profile?.custom_nickname)
                    || cleanNickname(profile?.ens_nickname)
                    || cleanNickname(profile?.nickname)
                    || user.mobile_number
                    || 'Guest'}
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
        <div
          className="fixed top-4 left-4 right-4 z-50 bg-green-500 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-black/20 cursor-pointer"
          onClick={() => setOrderPlaced(null)}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">Order #{orderPlaced.display_number} placed!</div>
              <div className="text-xs text-white/80 mt-0.5">
                {orderPlaced.kitchen_status === 'draft'
                  ? `Pay ${formatPaise(orderPlaced.total)} to send to kitchen`
                  : `Kitchen has been notified · ${formatPaise(orderPlaced.total)}`}
              </div>
            </div>
            <svg className="w-5 h-5 text-white/60 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
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
      <div className="flex-1 overflow-y-auto pb-28 max-w-7xl mx-auto w-full">

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

                    {/* Item cards — auto-fill so card width stays consistent regardless of item count */}
                    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                      {items.map((item) => {
                        const inCart = cart.find((c) => c.menu_item_id === item.id)
                        // If this item's name matches a meal slot, surface today's
                        // plan text from cafe_meal_plans.notes so the customer sees
                        // what's actually being served (e.g. "puri chole - tea").
                        const nameKey = item.name.trim().toLowerCase()
                        const planText =
                          nameKey === 'breakfast' ? todayPlanText.breakfast :
                          nameKey === 'lunch' ? todayPlanText.lunch :
                          nameKey === 'dinner' ? todayPlanText.dinner : ''
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
                              {planText && (
                                <p className="text-xs text-black/70 font-medium leading-relaxed mt-1.5">
                                  {planText}
                                </p>
                              )}
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

        {/* ── ORDERS TAB (cart + active orders + past orders) ────────────── */}
        {activeTab === 'orders' && (
          <div className="px-4 py-4 space-y-4">

            {/* Active orders — drafts (unpaid) and kitchen-flow are rendered as separate sections */}
            {([
              { title: 'Awaiting Payment', list: awaitingPaymentOrders },
              { title: 'Being Prepared', list: prepOrders },
            ] as const).map((group) => group.list.length > 0 && (
              <div key={group.title} className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4">
                <h3 className="text-xs font-bold text-black/60 uppercase tracking-widest mb-3">
                  {group.title}
                </h3>
                <div className="space-y-3">
                  {group.list.map((order) => {
                    const needsPayment = order.payment_mode === 'razorpay' && order.payment_status === 'pending'
                    const isThisInFlight = paymentInFlight?.orderId === order.id

                    // Multi-economy display + draft retry slider math:
                    //   orderGross        = subtotal + service_charge + tax  (gross)
                    //   credit            = $food currently applied to this row (paise)
                    //   dueAfterCredit    = cafe_orders.total = the Razorpay/cash leg
                    //   localCreditsRupees = slider value, defaults to existing applied
                    //   newDuePaise       = recomputed due if user changes the slider
                    const orderGross = order.subtotal + order.service_charge + order.tax_amount
                    const credit = order.food_credit_applied_paise || 0
                    const dueAfterCredit = order.total
                    // ceil — let credits absorb the GST paise tail so a ₹52.50
                    // order can be fully covered with 53 rupees of $food rather
                    // than getting stuck with ₹0.50 below Razorpay's ₹1 minimum.
                    const existingCreditsRupees = Math.ceil(credit / 100)
                    const maxCreditsRupees = needsPayment
                      ? Math.min(foodBalance + existingCreditsRupees, Math.ceil(orderGross / 100))
                      : 0
                    const localCreditsRupees = draftCreditOverrides[order.id] ?? existingCreditsRupees
                    const newDuePaise = Math.max(0, orderGross - localCreditsRupees * 100)
                    const showSlider = needsPayment && maxCreditsRupees > 0

                    return (
                      <div key={order.id} className="rounded-xl bg-orange-50 ring-1 ring-orange-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-bold text-sm text-black">#{order.display_number}</span>
                          <OrderStatusBadge status={order.kitchen_status} />
                        </div>
                        <div className="space-y-1">
                          {order.order_items?.map((item) => (
                            <div key={item.id} className="flex justify-between text-xs">
                              <span className="text-black/50 font-medium">
                                <span className="font-mono font-semibold">{item.quantity}×</span> {item.name}
                              </span>
                              <span className="font-semibold text-black/70">{formatPaise(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-black/5 space-y-0.5">
                          <div className="flex justify-between items-center text-[11px] text-black/40 font-medium font-mono">
                            <span>Subtotal</span>
                            <span>{formatPaise(order.subtotal)}</span>
                          </div>
                          {order.tax_amount > 0 && (
                            <div className="flex justify-between items-center text-[11px] text-black/40 font-medium font-mono">
                              <span>GST (5%)</span>
                              <span>{formatPaise(order.tax_amount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-sm text-black font-semibold">
                            <span>Order Total</span>
                            <span>{formatPaise(orderGross)}</span>
                          </div>
                          {credit > 0 && (
                            <>
                              <div className="flex justify-between items-center text-[11px] text-orange-600 font-medium font-mono">
                                <span>$food applied</span>
                                <span>−{formatPaise(credit)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm font-bold pt-0.5 border-t border-black/5">
                                <span className="text-black">
                                  {order.payment_status === 'paid' ? 'Paid' : 'To Pay'}
                                </span>
                                <span className={order.payment_status === 'paid' ? 'text-green-700' : 'text-black'}>
                                  {formatPaise(dueAfterCredit)}
                                </span>
                              </div>
                            </>
                          )}
                          <p className="text-[10px] text-black/30 font-mono mt-1">
                            placed {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {showSlider && (
                          <div className="mt-3 rounded-xl bg-black p-3">
                            <div className="flex justify-between mb-1.5">
                              <span className="text-orange-400 font-semibold text-xs">Apply $food</span>
                              <span className="text-orange-400 font-mono font-bold text-xs">balance ₹{foodBalance + existingCreditsRupees}</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={maxCreditsRupees}
                              value={localCreditsRupees}
                              disabled={paymentInFlight !== null}
                              onChange={(e) => setDraftCreditOverrides((prev) => ({ ...prev, [order.id]: Number(e.target.value) }))}
                              className="w-full"
                              style={{ accentColor: '#f97316' }}
                            />
                            <div className="flex justify-between text-[11px] mt-1">
                              <span className="text-white/50">Apply: ₹{localCreditsRupees}</span>
                              <span className="text-white font-semibold">To pay: {formatPaise(newDuePaise)}</span>
                            </div>
                          </div>
                        )}

                        {needsPayment && (
                          <button
                            onClick={() => completeDraftPayment(order)}
                            disabled={paymentInFlight !== null}
                            className="w-full mt-3 bg-orange-500 text-black py-2.5 text-sm font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                          >
                            {isThisInFlight && paymentInFlight?.status === 'opening' && 'Opening Payment…'}
                            {isThisInFlight && paymentInFlight?.status === 'awaiting' && 'Waiting in Razorpay…'}
                            {isThisInFlight && paymentInFlight?.status === 'confirming' && 'Confirming Payment…'}
                            {!isThisInFlight && (
                              newDuePaise === 0
                                ? `Confirm Order · ₹0 due`
                                : `Pay ${formatPaise(newDuePaise)} · UPI / Card`
                            )}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Cart (new order) */}
            {cart.length > 0 ? (
              <>
                <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4">
                  <h3 className="text-xs font-bold text-black/60 uppercase tracking-widest mb-3">
                    New Order
                  </h3>
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.menu_item_id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-black truncate">{item.name}</p>
                          <p className="text-xs text-black/45 font-medium">{formatPaise(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center rounded-xl bg-black/5 overflow-hidden ring-1 ring-black/10">
                            <button onClick={() => removeFromCart(item.menu_item_id)} className="w-8 h-8 flex items-center justify-center font-bold text-black active:bg-black/10">-</button>
                            <span className="font-bold text-sm font-mono w-5 text-center text-black">{item.quantity}</span>
                            <button onClick={() => addToCart({ id: item.menu_item_id, name: item.name, price: item.price })} className="w-8 h-8 flex items-center justify-center font-bold text-black active:bg-black/10">+</button>
                          </div>
                          <span className="font-bold text-sm w-14 text-right text-black">{formatPaise(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill summary */}
                <div className="rounded-2xl bg-yellow-200 ring-1 ring-black/10 p-4 space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-black/60 font-medium">Subtotal</span>
                    <span className="font-mono font-semibold text-black/70">{formatPaise(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-black/60 font-medium">GST (5%)</span>
                    <span className="font-mono font-semibold text-black/70">{formatPaise(cartTaxAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 mt-1 border-t border-black/10">
                    <span className="font-bold text-black">Total</span>
                    <span className="text-xl font-extrabold text-black">{formatPaise(totalAmount)}</span>
                  </div>
                </div>

                {/* $food Credits slider */}
                {foodBalance > 0 && (
                  <div className="rounded-2xl bg-black p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-orange-400 font-semibold text-sm">$food Balance</span>
                      <span className="text-orange-400 font-mono font-bold">{foodBalance}</span>
                    </div>
                    <input type="range" min={0} max={Math.min(foodBalance, Math.ceil(totalAmount / 100))} value={foodCreditAmount} onChange={(e) => setFoodCreditAmount(Number(e.target.value))} className="w-full" style={{ accentColor: '#f97316' }} />
                    <div className="flex justify-between text-xs mt-2">
                      <span className="text-white/50">Apply: ₹{foodCreditAmount}</span>
                      <span className="text-white font-semibold">To pay: {formatPaise(Math.max(0, totalAmount - foodCreditAmount * 100))}</span>
                    </div>
                  </div>
                )}

                {/* Place Order — Razorpay handles every paid order; the only no-payment
                    path is full food-credit coverage (RPC resolves that to 'zo_card'). */}
                <button onClick={handlePlaceOrder} disabled={isOrdering || paymentInFlight !== null} className="w-full bg-orange-500 text-black py-4 text-base font-bold tracking-wide rounded-2xl shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all disabled:opacity-50">
                  {(() => {
                    if (isOrdering) return 'Placing Order...'
                    const due = totalAmount - foodCreditAmount * 100
                    if (due <= 0) return `Place Order · ${formatPaise(0)} due`
                    return `Pay ${formatPaise(due)} · UPI / Card`
                  })()}
                </button>
                <p className="text-center text-xs text-black/35 font-medium">
                  {(() => {
                    const due = totalAmount - foodCreditAmount * 100
                    if (due <= 0) return foodCreditAmount > 0 ? `₹${foodCreditAmount} $food covers your order` : 'Order is free — no payment needed'
                    return foodCreditAmount > 0 ? `₹${foodCreditAmount} $food applied · pay rest via Razorpay` : 'Razorpay opens after you tap'
                  })()}
                </p>
              </>
            ) : activeOrders.length === 0 && orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <svg className="w-12 h-12 text-black/20" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                <p className="text-black/35 font-medium">No orders yet</p>
                <button onClick={() => setActiveTab('menu')} className="mt-2 px-5 py-2.5 bg-orange-500 text-black text-sm font-bold rounded-xl active:scale-95 transition-all">
                  Browse Menu
                </button>
              </div>
            ) : null}

            {/* History — served, ready (waiting at counter), and cancelled.
                Cancelled orders included so customers don't think they
                vanished (Akhilesh's feedback). */}
            {orders.filter((o) => o.kitchen_status && ['ready', 'served', 'cancelled'].includes(o.kitchen_status)).length > 0 && (
              <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4">
                <h3 className="text-xs font-bold text-black/60 uppercase tracking-widest mb-3">History</h3>
                <div className="space-y-3">
                  {orders.filter((o) => o.kitchen_status && ['ready', 'served', 'cancelled'].includes(o.kitchen_status)).map((order) => {
                    const orderGross = order.subtotal + order.service_charge + order.tax_amount
                    const credit = order.food_credit_applied_paise || 0
                    const isCancelled = order.kitchen_status === 'cancelled'
                    return (
                      <div key={order.id} className={`rounded-xl ring-1 p-3 ${isCancelled ? 'bg-red-50/40 ring-red-200' : 'bg-black/[0.02] ring-black/5'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-sm text-black">#{order.display_number}</span>
                          <OrderStatusBadge status={order.kitchen_status} />
                        </div>
                        <p className="text-xs text-black/50 font-medium truncate">
                          {order.order_items?.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                        </p>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-[10px] text-black/30 font-mono">
                            {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`font-bold text-sm ${isCancelled ? 'text-black/40 line-through' : 'text-black'}`}>{formatPaise(orderGross)}</span>
                        </div>
                        {credit > 0 && !isCancelled && (
                          <p className="text-[10px] text-black/40 font-medium font-mono text-right mt-0.5">
                            {formatPaise(credit)} $food + {formatPaise(orderGross - credit)} {order.payment_status === 'paid' ? 'paid' : 'due'}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
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

      {/* ── Go to Cart floating bar — centered, capped width ──────────────────── */}
      {totalItems > 0 && activeTab === 'menu' && (
        <div className="fixed bottom-24 inset-x-0 z-50 px-5 pointer-events-none">
          <button
            onClick={() => {
              if (requireLoginForOrdering()) setActiveTab('orders')
            }}
            className="pointer-events-auto max-w-2xl mx-auto w-full bg-orange-500 text-black px-5 py-3.5 rounded-2xl shadow-2xl shadow-orange-500/30 flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="bg-black text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
              <span className="font-bold text-sm">View Cart</span>
            </div>
            <span className="font-extrabold text-base">{formatPaise(totalAmount)}</span>
          </button>
        </div>
      )}

      {/* ── Bottom Navigation — centered, capped width ────────────────────────── */}
      <nav className="shrink-0 fixed bottom-5 inset-x-0 z-40 px-5 pointer-events-none">
        <div className="pointer-events-auto max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-full ring-1 ring-black/10 shadow-2xl shadow-black/20 flex items-center justify-around h-14">
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
                key: 'orders' as Tab,
                label: 'Orders',
                badge: (totalItems + activeOrders.length) > 0 ? (totalItems + activeOrders.length) : undefined,
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
              onClick={() => {
                if (tab.key === 'orders' && !requireLoginForOrdering()) return
                setActiveTab(tab.key)
              }}
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
