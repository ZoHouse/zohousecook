import React from "react";
import GlowCard from "./GlowCard";
import CitizenSeal from "./CitizenSeal";
import XpProgressBar from "./XpProgressBar";
import RoleBadge from "./RoleBadge";
import CultureTag from "./CultureTag";
import { syneClassName } from "../utils/font";

interface PassportIdentityCardProps {
  profile: any;
  myXp: any;
  roles: any;
  currentLocation?: string | null;
  onOpenSettings?: () => void;
  onOpenShare?: () => void;
}

function fixAvatarUrl(url?: string): string | undefined {
  if (!url || url.length === 0) return undefined;
  if (url.startsWith("ipfs://"))
    return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  return url
    .replace("static.cdn.zo.xyz", "proxy.cdn.zo.xyz")
    .replace("nsfp.cdn.zo.xyz", "proxy.cdn.zo.xyz");
}

function formatDob(dob?: string): string | undefined {
  if (!dob) return undefined;
  try {
    const date = new Date(dob);
    if (isNaN(date.getTime())) return undefined;
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    return `${day} ${month}`;
  } catch {
    return undefined;
  }
}

function formatGender(gender?: string): string | undefined {
  if (!gender) return undefined;
  if (gender.length === 1) return gender.toUpperCase();
  return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
}

function hasRole(roles: any, roleName: string): boolean {
  if (!roles?.displayNames || !Array.isArray(roles.displayNames)) return false;
  return roles.displayNames.some(
    (r: string) => r.toLowerCase() === roleName.toLowerCase()
  );
}

