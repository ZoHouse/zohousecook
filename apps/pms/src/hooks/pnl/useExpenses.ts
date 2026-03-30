import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../configs/supabase';
import type { PropertyExpense, CreateExpenseRequest } from '../../types/pnl';

interface UseExpensesParams {
  propertyId: string | null;
  dateFrom: string;
  dateTo: string;
}

interface UseExpensesResult {
  expenses: PropertyExpense[];
  isLoading: boolean;
  refetch: () => Promise<void>;
  addExpense: (req: CreateExpenseRequest) => Promise<boolean>;
  updateExpense: (id: string, updates: Partial<PropertyExpense>) => Promise<boolean>;
  softDeleteExpense: (id: string) => Promise<boolean>;
  carryForwardRecurring: (fromMonth: string) => Promise<number>;
}

export function useExpenses({ propertyId, dateFrom, dateTo }: UseExpensesParams): UseExpensesResult {
  const [expenses, setExpenses] = useState<PropertyExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!propertyId) {
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('property_expenses')
        .select('*')
        .eq('property_id', propertyId)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .is('deleted_at', null)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('useExpenses fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, dateFrom, dateTo]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(async (req: CreateExpenseRequest): Promise<boolean> => {
    try {
      const { error } = await supabase.from('property_expenses').insert(req);
      if (error) throw error;
      await fetchExpenses();
      return true;
    } catch (err) {
      console.error('addExpense error:', err);
      return false;
    }
  }, [fetchExpenses]);

  const updateExpense = useCallback(async (id: string, updates: Partial<PropertyExpense>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('property_expenses')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      await fetchExpenses();
      return true;
    } catch (err) {
      console.error('updateExpense error:', err);
      return false;
    }
  }, [fetchExpenses]);

  const softDeleteExpense = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('property_expenses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await fetchExpenses();
      return true;
    } catch (err) {
      console.error('softDeleteExpense error:', err);
      return false;
    }
  }, [fetchExpenses]);

  const carryForwardRecurring = useCallback(async (fromMonth: string): Promise<number> => {
    if (!propertyId) return 0;
    try {
      const lastMonthStart = fromMonth + '-01';
      const lastMonthEnd = fromMonth + '-31';
      const { data: recurring, error } = await supabase
        .from('property_expenses')
        .select('*')
        .eq('property_id', propertyId)
        .eq('recurring', true)
        .gte('date', lastMonthStart)
        .lte('date', lastMonthEnd)
        .is('deleted_at', null);

      if (error) throw error;
      if (!recurring || recurring.length === 0) return 0;

      const today = new Date().toISOString().split('T')[0];
      const newEntries = recurring.map((entry) => ({
        property_id: entry.property_id,
        type: entry.type,
        category: entry.category,
        amount: entry.amount,
        description: entry.description,
        date: today,
        recurring: true,
        created_by: entry.created_by,
      }));

      const { error: insertError } = await supabase
        .from('property_expenses')
        .insert(newEntries);

      if (insertError) throw insertError;
      await fetchExpenses();
      return newEntries.length;
    } catch (err) {
      console.error('carryForwardRecurring error:', err);
      return 0;
    }
  }, [propertyId, fetchExpenses]);

  return {
    expenses,
    isLoading,
    refetch: fetchExpenses,
    addExpense,
    updateExpense,
    softDeleteExpense,
    carryForwardRecurring,
  };
}
