-- ══════════════════════════════════════════════════════════════════════════════
-- Persistent customer cart for cafe ordering
--
-- Replaces sessionStorage-only cart on /cafe/order/[tableId] so a diner's cart
-- survives tab close, browser restart, day change, and device switch.
--
-- Design notes
--   • One row per Zo user (unique constraint). "One cart, full stop" — picking
--     a different table updates table_id on the same row instead of forking.
--   • Guest (not logged in) carts continue to live in localStorage, client-side.
--   • items is a jsonb array of {menu_item_id, quantity, name_snapshot,
--     price_snapshot}. Snapshots are display-only; place_cafe_order RPC
--     re-validates prices server-side at order time.
--   • No RLS. Follows the same trust model as cafe_orders SELECT (see
--     20260404_cafe_order_security.sql) — cart contents are not sensitive
--     beyond what's already implied by the menu, and the security boundary
--     for real value transfer (placing an order) remains the RPC.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cafe_carts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zo_user_id   uuid NOT NULL,
  property_id  uuid NOT NULL REFERENCES cafe_properties(id) ON DELETE CASCADE,
  table_id     uuid REFERENCES cafe_tables(id) ON DELETE SET NULL,
  items        jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (zo_user_id)
);

-- updated_at auto-touch on UPDATE
CREATE OR REPLACE FUNCTION cafe_carts_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cafe_carts_touch ON cafe_carts;
CREATE TRIGGER cafe_carts_touch
  BEFORE UPDATE ON cafe_carts
  FOR EACH ROW EXECUTE FUNCTION cafe_carts_touch_updated_at();

CREATE INDEX IF NOT EXISTS cafe_carts_updated_at_idx
  ON cafe_carts (updated_at DESC);
