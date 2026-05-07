/**
 * Razorpay webhook — records gateway fee breakdown onto cafe_orders.
 *
 * Registered in Razorpay Dashboard → Account → Webhooks with URL
 *   https://zozozo.work/pm/api/cafe/razorpay-webhook
 * and events subscribed: `payment.captured`, `payment.failed`.
 *
 * Flow:
 *   1. Razorpay POSTs the event with X-Razorpay-Signature (HMAC-SHA256 of the
 *      raw body using the webhook secret we configure in the dashboard).
 *   2. We verify the signature with crypto.timingSafeEqual.
 *   3. We look up our cafe_order via payload.payment.entity.notes.cafe_order_id
 *      (set when the order is created through the Razorpay integration flow).
 *   4. On payment.captured we write payment_status='paid', payment_id, and the
 *      gateway_fee_paise / gateway_gst_paise breakdown so FUDR-parity exports
 *      (see lib/cafe/export-fudr.ts) can report commission totals.
 *   5. On payment.failed we write payment_status='refunded' (no commission —
 *      Razorpay doesn't charge on a failed capture).
 *
 * Uses the Supabase SERVICE ROLE key (server-only — lives in process.env only,
 * never bundled). Bypasses RLS so the webhook can update regardless of
 * anon-write policy posture (#50).
 *
 * Idempotent: updates guard on payment_status to avoid double-processing
 * when Razorpay retries. Returns 200 quickly in all verified cases — Razorpay
 * retries on non-2xx, so we only 4xx/5xx for signature failures.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Disable Next's body parser so we can HMAC the raw payload. Razorpay
// signs the exact byte stream we receive — re-stringifying the parsed
// body would drift whitespace / key order and break verification.
export const config = {
  api: { bodyParser: false },
}

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Read the raw request body as a Buffer.
async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer))
  }
  return Buffer.concat(chunks)
}

// Constant-time signature compare. Returns false if lengths differ or bytes mismatch.
function verifySignature(rawBody: Buffer, header: string | undefined, secret: string): boolean {
  if (!header) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(header, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PaymentEntity = Record<string, any>

interface WebhookEvent {
  event: string
  payload: {
    payment?: { entity: PaymentEntity }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!RAZORPAY_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    // Misconfig — don't leak which one is missing.
    console.error('razorpay-webhook: missing env vars')
    return res.status(500).json({ error: 'Webhook not configured' })
  }

  // 1. Read + verify.
  let rawBody: Buffer
  try {
    rawBody = await readRawBody(req)
  } catch (err) {
    console.error('razorpay-webhook: body read failed:', err)
    return res.status(400).json({ error: 'Bad request' })
  }

  const signature = req.headers['x-razorpay-signature']
  const sigStr = Array.isArray(signature) ? signature[0] : signature
  if (!verifySignature(rawBody, sigStr, RAZORPAY_WEBHOOK_SECRET)) {
    console.warn('razorpay-webhook: signature verification failed')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  // 2. Parse event.
  let event: WebhookEvent
  try {
    event = JSON.parse(rawBody.toString('utf8'))
  } catch (err) {
    console.error('razorpay-webhook: invalid JSON:', err)
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const payment = event?.payload?.payment?.entity
  if (!payment) {
    // Not a payment event — Razorpay also sends refund/subscription events.
    // Ack so Razorpay stops retrying.
    return res.status(200).json({ status: 'ignored', reason: 'no payment entity' })
  }

  const cafeOrderId: string | undefined = payment.notes?.cafe_order_id
  if (!cafeOrderId) {
    console.warn('razorpay-webhook: payment without cafe_order_id in notes:', payment.id)
    return res.status(200).json({ status: 'ignored', reason: 'no cafe_order_id' })
  }

  // 3. Apply update.
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    if (event.event === 'payment.captured') {
      // Razorpay amounts are already in paise. fee = Razorpay's fee incl GST,
      // tax = GST portion of the fee.
      const gatewayFee = typeof payment.fee === 'number' ? payment.fee : null
      const gatewayGst = typeof payment.tax === 'number' ? payment.tax : null

      // Look up the order's current kitchen_status — Razorpay-pending orders
      // start as 'draft' (place_cafe_order RPC sets this) so chefs don't see
      // unpaid work. Capture is the moment we promote draft → new. We don't
      // overwrite further-along statuses (accepted/preparing/ready/served)
      // so a manually-progressed order isn't reset.
      const { data: existing } = await supabase
        .from('cafe_orders')
        .select('kitchen_status')
        .eq('id', cafeOrderId)
        .maybeSingle()

      const updates: Record<string, unknown> = {
        payment_status: 'paid',
        payment_id: payment.id,
        gateway_fee_paise: gatewayFee,
        gateway_gst_paise: gatewayGst,
        updated_at: new Date().toISOString(),
      }
      if (existing?.kitchen_status === 'draft') {
        updates.kitchen_status = 'new'
      }

      // Idempotent: only apply if not already paid with same payment_id.
      const { error } = await supabase
        .from('cafe_orders')
        .update(updates)
        .eq('id', cafeOrderId)
        .or(`payment_status.neq.paid,payment_id.neq.${payment.id}`)

      if (error) throw error
      return res.status(200).json({ status: 'captured', cafe_order_id: cafeOrderId })
    }

    if (event.event === 'payment.failed') {
      const { error } = await supabase
        .from('cafe_orders')
        .update({
          payment_status: 'refunded',
          payment_id: payment.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cafeOrderId)
        .neq('payment_status', 'paid')  // don't clobber already-captured

      if (error) throw error
      return res.status(200).json({ status: 'failed', cafe_order_id: cafeOrderId })
    }

    // Other events (refund.processed, etc.) — ack but don't act yet.
    return res.status(200).json({ status: 'ignored', reason: `event ${event.event} unhandled` })
  } catch (err) {
    console.error('razorpay-webhook: supabase update failed:', err)
    // 500 -> Razorpay will retry.
    return res.status(500).json({ error: 'Database update failed' })
  }
}
