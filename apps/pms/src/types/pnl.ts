// -- Database row types --

export type ExpenseCategory =
  | 'rent'
  | 'salaries'
  | 'kitchen_supplies'
  | 'electricity'
  | 'hk_supplies'
  | 'repairs'
  | 'internet'
  | 'events'
  | 'other';

export type RevenueCategory =
  | 'events_revenue'
  | 'coworking_revenue'
  | 'activity_revenue'
  | 'other_revenue';

export type EntryType = 'expense' | 'revenue';

export interface PropertyExpense {
  id: string;
  property_id: string;
  type: EntryType;
  category: ExpenseCategory | RevenueCategory;
  amount: number; // paise
  description: string | null;
  date: string; // YYYY-MM-DD
  recurring: boolean;
  created_by: string;
  created_at: string;
  receipt_url: string | null;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateExpenseRequest {
  property_id: string;
  type: EntryType;
  category: ExpenseCategory | RevenueCategory;
  amount: number; // paise
  description?: string;
  date: string;
  recurring?: boolean;
  created_by: string;
  receipt_url?: string;
}

// -- RPC response types --

export interface ExpenseSummary {
  category: ExpenseCategory;
  total: number; // paise
}

export interface PnlSummaryResponse {
  cafe_revenue: number; // paise
  other_revenue: number; // paise
  expenses: ExpenseSummary[];
}

// -- Zostel booking types (fields we use for P&L) --

export interface ZostelBookingForPnl {
  code: string;
  status: string;
  start_date: string;
  end_date: string;
  amount: number;
  tax_amount: number;
  paid_amount: number;
  due_amount: number;
  guests: Array<{
    name: string;
    mobile: string;
  }>;
}

// -- Computed P&L view model --

export interface PnlData {
  stay_revenue: number; // paise
  cafe_revenue: number; // paise
  other_revenue: number; // paise
  total_revenue: number; // paise
  expenses_by_category: ExpenseSummary[];
  total_expenses: number; // paise
  ebitda: number; // paise
}

// -- Guest revenue --

export interface GuestRevenue {
  name: string;
  phone: string;
  stay_revenue: number; // paise
  cafe_revenue: number; // paise
  total_revenue: number; // paise
  nights: number;
  adr: number; // paise per night
}

// -- Display helpers --

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: 'Rent',
  salaries: 'Salaries',
  kitchen_supplies: 'Kitchen Supplies',
  electricity: 'Electricity',
  hk_supplies: 'HK Supplies',
  repairs: 'Repairs',
  internet: 'Internet',
  events: 'Events',
  other: 'Other',
};

export const REVENUE_CATEGORY_LABELS: Record<RevenueCategory, string> = {
  events_revenue: 'Events',
  coworking_revenue: 'Coworking',
  activity_revenue: 'Activities',
  other_revenue: 'Other',
};

export const EBITDA_TARGET_PAISE = 500000 * 100; // ₹5,00,000 = 5,00,00,000 paise
