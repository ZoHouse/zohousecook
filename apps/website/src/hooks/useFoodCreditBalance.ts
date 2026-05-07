import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../config/supabase'

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10)
}

interface UseFoodCreditBalanceResult {
  balance: number
  isLoading: boolean
  refresh: () => void
}

export function useFoodCreditBalance(phone: string | null): UseFoodCreditBalanceResult {
  const [balance, setBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(() => {
    if (!phone) {
      setBalance(0)
      return
    }
    const normalized = normalizePhone(phone)
    if (normalized.length !== 10) {
      setBalance(0)
      return
    }
    setIsLoading(true)
    supabase
      .from('food_credit_wallets')
      .select('balance')
      .eq('phone', normalized)
      .single()
      .then(({ data }) => {
        setBalance(data?.balance ?? 0)
        setIsLoading(false)
      })
  }, [phone])

  useEffect(() => { refresh() }, [refresh])

  return { balance, isLoading, refresh }
}
