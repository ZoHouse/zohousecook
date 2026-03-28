import React from "react"
import { CONTRACTS } from "./constants"

export default function ContractsGrid() {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4">Contracts</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {CONTRACTS.map((c) => (
          <div key={c.address} className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white">{c.name}</h3>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-white/5 text-white/50 text-xs font-mono rounded">
                  {c.chain}
                </span>
                <span className="px-2 py-0.5 bg-white/5 text-white/50 text-xs font-mono rounded">
                  {c.standard}
                </span>
              </div>
            </div>

            <a
              href={`${c.explorer}/address/${c.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-[#cfff50] hover:underline block mb-3"
            >
              {c.address}
            </a>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {c.functions.map((fn) => (
                <span key={fn} className="px-2 py-0.5 bg-[#cfff50]/10 text-[#cfff50] text-xs font-mono rounded">
                  {fn}()
                </span>
              ))}
            </div>

            <p className="text-white/40 text-xs">{c.notes}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
