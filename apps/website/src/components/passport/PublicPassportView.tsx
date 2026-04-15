import React, { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@zo/auth";
import { usePublicPassport } from "../../hooks/usePublicPassport";
import { ViewerState } from "./PassportPitch";
import { ShareQuestButtons } from "./ShareQuestButtons";
import ShareModal from "./ShareModal";
import PassportIdentityCard from "./PassportIdentityCard";
import PassportPlusUpsell from "./PassportPlusUpsell";
import BookStaysPlaceholder from "./BookStaysPlaceholder";

interface PublicPassportViewProps {
  handle: string;
  viewerState: ViewerState;
}

type PublicData = NonNullable<ReturnType<typeof usePublicPassport>["data"]>;

function displayNameFor(data: PublicData): string {
  return (
    data.full_name ||
    data.handle.charAt(0).toUpperCase() + data.handle.slice(1)
  );
}

function primaryCtaCopy(state: ViewerState): string {
  switch (state) {
    case "logged_out":
      return "Unlock Your Passport";
    case "logged_in_no_passport":
      return "Complete Your Passport";
    case "free":
    case "pro":
      return "Go to My Passport";
  }
}

function adaptProfile(data: PublicData) {
  return {
    avatar: { image: data.avatar_image || data.pfp_image || "" },
    pfp_image: data.pfp_image,
    custom_nickname: data.custom_nickname,
    nickname: data.handle,
    full_name: data.full_name,
    place_name: data.place_name,
    city: data.place_name,
    country: data.country ? { name: data.country } : undefined,
    cultures: [],
  };
}

function adaptXp(data: PublicData) {
  return {
    xp: data.xp_total,
    xpToNextTier: 0,
    rankTitle: data.rank_title || "Citizen",
    stats: {
      destinations: data.stats.destinations,
      properties: 0,
    },
  };
}

function adaptRoles(data: PublicData) {
  return { displayNames: data.roles.map((r) => r.label) };
}

export function PublicPassportView({ handle, viewerState }: PublicPassportViewProps) {
  const router = useRouter();
  const { showLoginModal } = useAuth();
  const { data, isLoading, isError } = usePublicPassport(handle);
  const [shareOpen, setShareOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen bg-[#111] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 min-h-screen bg-[#111] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-2">Passport not found</h1>
          <p className="text-white/50">
            {handle} hasn&apos;t unlocked their passport yet.
          </p>
        </div>
      </div>
    );
  }

  const displayName = displayNameFor(data);
  const inviterFirstName =
    (data.full_name || "").split(" ")[0] ||
    data.handle.charAt(0).toUpperCase() + data.handle.slice(1);

  const handlePrimary = () => {
    if (viewerState === "logged_out") {
      showLoginModal(undefined, "/passport");
    } else {
      router.push("/passport");
    }
  };

  const passportCard = (
    <div className="flex flex-col gap-5">
      {/* Spacer so the avatar can overflow the top of the card */}
      <div className="pt-14">
        <PassportIdentityCard
          profile={adaptProfile(data)}
          myXp={adaptXp(data)}
          roles={adaptRoles(data)}
          onOpenShare={() => setShareOpen(true)}
        />
      </div>

      {data.state === "unlocked_pro" && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <ShareQuestButtons
            handle={handle}
            displayName={displayName}
            avatarUrl={data.avatar_image || data.pfp_image}
          />
        </div>
      )}

      {data.stamps.length > 0 && (
        <div>
          <h2 className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
            Destination Stamps
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {data.stamps.map((stamp, i) => {
              const s = stamp as { key?: string; label?: string };
              return (
                <div
                  key={s.key || i}
                  className="aspect-square rounded-xl bg-white/5 flex items-center justify-center p-2 text-center"
                >
                  <span className="text-[10px] text-white/80">{s.label || ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.badges.length > 0 && (
        <div>
          <h2 className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Badges</h2>
          <div className="flex flex-wrap gap-2">
            {data.badges.map((badge, i) => {
              const b = badge as { key?: string; label?: string };
              return (
                <span
                  key={b.key || i}
                  className="px-3 py-1 rounded-full bg-white/10 text-white text-xs"
                >
                  {b.label || ""}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {data.trophies.length > 0 && (
        <div>
          <h2 className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
            Season Champions
          </h2>
          <div className="flex gap-2">
            {data.trophies.map((trophy, i) => {
              const t = trophy as { season?: string; medal?: string };
              return (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-white/10 text-white text-xs capitalize"
                >
                  {t.medal || ""} {t.season ? `• ${t.season}` : ""}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {data.tribe_sample.length > 0 && (
        <div>
          <h2 className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
            Tribe ({data.stats.tribe})
          </h2>
          <div className="flex -space-x-2">
            {data.tribe_sample.map((member, i) => {
              const m = member as { handle?: string };
              return (
                <div
                  key={m.handle || i}
                  className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#111]"
                  title={m.handle || ""}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const pitchPanel = (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-white text-3xl xl:text-4xl font-bold leading-tight">
          {inviterFirstName} has shared
          <br />
          their passport with you
        </h1>
        <p className="text-white/60 text-sm mt-3">
          Join Zo World to earn XP, collect stamps, and unlock stays across
          108+ Zostel properties.
        </p>
      </div>

      <button
        onClick={handlePrimary}
        className="w-full sm:w-auto sm:self-start py-4 px-8 rounded-full bg-white text-black font-semibold text-base hover:bg-white/90 transition-colors"
      >
        {primaryCtaCopy(viewerState)}
      </button>

      {data.state === "locked" && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <p className="text-white text-sm font-semibold mb-1">
            {displayName}&apos;s passport is locked
          </p>
          <p className="text-white/50 text-xs">
            They haven&apos;t completed onboarding yet. Drop in later to see
            their stamps, badges, and tribe.
          </p>
        </div>
      )}

      <BookStaysPlaceholder />

      <PassportPlusUpsell
        onBecomeMember={handlePrimary}
        onUnlockAndGo={handlePrimary}
      />
    </div>
  );

  return (
    <div className="flex-1 min-h-screen bg-[#111]">
      <div className="max-w-[1280px] mx-auto px-4 pt-24 xl:pt-32 pb-16">
        <div className="flex flex-col xl:flex-row xl:gap-10 gap-8">
          <div className="w-full xl:w-[380px] xl:flex-shrink-0">
            {passportCard}
          </div>
          <div className="flex-1 min-w-0">{pitchPanel}</div>
        </div>
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        handle={handle}
        avatarUrl={data.avatar_image || data.pfp_image}
        displayName={displayName}
      />
    </div>
  );
}
