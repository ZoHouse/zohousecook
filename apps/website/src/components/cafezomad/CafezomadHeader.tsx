import { useRouter } from 'next/router'
import { useAuth, useProfile } from '@zo/auth'
import cafeZomadLogo from '../../assets/cafezomad/logo.png'
import { cleanNickname } from './nickname'

export function CafezomadHeader({ tableLabel }: { tableLabel?: string | null }) {
  const router = useRouter()
  const { user, isLoggedIn, showLoginModal } = useAuth()
  const { profile } = useProfile()

  return (
    <header className="shrink-0 sticky top-0 z-20 bg-[#F1563F] px-5 pt-4 pb-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/cafezomad')}
          className="text-left active:scale-95 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <img src={cafeZomadLogo.src} alt="Cafe Zomad" className="w-9 h-9 rounded-2xl object-contain bg-white p-1" />
            <h1 className="font-serif text-2xl font-semibold italic tracking-tight text-white leading-none">Cafe Zomad</h1>
          </div>
          {tableLabel && (
            <p className="text-[11px] text-white/70 font-medium tracking-[0.15em] uppercase mt-0.5 ml-[46px]">
              Table {tableLabel}
            </p>
          )}
        </button>
        <div className="flex items-center gap-2">
          {isLoggedIn && user ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 ring-1 ring-white/20 rounded-full">
              <span className="text-[11px] font-semibold text-white/90">
                {user.first_name
                  || (profile as { first_name?: string } | undefined)?.first_name
                  || cleanNickname(profile?.selected_nickname)
                  || cleanNickname(profile?.custom_nickname)
                  || cleanNickname(profile?.nickname)
                  || cleanNickname(profile?.ens_nickname)
                  || user.mobile_number
                  || 'Guest'}
              </span>
            </div>
          ) : (
            <button
              onClick={() => showLoginModal()}
              className="px-3 py-1.5 bg-black rounded-full text-[11px] font-semibold text-white"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
