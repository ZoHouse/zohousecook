import React, { useState } from "react"
import { FLOWS, API_ENDPOINTS, KEY_FILES, SCHEDULED_TASKS } from "./constants"

function Section({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen || false)
  return (
    <div className="border border-white/10 rounded-xl mb-3 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="font-bold text-white text-sm">{title}</span>
        <span className="text-white/40 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 pb-4 border-t border-white/5">{children}</div>}
    </div>
  )
}

export default function ReferenceSections() {
  return (
    <>
      {/* Flows */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Distribution Flows</h2>
        {Object.values(FLOWS).map((flow) => (
          <Section key={flow.title} title={flow.title}>
            <pre className="text-sm text-white/70 whitespace-pre-wrap font-mono leading-relaxed mt-3">
              {flow.content}
            </pre>
          </Section>
        ))}
      </section>

      {/* API Reference */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">API Reference</h2>
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 text-xs border-b border-white/5">
                <th className="pb-2 pr-4">Method</th>
                <th className="pb-2 pr-4">Endpoint</th>
                <th className="pb-2 pr-4">Auth</th>
                <th className="pb-2">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {API_ENDPOINTS.map((ep) => (
                <tr key={ep.path} className="border-b border-white/5 text-white/70">
                  <td className="py-2 pr-4">
                    <span className={`text-xs font-mono font-bold ${ep.method === "POST" ? "text-[#cfff50]" : "text-[#1890ff]"}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs">{ep.path}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      ep.auth === "Public" ? "bg-green-500/20 text-green-400" :
                      ep.auth === "CAS Admin" ? "bg-red-500/20 text-red-400" :
                      "bg-blue-500/20 text-blue-400"
                    }`}>
                      {ep.auth}
                    </span>
                  </td>
                  <td className="py-2 text-white/50 text-xs">{ep.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Scheduled Tasks */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Scheduled Tasks (Celery Beat)</h2>
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 text-xs border-b border-white/5">
                <th className="pb-2 pr-4">Task</th>
                <th className="pb-2 pr-4">Frequency</th>
                <th className="pb-2">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {SCHEDULED_TASKS.map((t) => (
                <tr key={t.task} className="border-b border-white/5 text-white/70">
                  <td className="py-2 pr-4 font-mono text-xs text-[#cfff50]">{t.task}</td>
                  <td className="py-2 pr-4 text-xs">{t.freq}</td>
                  <td className="py-2 text-white/50 text-xs">{t.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Key Files */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Key Files (thezoworld/zo-backend)</h2>
        {Object.entries(KEY_FILES).map(([group, files]) => (
          <Section key={group} title={group}>
            <ul className="mt-3 space-y-1.5">
              {files.map((f) => {
                const [path, desc] = f.split(" — ")
                return (
                  <li key={f} className="text-sm">
                    <span className="font-mono text-[#cfff50] text-xs">{path}</span>
                    {desc && <span className="text-white/40 text-xs ml-2">— {desc}</span>}
                  </li>
                )
              })}
            </ul>
          </Section>
        ))}
      </section>
    </>
  )
}
