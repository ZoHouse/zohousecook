import React from "react"
import { ZO_TOKEN } from "./constants"

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

export default function HeroSection() {
  return (
    <div className="border border-white/10 rounded-xl p-6 mb-8 bg-white/[0.02]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            <span className="text-[#cfff50]">$Zo</span> Distribution Ops
          </h1>
          <p className="text-white/50 text-sm">
            Create grants, distribute tokens, reference docs — all in one place
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 bg-[#0052FF]/20 text-[#0052FF] text-xs font-mono rounded">
            {ZO_TOKEN.chain}
          </span>
          <span className="px-2 py-1 bg-white/5 text-white/60 text-xs font-mono rounded">
            ERC-20
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="text-white/40 text-xs">Contract:</span>
        <a
          href={`${ZO_TOKEN.explorer}/token/${ZO_TOKEN.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-[#cfff50] hover:underline"
        >
          {ZO_TOKEN.address}
        </a>
        <CopyButton text={ZO_TOKEN.address} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatCard label="Total Supply" value={ZO_TOKEN.totalSupply} suffix="$Zo" />
        <StatCard label="Decimals" value="18" />
        <StatCard label="Chain ID" value={String(ZO_TOKEN.chainId)} />
        <StatCard label="Holders" value="578K+" highlight />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string
  value: string
  suffix?: string
  highlight?: boolean
}) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-3">
      <div className="text-white/40 text-xs mb-1">{label}</div>
      <div className={`font-mono text-lg font-bold ${highlight ? "text-[#cfff50]" : "text-white"}`}>
        {value}
        {suffix && <span className="text-white/40 text-sm ml-1">{suffix}</span>}
      </div>
    </div>
  )
}
