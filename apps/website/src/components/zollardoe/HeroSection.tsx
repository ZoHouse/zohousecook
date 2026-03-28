import React, { useMemo } from "react"
import { useQueryApi } from "@zo/auth"
import { GeneralObject } from "@zo/definitions/general"
import { ZO_TOKEN, CONTRACTS, AIRDROP_STATUS } from "./constants"

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="ml-2 text-xs text-white/40 hover:text-[#cfff50] transition-colors"
      title="Copy address"
    >
      {copied ? "copied" : "copy"}
    </button>
  )
}

function AddrLink({ address, explorer }: { address: string; explorer: string }) {
  return (
    <span className="flex items-center">
      <a
        href={`${explorer}/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-[#cfff50] hover:underline"
      >
        {address.slice(0, 10)}...{address.slice(-6)}
      </a>
      <CopyButton text={address} />
    </span>
  )
}

function formatZo(raw: number): string {
  const num = raw / 1e18
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
  if (num >= 1) return num.toFixed(0)
  return num.toFixed(2)
}

const FOUNDER = CONTRACTS.find((c) => c.name === "Founder NFT")!
const CITIZEN = CONTRACTS.find((c) => c.name === "Citizen NFT")!
const POA_CONTRACT = CONTRACTS.find((c) => c.name === "POA")!

// Quarterly emission: 1B $Zo per quarter (from emissions strategy)
const QUARTERLY_EMISSION = "1B"

export default function HeroSection() {
  // $Zo airdrops for transfer stats
  const { data: airdropsData } = useQueryApi<GeneralObject>(
    "CAS_TOKEN_AIRDROPS",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", "ordering=-allocated_at&page_size=100"
  )

  // Founder stats
  const { data: founderStatsData } = useQueryApi<GeneralObject>(
    "CAS_FOUNDER_TOKENS_STATS",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", ""
  )
  const { data: founderOwnersData } = useQueryApi<GeneralObject>(
    "CAS_FOUNDER_TOKENS_OWNERS",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", ""
  )
  const { data: founderMembersData } = useQueryApi<GeneralObject>(
    "WEBTHREE_FOUNDER_MEMBERS",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", ""
  )
  const { data: founderListingsData } = useQueryApi<GeneralObject>(
    "WEBTHREE_FOUNDER_MARKETPLACE_LISTINGS",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", ""
  )

  // POA stats
  const { data: poaData } = useQueryApi<GeneralObject>(
    "CAS_POAS",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", ""
  )

  // Parse
  const airdrops: any[] = airdropsData?.results || airdropsData || []
  const founderStats = founderStatsData || {}
  const founderOwners: any[] = founderOwnersData?.results || founderOwnersData || []
  const founderMembers: any[] = founderMembersData?.results || founderMembersData || []
  const poas: any[] = poaData?.results || poaData || []

  // $Zo computed stats
  const zoStats = useMemo(() => {
    const success = airdrops.filter((a) => a.status === 2)
    const totalDistributed = success.reduce((s: number, a: any) => s + Number(a.amount || 0), 0)
    const totalTransfers = airdrops.length
    const uniqueRecipients = new Set(success.map((a: any) => a.wallet_address)).size
    return { totalDistributed, totalTransfers, uniqueRecipients }
  }, [airdrops])

  // Founder computed
  const founderListings: any[] = founderListingsData?.results || founderListingsData || []
  const totalMinted = founderStats.total_minted || founderStats.count || founderOwners.length || "—"
  const uniqueOwners = founderStats.unique_owners || (founderOwners.length > 0 ? new Set(founderOwners.map((o: any) => o.wallet_address || o.owner)).size : "—")
  const totalFounderMembers = founderMembers.length || founderStats.total_members || "—"

  // Floor price from listings (lowest price in ETH)
  const floorPrice = useMemo(() => {
    if (!founderListings.length) return "—"
    const prices = founderListings
      .map((l: any) => {
        const price = l.price?.current?.value || l.current_price || l.price
        if (!price) return null
        const eth = Number(price) / 1e18
        return eth > 0 && eth < 1000 ? eth : null
      })
      .filter(Boolean) as number[]
    if (!prices.length) return "—"
    return `${Math.min(...prices).toFixed(3)} ETH`
  }, [founderListings])

  const listedCount = founderListings.length || "—"

  // POA computed
  const totalPoas = poas.length || "—"
  const totalPoaClaims = poas.reduce((s: number, p: any) => s + (p.attendees_count || 0), 0) || "—"

  return (
    <div className="mb-8">
      {/* Title bar */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/[0.02] mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              <span className="text-[#cfff50]">$Zo</span> Distribution Ops
            </h1>
            <p className="text-white/50 text-sm">
              Create grants, distribute tokens, manage the Zo on-chain ecosystem
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 bg-[#0052FF]/20 text-[#0052FF] text-xs font-mono rounded">
              Base
            </span>
            <span className="px-2 py-1 bg-[#627EEA]/20 text-[#627EEA] text-xs font-mono rounded">
              Ethereum
            </span>
          </div>
        </div>
      </div>

      {/* Web3 ecosystem cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* $Zo Token */}
        <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white text-lg">$Zo Token</h3>
            <div className="flex gap-1.5">
              <span className="px-2 py-0.5 bg-[#cfff50]/10 text-[#cfff50] text-[10px] font-mono rounded">ERC-20</span>
              <span className="px-2 py-0.5 bg-[#0052FF]/10 text-[#0052FF] text-[10px] font-mono rounded">Base</span>
            </div>
          </div>
          <AddrLink address={ZO_TOKEN.address} explorer={ZO_TOKEN.explorer} />
          <div className="grid grid-cols-2 gap-2 mt-3">
            <StatCard label="Total Supply" value="1T" highlight />
            <StatCard label="Quarterly Emission" value={QUARTERLY_EMISSION} />
            <StatCard label="Total Transfers" value={String(zoStats.totalTransfers)} live />
            <StatCard label="Distributed (Q)" value={formatZo(zoStats.totalDistributed)} live highlight />
            <StatCard label="Unique Holders" value="578K+" highlight />
            <StatCard label="Price" value="$0.00" />
          </div>
        </div>

        {/* Founder NFT */}
        <div className="border border-[#627EEA]/20 rounded-xl p-4 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white text-lg">Founder NFT</h3>
            <div className="flex gap-1.5">
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-mono rounded">ERC-721</span>
              <span className="px-2 py-0.5 bg-[#627EEA]/10 text-[#627EEA] text-[10px] font-mono rounded">Ethereum</span>
            </div>
          </div>
          <AddrLink address={FOUNDER.address} explorer={FOUNDER.explorer} />
          <div className="grid grid-cols-2 gap-2 mt-3">
            <StatCard label="Minted / Supply" value={`${totalMinted} / 1,111`} live />
            <StatCard label="Unique Holders" value={String(uniqueOwners)} live highlight />
            <StatCard label="Floor Price" value={floorPrice} live highlight />
            <StatCard label="Listed" value={String(listedCount)} live />
            <StatCard label="Verified Members" value={String(totalFounderMembers)} live />
            <StatCard label="Delegation" value="delegate.cash" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <a
              href="https://opensea.io/collection/founders-of-zo-world"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-white/30 hover:text-[#cfff50] font-mono transition-colors"
            >
              OpenSea ↗
            </a>
            <a
              href={`${FOUNDER.explorer}/address/${FOUNDER.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-white/30 hover:text-[#cfff50] font-mono transition-colors"
            >
              Etherscan ↗
            </a>
          </div>
        </div>

        {/* Citizen NFT + POA */}
        <div className="border border-blue-500/20 rounded-xl p-4 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white text-lg">Citizen & POA</h3>
            <div className="flex gap-1.5">
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-mono rounded">ERC-721</span>
              <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-mono rounded">ERC-1155</span>
            </div>
          </div>

          {/* Citizen */}
          <div className="mb-3">
            <div className="text-white/50 text-xs font-bold mb-1">Citizen NFT</div>
            <AddrLink address={CITIZEN.address} explorer={CITIZEN.explorer} />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <StatCard label="Mint" value="Auto on signup" />
              <StatCard label="Batch Size" value="100 / 10min" />
            </div>
          </div>

          <div className="border-t border-white/5 my-3" />

          {/* POA */}
          <div>
            <div className="text-white/50 text-xs font-bold mb-1">Proof of Attendance</div>
            <AddrLink address={POA_CONTRACT.address} explorer={POA_CONTRACT.explorer} />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <StatCard label="Active POAs" value={String(totalPoas)} live />
              <StatCard label="Total Claims" value={String(totalPoaClaims)} live />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
  live,
}: {
  label: string
  value: string
  highlight?: boolean
  live?: boolean
}) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-2">
      <div className="text-white/40 text-[10px] mb-0.5 flex items-center gap-1">
        {label}
        {live && <span className="w-1.5 h-1.5 rounded-full bg-[#cfff50] inline-block animate-pulse" />}
      </div>
      <div className={`font-mono text-sm font-bold ${highlight ? "text-[#cfff50]" : "text-white"}`}>
        {value}
      </div>
    </div>
  )
}
