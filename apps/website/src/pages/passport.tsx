import React, { useEffect, useState } from "react";
import { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth, useProfile } from "@zo/auth";
import {
  PassportIdentityCard,
  PassportProCard,
  QuestsSection,
  ReferralSection,
  WhyPassportPlus,
} from "../components/passport";
import { SettingsModal } from "../components/passport/SettingsModal";
import ShareModal from "../components/passport/ShareModal";
import { PublicPassportView } from "../components/passport/PublicPassportView";
import { ViewerState } from "../components/passport/PassportPitch";
import { ShareQuestButtons } from "../components/passport/ShareQuestButtons";
import { fixAvatarUrl } from "../hooks/usePublicPassport";
import { useMyXp } from "../hooks/useMyXp";
import { useMyRoles } from "../hooks/useMyRoles";
import { useCaptureReferrer } from "../hooks/useCaptureReferrer";

const PASSPORT_ENDPOINT = "https://api.nsfp.io.zo.xyz/api/v1/passport";

interface PassportOg {
  handle: string;
  title: string;
  description: string;
  image: string | null;
  url: string;
}

async function fetchPassportOg(
  handle: string,
  origin: string,
): Promise<PassportOg | null> {
  const nickname = handle.endsWith(".zo") ? handle : `${handle}.zo`;
  try {
    const res = await fetch(
      `${PASSPORT_ENDPOINT}/${encodeURIComponent(nickname)}/`,
      { headers: { accept: "application/json" } },
    );
    if (!res.ok) return null;
    const raw = (await res.json()) as Record<string, unknown>;
    const full = String(raw.full_name ?? "").trim();
    const rank = String(raw.rank_title ?? "").trim();
    const stats = (raw.stats as Record<string, unknown>) || {};
    const destinations = Number(stats.destinations) || 0;
    const stays = Number(stats.stays) || 0;
    const tribe = Number(stats.tribe) || 0;

    const displayName = full || handle;
    const title = full
      ? `${full} · ${nickname} on Zo World`
      : `${nickname} on Zo World`;

    const bits: string[] = [];
    if (rank) bits.push(rank);
    if (destinations > 0) bits.push(`${destinations} destination${destinations === 1 ? "" : "s"}`);
    if (stays > 0) bits.push(`${stays} stay${stays === 1 ? "" : "s"}`);
    if (tribe > 0) bits.push(`${tribe} fren${tribe === 1 ? "" : "s"}`);
    const description =
      bits.length > 0
        ? `${bits.join(" · ")} · Citizen of Zo World`
        : `${displayName} is a Citizen of Zo World. Unlock your Passport and join the tribe.`;

    // Prefer avatar_image (Zobu composite) once backend exposes it;
    // otherwise fall back to pfp_image. Apply fixAvatarUrl so the og:image
    // resolves against proxy.cdn.zo.xyz (nsfp.cdn.zo.xyz returns 403 and
    // breaks the WhatsApp/Twitter unfurl thumbnail).
    const rawImage =
      (raw.avatar_image as string | undefined) ||
      (raw.avatar_url as string | undefined) ||
      (raw.avatar && typeof raw.avatar === "object"
        ? ((raw.avatar as Record<string, unknown>).image as string | undefined)
        : undefined) ||
      (raw.pfp_image as string | undefined);
    const image = fixAvatarUrl(rawImage ? String(rawImage).trim() : null);
    const url = `${origin}/@${handle}`;
    return { handle, title, description, image, url };
  } catch {
    return null;
  }
}

