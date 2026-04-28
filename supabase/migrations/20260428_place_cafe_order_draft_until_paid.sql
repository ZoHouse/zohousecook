-- Cafe — orders enter kitchen_status='draft' until Razorpay payment confirms
--
-- Bug: today, a customer who picks "Pay via Razorpay" gets a cafe_orders row
-- inserted with kitchen_status='new' the moment they tap Place Order — the
-- kitchen sees it before any money has moved. If the customer dismisses
-- Razorpay Checkout or the payment fails, the kitchen has already started
-- prepping (or worse, served) an order that will never be paid.
--
-- Fix: razorpay/pending orders insert with kitchen_status='draft'. The
-- existing kitchen filter in apps/pms/src/hooks/cafe/useCafeRealtimeOrders.ts
-- (`ACTIVE_STATUSES = ['new','accepted','preparing','ready']`) already
-- excludes anything not in that list, so 'draft' is invisible to staff at no
-- extra cost. The Razorpay webhook (apps/pms/src/pages/api/cafe/razorpay-webhook.ts)
-- needs a paired update — when payment.captured arrives, it must also flip
-- kitchen_status from 'draft' to 'new'. That handler change is in this PR.
--
-- Resolution rule (matches the existing payment_mode resolver above it):
--   • full food-credit coverage      → kitchen_status='new', payment_mode='zo_card'
--   • cash (staff-only path now)     → kitchen_status='new', payment_mode='cash'
--   • razorpay (anything else)       → kitchen_status='draft', payment_mode='razorpay'
--
-- Food credits are still debited at RPC time. If a draft order is abandoned,
-- credits stay applied to it; the customer can return and Complete Payment via
-- the existing CTA. Cancel-and-refund is a separate flow not covered here.
--
-- Same 9-arg signature, CREATE OR REPLACE in place.

-- Widen the kitchen_status CHECK constraint so 'draft' is a legal value.
-- Prior constraint was {'new','accepted','preparing','ready','served','cancelled'}.
ALTER TABLE cafe_orders DROP CONSTRAINT IF EXISTS cafe_orders_kitchen_status_check;
ALTER TABLE cafe_orders ADD CONSTRAINT cafe_orders_kitchen_status_check
  CHECK (kitchen_status = ANY (ARRAY['draft','new','accepted','preparing','ready','served','cancelled']::text[]));

CREATE OR REPLACE FUNCTION place_cafe_order(
  p_property_id uuid,
  p_table_id text,
  p_customer_name text,
  p_customer_phone text,
  p_zo_user_id text,
  p_items jsonb,
  p_food_credit_paise int DEFAULT 0,
  p_customer_email text DEFAULT NULL,
  p_payment_mode text DEFAULT 'cash'
) RETURNS json AS $$
DECLARE
  v_item                record;
  v_menu_item           record;
  v_cart_total          int := 0;
  v_tax_amount          int := 0;
  v_net_total           int;
  v_final_total         int;
  v_order_id            uuid;
  v_display_number      int;
  v_wallet              record;
  v_today_start         timestamptz;
  v_today_count         int;
  v_order_items         jsonb := '[]'::jsonb;
  v_order_row           record;
  v_food_credit_rupees  int := floor(p_food_credit_paise / 100);
  v_resolved_mode       text;
  v_kitchen_status      text;
