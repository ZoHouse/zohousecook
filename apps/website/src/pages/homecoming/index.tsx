// apps/website/src/pages/homecoming/index.tsx
import React from 'react'
import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { zoServer, zoPassportServer } from '../../../../../libs/auth/src/utils'
import type { CeremonyData } from '../../components/homecoming/types'
import { CeremonyDataSchema } from '../../components/homecoming/types'
import {
  DEMO_CEREMONY,
  ZERO_STATE_CEREMONY,
} from '../../components/homecoming/data/demo'
import { adaptHomecomingPayload } from '../../components/homecoming/data/adapt'
import {
  REDIRECT_AUTH,
  REDIRECT_ONBOARDING,
  HOMECOMING_ENDPOINT,
  buildHandleHome,
} from '../../components/homecoming/constants'

// The Ceremony component uses window.matchMedia, <Canvas>, and @react-three/*;
// SSR would hydration-mismatch. Pages-Router fix: next/dynamic with ssr:false.
const Ceremony = dynamic(
  () =>
    import('../../components/homecoming/Ceremony').then((m) => m.Ceremony),
  { ssr: false },
)

type Props = { data: CeremonyData; replay: boolean }

export default function HomecomingPage({ data, replay }: Props) {
  return (
    <>
      <Head>
        <title>Homecoming · Zo World</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Ceremony data={data} replay={replay} />
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  // 1. Preview override — non-prod only, bypasses auth + identity + one-time.
  //    /homecoming?preview=1              → demo (populated) ceremony
  //    /homecoming?preview=1&state=zero   → zero-state ceremony
  if (ctx.query.preview === '1' && process.env.NODE_ENV !== 'production') {
    const data =
      ctx.query.state === 'zero' ? ZERO_STATE_CEREMONY : DEMO_CEREMONY
    CeremonyDataSchema.parse(data)
    return { props: { data, replay: true } }
  }

  // 2. Kill-switch (unless ?replay=1).
  if (
    process.env.NEXT_PUBLIC_HOMECOMING_ENABLED === 'false' &&
    ctx.query.replay !== '1'
  ) {
    return { redirect: { destination: '/passport', permanent: false } }
  }

  // 3. Cookie-forwarded auth.
  const cookie = ctx.req.headers.cookie ?? ''
  const authConfig = { headers: { cookie } }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let profile: any = null
  try {
    const res = await zoServer.get('/api/v1/profile/me/', authConfig)
    profile = res.data
  } catch {
    return { redirect: { destination: REDIRECT_AUTH, permanent: false } }
  }
  if (!profile) {
    return { redirect: { destination: REDIRECT_AUTH, permanent: false } }
  }

  // 4. Identity gate — handle + avatar must be set.
  if (!profile.handle || !profile.avatar_image) {
    return {
      redirect: { destination: REDIRECT_ONBOARDING, permanent: false },
    }
  }

  // 5. One-time gate (unless replay).
  const replay = ctx.query.replay === '1'
  if (profile.homecoming_completed_at && !replay) {
    return {
      redirect: {
        destination: buildHandleHome(profile.handle),
        permanent: false,
      },
    }
  }

  // 6. Payload fetch (matches existing code: direct zoPassportServer call
  //    with cookie, not the client helper — server needs the cookie).
  let payload
  try {
    const res = await zoPassportServer.post(
      HOMECOMING_ENDPOINT,
      {},
      authConfig,
    )
    payload = res.data
  } catch {
    // Fail-safe: send the user to their passport (matches old behavior, but
    // keyed to handle instead of /passport).
    return {
      redirect: {
        destination: buildHandleHome(profile.handle),
        permanent: false,
      },
    }
  }

  // 7. Adapt backend payload → CeremonyData and validate.
  //    If the backend shape drifts (missing field, partial rollout), fail
  //    safe to the user's passport page rather than throwing a 500.
  let data: CeremonyData
  try {
    data = adaptHomecomingPayload(payload, profile)
    CeremonyDataSchema.parse(data)
  } catch {
    return { redirect: { destination: buildHandleHome(profile.handle), permanent: false } }
  }

  return { props: { data, replay } }
}
