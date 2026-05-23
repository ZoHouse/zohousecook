import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Script from 'next/script'
import { useAuth, useProfile } from '@zo/auth'
import { supabase } from '../../config/supabase'
import { useFoodCreditBalance } from '../../hooks/useFoodCreditBalance'
import { useCafePersistentCart } from '../../hooks/useCafePersistentCart'
import { useCafeCustomerOrders } from '../../hooks/useCafeCustomerOrders'
import { BioHackTab } from '../../components/cafezomad/BioHackTab'
import { OrderStatusBadge } from '../../components/cafezomad/OrderStatusBadge'
import { formatPaise } from '../../components/cafezomad/types'
import type { MenuCategory, MenuItem, CafeOrderWithItems, Tab } from '../../components/cafezomad/types'
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
      <div
        className="flex items-center justify-center h-screen bg-[#f5f0e8] bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.93), rgba(255, 255, 255, 0.93)), url('/zomad-bg.png')" }}
      >
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
  const [menuLoaded, setMenuLoaded] = useState(false)
  const [isLoadingInit, setIsLoadingInit] = useState(true)
  // Per-property "accepting orders" gate — pulled from cafe_properties.
  // null = unknown (still loading); true = open; false = paused (kitchen
  // toggled it off via /pm/cafe/kitchen). When false we replace the menu/cart
  // surface with a closed splash so customers don't fill carts that the RPC
  // is just going to reject.
  const [acceptingOrders, setAcceptingOrders] = useState<boolean | null>(null)

  // Cart — DB-backed per zo_user_id, surviving table/device/day switches.
  // The legacy per-table localStorage cart is migrated into the DB row on
  // first hydrate after login (handled inside the hook).
  const zoUserIdForCart = isLoggedIn ? user?.id || null : null
  const {
    cart,
    setCart,
    clearCart,
    staleNotice: cartStaleNotice,
    dismissStaleNotice: dismissCartStaleNotice,
  } = useCafePersistentCart({
    zoUserId: zoUserIdForCart,
    propertyId,
    tableId,
    availableItems: menuItems,
    menuLoaded,
  })
  const [foodCreditAmount, setFoodCreditAmount] = useState(0)
  // Customer note to the kitchen — free-text, optional. Saved on the
  // cafe_orders.notes column via place_cafe_order's p_notes param. Reset
  // when the cart clears (after a successful order).
  const [customerNotes, setCustomerNotes] = useState('')
  // Per-draft-order slider value (in rupees). Default falls back to the order's
  // existing food_credit_applied_paise / 100 when undefined.
  const [draftCreditOverrides, setDraftCreditOverrides] = useState<Record<string, number>>({})
  const [activeTab, setActiveTab] = useState<Tab>('menu')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  // Single scroll container is shared across tabs, so switching tabs would
  // otherwise inherit the previous tab's scroll position (users on a
  // scrolled-down Menu tap "View Cart" and land on the cart already scrolled
  // past the items). Reset scrollTop=0 on every tab change.
  const mainScrollRef = useRef<HTMLDivElement | null>(null)
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
  const [errorToast, setErrorToast] = useState<string | null>(null)
  // Track today's sold count for items with daily_limit
  const [dailySold, setDailySold] = useState<Record<string, number>>({})
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')

  // Reset scroll to top whenever the user switches tabs. Without this, a
  // scrolled-down Menu tab leaks its scroll position into Cart/Orders/Wallet
  // and users land mid-page (or past the bottom) on the new tab.
  useEffect(() => {
    if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0
  }, [activeTab])

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
            .is('deleted_at', null)
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
        setMenuLoaded(true)

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
        supabase.from('cafe_menu_items').select('*').eq('property_id', propertyId).eq('is_available', true).is('deleted_at', null).order('sort_order'),
      ])
      if (cats) setCategories(cats as MenuCategory[])
      if (items) setMenuItems(items as MenuItem[])
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [propertyId])

  // ── Orders feed — paginated 10/page + Load More, visibility-aware polling.
  // Replaces the old 20-row hard-capped fetch that hid any history beyond
  // the most recent twenty orders. Scoped to the logged-in user's
  // zo_user_id + current property.
  const {
    orders,
    isLoading: ordersLoading,
    hasMore: hasMoreOrders,
    loadMore: loadMoreOrders,
    refetch: refetchOrders,
    appendLocalOrder,
  } = useCafeCustomerOrders({
    zoUserId: isLoggedIn ? user?.id || null : null,
    propertyId,
  })

  // ── Today's meal plan description — derived from the items actually
  // attached to each B/L/D slot (cafe_meal_plan_items → cafe_menu_items.name).
  // The notes column is no longer the source; items are.
  useEffect(() => {
    const fetchTodayPlan = () => {
      const d = new Date()
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      supabase
        .from('cafe_meal_plans')
        .select('meal_type, items:cafe_meal_plan_items(menu_item:cafe_menu_items(name))')
        .eq('date', today)
        .then(({ data }) => {
          const next = { breakfast: '', lunch: '', dinner: '' }
          // See menu.tsx — Supabase types many-to-one joins as arrays even
          // though runtime returns a single object. Handle both shapes.
          type JoinedMenuItem = { name: string } | { name: string }[] | null
          type Row = { meal_type: 'breakfast' | 'lunch' | 'dinner'; items: { menu_item: JoinedMenuItem }[] }
          for (const plan of (data || []) as unknown as Row[]) {
            if (plan.meal_type in next) {
              const names = (plan.items || [])
                .map((i) => {
                  const mi = i.menu_item
                  if (!mi) return undefined
                  return Array.isArray(mi) ? mi[0]?.name : mi.name
                })
                .filter((n): n is string => Boolean(n))
              next[plan.meal_type] = names.join(', ')
            }
          }
          setTodayPlanText(next)
        })
    }
    fetchTodayPlan()
    const ch = supabase
      .channel('cafezomad-table-meal-plan')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafe_meal_plans' }, () => fetchTodayPlan())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafe_meal_plan_items' }, () => fetchTodayPlan())
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
          refetchOrders()
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
  }, [refetchOrders, waitForPaymentCaptured])

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
          refetchOrders()
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
  }, [draftCreditOverrides, refetchOrders, refreshFoodBalance, openRazorpayCheckout])

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
        p_notes: customerNotes.trim() || null,
      })

      if (error) {
        // Parse Postgres exception messages into user-friendly text
        const msg = error.message || 'Failed to place order'
        throw new Error(msg.replace(/^.*RAISE EXCEPTION:\s*/, ''))
      }

      // Success — clear the persistent cart and surface the new order in the
      // Orders feed immediately (the next poll will reconcile authoritative
      // server state).
      await clearCart()
      setFoodCreditAmount(0)
      setCustomerNotes('')
      setOrderPlaced({
        id: data.id,
        display_number: data.display_number,
        total: data.total,
        kitchen_status: data.kitchen_status,
      })
      setActiveTab('orders')
      appendLocalOrder(data as CafeOrderWithItems)
      refetchOrders()

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
  const activeOrders = orders.filter(
    (o) => o.kitchen_status && !['ready', 'served', 'cancelled'].includes(o.kitchen_status)
  )
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

  // Only categories that actually contain at least one menu item — keeps the
  // sticky chip strip from listing empty sections.
  const visibleCategories = useMemo(() => {
    const present = new Set(menuItems.map((m) => m.category_id))
    return categories.filter((c) => present.has(c.id))
  }, [categories, menuItems])

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (isLoadingInit || !propertyId) {
    return (
      <div
        className="flex flex-col h-screen bg-[#f5f0e8] bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.93), rgba(255, 255, 255, 0.93)), url('/zomad-bg.png')" }}
      >
        {/* Skeleton header */}
        <div className="shrink-0 bg-[#F1563F] px-5 pt-4 pb-3">
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
      <div
        className="flex flex-col items-center justify-center min-h-screen bg-[#f5f0e8] bg-cover bg-center px-6 text-center"
        style={{ backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.93), rgba(255, 255, 255, 0.93)), url('/zomad-bg.png')" }}
      >
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
    <div
      className="flex flex-col h-screen tap-transparent bg-[#f5f0e8] bg-cover bg-center"
      style={{ backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.93), rgba(255, 255, 255, 0.93)), url('/zomad-bg.png')" }}
    >
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
      <header className="shrink-0 bg-[#F1563F] px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <img src={cafeZomadLogo.src} alt="Cafe Zomad" className="w-9 h-9 rounded-2xl object-contain bg-white p-1" />
              <h1 className="font-serif text-2xl font-semibold italic tracking-tight text-white leading-none">Cafe Zomad</h1>
            </div>
            <p className="text-[11px] text-white/70 font-medium tracking-[0.15em] uppercase mt-0.5 ml-[46px]">
              Table {tableInfo?.label || tableInfo?.code || '...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn && user ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 ring-1 ring-white/20 rounded-full">
                <span className="text-[11px] font-semibold text-white/90">
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
      <div ref={mainScrollRef} className={`flex-1 overflow-y-auto hide-scrollbar ${totalItems > 0 && activeTab === 'menu' ? 'pb-44' : 'pb-28'}`}>

        {/* ── MENU TAB ──────────────────────────────────────────────────────── */}
        {activeTab === 'menu' && (
          <>
            {/* Sticky header: persistent search input + category chip strip.
                Both live in one sticky wrapper so they move as a unit and the
                chip strip never floats free above the menu when the user
                scrolls past the search box. */}
            <div className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-black/5">
              {/* Search bar — always visible, no toggle. */}
              <div className="px-4 pt-2.5 pb-2">
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
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu..."
                    className="w-full pl-9 pr-9 py-2.5 text-sm bg-white rounded-2xl ring-1 ring-black/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F1563F]/40 placeholder:text-black/30"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                      aria-label="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Category chip strip — sits directly under the search bar. */}
              {visibleCategories.length > 0 && (
                <div className="px-3 pb-2">
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
                    <button
                      onClick={() => setActiveCategory(null)}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                        !activeCategory
                          ? 'bg-[#F1563F] text-white shadow-sm shadow-[#F1563F]/30'
                          : 'bg-white text-black/70 ring-1 ring-black/10'
                      }`}
                    >
                      All
                    </button>
                    {visibleCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                          activeCategory === cat.id
                            ? 'bg-[#F1563F] text-white shadow-sm shadow-[#F1563F]/30'
                            : 'bg-white text-black/70 ring-1 ring-black/10'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Category overlay FAB — full list, useful when there are many
                categories and the strip scrolls horizontally. */}
            <div className={`fixed ${totalItems > 0 ? 'bottom-44' : 'bottom-24'} right-4 z-50 flex flex-col items-end gap-2`}>
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
                          ? 'bg-[#F1563F] text-white font-semibold'
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
                            ? 'bg-[#F1563F] text-white font-semibold'
                            : 'text-black/70 hover:bg-black/5'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={() => setShowCategories((v) => !v)}
                className="w-12 h-12 bg-[#F1563F] text-white rounded-full shadow-lg shadow-[#F1563F]/40 flex items-center justify-center active:scale-95 transition-all"
                aria-label="Open category list"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6h16.5M3.75 12h16.5M3.75 18h16.5" />
                </svg>
              </button>
            </div>

            {/* Menu items grouped by category — Swiggy-style image-right cards.
                Replaces the prior 2-col grid which crowded diet dot, name,
                description, price, calories, macros, and ADD into one tile. */}
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
                    {!activeCategory && (
                      <div className="flex items-center gap-3 pt-3 first:pt-0">
                        <div className="flex-1 h-px bg-[#F1563F]/40" />
                        <h2 className="font-serif text-xl font-semibold italic text-[#F1563F] shrink-0">
                          {name}
                        </h2>
                        <div className="flex-1 h-px bg-[#F1563F]/40" />
                      </div>
                    )}

                    {items.map((item) => {
                      const inCart = cart.find((c) => c.menu_item_id === item.id)
                      const nameKey = item.name.trim().toLowerCase()
                      const planText =
                        nameKey === 'breakfast' ? todayPlanText.breakfast :
                        nameKey === 'lunch' ? todayPlanText.lunch :
                        nameKey === 'dinner' ? todayPlanText.dinner : ''
                      return (
                        <div
                          key={item.id}
                          onClick={() => setDetailItem(item)}
                          className="flex gap-4 p-3 rounded-2xl bg-white ring-1 ring-black/10 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
                        >
                          {/* Text column */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-block w-3 h-3 rounded-sm shrink-0 ring-1 ${
                                    item.diet === 'veg'
                                      ? 'ring-green-600'
                                      : item.diet === 'egg'
                                      ? 'ring-yellow-600'
                                      : 'ring-red-600'
                                  }`}
                                >
                                  <span
                                    className={`block w-full h-full rounded-full scale-50 ${
                                      item.diet === 'veg'
                                        ? 'bg-green-600'
                                        : item.diet === 'egg'
                                        ? 'bg-yellow-500'
                                        : 'bg-red-600'
                                    }`}
                                  />
                                </span>
                                <h3 className="font-serif text-lg font-semibold text-black tracking-tight leading-snug">
                                  {item.name}
                                </h3>
                              </div>
                              {planText && (
                                <p className="text-[13px] text-black/70 font-medium mt-1 line-clamp-2 leading-snug">
                                  {planText}
                                </p>
                              )}
                            </div>
                            <div className="flex items-baseline gap-2 mt-2">
                              <span className="text-base font-extrabold text-black">
                                {formatPaise(item.price)}
                              </span>
                            </div>
                          </div>

                          {/* Image column + ADD overlay */}
                          <div className="shrink-0 w-28 h-28 relative">
                            <div className="absolute inset-0 rounded-2xl overflow-hidden ring-1 ring-black/10 bg-stone-200">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-black/30">
                                  <span className="text-2xl font-extrabold tracking-tight">
                                    {item.name.slice(0, 1).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                              {!inCart ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); addToCart(item) }}
                                  className="px-3 h-7 bg-white text-[#F1563F] text-[11px] font-extrabold uppercase tracking-wider rounded-md ring-1 ring-black/10 shadow-md shadow-black/15 active:scale-95 transition-all"
                                >
                                  ADD
                                </button>
                              ) : (
                                <div onClick={(e) => e.stopPropagation()} className="flex items-center bg-white rounded-md ring-1 ring-black/10 shadow-md shadow-black/15 overflow-hidden">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeFromCart(item.id) }}
                                    className="w-6 h-7 flex items-center justify-center text-[#F1563F] font-bold text-sm active:bg-black/5"
                                  >
                                    −
                                  </button>
                                  <span className="text-[#F1563F] font-extrabold text-[11px] font-mono w-4 text-center">
                                    {inCart.quantity}
                                  </span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); addToCart(item) }}
                                    className="w-6 h-7 flex items-center justify-center text-[#F1563F] font-bold text-sm active:bg-black/5"
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
                ))
              })()}
            </div>
          </>
        )}

        {/* ── CART TAB ──────────────────────────────────────────────────────
            Dedicated tab for the new order being assembled. Stale-item
            notice, line items, bill summary, $food slider, kitchen note,
            and Place Order all live here. The Orders tab tracks orders
            that have already been placed. */}
        {activeTab === 'cart' && (
          <div className="px-4 py-4 space-y-4">

            {/* Stale items notice — items removed from menu since they were added */}
            {cartStaleNotice && (
              <div className="rounded-2xl bg-white ring-1 ring-[#F1563F]/40 px-4 py-3 flex items-start gap-3">
                <span className="text-[#F1563F] text-sm font-bold mt-0.5">!</span>
                <p className="flex-1 text-sm text-black font-medium leading-snug">
                  {cartStaleNotice}
                </p>
                <button
                  onClick={dismissCartStaleNotice}
                  className="text-black/40 hover:text-black"
                  aria-label="Dismiss"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {cart.length > 0 ? (
              <>
                <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4">
                  <h3 className="font-serif text-lg font-semibold italic text-black/80 mb-3">
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
                <div className="rounded-2xl bg-white ring-1 ring-black/10 p-4 space-y-1">
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
                  <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-black/45">$food Balance</div>
                        <div className="text-xl font-extrabold text-[#F1563F] font-mono leading-none mt-1">{foodBalance}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-black/45">Applying</div>
                        <div className="text-xl font-extrabold text-black font-mono leading-none mt-1">₹{foodCreditAmount}</div>
                      </div>
                    </div>
                    <input type="range" min={0} max={Math.min(foodBalance, Math.ceil(totalAmount / 100))} value={foodCreditAmount} onChange={(e) => setFoodCreditAmount(Number(e.target.value))} className="w-full" style={{ accentColor: '#F1563F' }} />
                    <div className="flex justify-between text-xs mt-2">
                      <span className="text-black/50 font-medium">Slide to apply $food</span>
                      <span className="text-black font-semibold">To pay: {formatPaise(Math.max(0, totalAmount - foodCreditAmount * 100))}</span>
                    </div>
                  </div>
                )}

                {/* Cooking Instructions — opens a modal so the customer can
                    type a note for the kitchen. Saved on cafe_orders.notes via
                    place_cafe_order's p_notes param. */}
                <button
                  onClick={() => { setNotesDraft(customerNotes); setNotesModalOpen(true) }}
                  className="w-full rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-3.5 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F1563F]/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#F1563F]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-black">Cooking Instructions</div>
                    <div className={`text-xs mt-0.5 truncate ${customerNotes ? 'text-black/70' : 'text-black/40'}`}>
                      {customerNotes || 'Add a note for the kitchen (optional)'}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-black/35 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>

                {/* Place Order — Razorpay handles every paid order; the only no-payment
                    path is full food-credit coverage (RPC resolves that to 'zo_card'). */}
                <button onClick={handlePlaceOrder} disabled={isOrdering || paymentInFlight !== null} className="w-full bg-[#F1563F] text-black py-4 text-base font-bold tracking-wide rounded-2xl shadow-lg shadow-[#F1563F]/30 active:scale-[0.98] transition-all disabled:opacity-50">
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
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <svg className="w-12 h-12 text-black/20" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                <p className="font-serif text-xl italic text-black/60">Your cart is empty</p>
                <button onClick={() => setActiveTab('menu')} className="mt-2 px-5 py-2.5 bg-[#F1563F] text-black text-sm font-bold rounded-xl active:scale-95 transition-all">
                  Browse Menu
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS TAB (placed orders: being prepared + history) ──────── */}
        {activeTab === 'orders' && (
          <div className="px-4 py-4 space-y-4">

            {/* Empty state — no orders, no active deliveries. */}
            {activeOrders.length === 0 && orders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <svg className="w-12 h-12 text-black/20" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-serif text-xl italic text-black/60">No orders yet</p>
                <button onClick={() => setActiveTab('menu')} className="mt-2 px-5 py-2.5 bg-[#F1563F] text-black text-sm font-bold rounded-xl active:scale-95 transition-all">
                  Browse Menu
                </button>
              </div>
            )}

            {/* Active orders (Being Prepared) */}
            {activeOrders.length > 0 && (
              <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4">
                <h3 className="font-serif text-lg font-semibold italic text-black/80 mb-3">
                  Being Prepared
                </h3>
                <div className="space-y-3">
                  {activeOrders.map((order) => {
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
                      <div key={order.id} className="rounded-xl bg-white ring-1 ring-[#F1563F]/30 p-3">
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
                              <div className="flex justify-between items-center text-[11px] text-[#F1563F] font-medium font-mono">
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
                              <span className="text-[#F1563F] font-semibold text-xs">Apply $food</span>
                              <span className="text-[#F1563F] font-mono font-bold text-xs">balance ₹{foodBalance + existingCreditsRupees}</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={maxCreditsRupees}
                              value={localCreditsRupees}
                              disabled={paymentInFlight !== null}
                              onChange={(e) => setDraftCreditOverrides((prev) => ({ ...prev, [order.id]: Number(e.target.value) }))}
                              className="w-full"
                              style={{ accentColor: '#F1563F' }}
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
                            className="w-full mt-3 bg-[#F1563F] text-black py-2.5 text-sm font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
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
            )}

            {/* History — served, ready (waiting at counter), and cancelled.
                Rendered as a plain list (no outer card), each row separated
                by a hairline divider so it reads like a receipt history. */}
            {orders.filter((o) => o.kitchen_status && ['ready', 'served', 'cancelled'].includes(o.kitchen_status)).length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-px bg-[#F1563F]/40" />
                  <h3 className="font-serif text-xl font-semibold italic text-[#F1563F] shrink-0">History</h3>
                  <div className="flex-1 h-px bg-[#F1563F]/40" />
                </div>
                <ul className="divide-y divide-black/10">
                  {orders.filter((o) => o.kitchen_status && ['ready', 'served', 'cancelled'].includes(o.kitchen_status)).map((order) => {
                    const orderGross = order.subtotal + order.service_charge + order.tax_amount
                    const credit = order.food_credit_applied_paise || 0
                    const isCancelled = order.kitchen_status === 'cancelled'
                    return (
                      <li key={order.id} className="py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-mono font-bold text-sm text-black shrink-0">#{order.display_number}</span>
                            <span className="text-xs text-black/60 font-medium truncate">
                              {order.order_items?.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <OrderStatusBadge status={order.kitchen_status} />
                            <span className={`font-bold text-sm font-mono ${isCancelled ? 'text-black/35 line-through' : 'text-black'}`}>
                              {formatPaise(orderGross)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-0.5 text-[10px] font-mono text-black/40">
                          <span>
                            {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {credit > 0 && !isCancelled && (
                            <span>
                              {formatPaise(credit)} $food + {formatPaise(orderGross - credit)} {order.payment_status === 'paid' ? 'paid' : 'due'}
                            </span>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Load more — covers older orders beyond the current page. */}
            {hasMoreOrders && (
              <button
                onClick={loadMoreOrders}
                disabled={ordersLoading}
                className="w-full py-3 rounded-2xl bg-white ring-1 ring-black/10 text-sm font-semibold text-black active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {ordersLoading ? 'Loading…' : 'Load more orders'}
              </button>
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
      {totalItems > 0 && activeTab === 'menu' && (
        <button
          onClick={() => {
            if (requireLoginForOrdering()) setActiveTab('cart')
          }}
          className="fixed bottom-24 left-5 right-5 max-w-md mx-auto z-50 bg-[#F1563F] text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/30 flex items-center justify-between active:scale-[0.98] transition-all"
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
      <nav className="shrink-0 fixed bottom-5 left-5 right-5 bg-[#F1563F] rounded-full ring-1 ring-black/10 shadow-2xl shadow-black/20 z-40">
        <div className="flex items-center justify-around h-14 max-w-md mx-auto px-1.5">
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
                key: 'orders' as Tab,
                label: 'Orders',
                badge: activeOrders.length > 0 ? activeOrders.length : undefined,
                icon: (active: boolean) => (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.2 : 1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              className={`relative flex flex-col items-center justify-center gap-0.5 w-14 h-11 rounded-full transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-[#F1563F] shadow-md shadow-black/10'
                  : 'text-white/85'
              }`}
            >
              {tab.badge !== undefined && (
                <span className="absolute -top-0.5 right-0.5 bg-black text-white text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center ring-2 ring-[#F1563F]">
                  {tab.badge}
                </span>
              )}
              {tab.icon(activeTab === tab.key)}
              <span className="text-[9px] font-semibold tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Cooking Instructions Modal ───────────────────────────────────── */}
      {notesModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          onClick={() => setNotesModalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl shadow-black/30"
          >
            <div className="pt-2.5 pb-1.5 flex justify-center">
              <div className="w-10 h-1 bg-black/15 rounded-full" />
            </div>
            <div className="px-5 pt-2 pb-1 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold italic text-black">Cooking Instructions</h2>
              <button
                onClick={() => setNotesModalOpen(false)}
                aria-label="Close"
                className="w-9 h-9 rounded-full ring-1 ring-black/10 flex items-center justify-center active:scale-95 transition-all"
              >
                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="px-5 pt-1 text-xs text-black/50 font-medium">
              Anything the chef should know? Allergies, spice level, etc.
            </p>
            <div className="px-5 pt-3 pb-3">
              <textarea
                autoFocus
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value.slice(0, 280))}
                placeholder="e.g. no onions, extra spicy, well done…"
                rows={5}
                className="w-full resize-none rounded-2xl bg-black/[0.04] px-4 py-3 text-sm text-black placeholder:text-black/30 outline-none ring-1 ring-black/5 focus:ring-[#F1563F]/40 focus:bg-black/[0.06] transition-colors"
              />
              <div className="mt-1 text-right text-[10px] text-black/35 font-mono">
                {notesDraft.length}/280
              </div>
            </div>
            <div className="px-5 pb-5 pt-2 flex gap-3 border-t border-black/5">
              <button
                onClick={() => setNotesModalOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-black/5 text-sm font-bold text-black active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { setCustomerNotes(notesDraft.trim()); setNotesModalOpen(false) }}
                className="flex-1 py-3 rounded-2xl bg-[#F1563F] text-white text-sm font-bold shadow-lg shadow-[#F1563F]/30 active:scale-[0.98] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Item Detail Modal ─────────────────────────────────────────────── */}
      {detailItem && (() => {
        const item = detailItem
        const inCart = cart.find((c) => c.menu_item_id === item.id)
        const nameKey = item.name.trim().toLowerCase()
        const planText =
          nameKey === 'breakfast' ? todayPlanText.breakfast :
          nameKey === 'lunch' ? todayPlanText.lunch :
          nameKey === 'dinner' ? todayPlanText.dinner : ''
        const descText = planText || item.description
        const hasMacros = item.calories != null || item.protein != null || item.carbs != null || item.fats != null
        const dietLabel = item.diet === 'veg' ? 'Veg' : item.diet === 'egg' ? 'Egg' : 'Non-veg'
        const dietRing = item.diet === 'veg' ? 'ring-green-600' : item.diet === 'egg' ? 'ring-yellow-600' : 'ring-red-600'
        const dietDot = item.diet === 'veg' ? 'bg-green-600' : item.diet === 'egg' ? 'bg-yellow-500' : 'bg-red-600'

        return (
          <div
            className="fixed inset-0 z-[60] flex items-end justify-center"
            onClick={() => setDetailItem(null)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/30"
            >
              <div className="pt-2.5 pb-1.5 flex justify-center shrink-0">
                <div className="w-10 h-1 bg-black/15 rounded-full" />
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full ring-1 ring-black/10 shadow-md flex items-center justify-center z-10 active:scale-95 transition-all"
                aria-label="Close"
              >
                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex-1 overflow-y-auto hide-scrollbar">
                <div className="px-4 pt-1">
                  <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden bg-stone-200">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black/30">
                        <span className="text-6xl font-extrabold tracking-tight">{item.name.slice(0, 1).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 pt-4 pb-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-block w-3.5 h-3.5 rounded-sm shrink-0 ring-1 ${dietRing}`}>
                        <span className={`block w-full h-full rounded-full scale-50 ${dietDot}`} />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-black/50">{dietLabel}</span>
                    </div>
                    <h2 className="font-serif text-2xl font-semibold italic text-black leading-tight">{item.name}</h2>
                    <p className="text-xl font-extrabold text-black mt-1.5">{formatPaise(item.price)}</p>
                  </div>

                  {descText && (
                    <div className="rounded-2xl bg-black/[0.03] px-4 py-3">
                      <p className="text-sm text-black/75 leading-snug">{descText}</p>
                    </div>
                  )}

                  {hasMacros && (
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-black/45 mb-2">Nutrition</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {item.calories != null && (
                          <div className="rounded-xl bg-[#F1563F]/10 ring-1 ring-[#F1563F]/20 px-2 py-2.5 text-center">
                            <div className="text-base font-extrabold text-[#F1563F]">{item.calories}</div>
                            <div className="text-[9px] font-semibold uppercase tracking-wider text-black/55 mt-0.5">kcal</div>
                          </div>
                        )}
                        {item.protein != null && (
                          <div className="rounded-xl bg-black/[0.04] px-2 py-2.5 text-center">
                            <div className="text-base font-extrabold text-black">{item.protein}g</div>
                            <div className="text-[9px] font-semibold uppercase tracking-wider text-black/55 mt-0.5">Protein</div>
                          </div>
                        )}
                        {item.carbs != null && (
                          <div className="rounded-xl bg-black/[0.04] px-2 py-2.5 text-center">
                            <div className="text-base font-extrabold text-black">{item.carbs}g</div>
                            <div className="text-[9px] font-semibold uppercase tracking-wider text-black/55 mt-0.5">Carbs</div>
                          </div>
                        )}
                        {item.fats != null && (
                          <div className="rounded-xl bg-black/[0.04] px-2 py-2.5 text-center">
                            <div className="text-base font-extrabold text-black">{item.fats}g</div>
                            <div className="text-[9px] font-semibold uppercase tracking-wider text-black/55 mt-0.5">Fats</div>
                          </div>
                        )}
                      </div>
                      {(item.fibre != null || item.sugar != null) && (
                        <div className="flex gap-4 mt-2 text-[11px] font-mono text-black/50">
                          {item.fibre != null && <span>Fibre <span className="font-bold text-black/75">{item.fibre}g</span></span>}
                          {item.sugar != null && <span>Sugar <span className="font-bold text-black/75">{item.sugar}g</span></span>}
                        </div>
                      )}
                    </div>
                  )}

                  {item.ingredients && (
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-black/45 mb-1.5">Ingredients</h3>
                      <p className="text-sm text-black/75 leading-snug">{item.ingredients}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 border-t border-black/5 bg-white px-5 py-3.5 flex items-center gap-3">
                {!inCart ? (
                  <button
                    onClick={() => addToCart(item)}
                    className="flex-1 bg-[#F1563F] text-white py-3.5 text-base font-bold tracking-wide rounded-2xl shadow-lg shadow-[#F1563F]/30 active:scale-[0.98] transition-all"
                  >
                    Add to Cart · {formatPaise(item.price)}
                  </button>
                ) : (
                  <>
                    <div className="flex items-center bg-black/5 rounded-2xl ring-1 ring-black/10 overflow-hidden">
                      <button onClick={() => removeFromCart(item.id)} className="w-11 h-11 flex items-center justify-center text-[#F1563F] font-bold text-lg active:bg-black/10">−</button>
                      <span className="text-[#F1563F] font-extrabold w-7 text-center">{inCart.quantity}</span>
                      <button onClick={() => addToCart(item)} className="w-11 h-11 flex items-center justify-center text-[#F1563F] font-bold text-lg active:bg-black/10">+</button>
                    </div>
                    <button
                      onClick={() => setDetailItem(null)}
                      className="flex-1 bg-[#F1563F] text-white py-3 text-sm font-bold tracking-wide rounded-2xl shadow-lg shadow-[#F1563F]/30 active:scale-[0.98] transition-all"
                    >
                      Added · {formatPaise(item.price * inCart.quantity)}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
