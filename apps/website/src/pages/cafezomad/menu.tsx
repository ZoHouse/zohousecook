import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '@zo/auth'
import { supabase } from '../../config/supabase'
import cafeZomadLogo from '../../assets/cafezomad/logo.png'
import appleTouchIcon from '../../components/cafezomad/assets/favicons/apple-touch-icon.png'
import cafezomadIcon192 from '../../components/cafezomad/assets/favicons/cafezomad-icon-192.png'
import cafezomadIcon512 from '../../components/cafezomad/assets/favicons/cafezomad-icon-512.png'

interface MenuCategory { id: string; name: string; sort_order: number }
interface MenuItem { id: string; category_id: string; name: string; description: string | null; price: number; image_url: string | null; diet: 'veg' | 'non_veg' | 'egg'; calories: number | null; protein: number | null; carbs: number | null; fats: number | null }
interface CafeTable { id: string; code: string; label: string | null; area: string }
interface CafeProperty { id: string; name: string }

type MealType = 'breakfast' | 'lunch' | 'dinner'

function todayISO(): string {
  // Use local-time YYYY-MM-DD so it matches what the operator chose in PMS
  // (the meal-plan calendar writes dates in the user's local timezone).
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(paise % 100 === 0 ? 0 : 2)}`
}

export default function CafeMenuPage() {
  const router = useRouter()
  const { isLoggedIn, user, showLoginModal } = useAuth()
  const [properties, setProperties] = useState<CafeProperty[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<CafeTable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  // Today's meal plan — text per slot from cafe_meal_plans.notes. Each slot is
  // a freeform description the operator wrote in PMS (e.g. "puri chole - tea").
  const [todayPlanText, setTodayPlanText] = useState<Record<MealType, string>>({
    breakfast: '', lunch: '', dinner: '',
  })

  useEffect(() => {
    fetch('/api/cafe/nodes')
      .then((r) => r.json())
      .then(({ nodes }: { nodes: CafeProperty[] }) => {
        if (nodes && nodes.length > 0) { setProperties(nodes); setSelectedPropertyId(nodes[0].id) }
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  // Reads go through /api/cafe/* so Vercel edge caches absorb the read volume.
  // Realtime stays on direct Supabase below; its handler appends a cache-buster
  // so the refetch bypasses the 60s s-maxage and gets fresh data.
  const fetchMenu = (bustCache = false) => {
    if (!selectedPropertyId) return
    const bust = bustCache ? `?_t=${Date.now()}` : ''
    Promise.all([
      fetch(`/api/cafe/nodes/${selectedPropertyId}/menu${bust}`).then((r) => r.json()),
      fetch(`/api/cafe/nodes/${selectedPropertyId}/tables${bust}`).then((r) => r.json()),
    ]).then(([menu, tablesRes]) => {
      setCategories((menu.categories as MenuCategory[]) || [])
      setMenuItems((menu.items as MenuItem[]) || [])
      setTables((tablesRes.tables as CafeTable[]) || [])
      const next: Record<MealType, string> = { breakfast: '', lunch: '', dinner: '' }
      type PlanRow = { meal_type: MealType; items: string[] }
      for (const plan of (menu.meal_plan || []) as PlanRow[]) {
        if (plan.meal_type in next) next[plan.meal_type] = (plan.items || []).join(', ')
      }
      setTodayPlanText(next)
    })
  }

  useEffect(() => { fetchMenu() }, [selectedPropertyId])

  // Live update: PMS changes a plan or its item list → refetch with cache-bust.
  useEffect(() => {
    const ch = supabase
      .channel('cafezomad-meal-plan')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafe_meal_plans' }, () => fetchMenu(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafe_meal_plan_items' }, () => fetchMenu(true))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [selectedPropertyId])

  // Refetch menu when user returns to tab (catches chef availability toggles).
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) fetchMenu(true)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
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

  const renderMenuItemCard = (item: MenuItem) => {
    // If this item's name matches a meal slot, surface today's plan text from
    // cafe_meal_plans.notes so the customer sees what's actually being served
    // (e.g. "puri chole - tea") directly inside the matching card. Mirrors the
    // pattern used on the table-side ordering page.
    const nameKey = item.name.trim().toLowerCase()
    const planText =
      nameKey === 'breakfast' ? todayPlanText.breakfast :
      nameKey === 'lunch' ? todayPlanText.lunch :
      nameKey === 'dinner' ? todayPlanText.dinner : ''
    return (
      <div key={item.id} className="rounded-2xl bg-white ring-1 ring-black/10 shadow-sm overflow-hidden">
        <div className="aspect-square bg-stone-100 relative">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-black/15 text-3xl font-bold">{item.name.charAt(0)}</div>
          )}
          <span className={`absolute top-2 left-2 w-3 h-3 rounded-full ring-2 ring-white ${item.diet === 'veg' ? 'bg-green-500' : item.diet === 'egg' ? 'bg-yellow-500' : 'bg-red-500'}`} />
        </div>
        <div className="p-3">
          <p className="font-bold text-sm text-black tracking-tight truncate">{item.name}</p>
          {planText && (
            <p className="text-xs text-black/70 font-medium leading-relaxed mt-1.5">{planText}</p>
          )}
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-bold text-black">{formatPaise(item.price)}</span>
            {item.calories != null && <span className="text-[10px] text-black/40 font-mono">{item.calories} kcal</span>}
          </div>
          {(item.protein != null || item.carbs != null || item.fats != null) && (
            <div className="flex gap-2 mt-1.5">
              {item.protein != null && <span className="text-[9px] text-orange-600/70 font-semibold font-mono bg-orange-50 px-1.5 py-0.5 rounded">{item.protein}g P</span>}
              {item.carbs != null && <span className="text-[9px] text-blue-600/70 font-semibold font-mono bg-blue-50 px-1.5 py-0.5 rounded">{item.carbs}g C</span>}
              {item.fats != null && <span className="text-[9px] text-amber-600/70 font-semibold font-mono bg-amber-50 px-1.5 py-0.5 rounded">{item.fats}g F</span>}
            </div>
          )}
        </div>
      </div>
    )
  }

  const tablesByArea = new Map<string, CafeTable[]>()
  for (const t of tables) {
    if (!tablesByArea.has(t.area)) tablesByArea.set(t.area, [])
    tablesByArea.get(t.area)!.push(t)
  }

  const openTablePicker = () => {
    if (!isLoggedIn || !user) {
      showLoginModal(undefined, '/cafezomad/menu')
      return
    }
    setShowTablePicker(true)
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-screen bg-[#f5f0e8] bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.93), rgba(255, 255, 255, 0.93)), url('https://cdn.zo.xyz/gallery/media/images/a0c69f2e-ed0e-43d9-8e30-8e1a36cc975b_20260524092110.png')" }}
      >
        <div className="w-10 h-10 border-[3px] border-black/80 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-[#f5f0e8] bg-cover bg-center"
      style={{ backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.93), rgba(255, 255, 255, 0.93)), url('https://cdn.zo.xyz/gallery/media/images/a0c69f2e-ed0e-43d9-8e30-8e1a36cc975b_20260524092110.png')" }}
    >
      <Head>
        <link rel="apple-touch-icon" href={appleTouchIcon.src} />
        <link rel="apple-touch-icon" sizes="180x180" href={appleTouchIcon.src} />
        <link rel="icon" type="image/png" sizes="192x192" href={cafezomadIcon192.src} />
        <link rel="icon" type="image/png" sizes="512x512" href={cafezomadIcon512.src} />
        <meta name="apple-mobile-web-app-title" content="Cafe Zomad" />
      </Head>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-orange-500 px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={() => router.push('/cafezomad')} className="w-9 h-9 rounded-xl bg-white overflow-hidden active:scale-95 transition-all shrink-0 p-1">
              <img src={cafeZomadLogo.src} alt="Cafe Zomad" className="w-full h-full object-contain" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-black">Menu</h1>
              {properties.length > 1 && selectedPropertyId && (
                <p className="text-[10px] text-black/50 font-medium uppercase tracking-widest">
                  {properties.find((p) => p.id === selectedPropertyId)?.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/cafezomad/biohack')} className="px-3 py-2 bg-white/80 text-black text-xs font-bold rounded-xl active:scale-95 transition-all">
              Bio Hack
            </button>
            <button onClick={openTablePicker} className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl active:scale-95 transition-all">
              Order Now
            </button>
          </div>
        </div>

        {properties.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            {properties.map((p) => (
              <button key={p.id} onClick={() => { setSelectedPropertyId(p.id); setActiveCategory(null) }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0 transition-all ${selectedPropertyId === p.id ? 'bg-black text-white' : 'bg-black/10 text-black/60'}`}>
                {p.name}
              </button>
            ))}
          </div>
        )}

        <div className="relative mt-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search menu..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/80 rounded-xl ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 placeholder:text-black/30" />
        </div>
      </header>

      {/* Category chips */}
      <div className="sticky top-[132px] z-10 bg-[#f5f0e8]/95 backdrop-blur-sm px-4 py-2.5 flex gap-2 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <button onClick={() => setActiveCategory(null)} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${!activeCategory ? 'bg-orange-500 text-black' : 'bg-white ring-1 ring-black/10 text-black/60'}`}>
          All ({menuItems.length})
        </button>
        {categories.map((cat) => {
          const count = menuItems.filter((i) => i.category_id === cat.id).length
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${activeCategory === cat.id ? 'bg-orange-500 text-black' : 'bg-white ring-1 ring-black/10 text-black/60'}`}>
              {cat.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Menu items */}
      <div className="px-4 py-3 pb-24 space-y-5">
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
              <div className="grid grid-cols-2 gap-3">
                {items.map(renderMenuItemCard)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-[#f5f0e8] via-[#f5f0e8] to-transparent pt-8">
        <button onClick={openTablePicker} className="w-full bg-orange-500 text-black py-4 text-base font-bold tracking-wide rounded-2xl shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all">
          Start Ordering
        </button>
      </div>

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
                      <button key={table.id} onClick={() => router.push(`/cafezomad/${table.id}`)}
                        className="p-3 rounded-xl bg-[#f5f0e8] ring-1 ring-black/5 text-left active:scale-95 transition-all hover:ring-orange-500/50">
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