BEGIN
  IF p_property_id IS NULL THEN
    RAISE EXCEPTION 'property_id is required';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'items array is required and must not be empty';
  END IF;
  IF jsonb_array_length(p_items) > 20 THEN
    RAISE EXCEPTION 'max 20 items per order';
  END IF;

  IF p_payment_mode NOT IN ('cash', 'razorpay') THEN
    RAISE EXCEPTION 'invalid payment_mode: %, must be cash or razorpay', p_payment_mode;
  END IF;

  v_today_start := date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata';

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items)
    AS x("menu_item_id" uuid, "quantity" int)
  LOOP
    IF v_item.quantity IS NULL OR v_item.quantity < 1 OR v_item.quantity > 10 THEN
      RAISE EXCEPTION 'invalid quantity for item %: must be 1-10', v_item.menu_item_id;
    END IF;

    SELECT * INTO v_menu_item
      FROM cafe_menu_items
      WHERE id = v_item.menu_item_id
        AND property_id = p_property_id
      FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'menu item % not found for this property', v_item.menu_item_id;
    END IF;

    IF NOT v_menu_item.is_available THEN
      RAISE EXCEPTION 'item "%" is currently unavailable', v_menu_item.name;
    END IF;

    IF v_menu_item.daily_limit IS NOT NULL THEN
      SELECT COALESCE(SUM(oi.quantity), 0) INTO v_today_count
        FROM cafe_order_items oi
        JOIN cafe_orders o ON o.id = oi.order_id
        WHERE oi.menu_item_id = v_item.menu_item_id
          AND o.property_id = p_property_id
          AND o.created_at >= v_today_start
          AND o.kitchen_status != 'cancelled'
          AND oi.item_status = 'active';

      IF v_today_count + v_item.quantity > v_menu_item.daily_limit THEN
        RAISE EXCEPTION 'daily limit reached for "%": % of % sold today',
          v_menu_item.name, v_today_count, v_menu_item.daily_limit;
      END IF;
    END IF;

    v_cart_total := v_cart_total + (v_menu_item.price * v_item.quantity);

    v_order_items := v_order_items || jsonb_build_object(
      'menu_item_id', v_item.menu_item_id,
      'name', v_menu_item.name,
      'price', v_menu_item.price,
      'quantity', v_item.quantity
    );
  END LOOP;

  v_tax_amount := floor(v_cart_total * 0.05);
  v_net_total  := v_cart_total + v_tax_amount;

  IF p_food_credit_paise > 0 THEN
    IF p_customer_phone IS NULL OR p_customer_phone = '' THEN
      RAISE EXCEPTION 'phone required to apply food credits';
    END IF;

    IF p_food_credit_paise > v_net_total THEN
      RAISE EXCEPTION 'food credit amount (%) exceeds order total (%)',
        p_food_credit_paise, v_net_total;
    END IF;

    SELECT * INTO v_wallet
      FROM food_credit_wallets
      WHERE phone = p_customer_phone
      FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'no food credit wallet found for this phone';
    END IF;

    IF v_wallet.balance < v_food_credit_rupees THEN
      RAISE EXCEPTION 'insufficient food credit balance: have ₹%, need ₹%',
        v_wallet.balance, v_food_credit_rupees;
    END IF;
  END IF;

  v_final_total := v_net_total - p_food_credit_paise;

  -- Resolve payment_mode + kitchen_status together. Razorpay orders defer
  -- kitchen visibility until the webhook confirms capture.
  IF p_food_credit_paise >= v_net_total THEN
    v_resolved_mode := 'zo_card';
    v_kitchen_status := 'new';
  ELSIF p_payment_mode = 'razorpay' THEN
    v_resolved_mode := 'razorpay';
    v_kitchen_status := 'draft';
  ELSE
    v_resolved_mode := p_payment_mode;
    v_kitchen_status := 'new';
  END IF;

  v_display_number := (EXTRACT(EPOCH FROM now())::int) % 10000;

  INSERT INTO cafe_orders (
    property_id, table_id,
    customer_name, customer_phone, customer_email, zo_user_id,
    mode, kitchen_status, display_number,
    subtotal, service_charge, tax_amount, total,
    payment_status, payment_mode, food_credit_applied_paise
  ) VALUES (
    p_property_id, p_table_id::uuid,
    p_customer_name, p_customer_phone, p_customer_email, NULLIF(p_zo_user_id, '')::uuid,
    'dine_in', v_kitchen_status, v_display_number,
    v_cart_total, 0, v_tax_amount, v_final_total,
    'pending',
    v_resolved_mode,
    p_food_credit_paise
  ) RETURNING * INTO v_order_row;

  v_order_id := v_order_row.id;

  INSERT INTO cafe_order_items (order_id, menu_item_id, name, price, quantity, item_status)
  SELECT
    v_order_id,
    (item->>'menu_item_id')::uuid,
    item->>'name',
    (item->>'price')::int,
    (item->>'quantity')::int,
    'active'
  FROM jsonb_array_elements(v_order_items) AS item;

  IF p_food_credit_paise > 0 THEN
    UPDATE food_credit_wallets
      SET balance = balance - v_food_credit_rupees
      WHERE id = v_wallet.id;

    INSERT INTO food_credit_transactions (
      wallet_id, type, amount, balance_after, reference_type, reference_id
    ) VALUES (
      v_wallet.id, 'spend', v_food_credit_rupees,
      v_wallet.balance - v_food_credit_rupees,
      'order', v_order_id::text
    );
  END IF;

  RETURN json_build_object(
    'id', v_order_id,
    'display_number', v_display_number,
    'human_order_id', v_order_row.human_order_id,
    'subtotal', v_cart_total,
    'tax_amount', v_tax_amount,
    'food_credit_applied', p_food_credit_paise,
    'total', v_final_total,
    'payment_mode', v_resolved_mode,
    'kitchen_status', v_kitchen_status,
    'items', v_order_items
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION place_cafe_order TO anon;
GRANT EXECUTE ON FUNCTION place_cafe_order TO authenticated;
