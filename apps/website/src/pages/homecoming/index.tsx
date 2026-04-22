import React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { zoServer, zoPassportServer } from "../../../../../libs/auth/src/utils";
import type { HomecomingPayload } from "../../components/homecoming/types";
import { HomecomingStage } from "../../components/homecoming/HomecomingStage";

interface Props {
  payload: HomecomingPayload;
  handle: string;
  firstName: string | null;
  avatarImage: string;
  replay: boolean;
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  // Local / dev preview override — renders the ceremony against a fixture
  // without touching the backend. Bypasses auth, identity gate, one-time flag,
  // and the completion write. `?state=zero` swaps to the zero-history track.
  //
  //   /homecoming?preview=1              → legendary reveal
  //   /homecoming?preview=1&state=zero   → day-1 zero-state
  //
  // Only active when NODE_ENV !== "production" so it can never leak to prod.
  if (ctx.query.preview === "1" && process.env.NODE_ENV !== "production") {
    const { LEGENDARY_FIXTURE, ZERO_STATE_FIXTURE } = await import(
      "../../lib/homecoming/fixtures"
    );
    const payload =
      ctx.query.state === "zero" ? ZERO_STATE_FIXTURE : LEGENDARY_FIXTURE;
    return {
      props: {
        payload,
        handle: payload.handle,
        firstName: payload.first_name,
        avatarImage: payload.avatar_image,
        replay: true, // suppresses the complete() write so preview is safe to repeat
      },
    };
  }

  // Kill-switch
  if (
    process.env.NEXT_PUBLIC_HOMECOMING_ENABLED === "false" &&
    ctx.query.replay !== "1"
  ) {
    return { redirect: { destination: "/passport", permanent: false } };
  }

  // Forward cookie-based auth
  const cookie = ctx.req.headers.cookie ?? "";
  const authConfig = { headers: { cookie } };

  // Fetch profile.me — on the prod backend, not the passport backend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let profile: any = null;
  try {
    const res = await zoServer.get("/api/v1/profile/me/", authConfig);
    profile = res.data;
  } catch {
    return {
      redirect: {
        destination: "/zo-auth?next=/homecoming",
        permanent: false,
      },
    };
  }

  if (!profile) {
    return {
      redirect: {
        destination: "/zo-auth?next=/homecoming",
        permanent: false,
      },
    };
  }

  // Identity gate: handle + avatar must be set
  if (!profile.handle || !profile.avatar_image) {
    return {
      redirect: {
        destination: "/onboarding?next=/homecoming",
        permanent: false,
      },
    };
  }

  // One-time gate (unless replay)
  const replay = ctx.query.replay === "1";
  if (profile.homecoming_completed_at && !replay) {
    return { redirect: { destination: "/passport", permanent: false } };
  }

  // Payload fetch via the passport backend
  let payload: HomecomingPayload;
  try {
    const res = await zoPassportServer.post<HomecomingPayload>(
      "/api/v1/passport/homecoming/",
      {},
      authConfig,
    );
    payload = res.data;
  } catch {
    // Fail-safe: send user to lobby. Overlay handles the "we couldn't read…"
    // message only in the client-triggered failure path; SSR failure is silent.
    return { redirect: { destination: "/passport", permanent: false } };
  }

  return {
    props: {
      payload,
      handle: profile.handle,
      firstName: profile.first_name ?? null,
      avatarImage: profile.avatar_image,
      replay,
    },
  };
};

export default function HomecomingPage({ payload, replay }: Props) {
  return (
    <>
      <Head>
        <title>Homecoming · Zo World</title>
        <meta name="robots" content="noindex" />
      </Head>
      <HomecomingStage payload={payload} replay={replay} />
    </>
  );
}
