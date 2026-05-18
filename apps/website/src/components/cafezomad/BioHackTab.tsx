import { useState, useEffect } from 'react'
import { useProfile } from '@zo/auth'
import { supabase } from '../../config/supabase'
import { useFoodCreditBalance } from '../../hooks/useFoodCreditBalance'
import { OrderStatusBadge } from './OrderStatusBadge'
import { formatPaise } from './types'
import type { MenuItem } from './types'

interface NutritionTotals {
  calories: number
  protein: number
  carbs: number
  fats: number
  fibre: number
  sugar: number
  items: number
}

interface NutritionGoals {
  calories: number
  protein: number
  carbs: number
  fats: number
  fibre: number
  sugar: number
}

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2200,
  protein: 60,
  carbs: 275,
  fats: 65,
  fibre: 30,
  sugar: 50,
}

function MacroRing({ label, value, target, color, unit }: { label: string; value: number; target: number; color: string; unit: string }) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0)
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#0000000d" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={r} fill="none"
            stroke={color} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-black">{Math.round(value)}</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold text-black/50 mt-1">{label}</span>
      <span className="text-[9px] text-black/30 font-medium">/ {target}{unit}</span>
    </div>
  )
}

export function BioHackTab({
  isLoggedIn,
  user,
  showLoginModal,
}: {
  isLoggedIn: boolean | null
  user: { id: string; first_name: string; last_name: string; mobile_number: string; wallet_address: string; membership: string } | null
  showLoginModal: () => void
}) {
  const { profile } = useProfile()
  const { balance: foodCreditBalance } = useFoodCreditBalance(user?.mobile_number || null)
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([])
  const [isLoadingBioHack, setIsLoadingBioHack] = useState(true)
  const [todayNutrition, setTodayNutrition] = useState<NutritionTotals | null>(null)
  const [mealLog, setMealLog] = useState<{ name: string; qty: number; cal: number; protein: number; time: string }[]>([])
  const [orderHistory, setOrderHistory] = useState<{ id: string; display_number: number; total: number; kitchen_status: string; created_at: string; order_items: { name: string; quantity: number; id?: string; price?: number }[] }[]>([])

  // Goals state
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS)
  const [showGoalsEditor, setShowGoalsEditor] = useState(false)
  const [editGoals, setEditGoals] = useState<NutritionGoals>(DEFAULT_GOALS)
  const [savingGoals, setSavingGoals] = useState(false)

  // Fetch ALL menu items (across all properties) for nutrition lookup
  useEffect(() => {
    supabase.from('cafe_menu_items').select('id, name, calories, protein, carbs, fats, fibre, sugar').is('deleted_at', null).then(({ data }) => {
      if (data) setAllMenuItems(data as MenuItem[])
    })
  }, [])

  // Fetch user's nutrition goals from DB
  useEffect(() => {
    if (!user?.mobile_number) return
    const phone = (user.mobile_number || '').replace(/^\+?91/, '').replace(/\D/g, '')
    supabase.from('cafe_nutrition_goals').select('*').eq('customer_phone', phone).maybeSingle().then(({ data }) => {
      if (data) {
        const g = {
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fats: data.fats,
          fibre: data.fibre,
          sugar: data.sugar,
        }
        setGoals(g)
        setEditGoals(g)
      }
    })
  }, [user?.mobile_number])

  const handleSaveGoals = async () => {
    if (!user?.mobile_number) return
    setSavingGoals(true)
    const phone = (user.mobile_number || '').replace(/^\+?91/, '').replace(/\D/g, '')
    await supabase.from('cafe_nutrition_goals').upsert({
      customer_phone: phone,
      ...editGoals,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'customer_phone' })
    setGoals(editGoals)
    setShowGoalsEditor(false)
    setSavingGoals(false)
  }

  // Calculate today's nutrition — user-level, all properties
  useEffect(() => {
    if (!user?.mobile_number || allMenuItems.length === 0) return

    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000
    const istNow = new Date(now.getTime() + istOffset)
    const todayStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - istOffset)

    const rawPhone = user.mobile_number || ''
    const phone = rawPhone.replace(/^\+?91/, '').replace(/\D/g, '')

    supabase
      .from('cafe_orders')
      .select('created_at, order_items:cafe_order_items(menu_item_id, quantity, name)')
      .eq('customer_phone', phone)
      .not('kitchen_status', 'eq', 'cancelled')
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data) return

        const menuMapById = new Map(allMenuItems.map((m) => [m.id, m]))
        const menuMapByName = new Map(allMenuItems.map((m) => [m.name.toLowerCase().trim(), m]))
        const totals: NutritionTotals = { calories: 0, protein: 0, carbs: 0, fats: 0, fibre: 0, sugar: 0, items: 0 }
        const log: typeof mealLog = []

        for (const order of data) {
          const items = (order.order_items as { menu_item_id: string; quantity: number; name: string }[]) || []
          for (const oi of items) {
            const menu = menuMapById.get(oi.menu_item_id) || menuMapByName.get((oi.name || '').toLowerCase().trim())
            const hasNutrition = !!menu && menu.calories != null
            const qty = oi.quantity || 1
            if (hasNutrition) {
              totals.calories += (menu!.calories || 0) * qty
              totals.protein += (menu!.protein || 0) * qty
              totals.carbs += (menu!.carbs || 0) * qty
              totals.fats += (menu!.fats || 0) * qty
              totals.fibre += (menu!.fibre || 0) * qty
              totals.sugar += (menu!.sugar || 0) * qty
            }
            totals.items += qty
            log.push({
              name: oi.name,
              qty,
              cal: hasNutrition ? (menu!.calories || 0) * qty : -1,
              protein: hasNutrition ? (menu!.protein || 0) * qty : -1,
              time: new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            })
          }
        }

        setTodayNutrition(totals)
        setMealLog(log)
        setIsLoadingBioHack(false)
      })

    // Order history (last 20)
    supabase
      .from('cafe_orders')
      .select('id, display_number, total, kitchen_status, created_at, order_items:cafe_order_items(id, name, quantity, price)')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setOrderHistory(data as typeof orderHistory)
      })
  }, [user?.id, user?.mobile_number, allMenuItems])

  const p = profile as {
    nickname?: string; avatar?: { image?: string }; pfp_image?: string; avatar_url?: string;
    first_name?: string; last_name?: string;
    experience?: number; level?: number; level_percent?: number; bio?: string;
    membership?: string; work_role?: string
  } | undefined
  const displayName = p?.nickname || (user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '') || 'Citizen'
  const rawAvatar = p?.avatar?.image || p?.pfp_image || p?.avatar_url
  const avatarUrl = rawAvatar && rawAvatar.length > 0 ? rawAvatar : null
  const balance = foodCreditBalance

  const nt = todayNutrition || { calories: 0, protein: 0, carbs: 0, fats: 0, fibre: 0, sugar: 0, items: 0 }

  if (!isLoggedIn || !user) {
    return (
      <div className="px-4 py-4">
        <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-black mb-1">Bio Hack</h3>
          <p className="text-sm text-black/50 font-medium mb-5">
            Sign in to track your nutrition from every meal at Zo House
          </p>
          <button
            onClick={() => showLoginModal()}
            className="px-6 py-3 bg-orange-500 text-black text-sm font-bold rounded-xl active:scale-95 transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (isLoadingBioHack) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-black/40 font-medium">Loading your nutrition...</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-3">
      {/* Profile Card */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 p-5 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-black/15 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-white/30">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-black text-white/80">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-extrabold text-black tracking-tight truncate">{displayName}</h2>
            {p?.work_role && (
              <p className="text-[11px] text-black/50 font-medium truncate">{p.work_role}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-black/15 rounded-full text-[10px] font-bold text-black/70 uppercase tracking-wider">
                {p?.membership || user.membership || 'Member'}
              </span>
              {p?.level != null && (
                <span className="text-[10px] font-bold text-black/50">Lvl {p.level}</span>
              )}
            </div>
          </div>
          {balance != null && (
            <div className="text-right shrink-0">
              <p className="text-lg font-extrabold text-black">{balance.toLocaleString()}</p>
              <p className="text-[9px] text-black/50 font-semibold uppercase tracking-wider">$food</p>
            </div>
          )}
        </div>
        {p?.level_percent != null && (
          <div className="relative mt-3">
            <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
              <div className="h-full bg-black/30 rounded-full transition-all" style={{ width: `${p.level_percent}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-[9px] font-semibold text-black/40">
              <span>{p.experience?.toLocaleString() || 0} XP</span>
              <span>Level {(p.level || 0) + 1}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bio Hack Header with Set Goals */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-black tracking-tight">Bio Hack</h2>
          <p className="text-[11px] text-black/40 font-medium">
            {displayName}&apos;s nutrition today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditGoals(goals); setShowGoalsEditor(true) }}
            className="px-2.5 py-1.5 rounded-full bg-white ring-1 ring-black/10 text-[11px] font-semibold text-black/50 active:scale-95 transition-all"
          >
            Set Goals
          </button>
          <div className="px-3 py-1.5 bg-orange-100 rounded-full">
            <span className="text-[11px] font-bold text-orange-700">
              {nt.items} item{nt.items !== 1 ? 's' : ''} logged
            </span>
          </div>
        </div>
      </div>

      {/* Calorie Hero Card */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 p-5 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-xs font-semibold text-black/50 uppercase tracking-widest mb-1">Calories Today</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-black tracking-tighter">
              {Math.round(nt.calories).toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-black/50 mb-1">/ {goals.calories} kcal</span>
          </div>
          <div className="mt-3 h-2.5 bg-black/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (nt.calories / goals.calories) * 100)}%`,
                background: nt.calories > goals.calories ? '#ef4444' : '#000000aa',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] font-semibold text-black/40">
            <span>{Math.round((nt.calories / goals.calories) * 100)}% of daily goal</span>
            <span>{Math.max(0, goals.calories - Math.round(nt.calories))} remaining</span>
          </div>
        </div>
      </div>

      {/* Macro Rings */}
      <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4">
        <h3 className="text-xs font-bold text-black/60 uppercase tracking-widest mb-3">Macros</h3>
        <div className="grid grid-cols-5 gap-1">
          <MacroRing label="Protein" value={nt.protein} target={goals.protein} color="#f97316" unit="g" />
          <MacroRing label="Carbs" value={nt.carbs} target={goals.carbs} color="#3b82f6" unit="g" />
          <MacroRing label="Fats" value={nt.fats} target={goals.fats} color="#eab308" unit="g" />
          <MacroRing label="Fibre" value={nt.fibre} target={goals.fibre} color="#22c55e" unit="g" />
          <MacroRing label="Sugar" value={nt.sugar} target={goals.sugar} color="#ef4444" unit="g" />
        </div>
      </div>

      {/* Meal Log */}
      {mealLog.length > 0 ? (
        <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4">
          <h3 className="text-xs font-bold text-black/60 uppercase tracking-widest mb-3">
            Today&apos;s Meals
          </h3>
          <div className="space-y-2">
            {mealLog.map((meal, idx) => (
              <div key={idx} className="flex items-center gap-3 py-1.5">
                <span className="text-[10px] font-mono text-black/30 w-10 shrink-0">{meal.time}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-black truncate block">
                    {meal.qty > 1 && <span className="font-mono text-black/40">{meal.qty}× </span>}
                    {meal.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  {meal.cal >= 0 ? (
                    <>
                      <span className="text-xs font-bold text-black">{meal.cal} kcal</span>
                      <span className="text-[10px] text-orange-500 font-semibold ml-1">{meal.protein}g P</span>
                    </>
                  ) : (
                    <span className="text-[10px] text-black/30 font-medium">no nutrition data</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-6 text-center">
          <p className="text-sm text-black/40 font-medium">
            No meals logged today. Order from the menu to start tracking.
          </p>
        </div>
      )}

      {/* Order History */}
      {orderHistory.length > 0 && (
        <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4">
          <h3 className="text-xs font-bold text-black/60 uppercase tracking-widest mb-3">
            Order History
          </h3>
          <div className="space-y-3">
            {orderHistory.map((order) => (
              <div key={order.id} className="rounded-xl bg-black/[0.02] ring-1 ring-black/5 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-sm text-black">
                    #{order.display_number}
                  </span>
                  <OrderStatusBadge status={order.kitchen_status} />
                </div>
                <div className="space-y-1">
                  {order.order_items?.map((item, idx) => (
                    <div key={item.id || idx} className="flex justify-between text-xs">
                      <span className="text-black/50 font-medium">
                        <span className="font-mono font-semibold">{item.quantity}×</span>{' '}
                        {item.name}
                      </span>
                      {item.price != null && (
                        <span className="font-semibold text-black/70">
                          {formatPaise(item.price * item.quantity)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/5">
                  <span className="text-[10px] text-black/30 font-medium font-mono">
                    {new Date(order.created_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="font-bold text-sm text-black">
                    {formatPaise(order.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals Editor Modal */}
      {showGoalsEditor && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowGoalsEditor(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl">
            <div className="px-5 pt-5 pb-3 border-b border-black/5">
              <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4" />
              <h2 className="text-lg font-extrabold text-black">Set Daily Goals</h2>
              <p className="text-xs text-black/40 font-medium mt-0.5">Customize your nutrition targets</p>
            </div>
            <div className="px-5 py-4 space-y-3 pb-8">
              {([
                { key: 'calories', label: 'Calories (kcal)', step: 100 },
                { key: 'protein', label: 'Protein (g)', step: 5 },
                { key: 'carbs', label: 'Carbs (g)', step: 10 },
                { key: 'fats', label: 'Fats (g)', step: 5 },
                { key: 'fibre', label: 'Fibre (g)', step: 5 },
                { key: 'sugar', label: 'Sugar (g)', step: 5 },
              ] as const).map(({ key, label, step }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-black/70">{label}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditGoals((g) => ({ ...g, [key]: Math.max(0, g[key] - step) }))}
                      className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center text-black/60 font-bold active:scale-95"
                    >-</button>
                    <span className="w-14 text-center font-bold text-black tabular-nums">{editGoals[key]}</span>
                    <button
                      onClick={() => setEditGoals((g) => ({ ...g, [key]: g[key] + step }))}
                      className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center text-black/60 font-bold active:scale-95"
                    >+</button>
                  </div>
                </div>
              ))}
              <button
                onClick={handleSaveGoals}
                disabled={savingGoals}
                className="w-full bg-orange-500 text-black py-3.5 text-sm font-bold rounded-xl mt-4 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {savingGoals ? 'Saving...' : 'Save Goals'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
