import { useCallback, useState } from 'react'
import { supabase } from '../../configs/supabase'
import { normalizePhone } from '../../lib/cafe/phone-normalize'
import type { GuestRevenue, ZostelBookingForPnl } from '../../types/pnl'
import { zostelServer } from '../../../../../libs/auth/src/utils'

interface CafeRevenueRpcResult {
  cafe_total: number
  order_count: number
}

interface UseGuestRevenueResult {
  guest: GuestRevenue | null
  isLoading: boolean
  search: (
    query: string,
    propertyId: string,
    operatorCode: string,
    dateFrom: string,
    dateTo: string
  ) => Promise<void>
}

export function useGuestRevenue(): UseGuestRevenueResult {
  const [guest, setGuest] = useState<GuestRevenue | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const search = useCallback(
    async (
      query: string,
      propertyId: string,
      operatorCode: string,
      dateFrom: string,
      dateTo: string
    ) => {
      if (!query.trim() || !propertyId || !operatorCode) return

      setIsLoading(true)
      setGuest(null)

      try {
        const bookingSearch = `operator=${operatorCode}&q=${encodeURIComponent(query.trim())}&start_date__gte=${dateFrom}&start_date__lte=${dateTo}`

        const [bookingsResponse, cafeResponse] = await Promise.all([
          zostelServer
            .get(`/api/v1/admin/pm/bookings/?${bookingSearch}`)
            .catch(() => null),
          supabase.rpc('guest_cafe_revenue', {
            p_phone_last10: normalizePhone(query.trim()),
            p_property_id: propertyId,
            p_date_from: dateFrom,
            p_date_to: dateTo,
          }),
        ])

        // zostelServer returns axios response: { data: { results: [...] } }
        const bookings: ZostelBookingForPnl[] =
          (bookingsResponse?.data as { results?: ZostelBookingForPnl[] })
            ?.results || []

        const cafeData = cafeResponse?.data as CafeRevenueRpcResult | null
        const cafeTotal = cafeData?.cafe_total ?? 0

        if (bookings.length === 0 && cafeTotal === 0) {
          setGuest(null)
          return
        }

        // Find the best matching booking by phone (normalized) or use the first result
        const normalizedQuery = normalizePhone(query.trim())
        const matchedBooking =
          bookings.find((b) => {
            const guestPhone = b.guests?.[0]?.mobile
              ? normalizePhone(b.guests[0].mobile)
              : ''
            return guestPhone === normalizedQuery
          }) || bookings[0]

        if (!matchedBooking && cafeTotal === 0) {
          setGuest(null)
          return
        }

        const guestName = matchedBooking?.guests?.[0]?.name ?? query.trim()
        const guestPhone = matchedBooking?.guests?.[0]?.mobile
          ? normalizePhone(matchedBooking.guests[0].mobile)
          : normalizedQuery

        // Aggregate stay revenue across all matching bookings (same phone)
        const matchingBookings = bookings.filter((b) => {
          const phone = b.guests?.[0]?.mobile
            ? normalizePhone(b.guests[0].mobile)
            : ''
          return phone === guestPhone
        })

        const stayRevenuePaise = matchingBookings.reduce((sum, b) => {
          return sum + (b.paid_amount ?? 0)
        }, 0)

        const nights = matchingBookings.reduce((sum, b) => {
          if (!b.start_date || !b.end_date) return sum
          const start = new Date(b.start_date)
          const end = new Date(b.end_date)
          const diff = Math.round(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          )
          return sum + Math.max(diff, 0)
        }, 0)

        const totalRevenue = stayRevenuePaise + cafeTotal
        const adr = nights > 0 ? Math.round(totalRevenue / nights) : totalRevenue

        setGuest({
          name: guestName,
          phone: guestPhone,
          stay_revenue: stayRevenuePaise,
          cafe_revenue: cafeTotal,
          total_revenue: totalRevenue,
          nights,
          adr,
        })
      } catch (err) {
        console.error('useGuestRevenue search error:', err)
        setGuest(null)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return { guest, isLoading, search }
}
