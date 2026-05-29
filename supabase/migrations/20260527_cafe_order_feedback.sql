-- ══════════════════════════════════════════════════════════════════════════════
-- Cafe order feedback
--
-- After a customer's order is marked `served`, cafezomad auto-pops a rating
-- modal on their next session. They give 1–5 stars + an optional comment;
-- one row is inserted here. Operators see the feed on /pm/cafe/reviews.
--
-- Design notes
--   • One feedback per order — UNIQUE(order_id) guards against double-submit
--     when realtime + polling race each other on the customer side.
--   • zo_user_id and property_id are denormalised from cafe_orders so the
--     reviews page can filter by property without a join, and so a deleted
--     order doesn't orphan the rating's user attribution.
--   • Trust model matches cafe_orders SELECT (see 20260404): anon can read +
--     insert; the unique-by-order check enforces the only invariant that
--     actually matters. Comment is plain text, length-capped server-side.
--   • Skip is a client-side concept (localStorage key) — there is no "skipped"
--     row in this table. Absence of a row for a served order = unrated.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cafe_order_feedback (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES cafe_orders(id) ON DELETE CASCADE,
  zo_user_id   text,
  property_id  uuid NOT NULL,
  rating       int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text CHECK (comment IS NULL OR char_length(comment) <= 1000),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS cafe_order_feedback_property_created_idx
  ON cafe_order_feedback (property_id, created_at DESC);

CREATE INDEX IF NOT EXISTS cafe_order_feedback_user_idx
  ON cafe_order_feedback (zo_user_id);

ALTER TABLE cafe_order_feedback ENABLE ROW LEVEL SECURITY;

-- Anon: read and insert. UNIQUE(order_id) + the CHECK on rating are the only
-- real invariants. service_role bypasses RLS for the PMS reviews tab.
DROP POLICY IF EXISTS "anon_select_feedback" ON cafe_order_feedback;
CREATE POLICY "anon_select_feedback" ON cafe_order_feedback
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_insert_feedback" ON cafe_order_feedback;
CREATE POLICY "anon_insert_feedback" ON cafe_order_feedback
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_feedback" ON cafe_order_feedback;
CREATE POLICY "authenticated_select_feedback" ON cafe_order_feedback
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_feedback" ON cafe_order_feedback;
CREATE POLICY "authenticated_insert_feedback" ON cafe_order_feedback
  FOR INSERT TO authenticated WITH CHECK (true);
