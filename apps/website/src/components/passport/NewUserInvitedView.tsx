import React, { useState } from "react";
import { useAuth } from "@zo/auth";
import passportInWalletImg from "../../assets/passport/passport-in-wallet.png";
import { fixAvatarUrl } from "../../hooks/usePublicPassport";

interface NewUserInvitedViewProps {
  inviterHandle: string;
  inviterDisplayName?: string | null;
  inviterAvatarUrl?: string | null;
  inviterRoleLabel?: string | null;
  viewerHandle?: string | null;
  viewerAvatarUrl?: string | null;
  viewerDisplayName?: string | null;
  viewerRoleLabel?: string | null;
  chainInviterHandle?: string | null;
  chainInviterAvatarUrl?: string | null;
}

function RoleChip({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium"
      style={{
        background: "rgba(84, 184, 53, 0.15)",
        border: "1px solid rgba(84, 184, 53, 0.35)",
        color: "#54B835",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#54B835]" />
      {label}
    </span>
  );
}

export function NewUserInvitedView({
  inviterHandle,
  inviterDisplayName,
  inviterAvatarUrl,
  inviterRoleLabel,
  viewerHandle,
  viewerAvatarUrl,
  viewerDisplayName,
  viewerRoleLabel,
  chainInviterHandle,
  chainInviterAvatarUrl,
}: NewUserInvitedViewProps) {
  const { showLoginModal } = useAuth();
  const [copied, setCopied] = useState(false);

  const displayName = inviterDisplayName || inviterHandle;
  const viewerLink =
    viewerHandle && typeof window !== "undefined"
      ? `${window.location.host}/@${viewerHandle.replace(".zo", "")}`
      : `zo.xyz/@${(viewerHandle || "you").replace(".zo", "")}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${viewerLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const handleConnectIG = () => {
    // Reuse the existing login-gated flow; IG connect happens on /passport
    // once the viewer has a handle. This button also doubles as "finish
    // onboarding" for logged-out visitors.
    showLoginModal(undefined, "/passport");
  };

  const inviterAvatar = fixAvatarUrl(inviterAvatarUrl || undefined);
  const viewerAvatar = fixAvatarUrl(viewerAvatarUrl || undefined);
  const chainAvatar = fixAvatarUrl(chainInviterAvatarUrl || undefined);

  return (
    <div className="flex-1 min-h-screen bg-[#0a0a0f]">
      <div className="max-w-[1440px] mx-auto px-6 pt-8 pb-16">
        <div className="mx-auto" style={{ maxWidth: 392 }}>
          {/* Reduced top profile card — the passport being viewed */}
          <div
            className="rounded-2xl p-5 flex flex-col items-center gap-3 mb-6"
            style={{
              background:
                "linear-gradient(145deg, rgba(35,35,45,0.7) 0%, rgba(20,20,28,0.9) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            {inviterAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={inviterAvatar}
                alt={displayName}
                className="w-14 h-14 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <h2 className="text-white text-[22px] font-bold">{displayName}</h2>
            </div>
            {inviterRoleLabel && <RoleChip label={inviterRoleLabel} />}
          </div>

          {/* Viewer's own unique link */}
          <div className="flex flex-col items-center gap-1 mb-4">
            <p className="text-white/40 text-[12px]">My unique link</p>
            <button
              onClick={handleCopyLink}
              className="text-white text-[16px] font-medium hover:text-white/80 transition-colors"
            >
              {copied ? "Copied!" : viewerLink}
            </button>
          </div>

          {/* Passport-in-wallet hero illustration */}
          <div className="relative mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={passportInWalletImg.src}
              alt="Your Zo Passport, waiting to be unlocked"
              className="w-full h-auto"
              style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))" }}
            />
          </div>

          {/* Creator Journey CTA */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-4 mb-8"
            style={{
              background:
                "linear-gradient(145deg, rgba(35,35,45,0.8) 0%, rgba(20,20,28,0.95) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(84,184,53,0.2)", border: "1px solid rgba(84,184,53,0.4)" }}
              >
                <span className="text-[#54B835] text-xs font-bold">C</span>
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(120,60,220,0.2)", border: "1px solid rgba(120,60,220,0.4)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a56ef0" strokeWidth="2.5">
                  <path d="M12 2l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-white text-[18px] font-semibold leading-tight">
                Start your Creator Journey
                <br />
                and Earn on Views
              </h3>
            </div>
            <button
              onClick={handleConnectIG}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-[14px] transition-all hover:brightness-110"
              style={{
                background:
                  "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
                boxShadow: "0 8px 24px rgba(168, 85, 247, 0.35)",
              }}
            >
              Connect Professional account
            </button>
          </div>

          {/* Chain inviter footer — who invited the CURRENT viewer */}
          {chainInviterHandle && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-white/40 text-[12px]">Invited by</p>
              <div className="flex items-center gap-2">
                {chainAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={chainAvatar}
                    alt={chainInviterHandle}
                    className="w-10 h-10 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {chainInviterHandle.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-white text-[14px] font-medium">
                  {chainInviterHandle.endsWith(".zo")
                    ? chainInviterHandle
                    : `${chainInviterHandle}.zo`}
                </span>
              </div>
            </div>
          )}

          {/* Fallback: if no chain inviter, still offer a subtle sign-up prompt */}
          {!chainInviterHandle && (
            <div className="text-center mt-2">
              <button
                onClick={() => showLoginModal(undefined, "/passport")}
                className="text-white/50 hover:text-white text-[12px] transition-colors"
              >
                Already a citizen? Log in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewUserInvitedView;
