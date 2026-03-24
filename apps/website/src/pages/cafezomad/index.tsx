export default function CafeZomadIndex() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f0e8] px-6">
      {/* ZO Logo */}
      <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-black/20">
        <span className="text-lg font-bold text-white font-mono tracking-wider">ZO</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-extrabold tracking-tight text-black mb-2">Cafe Zomad</h1>

      {/* Divider */}
      <div className="w-12 h-1 bg-orange-500 rounded-full mb-6" />

      {/* Message */}
      <div className="text-center max-w-xs">
        <p className="text-base font-semibold text-black/70 leading-relaxed">
          Scan the QR code at your table to order.
        </p>
        <p className="text-sm text-black/40 font-medium mt-3">
          Each table has a unique QR code — point your camera at it to get started.
        </p>
      </div>

      {/* QR icon */}
      <div className="mt-10 w-20 h-20 rounded-2xl bg-white ring-1 ring-black/10 shadow-sm flex items-center justify-center">
        <svg
          className="w-10 h-10 text-black/30"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
          />
        </svg>
      </div>

      {/* Footer */}
      <p className="mt-12 text-xs text-black/25 font-medium tracking-wide">
        Zo House — Whitefield, Bangalore
      </p>
    </div>
  )
}
