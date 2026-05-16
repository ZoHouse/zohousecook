import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { MeshGradient } from "@paper-design/shaders-react";
import { useAuth, useProfile as useMyProfile } from "@zo/auth";
import { usePublicPassport, type PublicPassport } from "../../hooks/usePublicPassport";
import { TopBar } from "../passport-lobby/TopBar";
import { CitizenCard } from "../passport-lobby/CitizenCard";
import { UnlimitedAccessCta } from "../passport-lobby/UnlimitedAccessCta";
import { HologramStatCard } from "../passport-lobby/HologramStatCard";
import { useMyXp } from "../../hooks/useMyXp";
import { PassportPitch, type ViewerState } from "./PassportPitch";
import ShareModal from "./ShareModal";
import pedestal from "../../assets/passport-lobby/scene/pedestal.svg";

interface PublicPassportViewProps {
  handle: string;
  viewerState: ViewerState;
  initialData?: PublicPassport | null;
}

const IRIDESCENT_PEARL_COLORS = [
  "#FBF8F4",
  "#F2E0EC",
  "#E6D9F2",
  "#FFFFFF",
  "#DCEDE8",
  "#F4E8D4",
  "#DBE6F2",
  "#FBF8F4",
];

export function PublicPassportView({ handle, viewerState, initialData }: PublicPassportViewProps) {
  const router = useRouter();
  const { isLoggedIn, showLoginModal } = useAuth();
  const { data, isLoading, isError } = usePublicPassport(handle, initialData);
  const { profile: viewerProfile } = useMyProfile();
  const { myXp: viewerXp } = useMyXp();
  const [shareOpen, setShareOpen] = useState(false);

  // Visitor unlock loop — viewer clicks "Get Unlimited Access" on someone else's
  // public profile, gets routed through login if needed, then lands on
  // /passport which handles onboarding + lobby for their own passport.
  const handleUnlock = () => {
    if (!isLoggedIn) {
      showLoginModal(undefined, "/passport");
      return;
    }
    router.push("/passport");
  };

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen bg-[#FBF8F4] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-black/20 border-t-black rounded-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 min-h-screen bg-[#FBF8F4] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-black text-2xl font-bold mb-2">Passport not found</h1>
          <p className="text-black/50">
            {handle} hasn&apos;t unlocked their passport yet.
          </p>
        </div>
      </div>
    );
  }

  const displayName = handle;
  const avatarUrl = data.avatar_image || undefined;
  // Use non-breaking spaces so "Zo World" never wraps mid-phrase.
  const inviteText = `${data.custom_nickname} has invited you to become a citizen of Zo World.`;
  const isFounder = data.roles.some((r) => r.key === "founder");
  const rankTitle = isFounder ? "Founder" : "Citizen";

  // Public passport endpoint does not yet expose season_level or quest count;
  // surface as "—" so the bento renders, and flag for the backend.
  const stats = [
    {
      label: "",
      value: rankTitle,
      // Royal iridescence — violet/indigo/cyan/magenta
      colors: ["#7C3AED", "#3B82F6", "#22D3EE", "#E879F9", "#7C3AED"],
    },
    {
      label: "Total XP",
      value: data.xp_total.toLocaleString(),
      // Gold iridescence — amber/peach/yellow/orange
      colors: ["#FFD24A", "#F5C542", "#FF9A3C", "#FFE38A", "#FFD24A"],
    },
    {
      label: "Season Level",
      value: "—",
      // Emerald iridescence — mint/green/teal/lime
      colors: ["#34D399", "#10B981", "#22D3EE", "#A7F3D0", "#34D399"],
    },
    {
      label: "Destinations",
      value: data.stats.destinations,
      // Coral iridescence — pink/rose/peach/orange
      colors: ["#FB7185", "#F472B6", "#FB923C", "#FFB4A2", "#FB7185"],
    },
    {
      label: "Quests",
      value: "—",
      // Cyber iridescence — cyan/blue/aqua/teal
      colors: ["#06B6D4", "#3B82F6", "#22D3EE", "#67E8F9", "#06B6D4"],
    },
    {
      label: "Trophies",
      value: data.trophies.length,
      // Sunset iridescence — magenta/red/violet/orange
      colors: ["#F43F5E", "#A855F7", "#FB7185", "#F97316", "#F43F5E"],
    },
  ];

  return (
    <div
      className="min-h-[100svh] md:h-screen md:overflow-hidden text-black relative"
      style={{
        background: "#FBF8F4",
        WebkitTapHighlightColor: "transparent",
        overscrollBehavior: "none",
        touchAction: "manipulation",
      }}
    >
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <MeshGradient
          colors={IRIDESCENT_PEARL_COLORS}
          speed={0.12}
          scale={0.7}
          distortion={0.08}
          swirl={0.1}
          grainMixer={0.04}
          grainOverlay={0.03}
          fit="cover"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0) 0%, rgba(220,225,235,0.15) 75%, rgba(200,210,225,0.25) 100%)",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 30% at 50% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%)",
          zIndex: 0,
        }}
      />

      <div className="relative z-[1] h-full">
        {isLoggedIn && (
          <TopBar
            xp={viewerXp?.xp ?? 0}
            rank={viewerXp?.rank ?? 0}
            avatarUrl={viewerProfile?.pfp_image || viewerProfile?.avatar?.image}
            showNavMenu={false}
          />
        )}

        <div className="h-full flex flex-col md:flex-row md:items-center md:justify-center max-w-[1080px] mx-auto px-4 md:px-8 pt-20 md:pt-0 pb-6 md:pb-0 gap-6 md:gap-12">
          {/* Card + pedestal + CTA */}
          <div className="flex flex-col items-center flex-shrink-0">
            <CitizenCard
              handle={handle}
              displayName={displayName}
              avatarUrl={avatarUrl}
              onClick={() => setShareOpen(true)}
              onShare={() => setShareOpen(true)}
            />
            <div style={{ marginTop: 4 }} aria-hidden>
              <Image
                src={pedestal}
                alt=""
                width={179}
                height={65}
                style={{ width: 220, height: "auto" }}
              />
            </div>
            <div className="mt-4">
              <UnlimitedAccessCta size="sm" label="Unlock Your Passport" onClick={handleUnlock} />
            </div>
          </div>

          {/* Info column */}
          <div className="flex-1 flex flex-col gap-5 items-center md:items-start text-center md:text-left max-w-md md:max-w-[440px] w-full">
            <p className="text-black/70 text-sm md:text-[15px] leading-snug">
              {inviteText}
            </p>

            {/* Bento — 3×2 hologram grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
              {stats.map(({ label, value, colors }, i) => (
                <HologramStatCard key={label || `stat-${i}`} label={label} value={value} colors={colors} />
              ))}
            </div>

            {/* Erum's 4-variant viewer pitch — the inviter funnel that turns
                a passport visitor into a Citizen / Pro / Reel-Quest creator. */}
            <PassportPitch inviterHandle={handle} viewerState={viewerState} />
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        handle={handle}
        avatarUrl={data.avatar_image}
        displayName={displayName}
      />
    </div>
  );
}
