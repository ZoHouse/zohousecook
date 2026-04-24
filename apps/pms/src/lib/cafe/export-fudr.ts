/**
 * FUDR-parity CSV exports for the admin Orders page.
 *
 * Three exports match FUDR's three monthly exports shape-for-shape so the
 * accountant can swap from FUDR to Zo House Cook without rebuilding pivots.
 *
 *   1. exportOrders       — matches fudr-orders<date>.xlsx (22 cols)
 *   2. exportOrderItems   — matches order-items<date>.xlsx (11 cols)
 *   3. exportPayout       — matches <propCode> Zo House ... Payout, Invoice And Ledger.xlsx (18 cols)
 *
 * Column names match FUDR exactly, including the "Paymet Type" typo, so any
 * downstream formulas keyed on that header keep working.
 *
 * Depends on PRs A (schema columns) and B (GST + human_order_id) being
 * applied in Supabase. Columns not yet populated (gateway_fee_paise,
 * gateway_gst_paise — PR D) render as 0.
 */

import { supabase } from '../../configs/supabase'

// ── Types (intentionally loose — we're reading arbitrary joined shapes) ──────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

// ── Helpers ──────────────────────────────────────────────────────────────────

function toRupees(paise: number | null | undefined): number {
  if (paise == null) return 0
  return Math.round(paise) / 100
}

function formatDateIST(iso: string): string {
  // e.g. "01 Mar 2026" — FUDR shape
  const d = new Date(iso)
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(d)
}

function formatTimeIST(iso: string): string {
  // e.g. "11:04 AM" — FUDR shape, 12h
  const d = new Date(iso)
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(d)
}

function csvEscape(val: unknown): string {
  if (val == null) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function rowsToCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvEscape).join(',')]
  for (const r of rows) {
    lines.push(r.map(csvEscape).join(','))
  }
  return lines.join('\n')
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Map our kitchen/payment statuses to FUDR's order-status vocabulary.
function fudrOrderStatus(kitchenStatus: string | null, paymentStatus: string | null): string {
  if (kitchenStatus === 'cancelled') return 'CANCELLED'
  if (paymentStatus === 'refunded') return 'CANCELLED'
  if (kitchenStatus === 'served' || paymentStatus === 'paid') return 'SETTLED'
  // New/accepted/preparing/ready with pending payment — FUDR calls these SETTLED too
  // (they pay before placing). We mirror.
  return 'SETTLED'
}

function fudrItemStatus(itemStatus: string | null, orderKitchenStatus: string | null): string {
  if (itemStatus === 'cancelled') return 'CANCELLED'
  if (orderKitchenStatus === 'cancelled') return 'CANCELLED'
  return 'SETTLED'
}

function fudrDietType(diet: string | null): string {
  if (diet === 'veg') return 'VEGETARIAN'
  if (diet === 'non_veg') return 'NON_VEGETARIAN'
  if (diet === 'egg') return 'EGG'
  return ''
}

function fudrPaymentMode(paymentMode: string | null, hasWallet: boolean): string {
  // FUDR: "Cashfree" for gateway, "-" for wallet-only.
  // We map: razorpay → "Razorpay", cash → "Cash", zo_card → "-"
  if (hasWallet && paymentMode === 'zo_card') return '-'
  if (paymentMode === 'razorpay') return 'Razorpay'
  if (paymentMode === 'cash') return 'Cash'
  return '-'
}

// ── Data fetch (shared across the three exports) ─────────────────────────────

interface FetchParams {
  propertyId: string
  fromDate: string  // 'YYYY-MM-DD' (IST)
  toDate: string    // 'YYYY-MM-DD' (IST, inclusive)
}

interface FetchedData {
  propertyName: string
  propertyCode: string
  orders: Row[]
  itemsByOrderId: Map<string, Row[]>
  menuDietById: Map<string, string>  // menu_item_id → diet string
}

