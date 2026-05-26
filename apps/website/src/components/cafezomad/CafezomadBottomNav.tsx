import type { Tab } from './types'

interface CafezomadBottomNavProps {
  activeTab: Tab
  onTabSelect: (tab: Tab) => void
  cartBadge?: number
  ordersBadge?: number
}

const TABS: ReadonlyArray<{
  key: Tab
  label: string
  icon: (active: boolean) => JSX.Element
}> = [
  {
    key: 'menu',
    label: 'Menu',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.2 : 1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    key: 'cart',
    label: 'Cart',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.2 : 1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
  },
  {
    key: 'orders',
    label: 'Orders',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.2 : 1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'wallet',
    label: 'Bio Hack',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.2 : 1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
]

export function CafezomadBottomNav({ activeTab, onTabSelect, cartBadge, ordersBadge }: CafezomadBottomNavProps) {
  const badgeFor = (key: Tab): number | undefined => {
    if (key === 'cart' && cartBadge && cartBadge > 0) return cartBadge
    if (key === 'orders' && ordersBadge && ordersBadge > 0) return ordersBadge
    return undefined
  }

  return (
    <nav className="fixed bottom-5 left-5 right-5 bg-[#F1563F] rounded-full ring-1 ring-black/10 shadow-2xl shadow-black/20 z-40">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto px-1.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const badge = badgeFor(tab.key)
          return (
            <button
              key={tab.key}
              onClick={() => onTabSelect(tab.key)}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-14 h-11 rounded-full transition-all ${
                isActive
                  ? 'bg-white text-[#F1563F] shadow-md shadow-black/10'
                  : 'text-white/85'
              }`}
            >
              {badge !== undefined && (
                <span className="absolute -top-0.5 right-0.5 bg-black text-white text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center ring-2 ring-[#F1563F]">
                  {badge}
                </span>
              )}
              {tab.icon(isActive)}
              <span className="text-[9px] font-semibold tracking-wide">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
