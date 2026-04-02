import React, { useMemo, useState } from "react";
import { useProfile } from "@zo/auth";
import { useRouter } from "next/router";
import { ZoSpinner } from "../ui/ZoSpinner";
import { GlassCard } from "./GlassCard";
import { DashboardTokens } from "../../styles/dashboard-tokens";

/** Fix CDN and IPFS URLs for browser display */
function fixAvatarUrl(url?: string): string | undefined {
  if (!url) return undefined;
  // Convert IPFS URLs to HTTP gateway
  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  // static.cdn.zo.xyz blocks direct browser access (referrer policy)
  return url.replace("static.cdn.zo.xyz", "proxy.cdn.zo.xyz");
}

function CircularProgress({
  size = 140,
  progress = 0,
  strokeWidth = 4,
  primaryStroke = "#FFFFFF",
  secondaryStroke = "rgba(255,255,255,0.2)",
}: {
  size?: number;
  progress?: number;
  strokeWidth?: number;
  primaryStroke?: string;
  secondaryStroke?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        stroke={secondaryStroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={primaryStroke}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
      />
    </svg>
  );
}

function FounderBadge() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path
        d="M12.0117 3.15234C13.1449 2.14828 14.8551 2.14828 15.9883 3.15234L16.0996 3.25684L17.7715 4.89453L20.1123 4.91895L20.2646 4.92383C21.7758 5.01516 22.9848 6.22423 23.0762 7.73535L23.0811 7.8877L23.1045 10.2275L24.7432 11.9004L24.8477 12.0117C25.8517 13.1449 25.8517 14.8551 24.8477 15.9883L24.7432 16.0996L23.1045 17.7715L23.0811 20.1123C23.0646 21.6938 21.8262 22.9818 20.2646 23.0762L20.1123 23.0811L17.7715 23.1045L16.0996 24.7432C14.9697 25.8498 13.1826 25.8852 12.0117 24.8477L11.9004 24.7432L10.2275 23.1045L7.8877 23.0811C6.30625 23.0646 5.01821 21.8262 4.92383 20.2646L4.91895 20.1123L4.89453 17.7715L3.25684 16.0996C2.11446 14.9333 2.11446 13.0667 3.25684 11.9004L4.89453 10.2275L4.91895 7.8877L4.92383 7.73535C5.01821 6.17382 6.30624 4.93536 7.8877 4.91895L10.2275 4.89453L11.9004 3.25684L12.0117 3.15234Z"
        fill="#FF2F8E"
        stroke="#111111"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M13.5008 16.1741H15.8997C16.4443 16.1741 16.8858 16.6156 16.8858 17.1602C16.8858 17.7048 16.4443 18.1463 15.8997 18.1463H12.2286C11.4558 18.1463 10.8293 17.5199 10.8293 16.7471C10.8293 16.4219 10.9425 16.1069 11.1495 15.8562L14.0743 12.3137H11.8434C11.2988 12.3137 10.8573 11.8722 10.8573 11.3276C10.8573 10.783 11.2988 10.3415 11.8434 10.3415H15.4226C16.1921 10.3415 16.8158 10.9652 16.8158 11.7347C16.8158 12.0634 16.6996 12.3816 16.4876 12.6329L13.5008 16.1741Z"
        fill="white"
      />
    </svg>
  );
}

function AvatarFallback({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="w-full h-full bg-gradient-to-br from-dash-accent/30 to-dash-accent/10 flex items-center justify-center">
      <span className="text-3xl font-bold text-dash-text">{initial}</span>
    </div>
  );
}

export function PassportCard() {
  const { profile, isLoading } = useProfile();
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  const isFounder = useMemo(() => {
    if (!profile) return false;
    return (
      profile.membership?.toLowerCase() === "founder" ||
      profile.role === "Founder" ||
      (profile.founder_nfts_count ?? 0) > 0
    );
  }, [profile?.membership, profile?.role, profile?.founder_nfts_count]);

  const completion = useMemo(() => {
    if (!profile) return { done: 0, total: 10 };
    const fields = [
      profile.nickname || profile.custom_nickname,
      profile.bio,
      profile.pfp_image || profile.avatar_url,
      profile.body_type,
      profile.culture,
      profile.city,
      profile.primary_wallet,
      profile.email,
      profile.calendar_url,
      profile.main_quest_url,
    ];
    const done = fields.filter(
      (f) => f !== null && f !== undefined && f !== ""
    ).length;
    return { done, total: fields.length };
  }, [
    profile?.nickname, profile?.custom_nickname, profile?.bio,
    profile?.pfp_image, profile?.avatar_url, profile?.body_type,
    profile?.culture, profile?.city, profile?.primary_wallet,
    profile?.email, profile?.calendar_url, profile?.main_quest_url,
  ]);

  const progress = Math.min(
    100,
    Math.max(0, (completion.done / completion.total) * 100)
  );
  const name = profile?.nickname || profile?.custom_nickname || "New Citizen";
  // Avatar: use citizenship avatar (profile.avatar.image)
  const rawAvatar = profile?.avatar?.image || (profile?.pfp_image || undefined);
  // Empty string should be treated as undefined
  const avatar = fixAvatarUrl(rawAvatar && rawAvatar.length > 0 ? rawAvatar : undefined);

  const bgImage = isFounder
    ? DashboardTokens.passport.founderBg
    : DashboardTokens.passport.citizenBg;
  const showAvatar = avatar && !imgError;

  if (isLoading) {
    return (
      <GlassCard className="p-dash-xl flex items-center justify-center min-h-[340px]">
        <ZoSpinner size={32} />
      </GlassCard>
    );
  }

  return (
    <GlassCard
      className="p-4 flex flex-col items-center xl:w-[270px] flex-shrink-0"
      onClick={() => router.push("/passport")}
    >
      {/* Passport card */}
      <div
        className="relative w-[234px] h-[300px] rounded-[20px] overflow-hidden flex-shrink-0"
        style={{
          boxShadow: isFounder
            ? "0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.1)"
            : "0 20px 25px -5px rgba(241,86,63,0.5), 0 8px 10px -6px rgba(241,86,63,0.1)",
        }}
      >
        {/* Background */}
        <img
          src={bgImage}
          alt="Zo Passport"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Circular Progress + Avatar */}
        <div className="absolute inset-0 flex items-center justify-center -mt-2.5">
          <CircularProgress
            size={140}
            progress={progress}
            primaryStroke={isFounder ? "#FFFFFF" : "#111111"}
            secondaryStroke={
              isFounder ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"
            }
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center -mt-2.5">
          <div className="w-[120px] h-[120px] rounded-full overflow-hidden">
            {showAvatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <AvatarFallback name={name} />
            )}
          </div>
          {isFounder && (
            <div className="absolute bottom-[84px] right-[60px]">
              <FounderBadge />
            </div>
          )}
        </div>

        {/* Name + Role */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p
            className={`font-bold truncate text-lg ${isFounder ? "text-white" : "text-[#111111]"}`}
          >
            {name}
          </p>
          <p
            className={`text-[10px] uppercase tracking-wider opacity-70 ${isFounder ? "text-white" : "text-[#111111]"}`}
          >
            {isFounder ? "Founder of Zo World" : "Citizen of Zo World"}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
