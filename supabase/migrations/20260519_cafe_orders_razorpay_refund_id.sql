-- 2026-05-19: Track the Razorpay refund id issued when staff cancels a
-- paid order.
--
-- Before today, cancelOrder in useCafeRealtimeOrders only flipped
-- payment_status='refunded' in the DB and logged a TODO; staff had to
-- manually refund via Razorpay Dashboard (see the #refund-todo comment).
--
-- The /pm/api/cafe/refund-razorpay endpoint introduced today calls
-- POST /v1/payments/{payment_id}/refund and stamps the returned refund id
-- onto this column. Subsequent re-fires for the same order short-circuit
-- on this column to prevent a double refund — important because Razorpay
-- charges fees per refund and a duplicate would silently double-credit
-- the customer.

ALTER TABLE cafe_orders
ADD COLUMN IF NOT EXISTS razorpay_refund_id text NULL;

COMMENT ON COLUMN cafe_orders.razorpay_refund_id IS
  'Razorpay refund id (e.g. rfnd_...) once the /pm/api/cafe/refund-razorpay endpoint has confirmed a successful refund. NULL means no refund issued yet.';
