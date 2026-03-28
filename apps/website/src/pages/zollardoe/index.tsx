import React from "react"
import { NextPage } from "next"
import Head from "next/head"
import HeroSection from "../../components/zollardoe/HeroSection"
import OperationsPanel from "../../components/zollardoe/OperationsPanel"
import ContractsGrid from "../../components/zollardoe/ContractsGrid"
import ReferenceSections from "../../components/zollardoe/ReferenceSections"

const ZollardoePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>$Zo Distribution Ops — zollardoe</title>
      </Head>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <HeroSection />

          {/* Architecture */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Architecture</h2>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 font-mono text-sm text-white/70">
              <div className="text-center mb-4 text-[#cfff50]">
                [Trigger] → [TokenAirdrop in DB] → [Celery batch / 10 min] → [batchTransferFrom on-chain]
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <div className="text-[#cfff50] font-bold mb-1">TokenGrant</div>
                  <div className="text-white/50">Budget — name, city wallet, allowance cap, date range</div>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <div className="text-[#cfff50] font-bold mb-1">TokenAirdrop</div>
                  <div className="text-white/50">Distribution — recipient wallet, amount, grant FK, status lifecycle</div>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <div className="text-[#cfff50] font-bold mb-1">EVMTransaction</div>
                  <div className="text-white/50">On-chain tx — signed, broadcast, tracked. Batches up to 100.</div>
                </div>
              </div>
            </div>
          </section>

          <OperationsPanel />
          <ContractsGrid />
          <ReferenceSections />
        </div>
      </div>
    </>
  )
}

export default ZollardoePage
