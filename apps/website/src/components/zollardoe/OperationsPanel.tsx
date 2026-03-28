import React, { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { useQueryApi, useMutationApi } from "@zo/auth"
import { GeneralObject } from "@zo/definitions/general"
import { toast } from "sonner"
import { AIRDROP_STATUS, ZO_TOKEN, CONTRACTS } from "./constants"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TokenGrant {
  id: string
  name: string
  allowance: string
  wallet_address: string
  contract: string
  start_date: string | null
  end_date: string | null
}

interface TokenAirdrop {
  id: string
  status: string // humanized: "pending" | "initiated" | "success" | "failed" | "cancelled"
  wallet_address: string
  amount: string
  allocated_at: string
  ref_note: string | null
  grant: string // UUID FK, not nested
  transaction: string | null // UUID FK, not nested
}

interface CsvRow {
  wallet_address?: string
  mobile_number?: string
  amount: string
  note: string
  valid: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatZo(raw: string | number): string {
  const num = Number(raw) / 1e18
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
  if (num >= 1) return num.toFixed(0)
  return num.toFixed(2)
}

function truncAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr || "—"
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatDate(d: string): string {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

const FOUNDER = CONTRACTS.find((c) => c.name === "Founder NFT")!

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

type Section = "zo" | "founders" | "citizens" | "poa"

export default function OperationsPanel() {
  const [activeSection, setActiveSection] = useState<Section>("zo")

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4">Management</h2>

      {/* Section tabs */}
      <div className="flex gap-1 mb-4 bg-white/[0.03] rounded-lg p-1 w-fit">
        {([
          { key: "zo" as Section, label: "$Zo" },
          { key: "founders" as Section, label: "Founder NFTs" },
          { key: "citizens" as Section, label: "Citizen NFTs" },
          { key: "poa" as Section, label: "POA" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === key
                ? "bg-[#cfff50] text-black"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeSection === "zo" && <ZoSection />}
      {activeSection === "founders" && <FoundersSection />}
      {activeSection === "citizens" && <CitizensSection />}
      {activeSection === "poa" && <PoaSection />}
    </section>
  )
}

// ===========================================================================
// $Zo Section
// ===========================================================================

function ZoSection() {
  const [activeTab, setActiveTab] = useState<"grants" | "distribute" | "bulk" | "ledger" | "claims">("grants")

  const { data: grantsData, isLoading: lg, refetch: refetchGrants } = useQueryApi<GeneralObject>(
    "CAS_TOKEN_GRANTS",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", ""
  )
  const { data: airdropsData, isLoading: la, refetch: refetchAirdrops } = useQueryApi<GeneralObject>(
    "CAS_TOKEN_AIRDROPS",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", "ordering=-allocated_at&page_size=50"
  )
  const { data: ledgerData, isLoading: ll } = useQueryApi<GeneralObject>(
    "CAS_LEDGER",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", "ordering=-id&page_size=50"
  )

  const grants: TokenGrant[] = grantsData?.results || grantsData || []
  const airdrops: TokenAirdrop[] = airdropsData?.results || airdropsData || []
  const ledgerEntries: any[] = ledgerData?.results || ledgerData || []
  const isLoading = lg || la

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {}
    let totalDistributed = 0
    for (const a of airdrops) {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1
      if (a.status === "success") totalDistributed += Number(a.amount)
    }
    return { byStatus, totalDistributed }
  }, [airdrops])

  if (!isLoading && grants.length === 0 && airdrops.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 text-white/40 text-sm">
        No data — login as CAS admin to access $Zo distribution operations.
      </div>
    )
  }

  const TAB_LABELS: Record<string, string> = {
    grants: "Grants",
    distribute: "Distribute",
    bulk: "Bulk Distribute",
    ledger: "Ledger",
    claims: "Claim History",
  }

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <KpiCard label="Grants" value={String(grants.length)} />
        <KpiCard label="Total Distributed" value={formatZo(stats.totalDistributed)} suffix="$Zo" highlight />
        <KpiCard label="Success" value={String(stats.byStatus["success"] || 0)} color="#52c41a" />
        <KpiCard label="Pending" value={String(stats.byStatus["pending"] || 0)} color="#faad14" />
        <KpiCard label="Failed" value={String(stats.byStatus["failed"] || 0)} color="#ff4d4f" />
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 bg-white/[0.02] rounded-lg p-1 w-fit flex-wrap">
        {(["grants", "distribute", "bulk", "ledger", "claims"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-white/40 text-sm py-8">Loading...</div>
      ) : (
        <>
          {activeTab === "grants" && <GrantsTab grants={grants} refetchGrants={refetchGrants} />}
          {activeTab === "distribute" && <DistributeTab grants={grants} airdrops={airdrops} refetchAirdrops={refetchAirdrops} />}
          {activeTab === "bulk" && <BulkDistributeTab />}
          {activeTab === "ledger" && <LedgerTab entries={ledgerEntries} isLoading={ll} />}
          {activeTab === "claims" && <ClaimsTab airdrops={airdrops} />}
        </>
      )}
    </div>
  )
}

// ===========================================================================
// Founders Section
// ===========================================================================

// Known treasury wallets
const TREASURY_WALLETS: Record<string, string> = {
  "0xeef680d493640228797d75dd3dff2b49609ed306": "JoinZo Contract",
  "0x19afb0c4f63983d619a3f983d065a68780734336": "Treasury Wallet",
}

function FoundersSection() {
  const { data: allowlistData, isLoading: loadingAl } = useQueryApi<GeneralObject>(
    "CAS_FOUNDER_ALLOWLISTS",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", "ordering=-created_at"
  )
  const { data: ownersData, isLoading: loadingOwners } = useQueryApi<GeneralObject>(
    "CAS_FOUNDER_TOKENS_OWNERS",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", ""
  )
  const { data: founderStatsData } = useQueryApi<GeneralObject>(
    "CAS_FOUNDER_TOKENS_STATS",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", ""
  )

  // Alchemy: floor price + recent sales
  const [marketData, setMarketData] = useState<{
    osFloor: string; lrFloor: string; recentSales: any[]
  }>({ osFloor: "—", lrFloor: "—", recentSales: [] })

  // Alchemy: on-chain holders
  const [onChainHolders, setOnChainHolders] = useState<{ address: string; count: number; label: string }[]>([])

  useEffect(() => {
    async function fetchMarket() {
      try {
        const [floorRes, salesRes, holdersRes] = await Promise.allSettled([
          window.fetch(`https://eth-mainnet.g.alchemy.com/nft/v3/demo/getFloorPrice?contractAddress=${FOUNDER.address}`).then(r => r.json()),
          window.fetch(`https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTSales?contractAddress=${FOUNDER.address}&order=desc&limit=10`).then(r => r.json()),
          window.fetch(`https://eth-mainnet.g.alchemy.com/nft/v3/demo/getOwnersForContract?contractAddress=${FOUNDER.address}&withTokenBalances=true`).then(r => r.json()),
        ])

        if (floorRes.status === "fulfilled") {
          const os = floorRes.value?.openSea
          const lr = floorRes.value?.looksRare
          setMarketData(prev => ({
            ...prev,
            osFloor: os?.floorPrice ? `${os.floorPrice.toFixed(3)} ETH` : "—",
            lrFloor: lr?.floorPrice ? `${lr.floorPrice.toFixed(3)} ETH` : "—",
          }))
        }

        if (salesRes.status === "fulfilled") {
          setMarketData(prev => ({ ...prev, recentSales: salesRes.value?.nftSales || [] }))
        }

        if (holdersRes.status === "fulfilled") {
          const rawOwners = holdersRes.value?.owners || []
          const sorted = rawOwners
            .map((o: any) => ({
              address: o.ownerAddress,
              count: (o.tokenBalances || []).length,
              label: TREASURY_WALLETS[o.ownerAddress?.toLowerCase()] || "",
            }))
            .sort((a: any, b: any) => b.count - a.count)
          setOnChainHolders(sorted)
        }
      } catch (e) {
        console.error("[zollardoe] market fetch error:", e)
      }
    }
    fetchMarket()
  }, [])

  const allowlists: any[] = allowlistData?.results || allowlistData || []
  const owners: any[] = ownersData?.results || ownersData || []
  const fStats: any = founderStatsData || {}
  const isLoading = loadingAl || loadingOwners

  // Build wallet → name lookup from Django data
  const walletNames = useMemo(() => {
    const map: Record<string, string> = {}
    for (const o of owners) {
      if (!o.user) continue
      const name = `${o.user.first_name || ""} ${o.user.last_name || ""}`.trim()
      if (!name) continue
      // Map all wallets this user owns
      for (const w of Object.keys(o.tokens || {})) {
        map[w.toLowerCase()] = name
      }
      if (o.user.wallet_address) map[o.user.wallet_address.toLowerCase()] = name
    }
    // Add treasury labels
    for (const [addr, label] of Object.entries(TREASURY_WALLETS)) {
      map[addr] = label
    }
    return map
  }, [owners])

  const [activeTab, setActiveTab] = useState<"market" | "holders" | "allowlist">("market")

  const treasuryTotal = onChainHolders
    .filter(h => TREASURY_WALLETS[h.address?.toLowerCase()])
    .reduce((s, h) => s + h.count, 0)

  if (isLoading) {
    return <div className="text-white/40 text-sm py-8">Loading founder data...</div>
  }

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        <KpiCard label="Minted" value="1,111 / 1,111" />
        <KpiCard label="Unique Holders" value={String(onChainHolders.length || fStats.total_holders || "—")} highlight />
        <KpiCard label="OpenSea Floor" value={marketData.osFloor} highlight />
        <KpiCard label="LooksRare Floor" value={marketData.lrFloor} />
        <KpiCard label="Treasury Held" value={String(treasuryTotal)} color="#faad14" />
        <KpiCard label="Allowlist Refs" value={String(allowlists.length || "—")} />
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 bg-white/[0.02] rounded-lg p-1 w-fit">
        {(["market", "holders", "allowlist"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {tab === "market" ? "Floor & Sales" : tab === "holders" ? "Holders" : "Allowlist"}
          </button>
        ))}
      </div>

      {activeTab === "market" && (
        <div className="space-y-4">
          {/* Treasury wallets */}
          <div className="bg-white/[0.02] border border-yellow-500/20 rounded-xl p-4">
            <h3 className="text-sm font-bold text-yellow-400 mb-3">Treasury Wallets</h3>
            <div className="space-y-2">
              {onChainHolders.filter(h => TREASURY_WALLETS[h.address?.toLowerCase()]).map((h) => (
                <div key={h.address} className="flex items-center justify-between bg-white/[0.03] rounded-lg p-3">
                  <div>
                    <div className="text-xs font-bold text-white">{TREASURY_WALLETS[h.address.toLowerCase()]}</div>
                    <a href={`${FOUNDER.explorer}/address/${h.address}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#cfff50] hover:underline">
                      {truncAddr(h.address)}
                    </a>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-yellow-400">{h.count}</div>
                    <div className="text-[10px] text-white/40">NFTs held</div>
                  </div>
                </div>
              ))}
              {treasuryTotal > 0 && (
                <div className="flex items-center justify-between mt-3 bg-white/[0.03] rounded-lg p-3">
                  <div className="text-xs text-white/40">
                    {treasuryTotal} NFTs available for OTC / resale at floor ({marketData.osFloor})
                  </div>
                  <a
                    href="https://etherscan.io/address/0xeEf680d493640228797d75Dd3dFF2B49609eD306#writeContract"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-md hover:bg-yellow-500/30 transition-colors"
                  >
                    Transfer via Etherscan ↗
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Recent sales */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white/70 mb-3">Recent Sales</h3>
            {marketData.recentSales.length === 0 ? (
              <div className="text-white/40 text-sm">No recent sales data.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-white/40 text-xs border-b border-white/5">
                      <th className="pb-2 pr-4">Token ID</th>
                      <th className="pb-2 pr-4">Marketplace</th>
                      <th className="pb-2 pr-4 text-right">Price</th>
                      <th className="pb-2 pr-4">Buyer</th>
                      <th className="pb-2 pr-4">Seller</th>
                      <th className="pb-2">Block</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketData.recentSales.map((s: any, i: number) => {
                      const price = Number(s.sellerFee?.amount || 0) / 1e18
                      const buyerName = walletNames[s.buyerAddress?.toLowerCase()] || ""
                      const sellerName = walletNames[s.sellerAddress?.toLowerCase()] || ""
                      return (
                        <tr key={i} className="border-b border-white/5 text-white/70">
                          <td className="py-2 pr-4 font-mono text-xs">#{s.tokenId}</td>
                          <td className="py-2 pr-4 text-xs">{s.marketplace || "—"}</td>
                          <td className="py-2 pr-4 text-right font-mono font-bold text-[#cfff50]">{price.toFixed(4)} ETH</td>
                          <td className="py-2 pr-4 font-mono text-xs">
                            <a href={`${FOUNDER.explorer}/address/${s.buyerAddress}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#cfff50]">
                              {truncAddr(s.buyerAddress || "")}
                            </a>
                            {buyerName && <span className="text-white/40 ml-1">({buyerName})</span>}
                          </td>
                          <td className="py-2 font-mono text-xs">
                            <a href={`${FOUNDER.explorer}/address/${s.sellerAddress}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#cfff50]">
                              {truncAddr(s.sellerAddress || "")}
                            </a>
                            {sellerName && <span className="text-white/40 ml-1">({sellerName})</span>}
                          </td>
                          <td className="py-2 text-xs text-white/30 font-mono">{s.blockNumber ? `#${s.blockNumber}` : "—"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent sales note */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3">
            <div className="text-[10px] text-white/30">
              Sales data from Alchemy (historical). For live activity check{" "}
              <a href="https://opensea.io/collection/founders-of-zo-world/activity" target="_blank" rel="noopener noreferrer" className="text-[#cfff50] hover:underline">OpenSea Activity ↗</a>
              {" "}or{" "}
              <a href="https://blur.io/eth/collection/founders-of-zo-world" target="_blank" rel="noopener noreferrer" className="text-[#cfff50] hover:underline">Blur ↗</a>
            </div>
          </div>
        </div>
      )}

      {activeTab === "holders" && (
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white/70 mb-3">Founder Members (Django) ({owners.length})</h3>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0a0a0a]">
                <tr className="text-left text-white/40 text-xs border-b border-white/5">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Wallet</th>
                  <th className="pb-2 pr-4">Token IDs</th>
                  <th className="pb-2 text-right"># Held</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((o: any, i: number) => {
                  const wallets = Object.keys(o.tokens || {})
                  const wallet = wallets[0] || o.user?.wallet_address || ""
                  const tokenIds = Object.values(o.tokens || {}).flat() as number[]
                  return (
                    <tr key={o.user?.id || i} className="border-b border-white/5 text-white/70">
                      <td className="py-2 pr-4 text-xs">
                        {o.user ? `${o.user.first_name || ""} ${o.user.last_name || ""}`.trim() || o.user.pid || "—" : "Unregistered"}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        <a href={`${FOUNDER.explorer}/address/${wallet}`} target="_blank" rel="noopener noreferrer" className="text-[#cfff50] hover:underline">
                          {truncAddr(wallet)}
                        </a>
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-white/40">
                        {tokenIds.length <= 3 ? tokenIds.join(", ") : `${tokenIds.slice(0, 3).join(", ")}...`}
                      </td>
                      <td className="py-2 text-right font-mono font-bold">{o.num_tokens || tokenIds.length}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "allowlist" && (
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white/70 mb-3">Allowlist Referrals ({allowlists.length})</h3>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0a0a0a]">
                <tr className="text-left text-white/40 text-xs border-b border-white/5">
                  <th className="pb-2 pr-4">Referred Wallet</th>
                  <th className="pb-2 pr-4">Referred By</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {allowlists.map((al: any, i: number) => {
                  const referredName = al.referred ? `${al.referred.first_name || ""} ${al.referred.last_name || ""}`.trim() : "—"
                  const referrerName = al.user ? `${al.user.first_name || ""} ${al.user.last_name || ""}`.trim() : "—"
                  return (
                    <tr key={al.id || i} className="border-b border-white/5 text-white/70">
                      <td className="py-2 pr-4 font-mono text-xs">
                        <a href={`${FOUNDER.explorer}/address/${al.wallet_address || ""}`} target="_blank" rel="noopener noreferrer" className="text-[#cfff50] hover:underline">
                          {truncAddr(al.wallet_address || "")}
                        </a>
                        {referredName !== "—" && <span className="text-white/40 ml-2">{referredName}</span>}
                      </td>
                      <td className="py-2 pr-4 text-xs">{referrerName}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          al.status === "approved" ? "bg-green-500/20 text-green-400" :
                          al.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                          al.status === "rejected" ? "bg-red-500/20 text-red-400" :
                          "bg-white/5 text-white/40"
                        }`}>
                          {al.status || "—"}
                        </span>
                      </td>
                      <td className="py-2 text-xs">{al.created_at ? formatDate(al.created_at) : "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ===========================================================================
// Citizens Section
// ===========================================================================

function CitizensSection() {
  const { data: nftAirdropsData, isLoading: loadingAirdrops } = useQueryApi<GeneralObject>(
    "CAS_NFTAIRDROPS",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", "ordering=-created_at&page_size=100"
  )
  const { data: collectionsData, isLoading: loadingCollections } = useQueryApi<GeneralObject>(
    "CAS_NFTAIRDROPCOLLECTIONS",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", ""
  )

  const nftAirdrops: any[] = nftAirdropsData?.results || nftAirdropsData || []
  const collections: any[] = collectionsData?.results || collectionsData || []
  const isLoading = loadingAirdrops || loadingCollections

  const [activeTab, setActiveTab] = useState<"overview" | "collections" | "recent">("overview")

  // Stats
  const stats = useMemo(() => {
    let pending = 0, success = 0, failed = 0, initiated = 0
    for (const a of nftAirdrops) {
      if (a.status === 0) pending++
      else if (a.status === 1) initiated++
      else if (a.status === 2) success++
      else if (a.status === 3) failed++
    }
    const successRate = nftAirdrops.length > 0 ? ((success / nftAirdrops.length) * 100).toFixed(1) : "0"
    return { pending, initiated, success, failed, total: nftAirdrops.length, successRate }
  }, [nftAirdrops])

  // Growth: group by date
  const growth = useMemo(() => {
    const byDate: Record<string, { total: number; success: number }> = {}
    for (const a of nftAirdrops) {
      if (!a.created_at) continue
      const date = new Date(a.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
      if (!byDate[date]) byDate[date] = { total: 0, success: 0 }
      byDate[date].total++
      if (a.status === 2) byDate[date].success++
    }
    return Object.entries(byDate).slice(0, 14).reverse()
  }, [nftAirdrops])

  // Per-collection stats
  const collectionStats = useMemo(() => {
    const byCollection: Record<string, { name: string; slug: string; total: number; success: number; pending: number; contract: string }> = {}
    for (const a of nftAirdrops) {
      const col = a.collection
      if (!col) continue
      const id = col.id || col.slug || "unknown"
      if (!byCollection[id]) {
        byCollection[id] = {
          name: col.name || col.slug || "Unknown",
          slug: col.slug || "",
          total: 0,
          success: 0,
          pending: 0,
          contract: col.contract?.address || "",
        }
      }
      byCollection[id].total++
      if (a.status === 2) byCollection[id].success++
      if (a.status === 0 || a.status === 1) byCollection[id].pending++
    }
    return Object.values(byCollection).sort((a, b) => b.total - a.total)
  }, [nftAirdrops])

  if (isLoading) {
    return <div className="text-white/40 text-sm py-8">Loading citizen data...</div>
  }

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        <KpiCard label="Total Airdrops" value={String(stats.total)} />
        <KpiCard label="Minted" value={String(stats.success)} color="#52c41a" />
        <KpiCard label="Pending" value={String(stats.pending)} color="#faad14" />
        <KpiCard label="In Progress" value={String(stats.initiated)} color="#1890ff" />
        <KpiCard label="Failed" value={String(stats.failed)} color="#ff4d4f" />
        <KpiCard label="Success Rate" value={`${stats.successRate}%`} highlight />
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 bg-white/[0.02] rounded-lg p-1 w-fit">
        {(["overview", "collections", "recent"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
            }`}
          >
            {tab === "overview" ? "Growth & Stats" : tab === "collections" ? "Collections" : "Recent Mints"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Daily minting velocity */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white/70 mb-3">Minting Velocity (daily)</h3>
            {growth.length === 0 ? (
              <div className="text-white/40 text-sm">No data yet.</div>
            ) : (
              <div className="space-y-1.5">
                {growth.map(([date, data]) => {
                  const maxTotal = Math.max(...growth.map(([, d]) => d.total), 1)
                  const barWidth = (data.total / maxTotal) * 100
                  const successWidth = (data.success / maxTotal) * 100
                  return (
                    <div key={date} className="flex items-center gap-3">
                      <div className="w-16 text-xs text-white/40 text-right font-mono">{date}</div>
                      <div className="flex-1 h-5 bg-white/[0.03] rounded relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-white/10 rounded" style={{ width: `${barWidth}%` }} />
                        <div className="absolute inset-y-0 left-0 bg-[#cfff50]/30 rounded" style={{ width: `${successWidth}%` }} />
                      </div>
                      <div className="w-16 text-xs font-mono text-right">
                        <span className="text-[#cfff50]">{data.success}</span>
                        <span className="text-white/30">/{data.total}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Per-collection breakdown */}
          {collectionStats.length > 0 && (
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white/70 mb-3">By Collection</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-white/40 text-xs border-b border-white/5">
                      <th className="pb-2 pr-4">Collection</th>
                      <th className="pb-2 pr-4">Contract</th>
                      <th className="pb-2 pr-4 text-right">Total</th>
                      <th className="pb-2 pr-4 text-right">Minted</th>
                      <th className="pb-2 text-right">Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectionStats.map((c, i) => (
                      <tr key={i} className="border-b border-white/5 text-white/70">
                        <td className="py-2 pr-4 font-medium text-xs">{c.name}</td>
                        <td className="py-2 pr-4 font-mono text-xs">
                          {c.contract ? (
                            <a href={`${ZO_TOKEN.explorer}/address/${c.contract}`} target="_blank" rel="noopener noreferrer" className="text-[#cfff50] hover:underline">
                              {truncAddr(c.contract)}
                            </a>
                          ) : "—"}
                        </td>
                        <td className="py-2 pr-4 text-right font-mono">{c.total}</td>
                        <td className="py-2 pr-4 text-right font-mono text-green-400">{c.success}</td>
                        <td className="py-2 text-right font-mono text-yellow-400">{c.pending}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "collections" && (
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white/70 mb-3">NFT Airdrop Collections ({collections.length})</h3>
          {collections.length === 0 ? (
            <div className="text-white/40 text-sm">No collections found.</div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#0a0a0a]">
                  <tr className="text-left text-white/40 text-xs border-b border-white/5">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Slug</th>
                    <th className="pb-2 pr-4">Contract</th>
                    <th className="pb-2 pr-4">Standard</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4 text-right">Supply</th>
                    <th className="pb-2">Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((c: any, i: number) => (
                    <tr key={c.id || i} className="border-b border-white/5 text-white/70">
                      <td className="py-2 pr-4 font-medium text-xs">{c.name || "—"}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-white/40">{c.slug || "—"}</td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        {c.contract?.address ? (
                          <a href={`${ZO_TOKEN.explorer}/address/${c.contract.address}`} target="_blank" rel="noopener noreferrer" className="text-[#cfff50] hover:underline">
                            {truncAddr(c.contract.address)}
                          </a>
                        ) : "—"}
                      </td>
                      <td className="py-2 pr-4 text-xs">
                        <span className="px-2 py-0.5 bg-white/5 text-white/50 rounded text-[10px] font-mono">
                          {c.contract?.standard || "—"}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          c.status === "active" ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/40"
                        }`}>
                          {c.status || "—"}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right font-mono">{c.total_supply || "—"}</td>
                      <td className="py-2 text-xs text-white/40">
                        {c.scheduled_start ? formatDate(c.scheduled_start) : "—"} → {c.scheduled_end ? formatDate(c.scheduled_end) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "recent" && (
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white/70 mb-3">Recent Mints ({nftAirdrops.length})</h3>
          {nftAirdrops.length === 0 ? (
            <div className="text-white/40 text-sm">No mint data available.</div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#0a0a0a]">
                  <tr className="text-left text-white/40 text-xs border-b border-white/5">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">User</th>
                    <th className="pb-2 pr-4">Wallet</th>
                    <th className="pb-2 pr-4">Collection</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {nftAirdrops.map((a: any, i: number) => {
                    const statusLabel = a.status === 0 ? "Pending"
                      : a.status === 1 ? "Initiated"
                      : a.status === 2 ? "Minted"
                      : a.status === 3 ? "Failed"
                      : String(a.status)
                    const statusColor = statusLabel === "Minted" ? "#52c41a"
                      : statusLabel === "Pending" ? "#faad14"
                      : statusLabel === "Initiated" ? "#1890ff"
                      : "#ff4d4f"
                    const walletAddr = a.web3_wallet?.wallet_address || ""
                    const userName = a.user ? `${a.user.first_name || ""} ${a.user.last_name || ""}`.trim() : ""
                    return (
                      <tr key={a.id || i} className="border-b border-white/5 text-white/70">
                        <td className="py-2 pr-4 text-xs">{a.created_at ? formatDate(a.created_at) : "—"}</td>
                        <td className="py-2 pr-4 text-xs">{userName || "—"}</td>
                        <td className="py-2 pr-4 font-mono text-xs">
                          {walletAddr ? (
                            <a href={`${ZO_TOKEN.explorer}/address/${walletAddr}`} target="_blank" rel="noopener noreferrer" className="text-[#cfff50] hover:underline">
                              {truncAddr(walletAddr)}
                            </a>
                          ) : "—"}
                        </td>
                        <td className="py-2 pr-4 text-xs text-white/40">{a.collection?.name || a.collection?.slug || "—"}</td>
                        <td className="py-2 pr-4">
                          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: statusColor + "20", color: statusColor }}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-2 font-mono text-xs">
                          {a.transaction_hash ? (
                            <a href={`${ZO_TOKEN.explorer}/tx/${a.transaction_hash}`} target="_blank" rel="noopener noreferrer" className="text-[#cfff50] hover:underline">
                              {a.transaction_hash.slice(0, 8)}...
                            </a>
                          ) : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ===========================================================================
// $Zo Sub-tabs (Grants, Distribute, Bulk)
// ===========================================================================

function GrantsTab({ grants, refetchGrants }: { grants: TokenGrant[]; refetchGrants: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", wallet_address: "", allowance: "", start_date: "", end_date: "" })
  const createGrant = useMutationApi("CAS_TOKEN_GRANTS", {
    onSuccess: () => {
      refetchGrants()
      toast.success("Grant created")
      setShowForm(false)
      setForm({ name: "", wallet_address: "", allowance: "", start_date: "", end_date: "" })
    },
    onError: (err: any) => { toast.error(err?.response?.data?.detail || "Failed to create grant") },
  }, "", "POST")

  const handleSubmit = () => {
    if (!form.name || !form.wallet_address || !form.allowance) {
      toast.error("Name, wallet address, and allowance are required")
      return
    }
    createGrant.mutate({ data: { ...form, start_date: form.start_date || null, end_date: form.end_date || null } })
  }

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white/70">Token Grants ({grants.length})</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-[#cfff50] text-black text-xs font-bold rounded-md hover:bg-[#bfef40] transition-colors"
        >
          {showForm ? "Cancel" : "+ Create Grant"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white/[0.03] rounded-lg p-4 mb-4 grid md:grid-cols-2 gap-3">
          <FormInput label="Grant Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Bangalore Q2 2026" />
          <FormInput label="Wallet Address" value={form.wallet_address} onChange={(v) => setForm({ ...form, wallet_address: v })} placeholder="0x..." mono />
          <FormInput label="Allowance (raw)" value={form.allowance} onChange={(v) => setForm({ ...form, allowance: v })} placeholder="e.g. 1000000000000000000000" mono />
          <FormInput label="Start Date" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} type="date" />
          <FormInput label="End Date" value={form.end_date} onChange={(v) => setForm({ ...form, end_date: v })} type="date" />
          <div className="flex items-end">
            <button
              onClick={handleSubmit}
              disabled={createGrant.isLoading}
              className="px-4 py-2 bg-[#cfff50] text-black text-sm font-bold rounded-md hover:bg-[#bfef40] disabled:opacity-50 transition-colors"
            >
              {createGrant.isLoading ? "Creating..." : "Create Grant"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 text-xs border-b border-white/5">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Wallet</th>
              <th className="pb-2 pr-4 text-right">Allowance</th>
              <th className="pb-2 pr-4">Start</th>
              <th className="pb-2">End</th>
            </tr>
          </thead>
          <tbody>
            {grants.map((g) => (
              <tr key={g.id} className="border-b border-white/5 text-white/70">
                <td className="py-2 pr-4 font-medium">{g.name}</td>
                <td className="py-2 pr-4 font-mono text-xs">
                  <a href={`${ZO_TOKEN.explorer}/address/${g.wallet_address}`} target="_blank" rel="noopener noreferrer" className="text-[#cfff50] hover:underline">
                    {truncAddr(g.wallet_address)}
                  </a>
                </td>
                <td className="py-2 pr-4 text-right font-mono">{formatZo(g.allowance)}</td>
                <td className="py-2 pr-4 text-xs">{g.start_date ? formatDate(g.start_date) : "—"}</td>
                <td className="py-2 text-xs">{g.end_date ? formatDate(g.end_date) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DistributeTab({ grants, airdrops, refetchAirdrops }: {
  grants: TokenGrant[]; airdrops: TokenAirdrop[]; refetchAirdrops: () => void
}) {
  const [form, setForm] = useState({ grant: "", wallet_address: "", amount: "", ref_note: "" })
  const createAirdrop = useMutationApi("CAS_TOKEN_AIRDROPS", {
    onSuccess: () => {
      refetchAirdrops()
      toast.success("Airdrop queued — Celery will process in ~10 min")
      setForm({ grant: "", wallet_address: "", amount: "", ref_note: "" })
    },
    onError: (err: any) => { toast.error(err?.response?.data?.detail || "Failed to create airdrop") },
  }, "", "POST")

  const handleSubmit = () => {
    if (!form.grant || !form.wallet_address || !form.amount) {
      toast.error("Grant, wallet address, and amount are required")
      return
    }
    createAirdrop.mutate({ data: form })
  }

  return (
    <div>
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-bold text-white/70 mb-3">Issue Single Airdrop</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-white/40 text-xs block mb-1">Grant</label>
            <select
              value={form.grant}
              onChange={(e) => setForm({ ...form, grant: e.target.value })}
              className="w-full bg-white/[0.05] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-[#cfff50] focus:outline-none"
            >
              <option value="">Select a grant...</option>
              {grants.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({truncAddr(g.wallet_address)})</option>
              ))}
            </select>
          </div>
          <FormInput label="Recipient Wallet" value={form.wallet_address} onChange={(v) => setForm({ ...form, wallet_address: v })} placeholder="0x..." mono />
          <FormInput label="Amount (raw)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} placeholder="Token amount" mono />
          <FormInput label="Note (optional)" value={form.ref_note} onChange={(v) => setForm({ ...form, ref_note: v })} placeholder="e.g. Demo Day reward" />
        </div>
        <button
          onClick={handleSubmit}
          disabled={createAirdrop.isLoading}
          className="mt-3 px-4 py-2 bg-[#cfff50] text-black text-sm font-bold rounded-md hover:bg-[#bfef40] disabled:opacity-50 transition-colors"
        >
          {createAirdrop.isLoading ? "Queuing..." : "Queue Airdrop"}
        </button>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
        <h3 className="text-sm font-bold text-white/70 mb-3">Recent Airdrops</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 text-xs border-b border-white/5">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Recipient</th>
                <th className="pb-2 pr-4 text-right">Amount</th>
                <th className="pb-2 pr-4">Note</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Tx</th>
              </tr>
            </thead>
            <tbody>
              {airdrops.map((a) => {
                const st = AIRDROP_STATUS[a.status] || { label: `${a.status}`, color: "#666" }
                return (
                  <tr key={a.id} className="border-b border-white/5 text-white/70">
                    <td className="py-2 pr-4 text-xs">{a.allocated_at ? formatDate(a.allocated_at) : "—"}</td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      <a href={`${ZO_TOKEN.explorer}/address/${a.wallet_address}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#cfff50]">
                        {truncAddr(a.wallet_address)}
                      </a>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono font-bold">{formatZo(a.amount)} $Zo</td>
                    <td className="py-2 pr-4 text-xs text-white/40 max-w-[200px] truncate">{a.ref_note || "—"}</td>
                    <td className="py-2 pr-4">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: st.color + "20", color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="py-2 font-mono text-xs">
                      {a.status === "success" ? "✓" : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function BulkDistributeTab() {
  const [rows, setRows] = useState<CsvRow[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 })
  const fileRef = useRef<HTMLInputElement>(null)

  const bulkDistribute = useMutationApi("CAS_REWARDS_VIBE_CURATORS", {}, "", "POST")

  const parseCsv = useCallback((text: string) => {
    const lines = text.trim().split("\n")
    if (lines.length < 2) { toast.error("CSV must have a header row + at least one data row"); return }

    const header = lines[0].toLowerCase().split(",").map((h) => h.trim())
    const walletIdx = header.indexOf("wallet_address")
    const mobileIdx = header.indexOf("mobile_number")
    const amountIdx = header.indexOf("amount") !== -1 ? header.indexOf("amount") : header.indexOf("$zo")
    const noteIdx = header.indexOf("note")

    if (amountIdx === -1) { toast.error("CSV must have an 'amount' or '$zo' column"); return }
    if (walletIdx === -1 && mobileIdx === -1) { toast.error("CSV must have 'wallet_address' or 'mobile_number' column"); return }

    const parsed: CsvRow[] = lines.slice(1).filter((l) => l.trim()).map((line) => {
      const cols = line.split(",").map((c) => c.trim())
      const wallet = walletIdx !== -1 ? cols[walletIdx] : undefined
      const mobile = mobileIdx !== -1 ? cols[mobileIdx] : undefined
      const amount = cols[amountIdx] || ""
      const note = noteIdx !== -1 ? cols[noteIdx] || "" : ""

      let valid = true
      let error: string | undefined
      if (wallet && !/^0x[a-fA-F0-9]{40}$/.test(wallet)) { valid = false; error = "Invalid wallet" }
      if (!wallet && !mobile) { valid = false; error = "No wallet or mobile" }
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { valid = false; error = "Invalid amount" }

      return { wallet_address: wallet, mobile_number: mobile, amount, note, valid, error }
    })

    setRows(parsed)
    toast.success(`Parsed ${parsed.length} rows — ${parsed.filter((r) => r.valid).length} valid`)
  }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => parseCsv(ev.target?.result as string)
    reader.readAsText(file)
  }

  const handleExecute = async () => {
    const validRows = rows.filter((r) => r.valid)
    if (validRows.length === 0) { toast.error("No valid rows to process"); return }

    setProcessing(true)
    setProgress({ done: 0, total: validRows.length, errors: 0 })

    let errors = 0
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      try {
        await bulkDistribute.mutateAsync({
          data: {
            mobile_number: row.mobile_number || "",
            "$zo": Number(row.amount),
            credits: 0,
            note: row.note,
          },
        })
      } catch {
        errors++
      }
      setProgress({ done: i + 1, total: validRows.length, errors })
    }

    setProcessing(false)
    if (errors === 0) {
      toast.success(`All ${validRows.length} distributions queued`)
    } else {
      toast.error(`${errors} of ${validRows.length} failed`)
    }
  }

  const validCount = rows.filter((r) => r.valid).length
  const totalAmount = rows.filter((r) => r.valid).reduce((s, r) => s + Number(r.amount), 0)

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
      <h3 className="text-sm font-bold text-white/70 mb-3">Bulk Distribute via CSV</h3>
      <p className="text-white/40 text-xs mb-4">
        CSV columns: <code className="text-[#cfff50]">wallet_address</code> or <code className="text-[#cfff50]">mobile_number</code>, <code className="text-[#cfff50]">amount</code> (or <code className="text-[#cfff50]">$zo</code>), <code className="text-[#cfff50]">note</code> (optional)
      </p>

      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center cursor-pointer hover:border-[#cfff50]/30 transition-colors mb-4"
      >
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        <div className="text-white/40 text-sm">
          {rows.length > 0 ? `${rows.length} rows loaded — click to replace` : "Click to upload CSV or drag & drop"}
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div className="flex items-center gap-4 mb-3 text-xs">
            <span className="text-white/40">{validCount} valid / {rows.length} total</span>
            <span className="text-[#cfff50] font-mono font-bold">{totalAmount.toLocaleString()} $Zo</span>
            {rows.length - validCount > 0 && <span className="text-[#ff4d4f]">{rows.length - validCount} errors</span>}
          </div>

          <div className="overflow-x-auto max-h-[300px] overflow-y-auto mb-4">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0a0a0a]">
                <tr className="text-left text-white/40 text-xs border-b border-white/5">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Wallet / Mobile</th>
                  <th className="pb-2 pr-4 text-right">Amount</th>
                  <th className="pb-2 pr-4">Note</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-b border-white/5 ${r.valid ? "text-white/70" : "text-red-400/70"}`}>
                    <td className="py-1.5 pr-4 text-xs text-white/30">{i + 1}</td>
                    <td className="py-1.5 pr-4 font-mono text-xs">{r.wallet_address ? truncAddr(r.wallet_address) : r.mobile_number || "—"}</td>
                    <td className="py-1.5 pr-4 text-right font-mono">{r.amount}</td>
                    <td className="py-1.5 pr-4 text-xs max-w-[200px] truncate">{r.note || "—"}</td>
                    <td className="py-1.5 text-xs">
                      {r.valid ? <span className="text-green-400">ready</span> : <span className="text-red-400">{r.error}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {processing && (
            <div className="mb-4">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#cfff50] transition-all duration-300" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
              <div className="text-xs text-white/40 mt-1">
                {progress.done} / {progress.total} processed{progress.errors > 0 ? ` — ${progress.errors} errors` : ""}
              </div>
            </div>
          )}

          <button
            onClick={handleExecute}
            disabled={processing || validCount === 0}
            className="px-4 py-2 bg-[#cfff50] text-black text-sm font-bold rounded-md hover:bg-[#bfef40] disabled:opacity-50 transition-colors"
          >
            {processing ? "Processing..." : `Distribute to ${validCount} wallets`}
          </button>
        </>
      )}
    </div>
  )
}

// ===========================================================================
// POA Section
// ===========================================================================

function PoaSection() {
  const { data: poaData, isLoading } = useQueryApi<GeneralObject>(
    "CAS_POAS",
    { refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", "ordering=-created_at"
  )

  const poas: any[] = poaData?.results || poaData || []

  const stats = React.useMemo(() => {
    let totalClaims = 0, activePoas = 0
    for (const p of poas) {
      totalClaims += p.num_holders || 0
      if (p.status === "active") activePoas++
    }
    return { totalClaims, activePoas, total: poas.length }
  }, [poas])

  if (isLoading) return <div className="text-white/40 text-sm py-8">Loading POA data...</div>

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Total POAs" value={String(stats.total)} />
        <KpiCard label="Active" value={String(stats.activePoas)} color="#52c41a" />
        <KpiCard label="Total Claims" value={String(stats.totalClaims)} highlight />
        <KpiCard label="Contract" value="ERC-1155" />
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
        <h3 className="text-sm font-bold text-white/70 mb-3">All POAs ({poas.length})</h3>
        {poas.length === 0 ? (
          <div className="text-white/40 text-sm">No POAs found.</div>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0a0a0a]">
                <tr className="text-left text-white/40 text-xs border-b border-white/5">
                  <th className="pb-2 pr-4">Title</th>
                  <th className="pb-2 pr-4">Category</th>
                  <th className="pb-2 pr-4 text-right">Claims</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Claim Window</th>
                  <th className="pb-2">Token ID</th>
                </tr>
              </thead>
              <tbody>
                {poas.map((p: any, i: number) => (
                  <tr key={p.id || i} className="border-b border-white/5 text-white/70">
                    <td className="py-2 pr-4 font-medium text-xs">{p.title || "—"}</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        p.category === "irl" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {p.category || "—"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono font-bold">{p.num_holders || 0}</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        p.status === "active" ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/40"
                      }`}>
                        {p.status || "—"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-xs text-white/40">
                      {p.claim_start ? formatDate(p.claim_start) : "—"} → {p.claim_end ? formatDate(p.claim_end) : "—"}
                    </td>
                    <td className="py-2 font-mono text-xs">{p.token_ref_id ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// Ledger Tab
// ===========================================================================

function LedgerTab({ entries, isLoading }: { entries: any[]; isLoading: boolean }) {
  if (isLoading) return <div className="text-white/40 text-sm py-8">Loading ledger...</div>

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
      <h3 className="text-sm font-bold text-white/70 mb-3">On-Chain Ledger (recent transfers)</h3>
      {entries.length === 0 ? (
        <div className="text-white/40 text-sm">No ledger entries found.</div>
      ) : (
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0a0a0a]">
              <tr className="text-left text-white/40 text-xs border-b border-white/5">
                <th className="pb-2 pr-4">Block</th>
                <th className="pb-2 pr-4">From</th>
                <th className="pb-2 pr-4">To</th>
                <th className="pb-2 pr-4 text-right">Amount</th>
                <th className="pb-2">Tx Hash</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e: any, i: number) => (
                <tr key={e.id || i} className="border-b border-white/5 text-white/70">
                  <td className="py-2 pr-4 font-mono text-xs">{e.block_number || "—"}</td>
                  <td className="py-2 pr-4 font-mono text-xs">
                    <a href={`${ZO_TOKEN.explorer}/address/${e.from_address}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#cfff50]">
                      {truncAddr(e.from_address || "")}
                    </a>
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs">
                    <a href={`${ZO_TOKEN.explorer}/address/${e.wallet_address}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#cfff50]">
                      {truncAddr(e.wallet_address || "")}
                    </a>
                  </td>
                  <td className="py-2 pr-4 text-right font-mono font-bold">{formatZo(e.amount || 0)} $Zo</td>
                  <td className="py-2 font-mono text-xs">
                    {e.transaction_hash ? (
                      <a href={`${ZO_TOKEN.explorer}/tx/${e.transaction_hash}`} target="_blank" rel="noopener noreferrer" className="text-[#cfff50] hover:underline">
                        {e.transaction_hash.slice(0, 10)}...
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ===========================================================================
// Claims Tab
// ===========================================================================

function ClaimsTab({ airdrops }: { airdrops: TokenAirdrop[] }) {
  // Filter to only profile completion / onboarding claims
  const claims = airdrops.filter((a) => {
    const note = (a.ref_note || "").toLowerCase()
    return note.includes("profilecompletion") || note.includes("profile") || note.includes("onboarding") || note.includes("claim")
  })

  const allAirdrops = claims.length > 0 ? claims : airdrops

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
      <h3 className="text-sm font-bold text-white/70 mb-1">
        {claims.length > 0 ? `Profile Completion Claims (${claims.length})` : `All Airdrop Claims (${airdrops.length})`}
      </h3>
      <p className="text-white/30 text-xs mb-3">
        {claims.length > 0 ? "Filtered to profile completion and onboarding claims" : "Showing all airdrops — no profile claims found in current data"}
      </p>
      {allAirdrops.length === 0 ? (
        <div className="text-white/40 text-sm">No claims found.</div>
      ) : (
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0a0a0a]">
              <tr className="text-left text-white/40 text-xs border-b border-white/5">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Wallet</th>
                <th className="pb-2 pr-4 text-right">Amount</th>
                <th className="pb-2 pr-4">Claim Ref</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Tx</th>
              </tr>
            </thead>
            <tbody>
              {allAirdrops.map((a) => {
                const st = AIRDROP_STATUS[a.status] || { label: `${a.status}`, color: "#666" }
                return (
                  <tr key={a.id} className="border-b border-white/5 text-white/70">
                    <td className="py-2 pr-4 text-xs">{a.allocated_at ? formatDate(a.allocated_at) : "—"}</td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      <a href={`${ZO_TOKEN.explorer}/address/${a.wallet_address}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#cfff50]">
                        {truncAddr(a.wallet_address)}
                      </a>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono font-bold">{formatZo(a.amount)} $Zo</td>
                    <td className="py-2 pr-4 text-xs text-white/40 max-w-[200px] truncate">{a.ref_note || "—"}</td>
                    <td className="py-2 pr-4">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: st.color + "20", color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="py-2 font-mono text-xs">
                      {a.status === "success" ? "✓" : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ===========================================================================
// Shared UI
// ===========================================================================

function FormInput({ label, value, onChange, placeholder, type, mono }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; mono?: boolean
}) {
  return (
    <div>
      <label className="text-white/40 text-xs block mb-1">{label}</label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white/[0.05] border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-[#cfff50] focus:outline-none ${mono ? "font-mono" : ""}`}
      />
    </div>
  )
}

function KpiCard({ label, value, suffix, color, highlight }: {
  label: string; value: string; suffix?: string; color?: string; highlight?: boolean
}) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-3">
      <div className="text-white/40 text-xs mb-1">{label}</div>
      <div className="font-mono text-lg font-bold" style={{ color: color || (highlight ? "#cfff50" : "#fff") }}>
        {value}
        {suffix && <span className="text-white/40 text-sm ml-1">{suffix}</span>}
      </div>
    </div>
  )
}
