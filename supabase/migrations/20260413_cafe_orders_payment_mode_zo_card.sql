-- Allow 'zo_card' as a payment_mode on cafe_orders.
-- place_cafe_order() writes 'zo_card' when food credits fully cover the order
-- (see 20260408_fix_place_cafe_order_food_credits.sql). The existing check
-- constraint predates that RPC and rejects the value, causing:
--   new row for relation "cafe_orders" violates check constraint
--   "cafe_orders_payment_mode_check"
-- Drop and recreate the constraint to include the full PaymentMode set
-- ('cash' | 'razorpay' | 'zo_card') that libs/types/cafe.ts already exports.

ALTER TABLE cafe_orders
  DROP CONSTRAINT IF EXISTS cafe_orders_payment_mode_check;

ALTER TABLE cafe_orders
  ADD CONSTRAINT cafe_orders_payment_mode_check
  CHECK (payment_mode IN ('cash', 'razorpay', 'zo_card'));
