/**
 * Razorpay Order creation endpoint — paired with the webhook (razorpay-webhook.ts).
 *
 * Called by the customer order page (apps/website/src/pages/cafezomad/[tableId].tsx)
 * after place_cafe_order RPC has created the cafe_orders row with
 *   payment_mode='razorpay', payment_status='pending'.
 *
 * Flow:
 *   1. FE POSTs { cafe_order_id }.
 *   2. We look up the cafe_order, validate it's still owed money via Razorpay.
 *   3. Idempotency: if cafe_orders.razorpay_order_id is already set, return it.
 *      No new Razorpay Order, no double charge if the user clicks Pay twice or
 *      retries from a stale tab.
 *   4. Otherwise, POST to Razorpay /v1/orders with notes.cafe_order_id so the
 *      webhook can match the eventual payment.captured event back to our row.
 *   5. UPDATE cafe_orders SET razorpay_order_id = ... WHERE razorpay_order_id IS NULL
 *      — guarded so a concurrent request that beat us doesn't get clobbered.
 *      If our update affected 0 rows, we lost a race; we return the winning id
 *      and orphan our newly-created Razorpay Order (it expires in 24h).
 *
 * Returns to FE: { razorpay_order_id, amount, currency, key_id,
 *                  prefill: { name, contact, email }, cafe_order_id }
 *
 * Env (server-only — never bundle):
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Auth posture: this endpoint is unauthenticated by design — the customer flow
 * is anonymous (customers don't have PMS sessions). The cafe_order_id is the
 * only auth: knowing it is sufficient to attempt to pay for it. Risk is low
 * because we only create Razorpay Orders for pending/razorpay rows that someone
 * already created via place_cafe_order — and worst case, an attacker who guesses
 * a uuid creates a Razorpay Order they themselves would have to pay for. Still,
 * we validate state strictly to avoid surprise re-creation paths.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

interface CreateOrderRequest {
  cafe_order_id: string
}

interface CreateOrderResponse {
  razorpay_order_id: string
  amount: number
  currency: string
  key_id: string
  cafe_order_id: string
  prefill: {
    name: string | null
    contact: string | null
    email: string | null
  }
  display_number: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateOrderResponse | { error: string }>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('create-razorpay-order: missing env vars')
    return res.status(500).json({ error: 'Endpoint not configured' })
  }

  const body = req.body as CreateOrderRequest | undefined
  const cafeOrderId = body?.cafe_order_id?.trim()
  if (!cafeOrderId) {
    return res.status(400).json({ error: 'cafe_order_id is required' })
  }
  // Loose uuid sanity check — Postgres will reject anyway, but fail fast.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cafeOrderId)) {
    return res.status(400).json({ error: 'cafe_order_id is not a valid uuid' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1. Fetch the cafe_order — validate state + grab fields we need.
  const { data: order, error: fetchErr } = await supabase
    .from('cafe_orders')
    .select(
      'id, total, payment_status, payment_mode, razorpay_order_id, customer_name, customer_phone, customer_email, display_number, human_order_id',
    )
    .eq('id', cafeOrderId)
    .single()

  if (fetchErr || !order) {
    return res.status(404).json({ error: 'Order not found' })
  }

  if (order.payment_mode !== 'razorpay') {
    return res.status(400).json({ error: `payment_mode is ${order.payment_mode}, not razorpay` })
  }

  if (order.payment_status === 'paid') {
    return res.status(400).json({ error: 'Order is already paid' })
  }

  if (order.payment_status !== 'pending') {
    return res.status(400).json({ error: `payment_status is ${order.payment_status}` })
  }

  if (!order.total || order.total <= 0) {
    return res.status(400).json({ error: 'Order total must be positive' })
  }

  // 2. Idempotency — if we already have a razorpay_order_id, return the cached config.
  if (order.razorpay_order_id) {
    return res.status(200).json({
      razorpay_order_id: order.razorpay_order_id,
      amount: order.total,
      currency: 'INR',
      key_id: RAZORPAY_KEY_ID,
      cafe_order_id: order.id,
      display_number: order.display_number,
      prefill: {
        name: order.customer_name,
        contact: order.customer_phone,
        email: order.customer_email,
      },
    })
  }

  // 3. No existing Razorpay Order — create one.
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
  const razorpayPayload = {
    amount: order.total,
    currency: 'INR',
    receipt: order.human_order_id || `cafe-${order.display_number}`,
    notes: {
      cafe_order_id: order.id,
    },
    payment_capture: 1,
  }

  let razorpayOrder: { id: string; amount: number; currency: string; status: string }
  try {
    const rpResp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(razorpayPayload),
    })

    if (!rpResp.ok) {
      const errBody = await rpResp.text()
      console.error('create-razorpay-order: razorpay API error', rpResp.status, errBody)
      return res.status(502).json({ error: 'Razorpay order creation failed' })
    }

    razorpayOrder = await rpResp.json()
  } catch (err) {
    console.error('create-razorpay-order: razorpay fetch failed', err)
    return res.status(502).json({ error: 'Razorpay request failed' })
  }

  // 4. Claim the cafe_orders row with our new razorpay_order_id, but only if
  //    no concurrent request beat us.
  const { data: claimed, error: claimErr } = await supabase
    .from('cafe_orders')
    .update({
      razorpay_order_id: razorpayOrder.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cafeOrderId)
    .is('razorpay_order_id', null)
    .select('razorpay_order_id')
    .maybeSingle()

  if (claimErr) {
    console.error('create-razorpay-order: claim update failed', claimErr)
    return res.status(500).json({ error: 'Failed to record Razorpay order id' })
  }

  let finalRazorpayOrderId: string
  if (claimed?.razorpay_order_id) {
    finalRazorpayOrderId = claimed.razorpay_order_id
  } else {
    // Lost the race — re-fetch the winning id. The Razorpay Order we just
    // created is now orphaned; Razorpay garbage-collects after 24h and
    // returns no payment, so this is leaky but safe (no double charge,
    // because the FE will only open Checkout against the winning id).
    const { data: refetched } = await supabase
      .from('cafe_orders')
      .select('razorpay_order_id')
      .eq('id', cafeOrderId)
      .single()
    if (!refetched?.razorpay_order_id) {
      // Shouldn't happen — claim failed AND no winner. Treat as 500.
      console.error('create-razorpay-order: lost race but no winner found', cafeOrderId)
      return res.status(500).json({ error: 'Race resolution failed' })
    }
    finalRazorpayOrderId = refetched.razorpay_order_id
    console.warn(
      'create-razorpay-order: lost race, orphaned Razorpay order',
      razorpayOrder.id,
      'using winning',
      finalRazorpayOrderId,
    )
  }

  return res.status(200).json({
    razorpay_order_id: finalRazorpayOrderId,
    amount: order.total,
    currency: 'INR',
    key_id: RAZORPAY_KEY_ID,
    cafe_order_id: order.id,
    display_number: order.display_number,
    prefill: {
      name: order.customer_name,
      contact: order.customer_phone,
      email: order.customer_email,
    },
  })
}
