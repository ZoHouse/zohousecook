import React, { useEffect, useRef, useState } from "react";
import { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth, useProfile } from "@zo/auth";
import { PassportLobby } from "../components/passport-lobby";
import { PublicPassportView } from "../components/passport/PublicPassportView";
import { NewUserInvitedView } from "../components/passport/NewUserInvitedView";
import { ViewerState } from "../components/passport/PassportPitch";
import {
  normalisePublicPassport,
  type PublicPassport,
} from "../hooks/usePublicPassport";
import { useCaptureReferrer } from "../hooks/useCaptureReferrer";
import { identifyUser, trackActivity } from "../lib/analytics/trackActivity";

const PASSPORT_ENDPOINT = `${
  process.env.API_BASE_URL || "https://api.io.zo.xyz"
}/api/v1/passport`;

interface PassportOg {
  handle: string;
  title: string;
  description: string;
  image: string | null;
  url: string;
}

// Single SSR fetch that yields both the OG metadata and the full public
// passport body. The body is handed to PublicPassportView as initialData so
// the client never has to re-fetch on hydration.
async function fetchPassportForSSR(
  handle: string,
  origin: string,
): Promise<{ og: PassportOg; passport: PublicPassport } | null> {
  const nickname = handle.endsWith(".zo") ? handle : `${handle}.zo`;
  try {
    const res = await fetch(
      `${PASSPORT_ENDPOINT}/${encodeURIComponent(nickname)}/`,
      { headers: { accept: "application/json" } },
    );
    if (!res.ok) return null;
    const raw = (await res.json()) as Record<string, unknown>;
    const passport = normalisePublicPassport(raw, handle);

    const full = String(raw.full_name ?? "").trim();
    const rank = String(raw.rank_title ?? "").trim();
    const { destinations, stays, tribe } = passport.stats;

    const displayName = full || handle;
    const title = full
      ? `${full} · ${nickname} on Zo World`
      : `${nickname} on Zo World`;

    const bits: string[] = [];
    if (rank) bits.push(rank);
    if (destinations > 0)
      bits.push(`${destinations} destination${destinations === 1 ? "" : "s"}`);
    if (stays > 0) bits.push(`${stays} stay${stays === 1 ? "" : "s"}`);
    if (tribe > 0) bits.push(`${tribe} fren${tribe === 1 ? "" : "s"}`);
    const description =
      bits.length > 0
        ? `${bits.join(" · ")} · Citizen of Zo World`
        : `${displayName} is a Citizen of Zo World. Unlock your Passport and join the tribe.`;

    const image = passport.avatar_image || passport.pfp_image;
    const url = `${origin}/@${handle}`;
    return {
      og: { handle, title, description, image, url },
      passport,
    };
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

const OWNER_HINT_STORAGE_KEY = "zo-passport-owner-hint";
const AUTH_USER_STORAGE_KEYS = ["zo-admin-user", "zo-web-user"] as const;

type CachedAuthUser = {
  id?: string | null;
  mobile_number?: string | null;
  email_address?: string | null;
  custom_nickname?: string | null;
  nickname?: string | null;
};

type OwnerHintRecord = {
  handle?: string | null;
  authUserId?: string | null;
  mobileNumber?: string | null;
  emailAddress?: string | null;
};

function normaliseHandle(handle?: string | null): string {
  return String(handle || "")
    .replace(/\.zo$/, "")
    .trim();
}

function readCachedAuthUser(): CachedAuthUser | null {
  if (typeof window === "undefined") return null;
  for (const key of AUTH_USER_STORAGE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const user = JSON.parse(raw) as CachedAuthUser;
      if (user && typeof user === "object") return user;
    } catch {
      /* ignore malformed payload */
    }
  }
  return null;
}

function ownerHintMatchesAuthUser(
  record: OwnerHintRecord,
  authUser: CachedAuthUser,
): boolean {
  const comparisons: Array<[string | null | undefined, string | null | undefined]> = [
    [record.authUserId, authUser.id],
    [record.mobileNumber, authUser.mobile_number],
    [record.emailAddress, authUser.email_address],
  ];

  let hasOverlap = false;
  for (const [expected, actual] of comparisons) {
    if (!expected || !actual) continue;
    hasOverlap = true;
    if (expected !== actual) return false;
  }

  return hasOverlap;
}

function writeOwnerHint(handle: string) {
  if (typeof window === "undefined") return;
  const authUser = readCachedAuthUser();
  const normalisedHandle = normaliseHandle(handle);
  if (!authUser || !normalisedHandle) return;

  const record: OwnerHintRecord = {
    handle: normalisedHandle,
    authUserId: authUser.id || null,
    mobileNumber: authUser.mobile_number || null,
    emailAddress: authUser.email_address || null,
  };

  window.localStorage.setItem(OWNER_HINT_STORAGE_KEY, JSON.stringify(record));
}

function clearOwnerHint() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(OWNER_HINT_STORAGE_KEY);
}

