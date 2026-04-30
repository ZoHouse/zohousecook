import React from "react";
import { useAuth } from "@zo/auth";
import passportInWalletImg from "../../assets/passport/passport-in-wallet.png";
import { fixAvatarUrl } from "../../hooks/usePublicPassport";

interface NewUserInvitedViewProps {
  chainInviterHandle?: string | null;
  chainInviterAvatarUrl?: string | null;
}

export function NewUserInvitedView({
  chainInviterHandle,
  chainInviterAvatarUrl,
}: NewUserInvitedViewProps) {
  const { showLoginModal } = useAuth();

  const handleUnlock = () => {
    showLoginModal(undefined, "/passport");
  };

  const handleGetPro = () => {
    showLoginModal(undefined, "/pro");
  };

  const chainAvatar = fixAvatarUrl(chainInviterAvatarUrl || undefined);

  return (
    <div className="flex-1 min-h-screen bg-[#0a0a0f]">
      <div className="max-w-[1440px] mx-auto px-6 pt-8 pb-16">
        <div className="mx-auto" style={{ maxWidth: 392 }}>
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

          {/* CTA card */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-4 mb-8"
            style={{
              background:
                "linear-gradient(145deg, rgba(35,35,45,0.8) 0%, rgba(20,20,28,0.95) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div className="text-center">
              <h3 className="text-white text-[20px] font-semibold leading-tight mb-1.5">
                Your Zo Passport awaits.
              </h3>
              <p className="text-white/60 text-[13px] leading-snug">
                Every citizen gets one. Pro unlocks the full kit.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUnlock}
                className="flex-1 py-3.5 rounded-xl font-semibold text-white text-[14px] transition-all hover:brightness-110"
                style={{
                  background:
                    "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
                  boxShadow: "0 8px 24px rgba(168, 85, 247, 0.35)",
                }}
              >
                Unlock your passport
              </button>
              <button
                onClick={handleGetPro}
                className="flex-1 py-3.5 rounded-xl font-semibold text-[14px] transition-all"
                style={{
                  background: "rgba(212, 175, 55, 0.08)",
                  border: "1px solid rgba(212, 175, 55, 0.45)",
                  color: "#d4af37",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(212, 175, 55, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(212, 175, 55, 0.08)";
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = "rgba(212, 175, 55, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = "rgba(212, 175, 55, 0.08)";
                }}
              >
                Get Pro Passport
              </button>
            </div>
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

          {/* Fallback: if no chain inviter, still offer a subtle sign-in prompt */}
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
