import React, { useEffect, useState } from "react"
import { useQueryApi } from "@zo/auth"
import { GeneralObject } from "@zo/definitions/general"
import { createPublicClient, http, formatEther, erc20Abi } from "viem"
import { base, mainnet } from "viem/chains"
import { ZO_TOKEN, CONTRACTS } from "./constants"

// ---------------------------------------------------------------------------
// On-chain clients
// ---------------------------------------------------------------------------

const baseClient = createPublicClient({ chain: base, transport: http() })
const ethClient = createPublicClient({ chain: mainnet, transport: http() })

const ZO_ADDR = ZO_TOKEN.address as `0x${string}`
const FOUNDER_ADDR = CONTRACTS.find((c) => c.name === "Founder NFT")!.address as `0x${string}`
const CITIZEN_ADDR = CONTRACTS.find((c) => c.name === "Citizen NFT")!.address as `0x${string}`

const FOUNDER = CONTRACTS.find((c) => c.name === "Founder NFT")!
const CITIZEN = CONTRACTS.find((c) => c.name === "Citizen NFT")!
const POA_CONTRACT = CONTRACTS.find((c) => c.name === "POA")!

// Minimal ERC-721 ABI for totalSupply
const erc721SupplyAbi = [{ inputs: [], name: "totalSupply", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }] as const

// ---------------------------------------------------------------------------
// Hook: on-chain stats
// ---------------------------------------------------------------------------

interface OnChainStats {
  zoTotalSupply: string
  zoHolders: string
  founderMinted: string
  founderFloor: string
  citizenMinted: string
}

function useOnChainStats() {
  const [stats, setStats] = useState<OnChainStats>({
    zoTotalSupply: "—",
    zoHolders: "—",
    founderMinted: "—",
    founderFloor: "—",
    citizenMinted: "—",
  })

  useEffect(() => {
    async function fetchAll() {
      try {
        const [zoSupplyRaw, founderSupply, citizenSupply, floorRes] = await Promise.allSettled([
          baseClient.readContract({ address: ZO_ADDR, abi: erc20Abi, functionName: "totalSupply" }),
          ethClient.readContract({ address: FOUNDER_ADDR, abi: erc721SupplyAbi, functionName: "totalSupply" }),
          baseClient.readContract({ address: CITIZEN_ADDR, abi: erc721SupplyAbi, functionName: "totalSupply" }),
          window.fetch(`https://eth-mainnet.g.alchemy.com/nft/v3/demo/getFloorPrice?contractAddress=${FOUNDER_ADDR}`).then((r) => r.json()),
        ])

        const zoSupply = zoSupplyRaw.status === "fulfilled"
          ? formatLargeNumber(Number(formatEther(zoSupplyRaw.value as bigint)))
          : "—"
        const founderMinted = founderSupply.status === "fulfilled" ? String(founderSupply.value) : "—"
        const citizenMinted = citizenSupply.status === "fulfilled" ? String(citizenSupply.value) : "—"

        let founderFloor = "—"
        if (floorRes.status === "fulfilled") {
          const os = floorRes.value?.openSea
          if (os?.floorPrice) founderFloor = `${os.floorPrice.toFixed(3)} ETH`
        }

        setStats({
          zoTotalSupply: zoSupply,
          zoHolders: "578K+",
          founderMinted,
          founderFloor,
          citizenMinted,
        })
      } catch (e) {
        console.error("[zollardoe] on-chain fetch error:", e)
      }
    }
    fetchAll()
  }, [])

  return stats
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(0)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return String(Math.round(n))
}

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HeroSection() {
  // On-chain reads (real data from Base + Ethereum)
  const onChain = useOnChainStats()

  // Django API for $Zo ledger (transfer history synced from chain)
  const { data: ledgerData } = useQueryApi<GeneralObject>(
    "CAS_LEDGER",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", "page_size=1" // just need count from response
  )

  // Django API for founder stats + POA
  const { data: founderStatsData } = useQueryApi<GeneralObject>(
    "CAS_FOUNDER_TOKENS_STATS",
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
  const { data: poaData } = useQueryApi<GeneralObject>(
    "CAS_POAS",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", ""
  )

  // Parse API responses
  const ledger: any = ledgerData || {}
  const totalTransfers = ledger.count || "—" // paginated response has .count
  const fStats: any = founderStatsData || {}
  const fMembers: any = founderMembersData || {}
  const poas: any[] = poaData?.results || poaData || []

  // Founder stats from Django
  const uniqueHolders = fStats.total_holding_wallets || fStats.total_holders || "—"
  const verifiedMembers = fMembers.users_count || "—"

  // Listings count from Django OpenSea passthrough
  const founderListingsRaw = founderListingsData?.listings || founderListingsData?.results || (Array.isArray(founderListingsData) ? founderListingsData : [])
  const founderListings: any[] = Array.isArray(founderListingsRaw) ? founderListingsRaw : []
  const listedCount = founderListings.length || "—"

  // POA stats
  const totalPoas = poas.length || "—"
  const totalPoaClaims = poas.reduce((s: number, p: any) => s + (p.num_holders || 0), 0) || "—"

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
        {/* $Zo Token — on-chain data */}
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
            <StatCard label="Total Supply" value={onChain.zoTotalSupply} live highlight />
            <StatCard label="Quarterly Emission" value="1B" />
            <StatCard label="Total Transfers" value={String(totalTransfers)} live />
            <StatCard label="Unique Holders" value={onChain.zoHolders} live highlight />
            <StatCard label="Price" value="$0.00" />
            <StatCard label="Chain" value="Base" />
          </div>
        </div>

        {/* Founder NFT — on-chain + Django */}
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
            <StatCard label="Minted / Supply" value="1,111 / 1,111" />
            <StatCard label="Unique Holders" value={String(uniqueHolders)} live highlight />
            <StatCard label="Floor Price" value={onChain.founderFloor} live highlight />
            <StatCard label="Listed" value={String(listedCount)} live />
            <StatCard label="Verified Members" value={String(verifiedMembers)} live />
            <StatCard label="Delegation" value="delegate.cash" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <a href="https://opensea.io/collection/founders-of-zo-world" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/30 hover:text-[#cfff50] font-mono transition-colors">
              OpenSea ↗
            </a>
            <a href={`${FOUNDER.explorer}/address/${FOUNDER.address}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/30 hover:text-[#cfff50] font-mono transition-colors">
              Etherscan ↗
            </a>
          </div>
        </div>

        {/* Citizen NFT + POA — on-chain + Django */}
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
              <StatCard label="Total Minted" value={onChain.citizenMinted} live highlight />
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

function StatCard({ label, value, highlight, live }: {
  label: string; value: string; highlight?: boolean; live?: boolean
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
