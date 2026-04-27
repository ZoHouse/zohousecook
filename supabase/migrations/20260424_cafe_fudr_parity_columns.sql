-- ══════════════════════════════════════════════════════════════════════════════
-- Cafe — FUDR-parity columns (PR A of 4)
--
-- Schema foundation for parity with FUDR's three monthly exports (Orders,
-- Order-items, Payout). All columns nullable — no backfill, no behaviour
-- change on their own. Subsequent PRs populate them:
--
--   PR B — place_cafe_order RPC: compute 5% GST into tax_amount, generate
--          human_order_id on insert.
--   PR C — CSV/Excel export on /cafe/orders (reads these columns).
--   PR D — Razorpay webhook: populate gateway_fee_paise / gateway_gst_paise
--          on successful payment.
--
-- Coupon/discount columns are deliberately NOT added — Zo House doesn't use
-- them (0 usage in FUDR March 2026 export) and $food credits already cover
-- the "internal discount" mechanism.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cafe_orders ──────────────────────────────────────────────────────────────

-- Customer email. FUDR captures this; we don't today.
ALTER TABLE cafe_orders
  ADD COLUMN IF NOT EXISTS customer_email text;

-- Payment gateway fees (Razorpay). NULL = not yet known (pending webhook) OR
-- not applicable (wallet-only payment). Export layer coalesces NULL to 0.
ALTER TABLE cafe_orders
  ADD COLUMN IF NOT EXISTS gateway_fee_paise int;
ALTER TABLE cafe_orders
  ADD COLUMN IF NOT EXISTS gateway_gst_paise int;

-- FUDR-style human-readable order ID: <property_code><YYMMDD>-<seq>
-- e.g. BNGHO812260424-1. Distinct from the existing unused `fudr_order_id`
-- column (which is reserved for mapping to the legacy FUDR system during
-- any dual-run / data-import flow).
ALTER TABLE cafe_orders
  ADD COLUMN IF NOT EXISTS human_order_id text;

-- Partial unique index — allows multiple NULL values (existing orders stay
-- NULL until backfill or until the RPC starts populating new orders).
CREATE UNIQUE INDEX IF NOT EXISTS cafe_orders_human_order_id_uniq
  ON cafe_orders (human_order_id)
  WHERE human_order_id IS NOT NULL;

-- ── cafe_order_items ─────────────────────────────────────────────────────────

-- Per-item free-text remark. FUDR has this at the item level (typically
-- "Item not available" when the kitchen flags a cancelled line). Our
-- existing cafe_orders.notes is ORDER-level only.
ALTER TABLE cafe_order_items
  ADD COLUMN IF NOT EXISTS remark text;
