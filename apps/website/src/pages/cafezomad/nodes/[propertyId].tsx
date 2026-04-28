import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../../config/supabase'
import cafeZomadLogo from '../../../assets/cafezomad/logo.png'

interface CafeTable {
  id: string
  code: string
  label: string | null
  area: string
  capacity: number
  is_active: boolean
}

interface PropertyMeta {
  name: string
  code: string
}

export default function NodeTablesPage() {
  const router = useRouter()
  const propertyId = typeof router.query.propertyId === 'string' ? router.query.propertyId : null

  const [property, setProperty] = useState<PropertyMeta | null>(null)
  const [tablesByArea, setTablesByArea] = useState<Record<string, CafeTable[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!propertyId) return
    let cancelled = false

    async function load() {
      const [{ data: prop }, { data: tables }] = await Promise.all([
        supabase
          .from('cafe_properties')
          .select('name, code')
          .eq('id', propertyId)
          .maybeSingle(),
        supabase
          .from('cafe_tables')
          .select('id, code, label, area, capacity, is_active')
          .eq('property_id', propertyId)
          .eq('is_active', true)
          .order('area')
          .order('code'),
      ])

      if (cancelled) return

      if (!prop) {
        setNotFound(true)
        setIsLoading(false)
        return
      }

      setProperty(prop as PropertyMeta)

      const grouped: Record<string, CafeTable[]> = {}
      for (const t of (tables as CafeTable[]) || []) {
        const key = t.area || 'Other'
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(t)
      }
      setTablesByArea(grouped)
      setIsLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [propertyId])

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f0e8] px-6">
        <p className="text-sm text-black/50 font-medium mb-4">Node not found.</p>
        <Link href="/cafezomad/nodes" className="text-sm font-bold text-orange-500">Pick a different node</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f0e8] px-6 py-10">
      <Link href="/cafezomad/nodes" className="inline-flex items-center gap-2 text-black/50 text-sm font-medium mb-8 active:opacity-60">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-sm">
          <img src={cafeZomadLogo.src} alt="Cafe Zomad" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-black">{property?.name || '...'}</h1>
          <p className="text-xs text-black/50 font-medium">Pick a table to start ordering</p>
        </div>
      </div>

      <div className="w-12 h-1 bg-orange-500 rounded-full mb-8" />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-black/5 animate-pulse" />
          ))}
        </div>
      ) : Object.keys(tablesByArea).length === 0 ? (
        <p className="text-sm text-black/40 font-medium text-center py-12">
          No tables available at this node right now.
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(tablesByArea).map(([area, tables]) => (
            <div key={area}>
              <p className="text-[11px] font-bold text-black/50 uppercase tracking-widest mb-2 px-1">
                {area}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {tables.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/cafezomad/${t.id}`)}
                    className="bg-white rounded-xl ring-1 ring-black/10 shadow-sm py-3 px-4 active:scale-[0.97] transition-all"
                  >
                    <p className="font-bold text-base text-black">
                      {t.label || t.code}
                    </p>
                    <p className="text-[11px] text-black/40 font-medium font-mono mt-0.5">
                      {t.code} · seats {t.capacity}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
