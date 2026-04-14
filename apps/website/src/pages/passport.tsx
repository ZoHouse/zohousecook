import React, { useEffect, useState } from "react";
import { GetServerSidePropsContext } from "next";
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
import { PublicPassportView } from "../components/passport/PublicPassportView";
import { ViewerState } from "../components/passport/PassportPitch";
import { useMyXp } from "../hooks/useMyXp";
import { useMyRoles } from "../hooks/useMyRoles";
import { useCaptureReferrer } from "../hooks/useCaptureReferrer";

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
}

export async function getServerSideProps(
  context: GetServerSidePropsContext,
): Promise<{ props: PassportPageProps }> {
  const reqUrl = context.req.url || "";
  const handleFromUrl = parseHandleFromAsPath(reqUrl);
  return { props: { handleFromUrl } };
}

export default function PassportPage({ handleFromUrl }: PassportPageProps) {
  const router = useRouter();
  const { isLoggedIn, showLoginModal } = useAuth();
  const { profile, isLoading } = useProfile();
  const { myXp } = useMyXp();
  const { roles } = useMyRoles();
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      <PublicPassportView
        handle={urlHandle}
        viewerState={resolveViewerState(isLoggedIn, profile)}
      />
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
              />
            </div>

            <PassportProCard />
            <QuestsSection />
            <ReferralSection handle={handle} />
            <WhyPassportPlus />
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
// deploy 1775810158