async function fetchAll({ propertyId, fromDate, toDate }: FetchParams): Promise<FetchedData> {
  // IST midnight boundaries → UTC ISO strings for the created_at filter.
  // IST = UTC+5:30 → 00:00 IST on 2026-04-01 is 2026-03-31T18:30:00Z.
  const istOffsetMs = 5.5 * 60 * 60 * 1000
  const fromUtc = new Date(new Date(fromDate + 'T00:00:00').getTime() - istOffsetMs).toISOString()
  const toUtc = new Date(new Date(toDate + 'T23:59:59.999').getTime() - istOffsetMs).toISOString()

  const [{ data: property }, { data: orderRows }] = await Promise.all([
    supabase
      .from('cafe_properties')
      .select('name, code')
      .eq('id', propertyId)
      .single(),
    supabase
      .from('cafe_orders')
      .select('*, table:cafe_tables(code, label)')
      .eq('property_id', propertyId)
      .gte('created_at', fromUtc)
      .lte('created_at', toUtc)
      .order('created_at', { ascending: true }),
  ])

  const orders = orderRows || []
  const orderIds = orders.map((o) => o.id)

  const { data: itemRows } = orderIds.length
    ? await supabase
        .from('cafe_order_items')
        .select('*')
        .in('order_id', orderIds)
    : { data: [] as Row[] }

  const itemsByOrderId = new Map<string, Row[]>()
  for (const it of itemRows || []) {
    const arr = itemsByOrderId.get(it.order_id) || []
    arr.push(it)
    itemsByOrderId.set(it.order_id, arr)
  }

  // Pull diet for every menu item referenced by any line item.
  const menuItemIds = [...new Set((itemRows || []).map((i) => i.menu_item_id))]
  const menuDietById = new Map<string, string>()
  if (menuItemIds.length > 0) {
    const { data: menuRows } = await supabase
      .from('cafe_menu_items')
      .select('id, diet')
      .in('id', menuItemIds)
    for (const m of menuRows || []) {
      menuDietById.set(m.id, m.diet)
    }
  }

  return {
    propertyName: property?.name || '',
    propertyCode: property?.code || '',
    orders,
    itemsByOrderId,
    menuDietById,
  }
}

// ── Report 1: Orders (22 cols, matches fudr-orders<date>.xlsx) ───────────────

const ORDERS_HEADERS = [
  'Restaurant Name', 'Restaurant Code',
  'Order ID', 'Order Date', 'Order Time',
  'Guest Name', 'Guest Phone', 'Guest Email',
  'Location', 'Order Status',
  'Gross Amount', 'Net Amount',
  'Discount', 'Coupon Code',
  'Paymet Type',                     // sic — FUDR typo preserved for parity
  'Has Wallet Payment', 'Wallet Amount',
  'Commission', 'Commission GST', 'Total Commission',
  'Special Instructions',
]

export async function exportOrders(params: FetchParams): Promise<string> {
  const { propertyName, propertyCode, orders } = await fetchAll(params)

  const rows = orders.map((o) => {
    const hasWallet = (o.food_credit_applied_paise ?? 0) > 0
    const gateway = o.gateway_fee_paise ?? 0
    const gatewayGst = o.gateway_gst_paise ?? 0
    const commission = gateway - gatewayGst
    const location = o.table?.label || o.table?.code || ''

    return [
      propertyName,
      propertyCode,
      o.human_order_id || String(o.display_number),
      formatDateIST(o.created_at),
      formatTimeIST(o.created_at),
      o.customer_name || '',
      o.customer_phone || '',
      o.customer_email || '',
      location,
      fudrOrderStatus(o.kitchen_status, o.payment_status),
      toRupees(o.subtotal),                              // Gross (pre-tax)
      toRupees((o.subtotal ?? 0) + (o.tax_amount ?? 0)), // Net (post-tax, pre-credit)
      '',  // Discount — not tracked
      '',  // Coupon Code — not tracked
      'PRE_PAYMENT',
      hasWallet ? 'yes' : 'no',
      hasWallet ? toRupees(o.food_credit_applied_paise) : '',
      toRupees(commission),
      toRupees(gatewayGst),
      toRupees(gateway),
      o.notes || '',
    ]
  })

  return rowsToCsv(ORDERS_HEADERS, rows)
}

