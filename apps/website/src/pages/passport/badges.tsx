import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth, useProfile } from '@zo/auth';
import { BadgesLobby } from '../../components/passport-lobby/BadgesLobby';

/**
 * /@{handle}/badges — surfaced via next.config rewrite to /passport/badges?handle=:handle.
 *
 * Owner-only surface. Visitors deep-linking to a stranger's /badges get
 * redirected to the public passport at /@{handle}. Mirrors the visitor/owner
 * gate from pages/passport.tsx so behavior is consistent across the @handle
 * sub-pages.
 */

const AUTH_USER_STORAGE_KEYS = ['zo-admin-user', 'zo-web-user'] as const;
const OWNER_HINT_STORAGE_KEY = 'zo-passport-owner-hint';

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
  return String(handle || '').replace(/\.zo$/, '').trim();
}

function readCachedAuthUser(): CachedAuthUser | null {
  if (typeof window === 'undefined') return null;
  for (const key of AUTH_USER_STORAGE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const user = JSON.parse(raw) as CachedAuthUser;
      if (user && typeof user === 'object') return user;
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

function readOwnerHint(): string | null {
  if (typeof window === 'undefined') return null;
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

function Skeleton() {
  return (
    <div className="flex-1 min-h-screen bg-[#FBF8F4] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-[#6B5B8E]/30 border-t-[#6B5B8E] rounded-full" />
    </div>
  );
}

export default function BadgesPage() {
  const router = useRouter();
  const { isLoggedIn, showLoginModal } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  const rawQueryHandle = typeof router.query.handle === 'string' ? router.query.handle : undefined;
  const queryHandle = normaliseHandle(rawQueryHandle);
  const profileHandle = normaliseHandle(
    profile?.custom_nickname || profile?.nickname,
  );

  const authResolved = isLoggedIn !== null;
  const profileReady = !profileLoading && !!profile;

  // Synchronous owner-hint read on mount so we can decide owner/visitor before
  // the auth provider finishes resolving. Mirrors passport.tsx behavior.
  const ownerHint = typeof window !== 'undefined' ? readOwnerHint() : null;
  const hintValid = ownerHint !== null && isLoggedIn !== false;

  const isOwnHandle =
    !queryHandle ||
    (hintValid && queryHandle === ownerHint) ||
    (isLoggedIn !== false && profileReady && !!profileHandle && queryHandle === profileHandle);

  // Visitor on /@<other>/badges → redirect to /@<other> (public passport).
  // Only fires once the owner check has resolved to a definite "not me".
  useEffect(() => {
    if (!queryHandle) return;
    if (isOwnHandle) return;
    // Wait until we have enough info to be sure it's not the viewer.
    const definitelyNotOwner =
      isLoggedIn === false ||
      (profileReady && profileHandle && profileHandle !== queryHandle);
    if (!definitelyNotOwner) return;
    router.replace(`/@${queryHandle}`);
  }, [queryHandle, isOwnHandle, isLoggedIn, profileReady, profileHandle, router]);

  // Logged-out user on /badges (own context, no handle in URL after rewrite).
  // The rewrite always supplies a handle param, so this branch is rare — but
  // covers a direct hit on /passport/badges with no auth.
  if (!queryHandle && authResolved && isLoggedIn === false) {
    return (
      <div className="flex-1 min-h-screen bg-[#FBF8F4] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-[#2A1B3D] text-2xl font-bold mb-4">Zo Passport</h1>
          <p className="text-[#6B5B8E] mb-6">Log in to view your badges</p>
          <button
            onClick={() => showLoginModal()}
            className="px-8 py-3 bg-[#2A1B3D] text-white rounded-lg font-bold text-sm"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // Owner view — render the badges lobby once the profile is loaded.
  if (isOwnHandle && profileReady) {
    return (
      <>
        <Head>
          <title>Badges · Zo World</title>
        </Head>
        <BadgesLobby />
      </>
    );
  }

  // Resolving — auth/profile still loading, or visitor redirect in flight.
  return <Skeleton />;
}
