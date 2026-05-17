import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '@zo/auth'
import cafeZomadLogo from '../../assets/cafezomad/logo.png'
import appleTouchIcon from '../../components/cafezomad/assets/favicons/apple-touch-icon.png'
import cafezomadIcon192 from '../../components/cafezomad/assets/favicons/cafezomad-icon-192.png'
import cafezomadIcon512 from '../../components/cafezomad/assets/favicons/cafezomad-icon-512.png'

export default function CafeZomadIndex() {
  const router = useRouter()
  const { isLoggedIn, user, showLoginModal } = useAuth()

  const signedIn = isLoggedIn && user

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f0e8] px-6">
      <Head>
        {/* iOS apple-touch-icon must be square. cafezomad/logo.png is 3948x3586 (non-square),
            so iOS rejects it and falls back to a title-letter icon. Square PNGs are imported
            through webpack so they're fingerprinted into the build output (apps/<app>/public/
            assets 404 in production on this nx-next setup). */}
        <link rel="apple-touch-icon" href={appleTouchIcon.src} />
        <link rel="apple-touch-icon" sizes="180x180" href={appleTouchIcon.src} />
        <link rel="icon" type="image/png" sizes="192x192" href={cafezomadIcon192.src} />
        <link rel="icon" type="image/png" sizes="512x512" href={cafezomadIcon512.src} />
        <meta name="apple-mobile-web-app-title" content="Cafe Zomad" />
      </Head>
      {/* Logo */}
      <div className="w-24 h-24 rounded-[2rem] bg-white p-3 mb-8 shadow-xl shadow-black/10">
        <img src={cafeZomadLogo.src} alt="Cafe Zomad" className="w-full h-full object-contain" />
      </div>

      {/* Title */}
      <h1 className="text-4xl font-extrabold tracking-tight text-black mb-2">Cafe Zomad</h1>
      <div className="w-12 h-1 bg-orange-500 rounded-full mb-4" />
      <p className="text-sm text-black/50 font-medium text-center max-w-[260px] leading-relaxed">
        Fresh food, good vibes, and nutrition tracking for every citizen.
      </p>

      {/* CTAs */}
      <div className="mt-10 flex flex-col items-center gap-3 w-full max-w-xs">
        {signedIn ? (
          <>
            <p className="text-sm text-black/60 font-semibold mb-1">
              Welcome back, {user.first_name || 'citizen'}
            </p>
            <button
              onClick={() => router.push('/cafezomad/nodes')}
              className="w-full bg-orange-500 text-black py-4 text-base font-bold tracking-wide rounded-2xl shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all"
            >
              View Nodes
            </button>
            <button
              onClick={() => router.push('/cafezomad/biohack')}
              className="w-full bg-black text-white py-3.5 text-sm font-bold tracking-wide rounded-2xl active:scale-[0.98] transition-all"
            >
              Bio Hack
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push('/cafezomad/nodes')}
              className="w-full bg-orange-500 text-black py-4 text-base font-bold tracking-wide rounded-2xl shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all"
            >
              View Nodes
            </button>
            <button
              onClick={() => showLoginModal()}
              className="w-full bg-black text-white py-3.5 text-sm font-bold tracking-wide rounded-2xl active:scale-[0.98] transition-all"
            >
              Sign In
            </button>
            <p className="text-xs text-black/35 font-medium text-center mt-1">
              Sign in to order, track nutrition, and earn XP
            </p>
          </>
        )}
      </div>

      {/* QR hint */}
      <div className="mt-12 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 ring-1 ring-black/5">
        <svg className="w-5 h-5 text-black/25 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
        </svg>
        <span className="text-xs text-black/40 font-medium">
          Or scan the QR code at your table to order directly
        </span>
      </div>
    </div>
  )
}
// deploy trigger 1776101576
