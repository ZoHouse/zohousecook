import { supabase } from '../../configs/supabase'
import { normalizePhone } from './phone-normalize'

/**
 * Debit $food credits when an order is accepted by kitchen.
 * Uses atomic Postgres RPC to prevent race conditions.
 */
export async function debitFoodCredits(orderId: string): Promise<void> {
  const { data: order, error: oErr } = await supabase
    .from('cafe_orders')
    .select('food_credit_applied_paise, customer_phone')
    .eq('id', orderId)
    .single()

  if (oErr || !order || !order.food_credit_applied_paise || order.food_credit_applied_paise <= 0) return

  const foodAmount = Math.floor(order.food_credit_applied_paise / 100)
  if (foodAmount <= 0) return

  const phone = normalizePhone(order.customer_phone || '')
  if (!phone) return

  const { data: wallet } = await supabase
    .from('food_credit_wallets')
    .select('id')
    .eq('phone', phone)
    .single()

  if (!wallet) {
    console.error('debitFoodCredits: no wallet for phone', phone)
    return
  }

  const { error } = await supabase.rpc('debit_food_credits', {
    p_wallet_id: wallet.id,
    p_amount: foodAmount,
    p_reference_id: orderId,
  })

  if (error) {
    console.error('debitFoodCredits failed:', error.message)
  }
}

/**
 * Restore $food credits when an accepted order is cancelled.
 * Uses atomic Postgres RPC.
 */
export async function restoreFoodCredits(orderId: string): Promise<void> {
  const { data: order, error: oErr } = await supabase
    .from('cafe_orders')
    .select('food_credit_applied_paise, customer_phone')
    .eq('id', orderId)
    .single()

  if (oErr || !order || !order.food_credit_applied_paise || order.food_credit_applied_paise <= 0) return

  const foodAmount = Math.floor(order.food_credit_applied_paise / 100)
  if (foodAmount <= 0) return

  const phone = normalizePhone(order.customer_phone || '')
  if (!phone) return

  const { data: wallet } = await supabase
    .from('food_credit_wallets')
    .select('id')
    .eq('phone', phone)
    .single()

  if (!wallet) return

  const { error } = await supabase.rpc('restore_food_credits', {
    p_wallet_id: wallet.id,
    p_amount: foodAmount,
    p_reference_id: orderId,
  })

  if (error) {
    console.error('restoreFoodCredits failed:', error.message)
  }
}
