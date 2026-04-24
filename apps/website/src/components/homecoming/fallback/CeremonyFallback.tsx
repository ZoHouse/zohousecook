// apps/website/src/components/homecoming/fallback/CeremonyFallback.tsx
import { useRouter } from 'next/router'
import { useState } from 'react'
import type { CeremonyData } from '../types'
import { getProofCopy } from '../copy/getProofCopy'
import { completeHomecoming } from '../../../lib/homecoming/endpoints'
import { buildHandleHome } from '../constants'

const POSTER_URL =
  'https://cdn.zo.xyz/homecoming/posters/idle-mars-2880x1800.jpg'

export function CeremonyFallback({
  data,
  replay,
}: {
  data: CeremonyData
  replay: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const destination = buildHandleHome(data.user.handle)

  const onClick = async () => {
    if (busy) return
    setBusy(true)
    if (!replay) {
      try {
        await completeHomecoming()
      } catch {
        /* non-fatal */
      }
    }
    router.push(destination)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `#1c1008 url(${POSTER_URL}) center/cover no-repeat`,
        color: '#ffd9a8',
        padding: '48px 24px',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          background: 'rgba(28,16,8,0.82)',
          padding: 32,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            letterSpacing: 4,
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          Welcome back, {data.user.displayName}
        </h1>
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
          {data.proofs.map((p) => (
            <li
              key={p.id}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid #8a6a5a',
                fontSize: 16,
              }}
            >
              {getProofCopy(p)}
            </li>
          ))}
        </ul>
        <button
          onClick={onClick}
          disabled={busy}
          style={{
            padding: '14px 28px',
            background: '#ffd9a8',
            color: '#1c1008',
            border: 'none',
            fontFamily: 'monospace',
            fontSize: 14,
            letterSpacing: 3,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Become a citizen
        </button>
        <p style={{ marginTop: 20, fontSize: 12, opacity: 0.7 }}>
          Your ceremony is ready when your device is.
        </p>
      </div>
    </div>
  )
}
