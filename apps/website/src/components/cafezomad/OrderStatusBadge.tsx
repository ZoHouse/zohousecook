export function OrderStatusBadge({ status }: { status: string | null }) {
  const config: Record<string, { bg: string; label: string }> = {
    draft: { bg: 'bg-yellow-100 text-yellow-800', label: 'Awaiting Payment' },
    new: { bg: 'bg-blue-100 text-blue-700', label: 'New' },
    accepted: { bg: 'bg-amber-100 text-amber-700', label: 'Accepted' },
    preparing: { bg: 'bg-orange-100 text-orange-700', label: 'Preparing' },
    ready: { bg: 'bg-green-100 text-green-700', label: 'Ready' },
    served: { bg: 'bg-stone-100 text-stone-500', label: 'Served' },
    cancelled: { bg: 'bg-red-100 text-red-700', label: 'Cancelled' },
  }
  const c =
    config[status || ''] || {
      bg: 'bg-stone-100 text-stone-500',
      label: status || 'Pending',
    }
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.bg}`}>
      {c.label}
    </span>
  )
}
