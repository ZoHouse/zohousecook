/**
 * Razorpay refund endpoint — invoked when staff cancels a paid Razorpay order.
 *
 * Replaces the long-standing #refund-todo where cancelOrder only flipped
 * cafe_orders.payment_status='refunded' in our DB and logged a warning
 * asking staff to refund manually via the Razorpay Dashboard.
 *
 * Flow:
 *   1. FE POSTs { cafe_order_id } from useCafeRealtimeOrders.cancelOrder
 *      AFTER it has already marked kitchen_status='cancelled' and restored
 *      $food credits.
 *   2. We look up the cafe_order. Reject unless:
 *        - payment_mode='razorpay'
 *        - payment_status='paid' (already-refunded orders are no-ops)
 *        - kitchen_status='cancelled' (don't refund an active order)
 *        - payment_id set (no payment ever captured → nothing to refund)
 *   3. Idempotency: if razorpay_refund_id is already set, return it without
 *      hitting Razorpay again. Critical because Razorpay charges a fee per
 *      refund and a duplicate would silently re-credit the customer.
 *   4. POST to Razorpay /v1/payments/{payment_id}/refund with the order's
 *      `total` paise (post-credit amount the customer was charged) plus an
 *      X-Razorpay-Idempotency header keyed by cafe_order_id so retries from
 *      our side are also deduped on Razorpay's side.
 *   5. On 2xx: UPDATE cafe_orders SET payment_status='refunded',
 *      razorpay_refund_id=<id>. Return refund object.
 *   6. On non-2xx from Razorpay: leave payment_status='paid' so staff sees
 *      the row hasn't refunded yet and can retry or escalate. Return 502
 *      with Razorpay's error message.
 *
 * Env (server-only — never bundle):
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Auth posture: requires PMS staff session. Uses service-role Supabase
 * client server-side; no client-side credentials.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

interface RefundRequest {
  cafe_order_id: string
}

interface RefundResponse {
  razorpay_refund_id: string
  amount_paise: number
  status: string
  already_refunded?: boolean
}

interface RazorpayRefund {
  id: string
  amount: number
  status: string
  payment_id: string
  notes?: Record<string, string>
}

interface RazorpayErrorBody {
  error?: { description?: string; code?: string }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RefundResponse | { error: string }>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('refund-razorpay: missing env vars')
    return res.status(500).json({ error: 'Endpoint not configured' })
  }

  const cafeOrderId = (req.body as RefundRequest | undefined)?.cafe_order_id?.trim()
  if (!cafeOrderId) {
    return res.status(400).json({ error: 'cafe_order_id required' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: order, error: lookupErr } = await supabase
    .from('cafe_orders')
    .select(
      'id, payment_mode, payment_status, payment_id, total, kitchen_status, razorpay_refund_id, display_number',
    )
    .eq('id', cafeOrderId)
    .single()

  if (lookupErr || !order) {
    return res.status(404).json({ error: 'order not found' })
  }

  if (order.payment_mode !== 'razorpay') {
    return res.status(400).json({ error: `order payment_mode is ${order.payment_mode}, not razorpay` })
  }

  if (order.kitchen_status !== 'cancelled') {
    return res.status(400).json({
      error: `order kitchen_status is ${order.kitchen_status}, refund only allowed after cancel`,
    })
  }

  if (!order.payment_id) {
    return res.status(400).json({ error: 'order has no payment_id (no Razorpay capture happened)' })
  }

  // Idempotency: short-circuit if we've already refunded this order.
  if (order.razorpay_refund_id) {
    return res.status(200).json({
      razorpay_refund_id: order.razorpay_refund_id,
      amount_paise: order.total,
      status: 'processed',
      already_refunded: true,
    })
  }

  if (order.payment_status !== 'paid' && order.payment_status !== 'refunded') {
    return res.status(400).json({
      error: `order payment_status is ${order.payment_status}, expected paid`,
    })
  }

  // POST to Razorpay refund API. The Idempotency-Key header is keyed by
  // cafe_order_id so a retried request from us is collapsed by Razorpay too.
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')

  let rzpResp: Response
  try {
    rzpResp = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(order.payment_id)}/refund`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
          'X-Razorpay-Idempotency': `cafe-${cafeOrderId}`,
        },
        body: JSON.stringify({
          amount: order.total,
          speed: 'normal',
          notes: {
            cafe_order_id: cafeOrderId,
            display_number: String(order.display_number),
          },
        }),
      },
    )
  } catch (err) {
    console.error('refund-razorpay: network error', err)
    return res.status(502).json({ error: 'razorpay request failed' })
  }

  if (!rzpResp.ok) {
    const body = (await rzpResp.json().catch(() => ({}))) as RazorpayErrorBody
    const msg = body?.error?.description || `razorpay returned ${rzpResp.status}`
    console.error('refund-razorpay: razorpay error', rzpResp.status, msg)
    return res.status(502).json({ error: msg })
  }

  const refund = (await rzpResp.json()) as RazorpayRefund

  // Confirm + persist. payment_status flips to 'refunded' here, NOT inside
  // cancelOrder, so that a failed Razorpay call leaves the row truthfully as
  // 'paid' for staff to see and retry.
  const { error: updErr } = await supabase
    .from('cafe_orders')
    .update({
      payment_status: 'refunded',
      razorpay_refund_id: refund.id,
    })
    .eq('id', cafeOrderId)
    // Guard against a concurrent refund (e.g. a Razorpay webhook beat us).
    .is('razorpay_refund_id', null)

  if (updErr) {
    console.error('refund-razorpay: supabase update failed after refund issued', updErr)
    // Refund DID go through on Razorpay's side — return success so the FE
    // doesn't trigger a retry that would double-refund.
  }

  return res.status(200).json({
    razorpay_refund_id: refund.id,
    amount_paise: refund.amount,
    status: refund.status,
  })
}
