-- Cafe — RPC to apply food credits to a draft (razorpay/pending) order
--
-- UX: a customer who placed a razorpay order with no credits (or partial
-- credits) and dismissed the Razorpay modal sees the "Awaiting Payment"
-- order in their orders tab. When they tap "Complete Payment", we want to
-- offer them the chance to apply $food credits before reopening Razorpay.
--
-- This RPC handles the delta-based update:
--   - Compute delta = new_food_credit_paise - existing_food_credit_applied_paise
--   - delta > 0 → debit wallet, INSERT spend transaction
--   - delta < 0 → refund wallet, INSERT refund transaction
--   - Update cafe_orders.food_credit_applied_paise + total + payment_mode + kitchen_status
--   - Always invalidate razorpay_order_id (amount changed → fresh Razorpay Order needed)
--   - If credits cover full net total → flip to zo_card / paid / kitchen_status='new'
--
-- Idempotency: each delta inserts a new transaction with a unique
-- reference_id (order_id + ':topup-' + epoch_millis) to bypass the
-- (reference_id, type='spend') unique index that protects against
-- double-debiting the same logical event.
--
-- Only callable on payment_status='pending' orders (paid orders are
-- immutable from the customer side).

CREATE OR REPLACE FUNCTION update_cafe_order_food_credits(
  p_cafe_order_id uuid,
  p_food_credit_paise int
) RETURNS json AS $$
DECLARE
  v_order              record;
  v_wallet             record;
  v_old_paise          int;
  v_old_rupees         int;
  v_new_rupees         int := floor(p_food_credit_paise / 100);
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

  IF p_food_credit_paise > v_net THEN
    RAISE EXCEPTION 'food credit amount (%) exceeds order net (%)', p_food_credit_paise, v_net;
  END IF;

  v_old_paise   := v_order.food_credit_applied_paise;
  v_old_rupees  := floor(v_old_paise / 100);
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

    -- Unique reference_id avoids the (reference_id, type='spend') idempotency index.
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

  v_new_total := v_net - p_food_credit_paise;

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
