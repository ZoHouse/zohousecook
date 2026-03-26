import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth, useProfile, useQueryApi } from '@zo/auth'
import { supabase } from '../../config/supabase'

interface MenuCategory { id: string; name: string; sort_order: number }
interface MenuItem { id: string; category_id: string; name: string; description: string | null; price: number; image_url: string | null; diet: 'veg' | 'non_veg' | 'egg'; calories: number | null; protein: number | null; carbs: number | null; fats: number | null; fibre: number | null; sugar: number | null }
interface CafeTable { id: string; code: string; label: string | null; area: string }
interface CafeProperty { id: string; name: string }

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(paise % 100 === 0 ? 0 : 2)}`
}

type Tab = 'menu' | 'biohack'

const DAILY_TARGETS = { calories: 2200, protein: 60, carbs: 275, fats: 65, fibre: 30, sugar: 50 }

export default function CafeMenuPage() {
  const router = useRouter()
  const { user, isLoggedIn, showLoginModal } = useAuth()
  const [properties, setProperties] = useState<CafeProperty[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<CafeTable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('menu')

  useEffect(() => {
    supabase.from('cafe_properties').select('id, name').then(({ data }) => {
      if (data && data.length > 0) { setProperties(data); setSelectedPropertyId(data[0].id) }
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedPropertyId) return
    Promise.all([
      supabase.from('cafe_menu_categories').select('id, name, sort_order').eq('property_id', selectedPropertyId).eq('is_active', true).order('sort_order'),
      supabase.from('cafe_menu_items').select('id, category_id, name, description, price, image_url, diet, calories, protein, carbs, fats, fibre, sugar').eq('property_id', selectedPropertyId).eq('is_available', true).order('sort_order'),
      supabase.from('cafe_tables').select('id, code, label, area').eq('property_id', selectedPropertyId).eq('is_active', true).order('area').order('code'),
    ]).then(([c, i, t]) => {
      setCategories((c.data as MenuCategory[]) || [])
      setMenuItems((i.data as MenuItem[]) || [])
      setTables((t.data as CafeTable[]) || [])
    })
  }, [selectedPropertyId])

  const searched = searchQuery.trim()
    ? menuItems.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : menuItems
  const filtered = activeCategory ? searched.filter((i) => i.category_id === activeCategory) : searched

  const grouped = new Map<string, { name: string; items: MenuItem[] }>()
  for (const item of filtered) {
    if (!grouped.has(item.category_id)) {
      const cat = categories.find((c) => c.id === item.category_id)
      grouped.set(item.category_id, { name: cat?.name || 'Other', items: [] })
    }
    grouped.get(item.category_id)!.items.push(item)
  }

  const tablesByArea = new Map<string, CafeTable[]>()
  for (const t of tables) {
    if (!tablesByArea.has(t.area)) tablesByArea.set(t.area, [])
    tablesByArea.get(t.area)!.push(t)
  }

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
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-black">
                {activeTab === 'menu' ? 'Menu' : 'Bio Hack'}
              </h1>
              {properties.length > 1 && selectedPropertyId && (
                <p className="text-[10px] text-black/50 font-medium uppercase tracking-widest">
                  {properties.find((p) => p.id === selectedPropertyId)?.name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowTablePicker(true)}
            className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
          >
            Order Now
          </button>
        </div>

        {properties.length > 1 && activeTab === 'menu' && (
          <div className="flex gap-2 mt-3 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            {properties.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedPropertyId(p.id); setActiveCategory(null) }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0 transition-all ${
                  selectedPropertyId === p.id ? 'bg-black text-white' : 'bg-black/10 text-black/60'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="relative mt-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/80 rounded-xl ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 placeholder:text-black/30"
            />
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-28">
        {activeTab === 'menu' && (
          <>
            {/* Category chips */}
            <div className="sticky top-[132px] z-10 bg-[#f5f0e8]/95 backdrop-blur-sm px-4 py-2.5 flex gap-2 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <button onClick={() => setActiveCategory(null)} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${!activeCategory ? 'bg-orange-500 text-black' : 'bg-white ring-1 ring-black/10 text-black/60'}`}>
                All ({menuItems.length})
              </button>
              {categories.map((cat) => {
                const count = menuItems.filter((i) => i.category_id === cat.id).length
                return (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${activeCategory === cat.id ? 'bg-orange-500 text-black' : 'bg-white ring-1 ring-black/10 text-black/60'}`}>
                    {cat.name} ({count})
                  </button>
                )
              })}
            </div>

            {/* Menu items */}
            <div className="px-4 py-3 space-y-3">
              {grouped.size === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <svg className="w-12 h-12 text-black/15" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <p className="text-black/35 font-medium text-sm">
                    {searchQuery.trim() ? `No items matching "${searchQuery}"` : 'Menu is being prepared — check back soon!'}
                  </p>
                </div>
              ) : (
                Array.from(grouped.entries()).map(([catId, { name, items }]) => (
                  <div key={catId} className="space-y-2.5">
                    {!activeCategory && (
                      <div className="flex items-center gap-3 pt-3 first:pt-0">
                        <h2 className="text-xs font-semibold text-black/40 uppercase tracking-widest shrink-0">{name}</h2>
                        <div className="flex-1 h-px bg-black/10" />
                      </div>
                    )}
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-4 rounded-2xl bg-white ring-1 ring-black/10 shadow-sm">
                        {item.image_url && <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.diet === 'veg' ? 'bg-green-500' : item.diet === 'egg' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                            <span className="font-bold text-sm text-black tracking-tight truncate">{item.name}</span>
                          </div>
                          {item.description && <p className="text-xs text-black/45 font-medium mt-0.5 ml-[18px] line-clamp-1">{item.description}</p>}
                          <div className="flex items-center gap-3 mt-1.5 ml-[18px]">
                            <span className="text-sm font-bold text-black">{formatPaise(item.price)}</span>
                            {item.calories != null && <span className="text-[10px] text-black/35 font-medium font-mono">{item.calories} kcal</span>}
                            {item.protein != null && <span className="text-[10px] text-orange-500/70 font-medium font-mono">{item.protein}g P</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'biohack' && (
          <BioHackView user={user} isLoggedIn={isLoggedIn} showLoginModal={showLoginModal} menuItems={menuItems} />
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="shrink-0 fixed bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md rounded-full ring-1 ring-black/10 shadow-2xl shadow-black/20 z-40">
        <div className="flex items-center justify-around h-14 max-w-md mx-auto">
          {([
            { key: 'menu' as Tab, label: 'Menu', icon: (a: boolean) => (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={a ? 2.2 : 1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            )},
            { key: 'biohack' as Tab, label: 'Bio Hack', icon: (a: boolean) => (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={a ? 2.2 : 1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            )},
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-2xl transition-all ${activeTab === tab.key ? 'text-orange-600' : 'text-black/50'}`}
            >
              {tab.icon(activeTab === tab.key)}
              <span className="text-[9px] font-semibold tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Table Picker */}
      {showTablePicker && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowTablePicker(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-black/5">
              <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4" />
              <h2 className="text-lg font-extrabold text-black">Pick your table</h2>
              <p className="text-xs text-black/40 font-medium mt-0.5">Select where you&apos;re sitting to start ordering</p>
            </div>
            <div className="px-5 py-4 space-y-4 pb-8">
              {Array.from(tablesByArea.entries()).map(([area, areaTables]) => (
                <div key={area}>
                  <h3 className="text-[10px] font-semibold text-black/40 uppercase tracking-widest mb-2">{area}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {areaTables.map((table) => (
                      <button key={table.id} onClick={() => router.push(`/cafezomad/${table.id}`)} className="p-3 rounded-xl bg-[#f5f0e8] ring-1 ring-black/5 text-left active:scale-95 transition-all hover:ring-orange-500/50">
                        <span className="text-sm font-bold text-black block">{table.label || table.code}</span>
                        <span className="text-[10px] text-black/35 font-medium">{table.code}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {tables.length === 0 && <p className="text-center text-black/35 text-sm font-medium py-8">No tables set up yet</p>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Bio Hack View (no table required) ────────────────────────────────────────

function BioHackView({
  user,
  isLoggedIn,
  showLoginModal,
  menuItems,
}: {
  user: { id: string; first_name: string; last_name: string; mobile_number: string; wallet_address: string; membership: string } | null
  isLoggedIn: boolean | null
  showLoginModal: () => void
  menuItems: MenuItem[]
}) {
  const { profile } = useProfile()
  const { data: balanceData } = useQueryApi('WEBTHREE_LEDGER_BALANCE', { enabled: isLoggedIn === true }, '', '')
  const [todayNutrition, setTodayNutrition] = useState<{ calories: number; protein: number; carbs: number; fats: number; fibre: number; sugar: number; items: number } | null>(null)
  const [mealLog, setMealLog] = useState<{ name: string; qty: number; cal: number; protein: number; time: string }[]>([])

  useEffect(() => {
    if (!user?.id) return
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Fetch across ALL properties (not table-specific)
    supabase
      .from('cafe_orders')
      .select('created_at, order_items:cafe_order_items(menu_item_id, quantity, name)')
      .eq('zo_user_id', user.id)
      .not('kitchen_status', 'eq', 'cancelled')
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data) return
        const menuMap = new Map(menuItems.map((m) => [m.id, m]))
        const totals = { calories: 0, protein: 0, carbs: 0, fats: 0, fibre: 0, sugar: 0, items: 0 }
        const log: typeof mealLog = []

        for (const order of data) {
          const items = (order.order_items as { menu_item_id: string; quantity: number; name: string }[]) || []
          for (const oi of items) {
            const menu = menuMap.get(oi.menu_item_id)
            if (!menu) continue
            const qty = oi.quantity || 1
            const hasNutrition = menu.calories != null
            if (hasNutrition) {
              totals.calories += (menu.calories || 0) * qty
              totals.protein += (menu.protein || 0) * qty
              totals.carbs += (menu.carbs || 0) * qty
              totals.fats += (menu.fats || 0) * qty
              totals.fibre += (menu.fibre || 0) * qty
              totals.sugar += (menu.sugar || 0) * qty
            }
            totals.items += qty
            log.push({
              name: oi.name, qty,
              cal: hasNutrition ? (menu.calories || 0) * qty : -1,
              protein: hasNutrition ? (menu.protein || 0) * qty : -1,
              time: new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            })
          }
        }
        setTodayNutrition(totals)
        setMealLog(log)
      })
  }, [user?.id, menuItems])

  const p = profile as { nickname?: string; avatar_url?: string; level?: number; level_percent?: number; experience?: number; membership?: string; work_role?: string } | undefined
  const balance = (balanceData as { data?: { balance?: number } })?.data?.balance

  if (!isLoggedIn || !user) {
    return (
      <div className="px-4 py-4">
        <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-black mb-1">Bio Hack</h3>
          <p className="text-sm text-black/50 font-medium mb-5">Sign in to track your nutrition from every meal at Zo House</p>
          <button onClick={() => showLoginModal()} className="px-6 py-3 bg-orange-500 text-black text-sm font-bold rounded-xl active:scale-95 transition-all">Sign In</button>
        </div>
      </div>
    )
  }

  const displayName = p?.nickname || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Citizen'
  const avatarUrl = p?.avatar_url
  const nt = todayNutrition || { calories: 0, protein: 0, carbs: 0, fats: 0, fibre: 0, sugar: 0, items: 0 }

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

  return (
    <div className="px-4 py-4 space-y-3">
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

      {/* Bio Hack Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-black tracking-tight">Today</h2>
          <p className="text-[11px] text-black/40 font-medium">{displayName}&apos;s nutrition</p>
        </div>
        <div className="px-3 py-1.5 bg-green-100 rounded-full">
          <span className="text-[11px] font-bold text-green-700">{nt.items} item{nt.items !== 1 ? 's' : ''} logged</span>
        </div>
      </div>

      {/* Calorie Card */}
      <div className="rounded-2xl bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 p-5 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-xs font-semibold text-black/50 uppercase tracking-widest mb-1">Calories Today</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-black tracking-tighter">{Math.round(nt.calories).toLocaleString()}</span>
            <span className="text-sm font-semibold text-black/50 mb-1">/ {DAILY_TARGETS.calories} kcal</span>
          </div>
          <div className="mt-3 h-2.5 bg-black/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (nt.calories / DAILY_TARGETS.calories) * 100)}%`, background: nt.calories > DAILY_TARGETS.calories ? '#ef4444' : '#000000aa' }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] font-semibold text-black/40">
            <span>{Math.round((nt.calories / DAILY_TARGETS.calories) * 100)}% of daily goal</span>
            <span>{Math.max(0, DAILY_TARGETS.calories - Math.round(nt.calories))} remaining</span>
          </div>
        </div>
      </div>

      {/* Macro Rings */}
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

      {/* Meal Log */}
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
    </div>
  )
}
