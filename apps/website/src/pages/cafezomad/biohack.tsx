import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '@zo/auth'
import { BioHackTab } from '../../components/cafezomad/BioHackTab'
import { CafezomadHeader } from '../../components/cafezomad/CafezomadHeader'
import { CafezomadBottomNav } from '../../components/cafezomad/CafezomadBottomNav'
import appleTouchIcon from '../../components/cafezomad/assets/favicons/apple-touch-icon.png'
import cafezomadIcon192 from '../../components/cafezomad/assets/favicons/cafezomad-icon-192.png'
import cafezomadIcon512 from '../../components/cafezomad/assets/favicons/cafezomad-icon-512.png'

export default function BioHackPage() {
  const router = useRouter()
  const { user, isLoggedIn, showLoginModal } = useAuth()

  return (
    <div className="flex flex-col h-screen bg-[#f5f0e8]">
      <Head>
        <link rel="apple-touch-icon" href={appleTouchIcon.src} />
        <link rel="apple-touch-icon" sizes="180x180" href={appleTouchIcon.src} />
        <link rel="icon" type="image/png" sizes="192x192" href={cafezomadIcon192.src} />
        <link rel="icon" type="image/png" sizes="512x512" href={cafezomadIcon512.src} />
        <meta name="apple-mobile-web-app-title" content="Cafe Zomad" />
      </Head>
      <CafezomadHeader />

      <div className="flex-1 overflow-y-auto pb-28">
        <BioHackTab
          isLoggedIn={isLoggedIn}
          user={user}
          showLoginModal={showLoginModal}
        />
      </div>

      <CafezomadBottomNav
        activeTab="wallet"
        onTabSelect={(tab) => {
          if (tab === 'wallet') return
          router.push('/cafezomad/nodes')
        }}
      />
    </div>
  )
}