const PassportIdentityCard: React.FC<PassportIdentityCardProps> = ({
  profile,
  myXp,
  roles,
  currentLocation,
  onOpenSettings,
  onOpenShare,
}) => {
  const rawAvatarUrl = profile?.avatar?.image || profile?.pfp_image;
  const avatarUrl = fixAvatarUrl(rawAvatarUrl);
  const displayName =
    profile?.custom_nickname || profile?.nickname || "Citizen";
  const initial = displayName.charAt(0).toUpperCase();

  const dob = formatDob(profile?.date_of_birth);
  const gender = formatGender(profile?.gender);
  const homeCity = profile?.place_name || profile?.city;
  const nationality = profile?.country?.name;

  const cultures: Array<{ name: string; icon?: string; key?: string }> =
    profile?.cultures || [];

  const destinations = myXp?.stats?.destinations || 0;
  const properties = myXp?.stats?.properties || 0;

  const showCreator = hasRole(roles, "Creator");
  const showTribeBuilder = hasRole(roles, "TribeBuilder");
  const hasRoles = showCreator || showTribeBuilder;

  const infoRows: Array<{ label: string; value: string }> = [];
  if (dob) infoRows.push({ label: "DOB", value: dob });
  if (gender) infoRows.push({ label: "GENDER", value: gender });
  if (homeCity) infoRows.push({ label: "HOMETOWN", value: homeCity });
  if (currentLocation) infoRows.push({ label: "CURRENT", value: currentLocation });
  if (nationality) infoRows.push({ label: "NATIONALITY", value: nationality });

  return (
    /* Outer wrapper — share button is a sibling of GlowCard so no stacking context issues */
    <div style={{ position: "relative", width: "100%" }}>

      {/* Share button — floated top-right, outside GlowCard */}
      {onOpenShare && (
        <button
          onClick={onOpenShare}
          aria-label="Share passport"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 50,
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.13)",
            border: "1px solid rgba(255,255,255,0.20)",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
      )}

      <GlowCard variant="lobby" className="w-full pt-0 pb-6 px-6" style={{ overflow: "visible" }}>
        <div className="flex flex-col gap-4">
          {/* Avatar + CitizenSeal */}
          <div className="relative">
            {/* Avatar — extends above the card top edge */}
            <div className="flex-shrink-0 -mt-14 ml-1">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="rounded-2xl object-cover"
                  style={{ width: 180, height: 180 }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="rounded-2xl flex items-center justify-center"
                  style={{
                    width: 180,
                    height: 180,
                    background: "linear-gradient(135deg, #3F8174, #1E574B)",
                  }}
                >
                  <span className="text-white text-5xl font-bold">{initial}</span>
                </div>
              )}
            </div>
            {/* Citizen Seal — top right of card */}
            <div
              className="absolute top-2 right-0"
              style={{ transform: "rotate(5deg)" }}
            >
              <CitizenSeal size={110} />
            </div>
          </div>

          {/* Handle */}
          <h2 className={`${syneClassName} text-white text-[24px]`}>
            {displayName}
          </h2>

          {/* XP Section */}
          <XpProgressBar
            xp={myXp?.xp || 0}
            xpToNextTier={myXp?.xpToNextTier || 0}
            rankTitle={myXp?.rankTitle || "Newcomer"}
            loading={!myXp}
          />

          {/* Role Badges */}
          {hasRoles && (
            <div className="flex flex-row gap-2">
              {showCreator && <RoleBadge type="creator" />}
              {showTribeBuilder && <RoleBadge type="tribebuilder" />}
            </div>
          )}

          {/* Personal Info */}
          {infoRows.length > 0 && (
            <div className="flex flex-col gap-1">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-center">
                  <span
                    className="text-white/55 text-[10px] uppercase font-bold"
                    style={{ width: 72 }}
                  >
                    {row.label}
                  </span>
                  <span className="text-white text-[12px]">{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Cultures */}
          {cultures.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-white/55 text-[10px] uppercase font-bold">
                CULTURES
              </span>
              <div className="flex flex-wrap gap-2">
                {cultures.map((culture, i) => (
                  <CultureTag
                    key={culture.key || culture.name || i}
                    name={culture.name}
                    icon={culture.icon}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Travel Stats */}
          <div className="flex flex-col gap-2">
            <span className="text-white/55 text-[10px] uppercase font-bold">
              TRAVEL STATS
            </span>
            <div className="flex gap-2">
              <div
                className="flex-1 rounded-2xl p-2 border border-white/15"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
                }}
              >
                <span className="text-white text-[20px] font-medium block">
                  {destinations}
                </span>
                <span className="text-white/55 text-[10px]">
                  Destinations Explored
                </span>
              </div>
              <div
                className="flex-1 rounded-2xl p-2 border border-white/15"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
                }}
              >
                <span className="text-white text-[20px] font-medium block">
                  {properties}
                </span>
                <span className="text-white/55 text-[10px]">
                  Zostels Unlocked
                </span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-col gap-2">
            <span className="text-white/55 text-[10px] uppercase font-bold">
              BADGES
            </span>
          </div>

          {/* Settings Button — owner only */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl py-3 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.5 1.5L6.9 3.1C6.3 3.3 5.8 3.6 5.3 4L3.8 3.3L2.3 5.9L3.6 6.9C3.5 7.3 3.5 7.7 3.6 8.1L2.3 9.1L3.8 11.7L5.3 11C5.8 11.4 6.3 11.7 6.9 11.9L6.5 13.5H9.5L9.1 11.9C9.7 11.7 10.2 11.4 10.7 11L12.2 11.7L13.7 9.1L12.4 8.1C12.5 7.7 12.5 7.3 12.4 6.9L13.7 5.9L12.2 3.3L10.7 4C10.2 3.6 9.7 3.3 9.1 3.1L9.5 1.5H6.5ZM8 5.5C9.4 5.5 10.5 6.6 10.5 8C10.5 9.4 9.4 10.5 8 10.5C6.6 10.5 5.5 9.4 5.5 8C5.5 6.6 6.6 5.5 8 5.5Z"
                  fill="white"
                />
              </svg>
              <span className="text-white text-[14px] font-medium">Settings</span>
            </button>
          )}
        </div>
      </GlowCard>
    </div>
  );
};

export default PassportIdentityCard;
