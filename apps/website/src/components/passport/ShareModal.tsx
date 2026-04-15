import React, { useEffect, useState } from "react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  handle: string;
  avatarUrl?: string;
  displayName?: string;
}

/** True on iOS / Android — where navigator.share({ files }) opens the native share sheet including Instagram */
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Generates a 1080×1920 story card and returns the canvas element */
function buildStoryCanvas(displayName: string, handle: string, profileUrl: string): HTMLCanvasElement {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // --- background ---
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0d0d16");
  bg.addColorStop(0.6, "#12082a");
  bg.addColorStop(1, "#0a0a12");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle radial glow centre
  const glow = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, 600);
  glow.addColorStop(0, "rgba(120,60,220,0.18)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // --- top label ---
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "8px";
  ctx.fillText("ZO WORLD", W / 2, 220);

  // divider
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 120, 260);
  ctx.lineTo(W / 2 + 120, 260);
  ctx.stroke();

  // --- "Zo Passport" ---
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "bold 110px system-ui, sans-serif";
  ctx.letterSpacing = "0px";
  ctx.fillText("Zo Passport", W / 2, H * 0.46);

  // --- display name ---
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 88px system-ui, sans-serif";
  ctx.fillText(displayName || handle, W / 2, H * 0.46 + 140);

  // --- handle ---
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "52px system-ui, sans-serif";
  ctx.fillText(handle.endsWith(".zo") ? handle : `${handle}.zo`, W / 2, H * 0.46 + 230);

  // --- bottom area ---
  // pill bg
  const pillY = H - 280;
  const pillW = 760, pillH = 90, pillX = (W - pillW) / 2, pillR = 45;
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "38px monospace";
  ctx.fillText(profileUrl, W / 2, pillY + 58);

  // CTA
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "40px system-ui, sans-serif";
  ctx.fillText("Follow my journey →", W / 2, H - 140);

  return canvas;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  handle,
  displayName,
}) => {
  const [copied, setCopied] = useState(false);
  const [igStep, setIgStep] = useState<"idle" | "instructions">("idle");

  const profileUrl = handle
    ? `https://zo.xyz/@${handle.replace(".zo", "")}`
    : "https://zo.xyz";

  const shareText = `Check out ${displayName || handle}'s Zo Passport 🌏`;

  // Reset sub-state when modal closes
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
        if (igStep !== "idle") { setIgStep("idle"); return; }
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
    } catch { /* noop */ }
  };

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`,
      "_blank", "noopener,noreferrer"
    );
  };

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText} ${profileUrl}`)}`,
      "_blank", "noopener,noreferrer"
    );
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: shareText, url: profileUrl }); } catch { /* cancelled */ }
    }
  };

  /**
   * Instagram Story flow:
   *
   * Mobile (iOS/Android):
   *   navigator.share({ files }) → native OS share sheet → user taps Instagram → image
   *   lands directly in Stories creation screen. No download, no instructions needed.
   *
   * Desktop / everything else:
   *   Download the PNG immediately and show the 4-step instructions panel.
   *   navigator.canShare returns true on macOS too, so we must NOT use it on desktop —
   *   it just opens the macOS share sheet which has no direct Instagram integration.
   */
  const handleInstagramStory = async () => {
    const name = displayName || handle;
    const canvas = buildStoryCanvas(name, handle, profileUrl);

    canvas.toBlob(async (blob) => {
      if (!blob) { setIgStep("instructions"); return; }

      if (isMobileDevice() && navigator.canShare) {
        // Mobile path — file share opens the native share sheet with Instagram
        const file = new File([blob], "zo-passport-story.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: shareText });
            return; // success — user picked Instagram (or another app)
          } catch {
            // user cancelled — fall through to download
          }
        }
      }

      // Desktop path (or mobile fallback) — download + show instructions
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

  // ── Instagram instructions panel ──────────────────────────────────────────
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
          {/* back */}
          <button
            onClick={() => setIgStep("idle")}
            className="absolute top-4 left-4 flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>

          {/* IG gradient icon */}
          <div className="flex flex-col items-center gap-3 pt-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </div>
            <h3 className="text-white font-semibold text-base">Add to your Instagram Story</h3>
            <p className="text-white/40 text-sm text-center">Your story card was downloaded. Follow these steps:</p>
          </div>

          {/* Steps */}
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

          {/* Copy link */}
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
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="4" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 4V3a1 1 0 011-1h5a1 1 0 011 1v7a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                Copy passport link
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Main share modal ──────────────────────────────────────────────────────
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
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Title */}
        <div>
          <h3 className="text-white text-lg font-semibold">Share Passport</h3>
          <p className="text-white/40 text-sm mt-0.5">Let others see your Zo journey</p>
        </div>

        {/* Profile URL pill */}
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <svg className="flex-shrink-0 text-white/30" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
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

        {/* Share options */}
        <div className="flex flex-col gap-2">

          {/* Instagram Story */}
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
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </span>
            <div className="flex flex-col items-start">
              <span className="text-white text-sm font-medium">Instagram Story</span>
              <span className="text-white/35 text-[11px]">Download story card + share</span>
            </div>
            <svg className="ml-auto text-white/20" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Twitter / X */}
          <button
            onClick={handleTwitter}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-3 transition-all hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: "#000" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </span>
            <span className="text-white text-sm font-medium">Share on X</span>
            <svg className="ml-auto text-white/20" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-3 transition-all hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: "#25D366" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </span>
            <span className="text-white text-sm font-medium">Share on WhatsApp</span>
            <svg className="ml-auto text-white/20" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Native share (mobile only) */}
          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-3 w-full rounded-xl px-4 py-3 transition-all hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </span>
              <span className="text-white text-sm font-medium">More options</span>
              <svg className="ml-auto text-white/20" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