// Reads the cached auth user synchronously from localStorage. If we've already
// resolved the viewer's real passport handle once, prefer the dedicated hint
// for that same auth user; otherwise fall back to the raw auth payload.
function readOwnerHint(): string | null {
  const authUser = readCachedAuthUser();
  if (!authUser) return null;

  try {
    const raw = window.localStorage.getItem(OWNER_HINT_STORAGE_KEY);
    if (raw) {
      const record = JSON.parse(raw) as OwnerHintRecord;
      const hint = normaliseHandle(record.handle);
      if (hint && ownerHintMatchesAuthUser(record, authUser)) return hint;
    }
  } catch {
    /* ignore malformed payload */
  }

  return normaliseHandle(authUser.custom_nickname || authUser.nickname) || null;
}

interface PassportPageProps {
  handleFromUrl: string | null;
  og: PassportOg | null;
  publicPassport: PublicPassport | null;
}

export async function getServerSideProps(
  context: GetServerSidePropsContext,
): Promise<{ props: PassportPageProps }> {
  const reqUrl = context.req.url || "";
  const handleFromUrl = parseHandleFromAsPath(reqUrl);

  let og: PassportOg | null = null;
  let publicPassport: PublicPassport | null = null;
  if (handleFromUrl) {
    const host = context.req.headers.host || "zo.xyz";
    const proto =
      (context.req.headers["x-forwarded-proto"] as string) ||
      (host.startsWith("localhost") ? "http" : "https");
    const origin = `${proto}://${host}`;
    const result = await fetchPassportForSSR(handleFromUrl, origin);
    if (result) {
      og = result.og;
      publicPassport = result.passport;
    }
  }

  return { props: { handleFromUrl, og, publicPassport } };
}

/**
 * State machine:
 *   - Visitor view   : urlHandle present AND confirmed not-my-handle → public card (SSR-seeded).
 *   - Owner view     : urlHandle matches viewer (via localStorage hint OR loaded profile) → Lobby.
 *   - Login screen   : /passport + auth resolved + not logged in + no hint.
 *   - Skeleton       : everything else (auth still resolving, profile loading before Lobby mounts).
 *
 * Key trick: the localStorage "owner hint" is read after hydration and lets us
 * decide Visitor vs Owner ~2s before AuthProvider finishes resolving isLoggedIn,
 * so the only render the user actually sees is the right one. No LoginScreen
 * flash on /passport, no PublicPassportView flash on /@own-handle.
 */
