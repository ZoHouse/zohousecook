-- Cafe — let $food credits absorb the 5% GST paise tail
--
-- Problem: food_credit_wallets.balance is whole rupees but order totals carry
-- a paise tail from 5% GST (e.g. ₹50 + ₹2.50 = ₹52.50). Slider/RPC capped
-- food credits at floor(net/100) rupees, leaving 1-99 paise on the Razorpay
-- leg. Razorpay's minimum charge is ₹1, so any sub-rupee remainder failed
-- and the order got stuck in kitchen_status='draft' forever (e.g. live order
-- #6799 — ₹52.50 order, ₹52 food credit, ₹0.50 stuck on Razorpay).
--
-- Fix: accept p_food_credit_paise up to v_net_total + 99 (one rupee over).
-- Customer drags slider to ceil(net/100); wallet debits the ceiling rupee;
-- order's food_credit_applied_paise records the actual wallet debit (paise).
-- final_total clamped to GREATEST(0, ...). The customer effectively
-- "rounds up" to fully cover the order — same UX as cash in any Indian
-- cafe where ₹52.50 is paid as ₹53 with no change handed back. The 1-99p
-- delta is the cost of avoiding sub-rupee Razorpay calls; staff can refund
-- via the existing food-credit issue flow if a customer ever objects.
--
-- Both customer entry points need the new behavior:
--   • place_cafe_order (cart → Place Order)
--   • update_cafe_order_food_credits (draft retry → Complete Payment)
-- Same signatures, CREATE OR REPLACE in place.

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
  v_food_credit_rupees  int := ceil(p_food_credit_paise::numeric / 100);
  v_resolved_mode       text;
  v_kitchen_status      text;
  v_accepting_orders    boolean;
BEGIN
  IF p_property_id IS NULL THEN
    RAISE EXCEPTION 'property_id is required';
  END IF;

  -- Pause-orders gate (added in 20260429_cafe_properties_accepting_orders.sql).
  SELECT accepting_orders INTO v_accepting_orders
    FROM cafe_properties WHERE id = p_property_id;
  IF v_accepting_orders IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'cafe is paused, not accepting orders right now';
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

    -- Allow up to ceil(net/100)*100 — i.e. one rupee over the order net so
    -- the wallet can absorb the GST paise tail. Anything beyond that is
    -- almost certainly a client bug or tampering.
    IF p_food_credit_paise > ceil(v_net_total::numeric / 100) * 100 THEN
      RAISE EXCEPTION 'food credit amount (%) exceeds order total (%) by more than one rupee',
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

  v_final_total := GREATEST(0, v_net_total - p_food_credit_paise);

  -- Resolve payment_mode + kitchen_status. Razorpay orders defer kitchen
  -- visibility until the webhook confirms capture.
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


CREATE OR REPLACE FUNCTION update_cafe_order_food_credits(
  p_cafe_order_id uuid,
  p_food_credit_paise int
) RETURNS json AS $$
DECLARE
  v_order              record;
  v_wallet             record;
  v_old_paise          int;
  v_old_rupees         int;
  v_new_rupees         int := ceil(p_food_credit_paise::numeric / 100);
  v_delta_rupees       int;
  v_net                int;
  v_new_total          int;
  v_new_payment_mode   text;
  v_new_kitchen_status text;
  v_new_payment_status text;
  v_ref                text;
BEGIN
  IF p_food_credit_paise < 0 THEN
    RAISE EXCEPTION 'food_credit_paise must be non-negative';
  END IF;

  SELECT * INTO v_order FROM cafe_orders WHERE id = p_cafe_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order not found';
  END IF;

  IF v_order.payment_status != 'pending' THEN
    RAISE EXCEPTION 'order is %, cannot modify food credits', v_order.payment_status;
  END IF;

  v_net := v_order.subtotal + v_order.tax_amount;

  -- Same one-rupee-over allowance as place_cafe_order so the retry path
  -- can absorb the GST paise tail too.
  IF p_food_credit_paise > ceil(v_net::numeric / 100) * 100 THEN
    RAISE EXCEPTION 'food credit amount (%) exceeds order net (%) by more than one rupee',
      p_food_credit_paise, v_net;
  END IF;

  v_old_paise   := v_order.food_credit_applied_paise;
  v_old_rupees  := ceil(v_old_paise::numeric / 100);
  v_delta_rupees := v_new_rupees - v_old_rupees;

  IF v_delta_rupees != 0 THEN
    IF v_order.customer_phone IS NULL OR v_order.customer_phone = '' THEN
      RAISE EXCEPTION 'phone required to apply food credits';
    END IF;

    SELECT * INTO v_wallet
      FROM food_credit_wallets
      WHERE phone = v_order.customer_phone
      FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'no food credit wallet found for this phone';
    END IF;

    v_ref := p_cafe_order_id::text || ':topup-' || (extract(epoch from now()) * 1000)::bigint::text;

    IF v_delta_rupees > 0 THEN
      IF v_wallet.balance < v_delta_rupees THEN
        RAISE EXCEPTION 'insufficient food credit balance: have ₹%, need ₹%',
          v_wallet.balance, v_delta_rupees;
      END IF;

      UPDATE food_credit_wallets
        SET balance = balance - v_delta_rupees
        WHERE id = v_wallet.id;

      INSERT INTO food_credit_transactions (
        wallet_id, type, amount, balance_after, reference_type, reference_id, note
      ) VALUES (
        v_wallet.id, 'spend', v_delta_rupees,
        v_wallet.balance - v_delta_rupees,
        'order', v_ref, 'topup applied to order ' || p_cafe_order_id::text
      );
    ELSE
      UPDATE food_credit_wallets
        SET balance = balance + abs(v_delta_rupees)
        WHERE id = v_wallet.id;

      INSERT INTO food_credit_transactions (
        wallet_id, type, amount, balance_after, reference_type, reference_id, note
      ) VALUES (
        v_wallet.id, 'refund', abs(v_delta_rupees),
        v_wallet.balance + abs(v_delta_rupees),
        'order', v_ref, 'refund from order ' || p_cafe_order_id::text
      );
    END IF;
  END IF;

  v_new_total := GREATEST(0, v_net - p_food_credit_paise);

  IF p_food_credit_paise >= v_net THEN
    v_new_payment_mode   := 'zo_card';
    v_new_kitchen_status := 'new';
    v_new_payment_status := 'paid';
  ELSE
    v_new_payment_mode   := 'razorpay';
    v_new_kitchen_status := 'draft';
    v_new_payment_status := 'pending';
  END IF;

  UPDATE cafe_orders SET
    food_credit_applied_paise = p_food_credit_paise,
    total = v_new_total,
    payment_mode = v_new_payment_mode,
    kitchen_status = v_new_kitchen_status,
    payment_status = v_new_payment_status,
    razorpay_order_id = NULL,
    updated_at = now()
  WHERE id = p_cafe_order_id;

  RETURN json_build_object(
    'id', p_cafe_order_id,
    'food_credit_applied', p_food_credit_paise,
    'total', v_new_total,
    'payment_mode', v_new_payment_mode,
    'kitchen_status', v_new_kitchen_status,
    'payment_status', v_new_payment_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_cafe_order_food_credits TO anon;
GRANT EXECUTE ON FUNCTION update_cafe_order_food_credits TO authenticated;
