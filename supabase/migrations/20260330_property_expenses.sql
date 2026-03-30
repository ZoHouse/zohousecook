-- Property expenses table for P&L tracking
CREATE TABLE property_expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES cafe_properties(id),
  type text NOT NULL CHECK (type IN ('expense', 'revenue')),
  category text NOT NULL CHECK (category IN (
    'rent', 'salaries', 'kitchen_supplies', 'electricity', 'hk_supplies',
    'repairs', 'internet', 'events', 'other',
    'events_revenue', 'coworking_revenue', 'activity_revenue', 'other_revenue'
  )),
  amount integer NOT NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  recurring boolean DEFAULT false,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  receipt_url text,
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_property_expenses_property_date ON property_expenses(property_id, date);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_property_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_property_expenses_updated_at
  BEFORE UPDATE ON property_expenses
  FOR EACH ROW EXECUTE FUNCTION update_property_expenses_updated_at();

-- RLS
ALTER TABLE property_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated" ON property_expenses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for authenticated" ON property_expenses
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update for authenticated" ON property_expenses
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- P&L summary RPC
CREATE OR REPLACE FUNCTION property_pnl_summary(
  p_property_id uuid,
  p_date_from date,
  p_date_to date
)
RETURNS JSON AS $$
  SELECT json_build_object(
    'cafe_revenue', (
      SELECT COALESCE(SUM(total), 0) FROM cafe_orders
      WHERE property_id = p_property_id
      AND created_at::date BETWEEN p_date_from AND p_date_to
      AND payment_status = 'paid'
    ),
    'other_revenue', (
      SELECT COALESCE(SUM(amount), 0) FROM property_expenses
      WHERE property_id = p_property_id
      AND date BETWEEN p_date_from AND p_date_to
      AND type = 'revenue'
      AND deleted_at IS NULL
    ),
    'expenses', (
      SELECT COALESCE(json_agg(row_to_json(e)), '[]'::json) FROM (
        SELECT category, SUM(amount) as total
        FROM property_expenses
        WHERE property_id = p_property_id
        AND date BETWEEN p_date_from AND p_date_to
        AND type = 'expense'
        AND deleted_at IS NULL
        GROUP BY category
      ) e
    )
  );
$$ LANGUAGE sql STABLE;

-- Guest cafe revenue by phone
CREATE OR REPLACE FUNCTION guest_cafe_revenue(
  p_phone_last10 text,
  p_property_id uuid,
  p_date_from date,
  p_date_to date
)
RETURNS JSON AS $$
  SELECT json_build_object(
    'cafe_total', (
      SELECT COALESCE(SUM(total), 0) FROM cafe_orders
      WHERE property_id = p_property_id
      AND created_at::date BETWEEN p_date_from AND p_date_to
      AND payment_status = 'paid'
      AND RIGHT(REGEXP_REPLACE(customer_phone, '\D', '', 'g'), 10) = p_phone_last10
    ),
    'order_count', (
      SELECT COUNT(*) FROM cafe_orders
      WHERE property_id = p_property_id
      AND created_at::date BETWEEN p_date_from AND p_date_to
      AND payment_status = 'paid'
      AND RIGHT(REGEXP_REPLACE(customer_phone, '\D', '', 'g'), 10) = p_phone_last10
    )
  );
$$ LANGUAGE sql STABLE;
