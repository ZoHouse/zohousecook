import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../../configs/supabase'
import { normalizePhone } from '../../lib/cafe/phone-normalize'
import type { FoodCreditWallet, FoodCreditTransaction } from '../../types/cafe'

interface FoodCreditStats {
  totalIssued: number
  totalSpent: number
  totalOutstanding: number
}

export interface CustomerMatch {
  phone: string
  name: string | null
  orderCount: number
}

interface UseFoodCreditsResult {
  wallet: FoodCreditWallet | null
  transactions: FoodCreditTransaction[]
  customerMatch: CustomerMatch | null
  isLoading: boolean
  error: string | null
  searchByPhone: (phone: string) => Promise<void>
  issueCredits: (phone: string, amount: number, name?: string, note?: string) => Promise<void>
  revokeCredits: (walletId: string, amount: number, reason: string) => Promise<void>
  stats: FoodCreditStats
  recentTransactions: FoodCreditTransaction[]
  refetch: () => Promise<void>
}

export function useFoodCredits(): UseFoodCreditsResult {
  const [wallet, setWallet] = useState<FoodCreditWallet | null>(null)
  const [transactions, setTransactions] = useState<FoodCreditTransaction[]>([])
  const [customerMatch, setCustomerMatch] = useState<CustomerMatch | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<FoodCreditStats>({ totalIssued: 0, totalSpent: 0, totalOutstanding: 0 })
  const [recentTransactions, setRecentTransactions] = useState<FoodCreditTransaction[]>([])

  const fetchStats = useCallback(async () => {
    // Pull aggregates from the food_credit_summary view (see migration
    // 20260518_food_credit_summary_view.sql). Constant-size payload
    // instead of the previous unbounded scan over food_credit_transactions.
    const { data, error } = await supabase
      .from('food_credit_summary')
      .select('total_issued, total_spent, total_outstanding')
      .single()
    if (error || !data) {
      setStats({ totalIssued: 0, totalSpent: 0, totalOutstanding: 0 })
      return
    }
    setStats({
      totalIssued: data.total_issued ?? 0,
      totalSpent: data.total_spent ?? 0,
      totalOutstanding: data.total_outstanding ?? 0,
    })
  }, [])

  const fetchRecent = useCallback(async () => {
    // JOIN the wallet so the "By" column on /cafe/food-credits can show
    // WHO spent (the wallet owner) — place_cafe_order's INSERT into
    // food_credit_transactions doesn't populate created_by, so without
    // the wallet join SPEND rows render with a blank actor.
    const { data } = await supabase
      .from('food_credit_transactions')
      .select('*, wallet:food_credit_wallets(name, phone)')
      .order('created_at', { ascending: false })
      .limit(20)
    setRecentTransactions((data || []) as FoodCreditTransaction[])
  }, [])

  useEffect(() => {
    fetchStats()
    fetchRecent()
  }, [fetchStats, fetchRecent])

  const searchByPhone = useCallback(async (phone: string) => {
    setIsLoading(true)
    setError(null)
    const normalized = normalizePhone(phone)
    if (normalized.length !== 10) {
      setWallet(null)
      setTransactions([])
      setIsLoading(false)
      return
    }

    const { data: w } = await supabase
      .from('food_credit_wallets')
      .select('*')
      .eq('phone', normalized)
      .single()

    if (w) {
      setWallet(w as FoodCreditWallet)
      setCustomerMatch(null)
      const { data: txns } = await supabase
        .from('food_credit_transactions')
        .select('*, wallet:food_credit_wallets(name, phone)')
        .eq('wallet_id', w.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setTransactions((txns || []) as FoodCreditTransaction[])
    } else {
      setWallet(null)
      setTransactions([])

      // No wallet — check if this phone has placed orders (potential customer)
      const { data: orders } = await supabase
        .from('cafe_orders')
        .select('customer_name, customer_phone')
        .eq('customer_phone', normalized)
        .order('created_at', { ascending: false })
        .limit(50)

      if (orders && orders.length > 0) {
        const name = orders.find((o) => o.customer_name)?.customer_name || null
        setCustomerMatch({ phone: normalized, name, orderCount: orders.length })
      } else {
        setCustomerMatch(null)
      }
    }
    setIsLoading(false)
  }, [])

  const issueCredits = useCallback(async (phone: string, amount: number, name?: string, note?: string) => {
    const normalized = normalizePhone(phone)
    const { error: err } = await supabase.rpc('issue_food_credits', {
      p_phone: normalized,
      p_name: name || null,
      p_amount: amount,
      p_note: note || null,
      p_created_by: 'admin',
    })
    if (err) throw new Error(err.message)
    await searchByPhone(normalized)
    await fetchStats()
    await fetchRecent()
  }, [searchByPhone, fetchStats, fetchRecent])

  const revokeCredits = useCallback(async (walletId: string, amount: number, reason: string) => {
    const { error: err } = await supabase.rpc('revoke_food_credits', {
      p_wallet_id: walletId,
      p_amount: amount,
      p_note: reason,
      p_created_by: 'admin',
    })
    if (err) throw new Error(err.message)
    if (wallet?.phone) await searchByPhone(wallet.phone)
    await fetchStats()
    await fetchRecent()
  }, [wallet, searchByPhone, fetchStats, fetchRecent])

  const refetch = useCallback(async () => {
    if (wallet?.phone) await searchByPhone(wallet.phone)
    await fetchStats()
    await fetchRecent()
  }, [wallet, searchByPhone, fetchStats, fetchRecent])

  return {
    wallet, transactions, customerMatch, isLoading, error,
    searchByPhone, issueCredits, revokeCredits,
    stats, recentTransactions, refetch,
  }
}
