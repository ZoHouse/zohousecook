import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../../config/supabase'
import cafeZomadLogo from '../../../assets/cafezomad/logo.png'

interface CafeProperty {
  id: string
  name: string
  code: string
}

export default function NodesIndex() {
  const router = useRouter()
  const [properties, setProperties] = useState<CafeProperty[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('cafe_properties')
        .select('id, name, code')
        .order('name')
      if (cancelled) return
      setProperties((data as CafeProperty[]) || [])
      setIsLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f0e8] px-6 py-10">
      {/* Header */}
      <Link href="/cafezomad" className="inline-flex items-center gap-2 text-black/50 text-sm font-medium mb-8 active:opacity-60">
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
          <h1 className="text-2xl font-extrabold text-black">Pick a Node</h1>
          <p className="text-xs text-black/50 font-medium">Choose a Zo House to order from</p>
        </div>
      </div>

      <div className="w-12 h-1 bg-orange-500 rounded-full mb-8" />

      {/* Properties */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-black/5 animate-pulse" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <p className="text-sm text-black/40 font-medium text-center py-12">
          No nodes available right now.
        </p>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/cafezomad/nodes/${p.id}`)}
              className="w-full text-left bg-white rounded-2xl ring-1 ring-black/10 shadow-sm p-5 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-extrabold text-black tracking-tight">{p.name}</p>
                  <p className="text-xs text-black/40 font-medium uppercase tracking-widest mt-0.5">
                    {p.code}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-orange-500/10 ring-1 ring-orange-500/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* QR hint */}
      <div className="mt-auto pt-12 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 ring-1 ring-black/5">
        <svg className="w-5 h-5 text-black/25 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        </svg>
        <span className="text-xs text-black/40 font-medium">
          At a node? Scan the QR on your table to skip this
        </span>
      </div>
    </div>
  )
}
