import React, { useEffect, useMemo, useState } from "react";
import { fixAvatarUrl } from "../../hooks/usePublicPassport";
import { useMyXp } from "../../hooks/useMyXp";
import {
  buildStoryCanvas,
  isMobileDevice,
  type StoryStats,
} from "../../lib/passport/buildStoryCanvas";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  handle: string;
  avatarUrl?: string | null;
  displayName?: string;
  /** When true, render the streamlined pearl-lobby variant: only Instagram
      Story is shown, X / WhatsApp / Native-share are suppressed, and the
      surface switches to the pearl-glass design language. Used by the
      Creator × Instagram quest CTA where the share target is unambiguous. */
  instagramOnly?: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  handle,
  avatarUrl,
  displayName,
  instagramOnly = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [igStep, setIgStep] = useState<"idle" | "instructions">("idle");

  const cleanHandle = handle.replace(".zo", "");
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://zo.xyz";
  const profileUrl = cleanHandle ? `${origin}/@${cleanHandle}` : origin;
  const shareText = `Check out ${displayName || cleanHandle}'s Zo Passport 🌏`;
  const fixedAvatar = fixAvatarUrl(avatarUrl || undefined) || null;

  // Stats + stamps for the story canvas — pulled from the authenticated
  // user's own XP/leaderboard data (the public passport endpoint still
  // returns zeros for stats/badges on prod, but useMyXp has the real ones).
  const { myXp } = useMyXp();
  // Pull membership off the auth context so founders render correctly.
  const profileMembership =
    typeof window === "undefined"
      ? null
      : (() => {
          try {
            const raw = localStorage.getItem("zo-profile");
            if (raw) {
              const parsed = JSON.parse(raw);
              return parsed?.membership ?? null;
            }
          } catch {
            /* noop */
          }
          return null;
        })();
  const storyStats: StoryStats | undefined = useMemo(() => {
    if (!myXp) return undefined;
    const stampNames = [
      ...(myXp.destinationNames ?? []),
      ...(myXp.tripDestinations ?? []),
    ].slice(0, 5);
    return {
      xpTotal: myXp.xp ?? 0,
      rankTitle: myXp.rankTitle ?? null,
      destinations: myXp.stats?.destinations ?? 0,
      stays: myXp.stats?.nights ?? 0,
      tribe: myXp.stats?.tribe ?? 0,
      reels: myXp.stats?.trips ?? 0,
      stampNames,
      membership: profileMembership,
    };
    // profileMembership is read once at hook-call time; refresh-on-membership-
    // change isn't a real concern since membership tier rarely flips mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myXp]);

  useEffect(() => {
    if (!isOpen) {
      setIgStep("idle");
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (igStep !== "idle") {
          setIgStep("idle");
          return;
        }
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, igStep]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  // Build the share canvas as a Blob for native-share-with-files paths.
  // Returns null if canvas generation fails — caller falls back to text-only.
  const buildShareBlob = async (): Promise<Blob | null> => {
    try {
      const name = displayName || cleanHandle;
      const canvas = await buildStoryCanvas(name, cleanHandle, profileUrl, fixedAvatar, storyStats);
      return await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((blob) => resolve(blob), "image/png"),
      );
    } catch {
      return null;
    }
  };

  // Trigger a browser download of the canvas so the user can attach it
  // manually on platforms that don't accept image-share via intent (X,
  // desktop WhatsApp Web).
  const downloadShareImage = async (filename: string): Promise<boolean> => {
    const blob = await buildShareBlob();
    if (!blob) return false;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  };

  const handleTwitter = async () => {
    // X mobile app drops `text=` when a separate `url=` field is also
    // present — combine into one text param so the post renders pre-filled.
    // Use x.com (the canonical domain post-rebrand; twitter.com still
    // works but x.com is what the app expects).
    const fullText = `${shareText} ${profileUrl}`;

    // On mobile, try native share with the canvas as a file so the user
    // gets the visual passport card alongside the text.
    if (isMobileDevice() && navigator.canShare) {
      const blob = await buildShareBlob();
      if (blob) {
        const file = new File([blob], "zo-passport.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], text: fullText });
            return;
          } catch {
            /* cancelled → fall through to intent URL */
          }
        }
      }
    }

    // Desktop / fallback — download the creative so the user can attach it
    // in the X composer, then open the X intent pre-filled with text+URL.
    void downloadShareImage("zo-passport.png");
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(fullText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleWhatsApp = async () => {
    const fullText = `${shareText} ${profileUrl}`;

    // On mobile, native share lets us attach the passport card as a file
    // alongside the text.
    if (isMobileDevice() && navigator.canShare) {
      const blob = await buildShareBlob();
      if (blob) {
        const file = new File([blob], "zo-passport.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], text: fullText });
            return;
          } catch {
            /* cancelled → fall through to wa.me */
          }
        }
      }
    }

    // Desktop / fallback — download the creative + open the wa.me intent.
    void downloadShareImage("zo-passport.png");
    window.open(
      `https://wa.me/?text=${encodeURIComponent(fullText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: profileUrl });
      } catch {
        /* cancelled */
      }
    }
  };

  const handleInstagramStory = async () => {
    const name = displayName || cleanHandle;
    const canvas = await buildStoryCanvas(name, cleanHandle, profileUrl, fixedAvatar, storyStats);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIgStep("instructions");
        return;
      }

      if (isMobileDevice() && navigator.canShare) {
        const file = new File([blob], "zo-passport-story.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: shareText });
            return;
          } catch {
            /* cancelled → fall through to download */
          }
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zo-passport-story.png";
      a.click();
      URL.revokeObjectURL(url);
      setIgStep("instructions");
    }, "image/png");
  };

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  if (igStep === "instructions") {
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
        onClick={() => setIgStep("idle")}
      >
        <div
          className="relative w-full max-w-sm mx-4 rounded-2xl p-6 flex flex-col gap-5"
          style={{
            background: "linear-gradient(145deg, rgba(40,40,50,0.97) 0%, rgba(20,20,28,0.99) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIgStep("idle")}
            className="absolute top-4 left-4 flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>

          <div className="flex flex-col items-center gap-3 pt-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-base">Add to your Instagram Story</h3>
            <p className="text-white/40 text-sm text-center">Your story card was downloaded. Follow these steps:</p>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { n: "1", label: "Open Instagram and tap  ＋  Story" },
              { n: "2", label: "Choose the downloaded image from your gallery" },
              { n: "3", label: 'Tap the sticker icon  🔗  and pick "Link"' },
              { n: "4", label: "Paste your Zo Passport link" },
            ].map(({ n, label }) => (
              <div
                key={n}
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "linear-gradient(135deg, #dc2743, #bc1888)", color: "white" }}
                >
                  {n}
                </span>
                <span className="text-white/70 text-sm leading-snug">{label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-medium text-sm transition-all"
            style={{
              background: copied ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.07)",
              border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
              color: copied ? "#34d399" : "rgba(255,255,255,0.75)",
            }}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="4" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M5 4V3a1 1 0 011-1h5a1 1 0 011 1v7a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                Copy passport link
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // === Pearl-lobby variant — only used when instagramOnly === true. ========
  // Matches the lobby's pearl-glass design language (ivory bg, ink text,
  // soft pastel sweep). Single CTA: "Share to Instagram Story".
  if (instagramOnly) {
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-sm mx-4 rounded-3xl p-6 flex flex-col gap-5"
          style={{
            background:
              "linear-gradient(180deg, #FFFFFF 0%, #FBF8F4 60%, #F2E0EC 100%)",
            border: "1px solid rgba(255,255,255,0.95)",
            boxShadow: "0 24px 64px rgba(120,100,160,0.28), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 transition-colors"
            style={{ color: "rgba(42,27,61,0.45)" }}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <div>
            <h3 style={{ color: "#2A1B3D", fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
              Share your passport
            </h3>
            <p style={{ color: "#6B5B8E", fontSize: 13, marginTop: 4 }}>
              Post your Zo World story on Instagram
            </p>
          </div>

          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-3"
            style={{
              background: "rgba(255,255,255,0.75)",
              border: "1px solid rgba(255,255,255,0.95)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 12px rgba(120,100,160,0.12)",
            }}
          >
            <span
              style={{
                color: "#2A1B3D",
                fontSize: 12,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profileUrl}
            </span>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 text-xs font-medium px-3 py-1 rounded-lg transition-all"
              style={{
                background: copied ? "rgba(52,211,153,0.18)" : "rgba(42,27,61,0.06)",
                color: copied ? "#0F8B5B" : "#2A1B3D",
                border: `1px solid ${copied ? "rgba(52,211,153,0.4)" : "rgba(42,27,61,0.1)"}`,
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <button
            onClick={handleInstagramStory}
            className="flex items-center gap-3 w-full rounded-2xl px-5 py-4 transition-all active:scale-[0.98] hover:brightness-105"
            style={{
              background:
                "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
              border: "1px solid rgba(255,255,255,0.4)",
              boxShadow:
                "0 10px 28px rgba(220,39,67,0.32), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            <span
              className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </span>
            <div className="flex flex-col items-start text-left">
              <span style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 700 }}>
                Share to Instagram Story
              </span>
              <span style={{ color: "rgba(255,255,255,0.78)", fontSize: 12 }}>
                Generates your story card
              </span>
            </div>
            <svg
              className="ml-auto"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              <path d="M5 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // === Default multi-target ShareModal — used by the rank-pill share. =====
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: "linear-gradient(145deg, rgba(40,40,50,0.95) 0%, rgba(20,20,28,0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div>
          <h3 className="text-white text-lg font-semibold">Share Passport</h3>
          <p className="text-white/40 text-sm mt-0.5">Let others see your Zo journey</p>
        </div>

        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <svg
            className="flex-shrink-0 text-white/30"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
          </svg>
          <span className="text-white/60 text-xs truncate flex-1 font-mono">{profileUrl}</span>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 text-xs font-medium px-3 py-1 rounded-lg transition-all"
            style={{
              background: copied ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.08)",
              color: copied ? "#34d399" : "rgba(255,255,255,0.7)",
              border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleInstagramStory}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-3 transition-all hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, rgba(240,148,51,0.15) 0%, rgba(220,39,67,0.15) 50%, rgba(188,24,136,0.15) 100%)",
              border: "1px solid rgba(220,39,67,0.25)",
            }}
          >
            <span
              className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </span>
            <div className="flex flex-col items-start">
              <span className="text-white text-sm font-medium">Instagram Story</span>
              <span className="text-white/35 text-[11px]">Download story card + share</span>
            </div>
            <svg className="ml-auto text-white/20" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            onClick={handleTwitter}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-3 transition-all hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: "#000" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </span>
            <span className="text-white text-sm font-medium">Share on X</span>
            <svg className="ml-auto text-white/20" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-3 transition-all hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: "#25D366" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </span>
            <span className="text-white text-sm font-medium">Share on WhatsApp</span>
            <svg className="ml-auto text-white/20" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-3 w-full rounded-xl px-4 py-3 transition-all hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
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
              </span>
              <span className="text-white text-sm font-medium">More options</span>
              <svg className="ml-auto text-white/20" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
