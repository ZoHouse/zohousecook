-- ══════════════════════════════════════════
-- $food Credits — Tables, RPC, RLS, Indexes
-- ══════════════════════════════════════════

-- 1. Wallets
CREATE TABLE IF NOT EXISTS food_credit_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  name text,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_food_credit_wallets_phone ON food_credit_wallets (phone);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_food_credit_wallets_updated_at
  BEFORE UPDATE ON food_credit_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Transactions
CREATE TABLE IF NOT EXISTS food_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES food_credit_wallets(id),
  type text NOT NULL CHECK (type IN ('issue', 'spend', 'revoke', 'refund')),
  amount integer NOT NULL CHECK (amount > 0),
  balance_after integer NOT NULL,
  reference_type text,
  reference_id text,
  note text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_food_credit_txn_wallet_date ON food_credit_transactions (wallet_id, created_at DESC);
CREATE UNIQUE INDEX idx_food_credit_txn_spend_idempotent ON food_credit_transactions (reference_id, type) WHERE type = 'spend';

-- 3. Add column to cafe_orders
ALTER TABLE cafe_orders ADD COLUMN IF NOT EXISTS food_credit_applied_paise integer NOT NULL DEFAULT 0;

-- 4. RPC: issue_food_credits
CREATE OR REPLACE FUNCTION issue_food_credits(
  p_phone text, p_name text, p_amount integer, p_note text, p_created_by text
) RETURNS json AS $$
DECLARE
  v_wallet food_credit_wallets%ROWTYPE;
  v_new_balance integer;
BEGIN
  INSERT INTO food_credit_wallets (phone, name, balance)
    VALUES (p_phone, p_name, p_amount)
    ON CONFLICT (phone) DO UPDATE
      SET balance = food_credit_wallets.balance + p_amount,
          name = COALESCE(NULLIF(p_name, ''), food_credit_wallets.name)
    RETURNING * INTO v_wallet;

  v_new_balance := v_wallet.balance;

  INSERT INTO food_credit_transactions (wallet_id, type, amount, balance_after, reference_type, note, created_by)
    VALUES (v_wallet.id, 'issue', p_amount, v_new_balance, 'manual', p_note, p_created_by);

  RETURN json_build_object('wallet_id', v_wallet.id, 'balance', v_new_balance);
END;
$$ LANGUAGE plpgsql;

-- 5. RPC: revoke_food_credits
CREATE OR REPLACE FUNCTION revoke_food_credits(
  p_wallet_id uuid, p_amount integer, p_note text, p_created_by text
) RETURNS integer AS $$
DECLARE v_balance integer;
BEGIN
  SELECT balance INTO v_balance FROM food_credit_wallets WHERE id = p_wallet_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'wallet_not_found'; END IF;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'insufficient_balance'; END IF;

  UPDATE food_credit_wallets SET balance = balance - p_amount WHERE id = p_wallet_id;

  INSERT INTO food_credit_transactions (wallet_id, type, amount, balance_after, reference_type, note, created_by)
    VALUES (p_wallet_id, 'revoke', p_amount, v_balance - p_amount, 'manual', p_note, p_created_by);

  RETURN v_balance - p_amount;
END;
$$ LANGUAGE plpgsql;

-- 6. RPC: debit_food_credits
CREATE OR REPLACE FUNCTION debit_food_credits(
  p_wallet_id uuid, p_amount integer, p_reference_id text
) RETURNS integer AS $$
DECLARE v_balance integer;
BEGIN
  SELECT balance INTO v_balance FROM food_credit_wallets WHERE id = p_wallet_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'wallet_not_found'; END IF;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'insufficient_balance'; END IF;

  UPDATE food_credit_wallets SET balance = balance - p_amount WHERE id = p_wallet_id;

  INSERT INTO food_credit_transactions (wallet_id, type, amount, balance_after, reference_type, reference_id)
    VALUES (p_wallet_id, 'spend', p_amount, v_balance - p_amount, 'order', p_reference_id);

  RETURN v_balance - p_amount;
END;
$$ LANGUAGE plpgsql;

-- 7. RPC: restore_food_credits
CREATE OR REPLACE FUNCTION restore_food_credits(
  p_wallet_id uuid, p_amount integer, p_reference_id text
) RETURNS integer AS $$
DECLARE v_balance integer;
BEGIN
  SELECT balance INTO v_balance FROM food_credit_wallets WHERE id = p_wallet_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  UPDATE food_credit_wallets SET balance = balance + p_amount WHERE id = p_wallet_id;

  INSERT INTO food_credit_transactions (wallet_id, type, amount, balance_after, reference_type, reference_id, note)
    VALUES (p_wallet_id, 'refund', p_amount, v_balance + p_amount, 'order', p_reference_id, 'order cancelled');

  RETURN v_balance + p_amount;
END;
$$ LANGUAGE plpgsql;

-- 8. RLS
ALTER TABLE food_credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_own_wallet" ON food_credit_wallets FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_transactions" ON food_credit_transactions FOR SELECT TO anon USING (true);
CREATE POLICY "service_all_wallets" ON food_credit_wallets FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_transactions" ON food_credit_transactions FOR ALL TO service_role USING (true);
