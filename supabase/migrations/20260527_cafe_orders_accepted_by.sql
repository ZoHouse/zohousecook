-- ══════════════════════════════════════════════════════════════════════════════
-- Capture which kitchen operator accepted (and therefore is cooking) each
-- order. Surfaces back to the diner in the post-meal feedback modal as
-- "Made with love by Arun.zo" / etc — Uber-style attribution so customers
-- know who cooked their food.
--
-- Design notes
--   • One slot only: `accepted_by` (text), nullable. Holds the operator's
--     display handle (nickname / first name / "operator"). We don't FK to a
--     user table because staff identity in PMS travels as a free-text
--     nickname today; if a proper staff roster lands later, this column can
--     be migrated to an FK without breaking the customer-facing read path.
--   • Written only on the new→accepted transition. Once set, advance steps
--     (preparing/ready/served) leave it alone — the cook who *accepted* the
--     ticket owns it even if a different operator marks it served later.
--     A teammate stepping in mid-prep isn't surfaced; that's a deliberate
--     simplification (one name reads better than a list, and accept is the
--     moment the kitchen commits to the dish).
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE cafe_orders
  ADD COLUMN IF NOT EXISTS accepted_by text;

COMMENT ON COLUMN cafe_orders.accepted_by IS
  'Display handle of the kitchen operator who accepted this order (nickname). Set on new→accepted via advance_kitchen_status. Surfaced in cafezomad feedback modal.';

-- Extend advance_kitchen_status with an actor param. p_actor is optional —
-- existing callers that pass nothing keep working (the RPC just doesn't
-- write the column), and new callers (kitchen accept) pass the operator's
-- nickname. Only the new→accepted transition writes the column; other
-- transitions ignore the actor.
CREATE OR REPLACE FUNCTION advance_kitchen_status(
  p_order_id uuid,
  p_expected_status text,
  p_next_status text,
  p_actor text DEFAULT NULL
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

  SELECT kitchen_status, payment_status
    INTO v_current_status, v_payment_status
    FROM cafe_orders
    WHERE id = p_order_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order % not found', p_order_id;
  END IF;

  IF v_current_status IS DISTINCT FROM p_expected_status THEN
    RAISE EXCEPTION 'kitchen_status changed: expected %, found %',
      p_expected_status, v_current_status;
  END IF;

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

  IF v_current_status = 'draft' THEN
    RAISE EXCEPTION 'draft order — payment must capture before kitchen can advance';
  END IF;

  -- Stamp accepted_by on the new→accepted edge only. Trim + cap length so
  -- a stray pasted bio doesn't poison the column. NULLIF guards against
  -- empty-string posing as a real value.
  IF v_current_status = 'new' AND p_next_status = 'accepted' AND p_actor IS NOT NULL THEN
    UPDATE cafe_orders
      SET kitchen_status = p_next_status,
          accepted_by = NULLIF(left(btrim(p_actor), 60), ''),
          updated_at = now()
      WHERE id = p_order_id;
  ELSE
    UPDATE cafe_orders
      SET kitchen_status = p_next_status,
          updated_at = now()
      WHERE id = p_order_id;
  END IF;

  RETURN p_next_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION advance_kitchen_status(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION advance_kitchen_status(uuid, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION advance_kitchen_status(uuid, text, text, text) TO anon;
