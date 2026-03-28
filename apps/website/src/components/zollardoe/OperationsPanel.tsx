import React, { useMemo, useState, useCallback, useRef } from "react"
import { useQueryApi, useMutationApi } from "@zo/auth"
import { GeneralObject } from "@zo/definitions/general"
import { toast } from "sonner"
import { AIRDROP_STATUS, ZO_TOKEN } from "./constants"

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
  status: number
  wallet_address: string
  amount: string
  allocated_at: string
  ref_note: string | null
  grant: TokenGrant | string
  transaction: { hash: string } | null
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Tab = "grants" | "distribute" | "bulk"

export default function OperationsPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("grants")

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

  const grants: TokenGrant[] = grantsData?.results || grantsData || []
  const airdrops: TokenAirdrop[] = airdropsData?.results || airdropsData || []
  const isLoading = lg || la

  const stats = useMemo(() => {
    const byStatus: Record<number, number> = {}
    let totalDistributed = 0
    for (const a of airdrops) {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1
      if (a.status === 2) totalDistributed += Number(a.amount)
    }
    return { byStatus, totalDistributed }
  }, [airdrops])

  if (!isLoading && grants.length === 0 && airdrops.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Operations</h2>
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 text-white/40 text-sm">
          No data — login as CAS admin to access distribution operations.
        </div>
      </section>
    )
  }

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4">Operations</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <KpiCard label="Grants" value={String(grants.length)} />
        <KpiCard label="Total Distributed" value={formatZo(stats.totalDistributed)} suffix="$Zo" highlight />
        <KpiCard label="Success" value={String(stats.byStatus[2] || 0)} color="#52c41a" />
        <KpiCard label="Pending" value={String(stats.byStatus[0] || 0)} color="#faad14" />
        <KpiCard label="Failed" value={String(stats.byStatus[3] || 0)} color="#ff4d4f" />
      </div>

      <div className="flex gap-1 mb-4 bg-white/[0.03] rounded-lg p-1 w-fit">
        {(["grants", "distribute", "bulk"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-[#cfff50] text-black"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab === "grants" ? "Grants" : tab === "distribute" ? "Distribute" : "Bulk Distribute"}
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
        </>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Grants Tab
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Distribute Tab
// ---------------------------------------------------------------------------

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
                      {a.status === 2 && a.transaction?.hash ? (
                        <a href={`${ZO_TOKEN.explorer}/tx/${a.transaction.hash}`} target="_blank" rel="noopener noreferrer" className="text-[#cfff50] hover:underline">
                          {a.transaction.hash.slice(0, 8)}...
                        </a>
                      ) : "—"}
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

// ---------------------------------------------------------------------------
// Bulk Distribute Tab
// ---------------------------------------------------------------------------

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
          {rows.length > 0
            ? `${rows.length} rows loaded — click to replace`
            : "Click to upload CSV or drag & drop"}
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div className="flex items-center gap-4 mb-3 text-xs">
            <span className="text-white/40">{validCount} valid / {rows.length} total</span>
            <span className="text-[#cfff50] font-mono font-bold">{totalAmount.toLocaleString()} $Zo</span>
            {rows.length - validCount > 0 && (
              <span className="text-[#ff4d4f]">{rows.length - validCount} errors</span>
            )}
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
                      {r.valid
                        ? <span className="text-green-400">ready</span>
                        : <span className="text-red-400">{r.error}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {processing && (
            <div className="mb-4">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#cfff50] transition-all duration-300"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
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

// ---------------------------------------------------------------------------
// Shared UI
// ---------------------------------------------------------------------------

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
