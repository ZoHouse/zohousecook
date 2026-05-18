-- 2026-05-18: Reconcile double-debited $food credits.
--
-- Bug: from 2026-04-29 (PR #65 — `update_cafe_order_food_credits` RPC) to
-- 2026-05-18 (the code fix removing the accept-time `debitFoodCredits` call
-- in `useCafeRealtimeOrders.ts`), any order that flowed
--   place_cafe_order (food_credit=0, razorpay draft)
--   → update_cafe_order_food_credits (apply credits via "Complete Payment")
--   → kitchen accept
-- was debited twice for the same credits:
--   • topup-path spend tx with reference_id = '<order_id>:topup-<epoch_ms>'
--   • accept-time spend tx with reference_id = '<order_id>'
--
-- The unique-spend idempotency index (reference_id, type='spend') is keyed
-- by the literal reference_id and so does NOT collapse these two — the
-- topup path engineers a different ref to legitimately allow delta
-- adjustments. Net effect: a silent +N debit on every "Complete Payment"
-- order, observed first on Harsh Mishra's wallet 9340573385.
--
-- This script finds every affected order and issues a refund credit equal
-- to MIN(plain_spend, topup_spend) for it. Idempotent — re-running is a
-- no-op because the refund row is tagged note='double-debit reconciliation'
-- and the WHERE NOT EXISTS clause skips orders that already have one.

DO $$
DECLARE
  rec RECORD;
  v_new_balance int;
BEGIN
  FOR rec IN
    SELECT
      plain.wallet_id,
      plain.reference_id AS order_id,
      LEAST(plain.amount, topup.amount) AS refund_amount
    FROM food_credit_transactions plain
    JOIN food_credit_transactions topup
      ON topup.wallet_id = plain.wallet_id
     AND topup.reference_id LIKE plain.reference_id || ':topup-%'
     AND topup.type = 'spend'
    WHERE plain.type = 'spend'
      AND plain.reference_id NOT LIKE '%:topup-%'
      AND NOT EXISTS (
        SELECT 1 FROM food_credit_transactions r
        WHERE r.wallet_id = plain.wallet_id
          AND r.reference_id = plain.reference_id
          AND r.type = 'refund'
          AND r.note = 'double-debit reconciliation'
      )
    -- Lock both rows for the duration of this loop iteration.
    FOR UPDATE OF plain, topup
  LOOP
    UPDATE food_credit_wallets
      SET balance = balance + rec.refund_amount
      WHERE id = rec.wallet_id
      RETURNING balance INTO v_new_balance;

    INSERT INTO food_credit_transactions (
      wallet_id, type, amount, balance_after,
      reference_type, reference_id, note, created_by
    ) VALUES (
      rec.wallet_id, 'refund', rec.refund_amount, v_new_balance,
      'order', rec.order_id,
      'double-debit reconciliation',
      'system-reconcile-2026-05-18'
    );
  END LOOP;
END $$;
