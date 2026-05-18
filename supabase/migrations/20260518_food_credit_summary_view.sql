-- Cafe — server-side aggregate for the $food-credits stats card
--
-- useFoodCredits.fetchStats currently does `select type, amount from
-- food_credit_transactions` with no aggregation or pagination, pulling
-- every transaction row ever to compute three top-line numbers. As the
-- ledger grows, the food-credits admin page gets progressively heavier.
--
-- Replace with a Postgres view that returns a single row of aggregates,
-- so the FE fetches O(1) bytes regardless of transaction count.

CREATE OR REPLACE VIEW food_credit_summary AS
SELECT
  COALESCE((
    SELECT SUM(amount)::int
      FROM food_credit_transactions
      WHERE type = 'issue'
  ), 0) AS total_issued,
  COALESCE((
    SELECT SUM(amount)::int
      FROM food_credit_transactions
      WHERE type = 'spend'
  ), 0) AS total_spent,
  COALESCE((
    SELECT SUM(amount)::int
      FROM food_credit_transactions
      WHERE type = 'revoke'
  ), 0) AS total_revoked,
  COALESCE((
    SELECT SUM(amount)::int
      FROM food_credit_transactions
      WHERE type = 'refund'
  ), 0) AS total_refunded,
  COALESCE((
    SELECT SUM(balance)::int
      FROM food_credit_wallets
  ), 0) AS total_outstanding;

-- Grants: the admin page is authenticated, but the view inherits RLS from
-- the underlying tables. The existing RLS policies on food_credit_wallets
-- and food_credit_transactions allow anon SELECT (used by /pm/cafe pages
-- which run as authenticated; the anon-select policy is permissive).
GRANT SELECT ON food_credit_summary TO anon;
GRANT SELECT ON food_credit_summary TO authenticated;
