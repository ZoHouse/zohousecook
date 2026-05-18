import { useRouter } from 'next/router'
import { useAuth } from '@zo/auth'
import { BioHackTab } from '../../components/cafezomad/BioHackTab'
import cafeZomadLogo from '../../assets/cafezomad/logo.png'

export default function BioHackPage() {
  const router = useRouter()
  const { user, isLoggedIn, showLoginModal } = useAuth()

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* Header — full-width orange band, content constrained for laptop readability */}
      <header className="sticky top-0 z-20 bg-orange-500 px-5 pt-4 pb-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={() => router.push('/cafezomad')} className="w-9 h-9 rounded-xl bg-white overflow-hidden active:scale-95 transition-all shrink-0 p-1">
              <img src={cafeZomadLogo.src} alt="Cafe Zomad" className="w-full h-full object-contain" />
            </button>
            <h1 className="text-lg font-extrabold tracking-tight text-black">Bio Hack</h1>
          </div>
          <button onClick={() => router.push('/cafezomad/menu')} className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl active:scale-95 transition-all">
            Menu
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto pb-12">
        <BioHackTab
          isLoggedIn={isLoggedIn}
          user={user}
          showLoginModal={showLoginModal}
        />
      </div>
    </div>
  )
}