function parseHandleFromAsPath(asPath: string): string | null {
  const m = asPath.match(/^\/@([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function resolveViewerState(
  isLoggedIn: boolean | null | undefined,
  profile: { custom_nickname?: string | null; nickname?: string | null } | null | undefined,
): ViewerState {
  if (!isLoggedIn) return "logged_out";
  const hasHandle = !!(profile?.custom_nickname || profile?.nickname);
  if (!hasHandle) return "logged_in_no_passport";
  return "free";
}

interface PassportPageProps {
  handleFromUrl: string | null;
  og: PassportOg | null;
}

export async function getServerSideProps(
  context: GetServerSidePropsContext,
): Promise<{ props: PassportPageProps }> {
  const reqUrl = context.req.url || "";
  const handleFromUrl = parseHandleFromAsPath(reqUrl);

  let og: PassportOg | null = null;
  if (handleFromUrl) {
    const host = context.req.headers.host || "zo.xyz";
    const proto =
      (context.req.headers["x-forwarded-proto"] as string) ||
      (host.startsWith("localhost") ? "http" : "https");
    const origin = `${proto}://${host}`;
    og = await fetchPassportOg(handleFromUrl, origin);
  }

  return { props: { handleFromUrl, og } };
}

export default function PassportPage({ handleFromUrl, og }: PassportPageProps) {
  const router = useRouter();
  const { isLoggedIn, showLoginModal } = useAuth();
  const { profile, isLoading } = useProfile();
  const { myXp } = useMyXp();
  const { roles } = useMyRoles();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handle =
    profile?.custom_nickname?.replace(".zo", "") ||
    profile?.nickname ||
    "";

  const urlHandle = parseHandleFromAsPath(router.asPath) || handleFromUrl;
  const isVisitorView = !!urlHandle && urlHandle !== handle;

  useCaptureReferrer(isVisitorView ? urlHandle : null);

  useEffect(() => {
    if (router.asPath === "/passport" && isLoggedIn && handle) {
      router.replace(`/@${handle}`);
    }
  }, [router, isLoggedIn, handle]);

  if (isVisitorView && urlHandle) {
    return (
      <>
        {og && (
          <Head>
            <title>{og.title}</title>
            <meta name="title" content={og.title} />
            <meta name="description" content={og.description} />
            <meta property="og:type" content="profile" />
            <meta property="og:url" content={og.url} />
            <meta property="og:title" content={og.title} />
            <meta property="og:description" content={og.description} />
            {og.image && <meta property="og:image" content={og.image} />}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={og.url} />
            <meta property="twitter:title" content={og.title} />
            <meta property="twitter:description" content={og.description} />
            {og.image && <meta property="twitter:image" content={og.image} />}
          </Head>
        )}
        <PublicPassportView
          handle={urlHandle}
          viewerState={resolveViewerState(isLoggedIn, profile)}
        />
      </>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex-1 min-h-screen bg-[#111] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-4">Zo Passport</h1>
          <p className="text-white/50 mb-6">Log in to view your passport</p>
          <button
            onClick={() => showLoginModal()}
            className="px-8 py-3 bg-white text-black rounded-lg font-bold text-sm"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen bg-[#111] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-[#111]">
      <div className="max-w-[1280px] mx-auto px-4 pt-36 pb-32">
        <div className="flex gap-6">
          {/* Left column — Passport Card (desktop) */}
          <div className="hidden xl:block w-[354px] flex-shrink-0 sticky top-6 self-start">
            <PassportIdentityCard
              profile={profile}
              myXp={myXp}
              roles={roles}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenShare={() => setShareOpen(true)}
            />
          </div>

          {/* Right column */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">
            {/* Mobile passport card */}
            <div className="xl:hidden">
              <PassportIdentityCard
                profile={profile}
                myXp={myXp}
                roles={roles}
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenShare={() => setShareOpen(true)}
              />
            </div>

            <PassportProCard />
            <QuestsSection />
            <ReferralSection handle={handle} />
            {handle && (
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <ShareQuestButtons handle={handle} />
              </div>
            )}
            <WhyPassportPlus />
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        handle={handle}
        avatarUrl={profile?.avatar?.image || profile?.pfp_image}
        displayName={profile?.full_name || profile?.first_name || handle}
      />
    </div>
  );
}
// deploy 1775810158
