import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth, useProfile, useQueryApi } from '@zo/auth'
import { supabase } from '../../config/supabase'

interface MenuItem { id: string; name: string; calories: number | null; protein: number | null; carbs: number | null; fats: number | null; fibre: number | null; sugar: number | null }
interface OrderHistoryItem { id: string; display_number: number; total: number; kitchen_status: string; created_at: string; items: { name: string; quantity: number }[] }

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(paise % 100 === 0 ? 0 : 2)}`
}

const DAILY_TARGETS = { calories: 2200, protein: 60, carbs: 275, fats: 65, fibre: 30, sugar: 50 }

function MacroRing({ label, value, target, color, unit }: { label: string; value: number; target: number; color: string; unit: string }) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0)
  const r = 28, circ = 2 * Math.PI * r, offset = circ - (pct / 100) * circ
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#0000000d" strokeWidth="5" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
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

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  accepted: 'bg-amber-100 text-amber-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-orange-100 text-orange-700',
  served: 'bg-stone-100 text-stone-500',
  cancelled: 'bg-red-100 text-red-700',
}

export default function BioHackPage() {
  const router = useRouter()
  const { user, isLoggedIn, showLoginModal } = useAuth()
  const { profile } = useProfile()
  const { data: balanceData } = useQueryApi('WEBTHREE_LEDGER_BALANCE', { enabled: isLoggedIn === true }, '', '')

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [todayNutrition, setTodayNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0, fibre: 0, sugar: 0, items: 0 })
  const [mealLog, setMealLog] = useState<{ name: string; qty: number; cal: number; protein: number; time: string }[]>([])
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch all menu items (for nutrition lookup)
  useEffect(() => {
    supabase.from('cafe_menu_items').select('id, name, calories, protein, carbs, fats, fibre, sugar').then(({ data }) => {
      setMenuItems((data as MenuItem[]) || [])
      setIsLoading(false)
    })
  }, [])

  // Fetch today's nutrition + order history
  useEffect(() => {
    if (!user?.mobile_number || menuItems.length === 0) return

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Match by phone number (historic data has no zo_user_ids)
    // Normalize: strip country code prefix (+91/91) to get bare 10-digit number
    const rawPhone = user.mobile_number || ''
    const phone = rawPhone.replace(/^\+?91/, '').replace(/\D/g, '')

    // Today's orders for nutrition
    supabase
      .from('cafe_orders')
      .select('created_at, order_items:cafe_order_items(menu_item_id, quantity, name)')
      .eq('customer_phone', phone)
      .not('kitchen_status', 'eq', 'cancelled')
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data) return
        const menuMap = new Map(menuItems.map((m) => [m.id, m]))
        const totals = { calories: 0, protein: 0, carbs: 0, fats: 0, fibre: 0, sugar: 0, items: 0 }
        const log: typeof mealLog = []

        for (const order of data) {
          for (const oi of (order.order_items as { menu_item_id: string; quantity: number; name: string }[]) || []) {
            const menu = menuMap.get(oi.menu_item_id)
            if (!menu) continue
            const qty = oi.quantity || 1
            const has = menu.calories != null
            if (has) {
              totals.calories += (menu.calories || 0) * qty
              totals.protein += (menu.protein || 0) * qty
              totals.carbs += (menu.carbs || 0) * qty
              totals.fats += (menu.fats || 0) * qty
              totals.fibre += (menu.fibre || 0) * qty
              totals.sugar += (menu.sugar || 0) * qty
            }
            totals.items += qty
            log.push({ name: oi.name, qty, cal: has ? (menu.calories || 0) * qty : -1, protein: has ? (menu.protein || 0) * qty : -1, time: new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) })
          }
        }
        setTodayNutrition(totals)
        setMealLog(log)
      })

    // Full order history (last 20)
    supabase
      .from('cafe_orders')
      .select('id, display_number, total, kitchen_status, created_at, order_items:cafe_order_items(name, quantity)')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!data) return
        setOrderHistory(data.map((o) => ({
          id: o.id,
          display_number: o.display_number,
          total: o.total,
          kitchen_status: o.kitchen_status,
          created_at: o.created_at,
          items: ((o.order_items as { name: string; quantity: number }[]) || []),
        })))
      })
  }, [user?.id, menuItems])

  const p = profile as { nickname?: string; avatar_url?: string; level?: number; level_percent?: number; experience?: number; membership?: string; work_role?: string } | undefined
  const balance = (balanceData as { data?: { balance?: number } })?.data?.balance
  const nt = todayNutrition

  // Not logged in
  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-center px-6">
        <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-8 text-center max-w-xs w-full">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-black mb-1">Bio Hack</h3>
          <p className="text-sm text-black/50 font-medium mb-5">Sign in to track your nutrition from every meal at Zo House</p>
          <button onClick={() => showLoginModal()} className="px-6 py-3 bg-orange-500 text-black text-sm font-bold rounded-xl active:scale-95 transition-all">Sign In</button>
        </div>
        <button onClick={() => router.push('/cafezomad')} className="mt-6 text-xs text-black/40 font-medium">Back to Cafe Zomad</button>
      </div>
    )
  }

  const displayName = p?.nickname || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Citizen'
  const avatarUrl = p?.avatar_url

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f5f0e8]">
        <div className="w-10 h-10 border-[3px] border-black/80 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-orange-500 px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={() => router.push('/cafezomad')} className="w-9 h-9 rounded-xl bg-white overflow-hidden active:scale-95 transition-all shrink-0 p-1">
              <img src="/cafezomad/logo.png" alt="Cafe Zomad" className="w-full h-full object-contain" />
            </button>
            <h1 className="text-lg font-extrabold tracking-tight text-black">Bio Hack</h1>
          </div>
          <button onClick={() => router.push('/cafezomad/menu')} className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl active:scale-95 transition-all">
            Menu
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-3 pb-12">
        {/* Profile Card */}
        <div className="rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 p-5 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-black/15 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-white/30">
              {avatarUrl ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" /> : <span className="text-xl font-black text-white/80">{displayName.charAt(0).toUpperCase()}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-extrabold text-black tracking-tight truncate">{displayName}</h2>
              {p?.work_role && <p className="text-[11px] text-black/50 font-medium truncate">{p.work_role}</p>}
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-black/15 rounded-full text-[10px] font-bold text-black/70 uppercase tracking-wider">{p?.membership || user.membership || 'Member'}</span>
                {p?.level != null && <span className="text-[10px] font-bold text-black/50">Lvl {p.level}</span>}
              </div>
            </div>
            {balance != null && (
              <div className="text-right shrink-0">
                <p className="text-lg font-extrabold text-black">{balance.toLocaleString()}</p>
                <p className="text-[9px] text-black/50 font-semibold uppercase tracking-wider">credits</p>
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

        {/* Nutrition Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-black tracking-tight">Today</h2>
            <p className="text-[11px] text-black/40 font-medium">{displayName}&apos;s nutrition</p>
          </div>
          <div className="px-3 py-1.5 bg-orange-100 rounded-full">
            <span className="text-[11px] font-bold text-orange-700">{nt.items} item{nt.items !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Calorie Card */}
        <div className="rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 p-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-xs font-semibold text-black/50 uppercase tracking-widest mb-1">Calories</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-black tracking-tighter">{Math.round(nt.calories).toLocaleString()}</span>
              <span className="text-sm font-semibold text-black/50 mb-1">/ {DAILY_TARGETS.calories} kcal</span>
            </div>
            <div className="mt-3 h-2.5 bg-black/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (nt.calories / DAILY_TARGETS.calories) * 100)}%`, background: nt.calories > DAILY_TARGETS.calories ? '#ef4444' : '#000000aa' }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] font-semibold text-black/40">
              <span>{Math.round((nt.calories / DAILY_TARGETS.calories) * 100)}%</span>
              <span>{Math.max(0, DAILY_TARGETS.calories - Math.round(nt.calories))} remaining</span>
            </div>
          </div>
        </div>

        {/* Macros */}
        <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4">
          <h3 className="text-xs font-bold text-black/60 uppercase tracking-widest mb-3">Macros</h3>
          <div className="grid grid-cols-5 gap-1">
            <MacroRing label="Protein" value={nt.protein} target={DAILY_TARGETS.protein} color="#f97316" unit="g" />
            <MacroRing label="Carbs" value={nt.carbs} target={DAILY_TARGETS.carbs} color="#3b82f6" unit="g" />
            <MacroRing label="Fats" value={nt.fats} target={DAILY_TARGETS.fats} color="#eab308" unit="g" />
            <MacroRing label="Fibre" value={nt.fibre} target={DAILY_TARGETS.fibre} color="#22c55e" unit="g" />
            <MacroRing label="Sugar" value={nt.sugar} target={DAILY_TARGETS.sugar} color="#ef4444" unit="g" />
          </div>
        </div>

        {/* Today's Meals */}
        {mealLog.length > 0 ? (
          <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4">
            <h3 className="text-xs font-bold text-black/60 uppercase tracking-widest mb-3">Today&apos;s Meals</h3>
            <div className="space-y-2">
              {mealLog.map((meal, idx) => (
                <div key={idx} className="flex items-center gap-3 py-1.5">
                  <span className="text-[10px] font-mono text-black/30 w-10 shrink-0">{meal.time}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-black truncate block">
                      {meal.qty > 1 && <span className="font-mono text-black/40">{meal.qty}× </span>}{meal.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    {meal.cal >= 0 ? (
                      <><span className="text-xs font-bold text-black">{meal.cal} kcal</span><span className="text-[10px] text-orange-500 font-semibold ml-1">{meal.protein}g P</span></>
                    ) : (
                      <span className="text-[10px] text-black/30 font-medium">no data</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-6 text-center">
            <p className="text-sm text-black/40 font-medium">No meals logged today. Order from the menu to start tracking.</p>
          </div>
        )}

        {/* Order History */}
        {orderHistory.length > 0 && (
          <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-4">
            <h3 className="text-xs font-bold text-black/60 uppercase tracking-widest mb-3">Order History</h3>
            <div className="space-y-3">
              {orderHistory.map((order) => (
                <div key={order.id} className="rounded-xl bg-black/[0.02] ring-1 ring-black/5 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-black">#{order.display_number}</span>
                      <span className="text-[10px] text-black/30 font-mono">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[order.kitchen_status] || 'bg-stone-100 text-stone-500'}`}>
                      {order.kitchen_status}
                    </span>
                  </div>
                  <p className="text-xs text-black/50 font-medium truncate">
                    {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                  </p>
                  <p className="text-sm font-bold text-black mt-1">{formatPaise(order.total)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
