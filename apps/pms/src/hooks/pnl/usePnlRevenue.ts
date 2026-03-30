import { useCallback, useEffect, useState } from 'react'
import { useQueryApi } from '@zo/auth'
import { supabase } from '../../configs/supabase'
import type { PnlData, PnlSummaryResponse, ZostelBookingForPnl } from '../../types/pnl'

const EXCLUDED_STATUSES = ['cancelled', 'refunded']
// Request a large page to get all bookings in the date range in one shot.
// 500 is well above the maximum number of active bookings for a single property
// in any 30-day window.
const BOOKINGS_LIMIT = 500

interface UsePnlRevenueParams {
  propertyId: string | null
  operatorCode: string | null
  dateFrom: string
  dateTo: string
}

interface UsePnlRevenueResult {
  pnl: PnlData | null
  isLoading: boolean
  refetch: () => void
}

export function usePnlRevenue({
  propertyId,
  operatorCode,
  dateFrom,
  dateTo,
}: UsePnlRevenueParams): UsePnlRevenueResult {
  const [pnl, setPnl] = useState<PnlData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Flip this to trigger a refetch without changing the query params
  const [fetchTick, setFetchTick] = useState(0)

  // --- Zostel bookings via useQueryApi ---
  // additionalRoute is empty; all filters go in the search string.
  const bookingsSearch =
    operatorCode && dateFrom && dateTo
      ? `operator=${operatorCode}&start_date__gte=${dateFrom}&start_date__lte=${dateTo}&limit=${BOOKINGS_LIMIT}&ordering=start_date`
      : ''

  const {
    data: bookingsResponse,
    isLoading: isBookingsLoading,
    refetch: refetchBookings,
  } = useQueryApi(
    'ADMIN_PM_BOOKINGS',
    {
      enabled: Boolean(operatorCode && dateFrom && dateTo),
      retry: 1,
      refetchOnWindowFocus: false,
    },
    '',
    bookingsSearch
  )

  // --- Supabase RPC ---
  const [supabaseData, setSupabaseData] = useState<PnlSummaryResponse | null>(null)
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(true)

  const fetchSupabase = useCallback(async () => {
    if (!propertyId || !dateFrom || !dateTo) {
      setSupabaseData(null)
      setIsSupabaseLoading(false)
      return
    }
    setIsSupabaseLoading(true)
    try {
      const { data, error } = await supabase.rpc('property_pnl_summary', {
        p_property_id: propertyId,
        p_date_from: dateFrom,
        p_date_to: dateTo,
      })
      if (error) throw error
      setSupabaseData(data as PnlSummaryResponse)
    } catch (err) {
      console.error('usePnlRevenue Supabase RPC error:', err)
      setSupabaseData(null)
    } finally {
      setIsSupabaseLoading(false)
    }
  }, [propertyId, dateFrom, dateTo])

  // Re-run Supabase fetch when params change or refetch is triggered
  useEffect(() => {
    fetchSupabase()
  }, [fetchSupabase, fetchTick])

  // --- Combine when both sources are ready ---
  useEffect(() => {
    if (isBookingsLoading || isSupabaseLoading) {
      setIsLoading(true)
      return
    }

    const rawBookings: ZostelBookingForPnl[] =
      (bookingsResponse as any)?.data?.results ?? []

    const activeBookings = rawBookings.filter(
      (b) => !EXCLUDED_STATUSES.includes(b.status)
    )

    // Zostel amounts are in rupees — convert to paise (*100)
    const stayRevenuePaise = activeBookings.reduce((sum, b) => {
      const rupees = b.paid_amount ?? 0
      return sum + Math.round(rupees * 100)
    }, 0)

    const cafeRevenue = supabaseData?.cafe_revenue ?? 0
    const otherRevenue = supabaseData?.other_revenue ?? 0
    const expensesByCategory = supabaseData?.expenses ?? []
    const totalExpenses = expensesByCategory.reduce(
      (sum, e) => sum + (e.total ?? 0),
      0
    )

    const totalRevenue = stayRevenuePaise + cafeRevenue + otherRevenue
    const ebitda = totalRevenue - totalExpenses

    setPnl({
      stay_revenue: stayRevenuePaise,
      cafe_revenue: cafeRevenue,
      other_revenue: otherRevenue,
      total_revenue: totalRevenue,
      expenses_by_category: expensesByCategory,
      total_expenses: totalExpenses,
      ebitda,
    })
    setIsLoading(false)
  }, [isBookingsLoading, isSupabaseLoading, bookingsResponse, supabaseData])

  const refetch = useCallback(() => {
    refetchBookings()
    setFetchTick((t) => t + 1)
  }, [refetchBookings])

  return { pnl, isLoading, refetch }
}
