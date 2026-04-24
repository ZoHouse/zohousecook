-- ══════════════════════════════════════════════════════════════════════════════
-- Cafe — compute GST and auto-populate human_order_id (PR B of 4)
--
-- Depends on PR A (20260424_cafe_fudr_parity_columns.sql).
--
-- Two changes:
--
-- 1. BEFORE INSERT trigger on cafe_orders that auto-populates human_order_id
--    in the FUDR format `<property_code><YYMMDD>-<seq>`. This covers ALL
--    insert paths (place_cafe_order RPC, CreateOrderDialog manual orders,
--    any future staff tool) without each path having to reinvent the logic.
--    Uses a per-(property, IST-date) advisory lock to serialise sequence
--    generation, so two concurrent orders can't get the same seq.
--
-- 2. CREATE OR REPLACE FUNCTION place_cafe_order — compute 5% GST on the
--    subtotal (previously tax_amount was hardcoded to 0), recompute the
--    final total to include tax, adjust the food-credit ceiling to include
--    tax, accept an optional customer_email parameter, and return the
--    generated human_order_id in the response JSON.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. human_order_id trigger ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fill_human_order_id() RETURNS trigger AS $$
DECLARE
  v_property_code text;
  v_date_str      text;
  v_lock_key      bigint;
  v_next_seq      int;
BEGIN
  -- Skip if caller already set it (e.g. a backfill script).
  IF NEW.human_order_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT code INTO v_property_code
    FROM cafe_properties
    WHERE id = NEW.property_id;

  IF v_property_code IS NULL THEN
    RAISE EXCEPTION 'property % not found while generating human_order_id', NEW.property_id;
  END IF;

  -- IST date for the new row. created_at defaults to now() at this point
  -- if the caller didn't supply it.
  v_date_str := to_char(
    (COALESCE(NEW.created_at, now()) AT TIME ZONE 'Asia/Kolkata')::date,
    'YYMMDD'
  );

  -- Serialise (property, day) sequence generation. Two concurrent inserts
  -- for the same (property, day) will queue on this lock, pick distinct
  -- sequence numbers, and both succeed.
  v_lock_key := hashtextextended(v_property_code || v_date_str, 0);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT COALESCE(
    MAX(
      NULLIF(regexp_replace(human_order_id, '^.*-', ''), '')::int
    ),
    0
  ) + 1
    INTO v_next_seq
    FROM cafe_orders
    WHERE property_id = NEW.property_id
      AND human_order_id LIKE v_property_code || v_date_str || '-%';

  NEW.human_order_id := v_property_code || v_date_str || '-' || v_next_seq;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cafe_orders_fill_human_order_id ON cafe_orders;
CREATE TRIGGER cafe_orders_fill_human_order_id
  BEFORE INSERT ON cafe_orders
  FOR EACH ROW EXECUTE FUNCTION fill_human_order_id();

-- ── 2. place_cafe_order — GST + customer_email ───────────────────────────────

CREATE OR REPLACE FUNCTION place_cafe_order(
  p_property_id uuid,
  p_table_id text,
  p_customer_name text,
  p_customer_phone text,
  p_zo_user_id text,
  p_items jsonb,                    -- [{ "menu_item_id": "uuid", "quantity": int }]
  p_food_credit_paise int DEFAULT 0,
  p_customer_email text DEFAULT NULL
) RETURNS json AS $$
DECLARE
  v_item         record;
  v_menu_item    record;
  v_cart_total   int := 0;
  v_tax_amount   int := 0;
  v_net_total    int;                 -- subtotal + tax, before food credits
  v_final_total  int;                 -- what the customer has to pay beyond food credits
  v_order_id     uuid;
  v_display_number int;
  v_wallet       record;
  v_today_start  timestamptz;
  v_today_count  int;
  v_order_items  jsonb := '[]'::jsonb;
  v_order_row    record;
BEGIN
  -- ── Validate inputs ────────────────────────────────────────────────────────
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

  -- ── Validate each item ─────────────────────────────────────────────────────
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

  -- ── Tax (5% GST on subtotal, rounded down to nearest paise) ───────────────
  v_tax_amount := floor(v_cart_total * 0.05);
  v_net_total  := v_cart_total + v_tax_amount;

  -- ── Validate food credits against net (subtotal + tax) ─────────────────────
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

    IF v_wallet.balance < p_food_credit_paise THEN
      RAISE EXCEPTION 'insufficient food credit balance: have %, need %',
        v_wallet.balance, p_food_credit_paise;
    END IF;
  END IF;

  v_final_total := v_net_total - p_food_credit_paise;
  v_display_number := (EXTRACT(EPOCH FROM now())::int) % 10000;

  -- ── Insert order (human_order_id auto-populated by trigger) ────────────────
  INSERT INTO cafe_orders (
    property_id, table_id,
    customer_name, customer_phone, customer_email, zo_user_id,
    mode, kitchen_status, display_number,
    subtotal, service_charge, tax_amount, total,
    payment_status, payment_mode, food_credit_applied_paise
  ) VALUES (
    p_property_id, p_table_id,
    p_customer_name, p_customer_phone, p_customer_email, p_zo_user_id,
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

  -- Debit food credits if applied (unchanged from prior RPC)
  IF p_food_credit_paise > 0 AND v_wallet.id IS NOT NULL THEN
    UPDATE food_credit_wallets
      SET balance = balance - p_food_credit_paise
      WHERE id = v_wallet.id;

    INSERT INTO food_credit_transactions (
      wallet_id, type, amount, balance_after, reference_type, reference_id
    ) VALUES (
      v_wallet.id, 'spend', p_food_credit_paise,
      v_wallet.balance - p_food_credit_paise,
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
