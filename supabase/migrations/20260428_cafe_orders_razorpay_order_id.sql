-- Cafe — add razorpay_order_id to cafe_orders
--
-- Idempotency anchor for the Razorpay Order created by
-- /pm/api/cafe/create-razorpay-order. Without it, a customer who closes
-- the Checkout modal and clicks Pay again would get a brand-new Razorpay
-- Order each time, leaving the previous one orphaned (and re-charging
-- the customer if they happen to pay both).
--
-- Flow:
--   1. Customer places order via place_cafe_order RPC → cafe_orders row
--      with payment_mode='razorpay', razorpay_order_id=NULL.
--   2. FE calls /pm/api/cafe/create-razorpay-order(cafe_order_id).
--   3. Server endpoint:
--      - Locks the cafe_orders row (FOR UPDATE).
--      - If razorpay_order_id is already set, returns it (idempotent).
--      - Else creates Razorpay Order via API with notes.cafe_order_id,
--        sets razorpay_order_id, returns it.
--   4. FE opens Razorpay Checkout with the returned order id.
--   5. On payment.captured, the existing webhook (PR #56) reads
--      notes.cafe_order_id and flips payment_status='paid' + records
--      payment_id, gateway_fee_paise, gateway_gst_paise.
--
-- Indexed on razorpay_order_id for the rare case where we need to look
-- up by it (e.g. webhook fallback path when notes.cafe_order_id is
-- missing). Not unique because in-flight retries before the first
-- response come back could theoretically race; the server route handles
-- the race via SELECT … FOR UPDATE.

ALTER TABLE cafe_orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id text;

CREATE INDEX IF NOT EXISTS idx_cafe_orders_razorpay_order_id
  ON cafe_orders (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;
