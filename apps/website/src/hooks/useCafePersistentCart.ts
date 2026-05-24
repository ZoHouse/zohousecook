import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../config/supabase'
import type { CartItem, MenuItem } from '../components/cafezomad/types'

// ─────────────────────────────────────────────────────────────────────────────
// Persistent customer cart for Cafe Zomad
//
// Replaces the old per-table localStorage cart (cafezomad_cart_<tableId>),
// which forked a new cart every time a diner scanned a different table —
// even for the same logged-in user. The page already requires login before
// addToCart can run, so this hook is DB-only (no guest path): one row per
// zo_user_id in cafe_carts, hydrated on login, debounced upsert on change.
//
// Legacy per-table localStorage entries are folded into the DB row on first
// hydrate so a customer with a saved-but-never-placed cart from before this
// rollout doesn't lose their items.
// ─────────────────────────────────────────────────────────────────────────────

const SYNC_DEBOUNCE_MS = 500
const LEGACY_KEY_PREFIX = 'cafezomad_cart_'

interface UseCafePersistentCartParams {
  zoUserId: string | null | undefined
  propertyId: string | null
  tableId: string
  // Live menu, used to drop items that are no longer in the menu.
  availableItems: MenuItem[]
  menuLoaded: boolean
}

interface UseCafePersistentCartResult {
  cart: CartItem[]
  setCart: (items: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void
  hydrated: boolean
  clearCart: () => Promise<void>
  staleNotice: string | null
  dismissStaleNotice: () => void
}

function mergeCarts(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>()
  for (const item of [...a, ...b]) {
    const existing = map.get(item.menu_item_id)
    if (existing) {
      map.set(item.menu_item_id, { ...existing, quantity: existing.quantity + item.quantity })
    } else {
      map.set(item.menu_item_id, { ...item })
    }
  }
  return Array.from(map.values())
}

function readAllLegacyCarts(): CartItem[] {
  if (typeof window === 'undefined') return []
  const out: CartItem[] = []
  // Iterate localStorage looking for any cafezomad_cart_* keys (any tableId)
  // so a user's older saved cart from a different table still surfaces.
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const k = window.localStorage.key(i)
    if (!k || !k.startsWith(LEGACY_KEY_PREFIX)) continue
    try {
      const raw = window.localStorage.getItem(k)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) out.push(...parsed)
    } catch {
      /* corrupt — skip */
    }
  }
  return out
}

function clearAllLegacyCarts() {
  if (typeof window === 'undefined') return
  const keys: string[] = []
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const k = window.localStorage.key(i)
    if (k && k.startsWith(LEGACY_KEY_PREFIX)) keys.push(k)
  }
  for (const k of keys) window.localStorage.removeItem(k)
}

export function useCafePersistentCart({
  zoUserId,
  propertyId,
  tableId,
  availableItems,
  menuLoaded,
}: UseCafePersistentCartParams): UseCafePersistentCartResult {
  const [cart, setCart] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [staleNotice, setStaleNotice] = useState<string | null>(null)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastUserIdRef = useRef<string | null>(null)

  // ── Hydrate ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!menuLoaded) return
    // Wait until we know who the user is (logged in OR confirmed logged out).
    // We skip hydration entirely while logged out — addToCart is gated, so
    // the cart should be empty anyway.
    if (!zoUserId) {
      setHydrated(true)
      return
    }

    let cancelled = false
    const uid: string = zoUserId
    const previousUserId = lastUserIdRef.current
    lastUserIdRef.current = uid

    async function hydrate() {
      const availableIds = new Set(availableItems.map((i) => i.id))

      const { data } = await supabase
        .from('cafe_carts')
        .select('items')
        .eq('zo_user_id', uid)
        .maybeSingle()
      const dbItems = Array.isArray(data?.items) ? (data!.items as CartItem[]) : []

      // Migrate legacy per-table carts the first time a user lands here after
      // this rollout (or on first login of a session).
      const justLoggedIn = !previousUserId
      const legacyItems = justLoggedIn ? readAllLegacyCarts() : []
      let merged = legacyItems.length > 0 ? mergeCarts(dbItems, legacyItems) : dbItems
      if (legacyItems.length > 0) clearAllLegacyCarts()

      // Drop items no longer on the menu (availability change or removed item).
      let droppedCount = 0
      merged = merged.filter((item) => {
        const ok = availableIds.has(item.menu_item_id)
        if (!ok) droppedCount += 1
        return ok
      })

      if (cancelled) return

      setCart(merged)
      if (droppedCount > 0) {
        setStaleNotice(
          droppedCount === 1
            ? '1 item in your cart is no longer available and was removed.'
            : `${droppedCount} items in your cart are no longer available and were removed.`,
        )
      }
      setHydrated(true)

      // Persist post-merge / post-clean so we don't re-warn next time.
      if (legacyItems.length > 0 || droppedCount > 0) {
        await persistCart(merged, uid, propertyId, tableId)
      }
    }

    hydrate()
    return () => {
      cancelled = true
    }
    // availableItems intentionally omitted — see PMS hook note. Menu identity
    // is captured by menuLoaded flipping once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoUserId, menuLoaded])

  // ── Persist (debounced) ──────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated || !zoUserId) return
    const uid: string = zoUserId
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      persistCart(cart, uid, propertyId, tableId)
    }, SYNC_DEBOUNCE_MS)
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    }
  }, [cart, zoUserId, propertyId, tableId, hydrated])

  const clearCart = useCallback(async () => {
    setCart([])
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    if (zoUserId) {
      await supabase.from('cafe_carts').delete().eq('zo_user_id', zoUserId)
    }
  }, [zoUserId])

  const dismissStaleNotice = useCallback(() => setStaleNotice(null), [])

  return { cart, setCart, hydrated, clearCart, staleNotice, dismissStaleNotice }
}

async function persistCart(
  items: CartItem[],
  zoUserId: string,
  propertyId: string | null,
  tableId: string,
) {
  if (!propertyId) return
  if (items.length === 0) {
    await supabase.from('cafe_carts').delete().eq('zo_user_id', zoUserId)
    return
  }
  await supabase.from('cafe_carts').upsert(
    {
      zo_user_id: zoUserId,
      property_id: propertyId,
      table_id: tableId,
      items,
    },
    { onConflict: 'zo_user_id' },
  )
}
