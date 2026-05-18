-- Cafe — race-safe kitchen status transitions
--
-- Today, advanceStatus in useCafeRealtimeOrders does a bare UPDATE with no
-- expected-state check. If two kitchen tabs are open on the same board and
-- both click "Accept" on the same order, both writes succeed in turn, and
-- inventory deduction + credit debit (both fired client-side after the
-- write) can run twice. The credit-spend transaction is idempotent via
-- the unique index on (reference_id, type='spend'), but inventory has no
-- such guard and can double-decrement.
--
-- This migration introduces advance_kitchen_status: a SECURITY DEFINER RPC
-- that locks the order row, asserts the current status matches what the
-- caller expects, validates the requested transition against the same
-- state machine the FE uses (kitchen-status.ts), and updates atomically.
-- Returns the new status. The FE swaps its bare UPDATE for this call so
-- only one of the two competing tabs gets through.
--
-- Inventory + credit side-effects remain on the FE for now — moving the
-- recipe walk into SQL is a separate piece of work.

CREATE OR REPLACE FUNCTION advance_kitchen_status(
  p_order_id uuid,
  p_expected_status text,
  p_next_status text
) RETURNS text AS $$
DECLARE
  v_current_status text;
  v_payment_status text;
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id is required';
  END IF;

  IF p_next_status NOT IN ('new', 'accepted', 'preparing', 'ready', 'served', 'cancelled') THEN
    RAISE EXCEPTION 'invalid next_status: %', p_next_status;
  END IF;

  -- Lock the row so a concurrent caller waits until we decide.
  SELECT kitchen_status, payment_status
    INTO v_current_status, v_payment_status
    FROM cafe_orders
    WHERE id = p_order_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order % not found', p_order_id;
  END IF;

  -- Optimistic check: the caller must have been looking at the same
  -- current_status we now hold the lock on. If a faster tab already
  -- advanced it, the second caller's expectation is stale and we abort.
  IF v_current_status IS DISTINCT FROM p_expected_status THEN
    RAISE EXCEPTION 'kitchen_status changed: expected %, found %',
      p_expected_status, v_current_status;
  END IF;

  -- State machine — must stay in sync with kitchen-status.ts.
  -- 'cancelled' is allowed from any non-terminal status (handled separately
  -- by cancelOrder so it can carry refund side-effects; not via this RPC).
  IF p_next_status = 'cancelled' THEN
    IF v_current_status IN ('served', 'cancelled') THEN
      RAISE EXCEPTION 'cannot cancel order in terminal state: %', v_current_status;
    END IF;
  ELSIF (v_current_status, p_next_status) NOT IN (
    ('new', 'accepted'),
    ('accepted', 'preparing'),
    ('preparing', 'ready'),
    ('ready', 'served')
  ) THEN
    RAISE EXCEPTION 'illegal transition: % → %', v_current_status, p_next_status;
  END IF;

  -- Draft orders (Razorpay awaiting capture) can't be advanced by staff.
  IF v_current_status = 'draft' THEN
    RAISE EXCEPTION 'draft order — payment must capture before kitchen can advance';
  END IF;

  UPDATE cafe_orders
    SET kitchen_status = p_next_status,
        updated_at = now()
    WHERE id = p_order_id;

  RETURN p_next_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION advance_kitchen_status TO authenticated;
GRANT EXECUTE ON FUNCTION advance_kitchen_status TO service_role;