// ── Report 2: Order items (11 cols) ──────────────────────────────────────────

const ORDER_ITEMS_HEADERS = [
  'Order ID', 'Order Date', 'Order Time', 'Order Status',
  'Item Name', 'Type', 'Quantity', 'Price',
  'Item Status', 'Remark',
]

export async function exportOrderItems(params: FetchParams): Promise<string> {
  const { orders, itemsByOrderId, menuDietById } = await fetchAll(params)

  const rows: unknown[][] = []
  for (const o of orders) {
    const items = itemsByOrderId.get(o.id) || []
    for (const it of items) {
      rows.push([
        o.human_order_id || String(o.display_number),
        formatDateIST(o.created_at),
        formatTimeIST(o.created_at),
        fudrOrderStatus(o.kitchen_status, o.payment_status),
        it.name,
        fudrDietType(menuDietById.get(it.menu_item_id) || null),
        String(it.quantity),
        toRupees((it.price ?? 0) * (it.quantity ?? 1)),  // line total, not per-unit
        fudrItemStatus(it.item_status, o.kitchen_status),
        it.remark || '',
      ])
    }
  }

  return rowsToCsv(ORDER_ITEMS_HEADERS, rows)
}

// ── Report 3: Payout / Invoice / Ledger (18 cols) ────────────────────────────

const PAYOUT_HEADERS = [
  'Restaurant Name', 'Restaurant Code',
  'Order ID', 'Order Date', 'Order Time',
  'Guest Name', 'Table Label', 'Order Status',
  'Net Amount',
  'Paymet Type',                     // sic — FUDR typo preserved
  'Payment Mode',
  'Has Wallet Payment', 'Wallet Amount',
  'Commission', 'GST', 'Total Commission',
  'Net Pre Order', 'Net Settlement',
]

export async function exportPayout(params: FetchParams): Promise<string> {
  const { propertyName, propertyCode, orders } = await fetchAll(params)

  const rows = orders.map((o) => {
    const hasWallet = (o.food_credit_applied_paise ?? 0) > 0
    const gateway = o.gateway_fee_paise ?? 0
    const gatewayGst = o.gateway_gst_paise ?? 0
    const commission = gateway - gatewayGst
    const tableLabel = o.table?.label || o.table?.code || ''
    const net = (o.subtotal ?? 0) + (o.tax_amount ?? 0)

    // Net Pre Order = what the payment gateway collected from customer.
    // Wallet-paid orders: 0 (no money flows through gateway).
    // Gateway-paid orders: net (pre-commission).
    const netPreOrder = (o.payment_mode === 'zo_card' || hasWallet) ? 0 : net
    const netSettlement = netPreOrder - gateway

    return [
      propertyName,
      propertyCode,
      o.human_order_id || String(o.display_number),
      formatDateIST(o.created_at),
      formatTimeIST(o.created_at),
      o.customer_name || '',
      tableLabel,
      fudrOrderStatus(o.kitchen_status, o.payment_status),
      toRupees(net),
      'PRE_PAYMENT',
      fudrPaymentMode(o.payment_mode, hasWallet),
      hasWallet ? 'yes' : 'no',
      hasWallet ? toRupees(o.food_credit_applied_paise) : '',
      toRupees(commission),
      toRupees(gatewayGst),
      toRupees(gateway),
      toRupees(netPreOrder),
      toRupees(netSettlement),
    ]
  })

  return rowsToCsv(PAYOUT_HEADERS, rows)
}
