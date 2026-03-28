import React from "react"
import { NextPage } from "next"
import Head from "next/head"
import { useAuth } from "@zo/auth"
import HeroSection from "../../components/zollardoe/HeroSection"
import OperationsPanel from "../../components/zollardoe/OperationsPanel"

const ZollardoePage: NextPage = () => {
  const { isLoggedIn, showLoginModal } = useAuth()

  return (
    <>
      <Head>
        <title>$Zo Distribution Ops — zollardoe</title>
      </Head>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          {!isLoggedIn ? (
            <div className="flex flex-col items-center justify-center py-32">
              <h1 className="text-2xl font-bold mb-2">
                <span className="text-[#cfff50]">$Zo</span> Distribution Ops
              </h1>
              <p className="text-white/40 text-sm mb-6">Login with Zo admin to access</p>
              <button
                onClick={() => showLoginModal()}
                className="px-6 py-3 bg-[#cfff50] text-black font-bold rounded-lg hover:bg-[#bfef40] transition-colors"
              >
                Login
              </button>
            </div>
          ) : (
            <>
              <HeroSection />
              <OperationsPanel />
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default ZollardoePage
