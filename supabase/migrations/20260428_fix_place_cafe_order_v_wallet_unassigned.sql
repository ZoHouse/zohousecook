-- Cafe — fix place_cafe_order "record v_wallet is not assigned yet"
--
-- Third pre-existing bug in this RPC (since 20260404), surfaced when a
-- customer scanned the table QR and tried to place an order WITHOUT
-- applying food credits. Last session's smoke test always set
-- p_food_credit_paise > 0, so this branch never fired.
--
-- Bug: the wallet-debit block at the bottom of the RPC reads
--   IF p_food_credit_paise > 0 AND v_wallet.id IS NOT NULL THEN
-- When p_food_credit_paise = 0, the wallet-lookup block above is
-- skipped entirely, so v_wallet is never assigned. PL/pgSQL raises
-- "record v_wallet is not assigned yet" the moment v_wallet.id is
-- referenced — short-circuit AND does not save us.
--
-- Fix: drop the redundant v_wallet.id check. By the time we reach
-- this block, if p_food_credit_paise > 0 we already either assigned
-- v_wallet or raised "no food credit wallet found" — so the second
-- condition is dead weight. Same 8-arg signature, CREATE OR REPLACE
-- in place.

CREATE OR REPLACE FUNCTION place_cafe_order(
  p_property_id uuid,
  p_table_id text,
  p_customer_name text,
  p_customer_phone text,
  p_zo_user_id text,
  p_items jsonb,
  p_food_credit_paise int DEFAULT 0,
  p_customer_email text DEFAULT NULL
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
    'dine_in', 'new', v_display_number,
    v_cart_total, 0, v_tax_amount, v_final_total,
    'pending',
    CASE WHEN p_food_credit_paise >= v_net_total THEN 'zo_card' ELSE 'cash' END,
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
    'kitchen_status', 'new',
    'items', v_order_items
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION place_cafe_order TO anon;
GRANT EXECUTE ON FUNCTION place_cafe_order TO authenticated;