export default function PassportPage({
  handleFromUrl,
  og,
  publicPassport,
}: PassportPageProps) {
  const router = useRouter();
  const { isLoggedIn, showLoginModal } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  // Client-only — null during SSR and first client render (hydration-safe),
  // fills in on mount. Re-reads on isLoggedIn change so a logout clears it.
  const [ownerHint, setOwnerHint] = useState<string | null>(null);
  useEffect(() => {
    setOwnerHint(readOwnerHint());
  }, [isLoggedIn]);

  const urlHandle = parseHandleFromAsPath(router.asPath) || handleFromUrl;
  const isPassportRoute =
    router.asPath === "/passport" || router.asPath.startsWith("/passport?");

  const profileHandle = normaliseHandle(
    profile?.custom_nickname || profile?.nickname,
  );

  const authResolved = isLoggedIn !== null;
  const profileReady = !profileLoading && !!profile;
  // Treat the hint as invalid if the user is explicitly logged out; otherwise
  // stale localStorage would redirect a logged-out viewer to a stranger's page.
  const hintValid = ownerHint !== null && isLoggedIn !== false;

  const isOwnHandle =
    (hintValid && !!urlHandle && urlHandle === ownerHint) ||
    (isLoggedIn !== false &&
      profileReady &&
      !!profileHandle &&
      urlHandle === profileHandle);

  useEffect(() => {
    if (isLoggedIn === false) {
      clearOwnerHint();
      setOwnerHint(null);
      return;
    }

    if (!profileHandle) return;
    writeOwnerHint(profileHandle);
    setOwnerHint((current) => (current === profileHandle ? current : profileHandle));
  }, [isLoggedIn, profileHandle]);

  // Default visitor view for any /@handle unless we've confirmed the viewer is
  // the owner. This keeps SSR output crawlable (most traffic is visitors) and
  // the rare owner case swaps to Lobby in a single post-hydration render.
  const isVisitorView = !!urlHandle && !isOwnHandle;

  // /passport → /@handle as soon as we know a handle — don't wait for the
  // AuthProvider's delayed isLoggedIn resolution or the profile fetch.
  useEffect(() => {
    if (!isPassportRoute) return;
    if (isLoggedIn === false) return; // explicitly logged out — keep them here
    const target = profileHandle || (hintValid ? ownerHint : null);
    if (target) {
      const queryStart = router.asPath.indexOf("?");
      const queryString = queryStart >= 0 ? router.asPath.slice(queryStart) : "";
      router.replace(`/@${target}${queryString}`);
    }
  }, [isPassportRoute, isLoggedIn, profileHandle, ownerHint, hintValid, router]);

  useCaptureReferrer(isVisitorView ? urlHandle : null);

  useEffect(() => {
    if (isLoggedIn && profile?.id) {
      void identifyUser(String(profile.id), {
        handle: profile.custom_nickname || profile.nickname || null,
      });
    }
  }, [isLoggedIn, profile?.id, profile?.custom_nickname, profile?.nickname]);

  // Fire passport_view exactly once per viewed handle — deduped via ref so the
  // visitor→owner swap on refresh doesn't double-count.
  const trackedHandleRef = useRef<string | null>(null);
  const viewedHandle = isVisitorView ? urlHandle : profileHandle || ownerHint || null;
  useEffect(() => {
    if (!viewedHandle) return;
    if (trackedHandleRef.current === viewedHandle) return;
    trackedHandleRef.current = viewedHandle;
    void trackActivity("passport_view", {
      handle: viewedHandle,
      is_own_passport: !isVisitorView,
      is_logged_in: !!isLoggedIn,
      referrer:
        typeof document !== "undefined" ? document.referrer || null : null,
    });
  }, [viewedHandle, isVisitorView, isLoggedIn]);

  // --- Render decisions, top to bottom by priority ---

  // Visitor view. Paints from SSR on first render; client seeds the hook with
  // the same body so there's no duplicate fetch.
  if (isVisitorView && urlHandle) {
    // Only show NewUserInvitedView when we're SURE — either the backend has
    // no record at this URL, or the viewer is confirmed to have no passport.
    // Previously this fired during profile loading (handle === '' pre-fetch),
    // flashing the invited view on every refresh.
    const viewerIsNewUser =
      isLoggedIn === true && profileReady && !profileHandle;
    const inviterMissing = og === null && publicPassport === null;
    const showNewUserInvited = viewerIsNewUser || inviterMissing;

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
        {/* data-passport-ssr="public" lets the pre-paint script in
            _document.tsx hide this subtree when the viewer is the
            handle's owner, so the SSR Public paint never flashes
            before React swaps in the Owner lobby. */}
        <div data-passport-ssr="public">
          {showNewUserInvited ? (
            <NewUserInvitedView />
          ) : (
            <PublicPassportView
              handle={urlHandle}
              viewerState={resolveViewerState(isLoggedIn, profile)}
              initialData={
                publicPassport && publicPassport.handle === urlHandle
                  ? publicPassport
                  : null
              }
            />
          )}
        </div>
      </>
    );
  }

  // Owner view. We'll render the Lobby once the profile is loaded — PassportLobby
  // returns null without a profile, so we show the skeleton in the meantime.
  if (isOwnHandle) {
    if (profileReady) return <PassportLobby />;
    return <Skeleton />;
  }

  // Explicit logged-out state with no handle in the URL → Login screen.
  if (isPassportRoute && authResolved && isLoggedIn === false && !hintValid) {
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

  // Resolving — auth not yet known, or the /passport → /@handle redirect is in
  // flight. Stable skeleton — never flashes Login, Visitor, or NewUserInvited.
  return <Skeleton />;
}

function Skeleton() {
  return (
    <div className="flex-1 min-h-screen bg-[#111] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
    </div>
  );
}
// deploy 1775810158
