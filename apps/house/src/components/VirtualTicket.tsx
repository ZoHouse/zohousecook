import React, { useRef, useCallback, useEffect, useState } from "react";
import { toPng } from "html-to-image";

interface VirtualTicketProps {
  name: string;
  handle: string;
  title: string;
  imageUrl?: string;
  ticketNo?: string;
  hideActions?: boolean;
  socials?: string;
}

const GOLDEN_GRADIENT =
  "linear-gradient(135deg, #F8E287 0%, #D4AF37 25%, #AA771C 50%, #D4AF37 75%, #F8E287 100%)";

export const CIVILIZATION_TITLES = [
  "THE ARCHITECT",
  "THE ENFORCER",
  "THE PHANTOM",
  "THE RINGLEADER",
  "THE CONDUCTOR",
  "THE SHADOW",
  "THE IRON FIST",
  "THE STRATEGIST",
  "THE KINGPIN",
  "THE PUPPET MASTER",
  "THE MASTERMIND",
  "THE GHOST",
  "THE RENEGADE",
  "THE CHRONICLER",
  "THE ALCHEMIST",
  "THE SENTINEL",
  "THE OPERATOR",
  "THE WARDEN",
  "THE ORACLE",
  "THE APPARITION",
  "THE INFILTRATOR",
  "THE BROKER",
  "THE CATALYST",
  "THE CUSTODIAN",
] as const;

export function parseHandleFromSocials(socials: string, fallbackName = ""): string {
  return resolveAvatarSources(socials, fallbackName).displayHandle;
}

export interface AvatarResolution {
  displayHandle: string;
  sources: string[];
}

export function resolveAvatarSources(
  socials: string,
  fallbackName = ""
): AvatarResolution {
  const trimmed = socials.trim();
  const fallbackHandle = (fallbackName.split(/\s+/)[0] || "zo").toLowerCase();
  const sources: string[] = [];
  let displayHandle = fallbackHandle;

  const pushDicebear = () => {
    const seed = encodeURIComponent(displayHandle || fallbackHandle);
    sources.push(
      `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=D4AF37&textColor=000000`
    );
  };

  if (!trimmed) {
    pushDicebear();
    return { displayHandle, sources };
  }

  const xMatch = trimmed.match(/(?:^|\/\/|\s)(?:x\.com|twitter\.com)\/(@?[A-Za-z0-9_]+)/i);
  const liMatch = trimmed.match(/linkedin\.com\/in\/([A-Za-z0-9-_]+)/i);
  const ghMatch = trimmed.match(/github\.com\/([A-Za-z0-9-_]+)/i);
  const igMatch = trimmed.match(/instagram\.com\/([A-Za-z0-9-_.]+)/i);
  const ytMatch = trimmed.match(/youtube\.com\/(?:@|c\/|user\/)?([A-Za-z0-9-_.]+)/i);
  const emailMatch = trimmed.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

  if (xMatch) {
    displayHandle = xMatch[1].replace(/^@/, "");
    sources.push(`https://unavatar.io/x/${displayHandle}`);
    sources.push(`https://unavatar.io/twitter/${displayHandle}`);
  } else if (ghMatch) {
    displayHandle = ghMatch[1];
    sources.push(`https://unavatar.io/github/${displayHandle}`);
  } else if (igMatch) {
    displayHandle = igMatch[1];
    sources.push(`https://unavatar.io/instagram/${displayHandle}`);
  } else if (ytMatch) {
    displayHandle = ytMatch[1];
    sources.push(`https://unavatar.io/youtube/${displayHandle}`);
  } else if (liMatch) {
    displayHandle = liMatch[1];
    const url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    sources.push(`https://unavatar.io/${encodeURIComponent(url)}`);
  } else if (emailMatch) {
    displayHandle = trimmed.split("@")[0];
    sources.push(`https://unavatar.io/${encodeURIComponent(trimmed)}`);
  } else if (/^https?:\/\//i.test(trimmed) || /^[^\s]+\.[a-z]{2,}/i.test(trimmed)) {
    const url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      displayHandle = host.split(".")[0];
    } catch {
      /* keep fallback */
    }
    sources.push(`https://unavatar.io/${encodeURIComponent(url)}`);
  } else if (/^@?[A-Za-z0-9_]+$/.test(trimmed)) {
    displayHandle = trimmed.replace(/^@/, "");
    sources.push(`https://unavatar.io/x/${displayHandle}`);
    sources.push(`https://unavatar.io/twitter/${displayHandle}`);
    sources.push(`https://unavatar.io/github/${displayHandle}`);
  } else {
    sources.push(`https://unavatar.io/${encodeURIComponent(trimmed)}`);
  }

  pushDicebear();
  return { displayHandle: displayHandle.toLowerCase(), sources };
}

export function pickTitle(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return CIVILIZATION_TITLES[hash % CIVILIZATION_TITLES.length];
}

export const VirtualTicket: React.FC<VirtualTicketProps> = ({
  name,
  handle,
  title,
  imageUrl,
  ticketNo = "010091",
  hideActions = false,
  socials,
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  const captureTicketPng = useCallback(async (): Promise<string | null> => {
    if (ticketRef.current === null) return null;
    try {
      return await toPng(ticketRef.current, { cacheBust: true, pixelRatio: 2 });
    } catch (err) {
      console.error("Failed to generate image", err);
      return null;
    }
  }, []);

  const handleDownload = useCallback(async () => {
    const dataUrl = await captureTicketPng();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `civilization-pass-${handle}.png`;
    link.href = dataUrl;
    link.click();
  }, [captureTicketPng, handle]);

  const handleShareX = useCallback(async () => {
    const text =
      "Got my ticket to the civilisation.\nZo House · Era Alpha Waiting List";
    const url = "https://house.zo.xyz";
    const intent = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

    const dataUrl = await captureTicketPng();
    if (!dataUrl) {
      window.open(intent, "_blank", "noopener,noreferrer");
      return;
    }

    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `civilization-pass-${handle}.png`, {
      type: "image/png",
    });

    const nav = typeof navigator !== "undefined" ? navigator : null;

    // Mobile & supported browsers: native share sheet — X appears with image attached.
    if (nav && "canShare" in nav && nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], text: `${text}\n${url}` });
        return;
      } catch {
        /* user cancelled or share failed — continue to fallback */
      }
    }

    // Desktop: copy image to clipboard + open tweet intent. User pastes with Cmd/Ctrl-V.
    try {
      if (
        nav &&
        "clipboard" in nav &&
        typeof window !== "undefined" &&
        typeof window.ClipboardItem !== "undefined"
      ) {
        await nav.clipboard.write([
          new window.ClipboardItem({ "image/png": blob }),
        ]);
        window.open(intent, "_blank", "noopener,noreferrer");
        alert(
          "Ticket copied to clipboard — paste it into your tweet (Cmd/Ctrl-V)."
        );
        return;
      }
    } catch {
      /* clipboard blocked — fall through to download */
    }

    // Final fallback: download PNG + open tweet.
    const link = document.createElement("a");
    link.download = `civilization-pass-${handle}.png`;
    link.href = dataUrl;
    link.click();
    window.open(intent, "_blank", "noopener,noreferrer");
  }, [captureTicketPng, handle]);

  const handleShareImage = useCallback(async () => {
    const dataUrl = await captureTicketPng();
    if (!dataUrl) return;

    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `civilization-pass-${handle}.png`, {
        type: "image/png",
      });

      const nav = typeof navigator !== "undefined" ? navigator : null;
      if (nav && "canShare" in nav && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: "My Zo House pass",
          text: "Got my ticket to the civilisation. house.zo.xyz",
        });
        return;
      }
    } catch (err) {
      // user cancel or share unsupported — fall through to download
    }

    const link = document.createElement("a");
    link.download = `civilization-pass-${handle}.png`;
    link.href = dataUrl;
    link.click();
  }, [captureTicketPng, handle]);

  const cleanHandle = handle.replace(/^@/, "");

  const sources = React.useMemo(() => {
    if (imageUrl) return [imageUrl];
    if (socials && socials.trim()) {
      return resolveAvatarSources(socials, name).sources;
    }
    const seed = encodeURIComponent(cleanHandle || name || "zo");
    return [
      `https://unavatar.io/x/${cleanHandle}`,
      `https://unavatar.io/twitter/${cleanHandle}`,
      `https://unavatar.io/github/${cleanHandle}`,
      `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=D4AF37&textColor=000000`,
    ];
  }, [imageUrl, socials, cleanHandle, name]);

  const [srcIndex, setSrcIndex] = useState(0);
  useEffect(() => {
    setSrcIndex(0);
  }, [sources]);

  const portrait = sources[srcIndex];

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Natural ticket dimensions (gradient wrapper = 804 + 4 px + padding).
  const TICKET_W = 808;
  const TICKET_H = 408;
  const MOBILE_SCALE = 0.55;
  const boxW = isMobile ? TICKET_H * MOBILE_SCALE : TICKET_W;
  const boxH = isMobile ? TICKET_W * MOBILE_SCALE : TICKET_H;

  return (
    <div className="flex flex-col items-center gap-8 font-sans">
      <div
        style={{
          width: boxW,
          height: boxH,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: isMobile
              ? `translate(-50%, -50%) rotate(90deg) scale(${MOBILE_SCALE})`
              : "translate(-50%, -50%)",
            transformOrigin: "center",
          }}
        >
          {/* The capture wrapper (no bg / no padding so live view is clean) */}
          <div
            ref={ticketRef}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
        {/* Outer Gradient Border Wrapper */}
        <div
          style={{
            position: "relative",
            width: 804, // 800 + 4 (padding)
            height: 404,
            background: GOLDEN_GRADIENT,
            padding: 2,
            borderRadius: 24,
            boxShadow: "0 0 40px rgba(212, 175, 55, 0.2)",
            display: "flex",
          }}
        >
          {/* Inner Ticket Background */}
          <div
            style={{
              flex: 1,
              position: "relative",
              backgroundImage: "url('/ticket.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: 22,
              display: "flex",
              overflow: "hidden",
            }}
          >
            {/* Dark overlay for readability */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0, 0, 0, 0.75)",
                zIndex: 1,
              }}
            />

            {/* Subtle noise/texture overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.03,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                pointerEvents: "none",
                zIndex: 1,
              }}
            />

            {/* Main Section */}
            <div
              style={{
                flex: 1,
                padding: "48px 56px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                zIndex: 2,
              }}
            >
              {/* Header: User Info */}
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <img
                  src={portrait}
                  alt={name}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    setSrcIndex((i) => Math.min(i + 1, sources.length - 1));
                  }}
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: "50%",
                    border: "2px solid #D4AF37",
                    objectFit: "cover",
                    background: "#111",
                  }}
                />
                <div>
                  <h2
                    style={{
                      fontSize: 36,
                      color: "#FFFFFF",
                      margin: 0,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {name}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 18,
                        color: "rgba(255, 255, 255, 0.4)",
                        fontWeight: 500,
                      }}
                    >
                      @{cleanHandle}
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle: Civilization Branding */}
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "#D4AF37",
                    letterSpacing: "0.4em",
                    textTransform: "uppercase",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  TICKET TO
                </div>
                <h1
                  style={{
                    fontSize: 64,
                    margin: 0,
                    color: "#FFFFFF",
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    lineHeight: 0.9,
                    textTransform: "uppercase",
                    fontFamily: "serif",
                    fontStyle: "italic",
                  }}
                >
                  CIVILIZATION
                </h1>
              </div>

              {/* Footer: Details */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginTop: "auto",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "rgba(255, 255, 255, 0.7)",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                    }}
                  >
                    WAITING LIST PASS • ERA ALPHA
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255, 255, 255, 0.4)",
                      marginTop: 4,
                    }}
                  >
                    ZO HOUSE • BANGALORE • 2026
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#D4AF37",
                    fontFamily: "monospace",
                    opacity: 0.8,
                  }}
                >
                  house.zo.xyz
                </div>
              </div>
            </div>

            {/* Dashed divider */}
            <div
              style={{
                width: 2,
                backgroundImage: `linear-gradient(to bottom, #D4AF37 50%, transparent 50%)`,
                backgroundSize: "100% 12px",
                margin: "20px 0",
                opacity: 0.4,
                zIndex: 2,
              }}
            />

            {/* Stub Section */}
            <div
              style={{
                width: 160,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  transform: "rotate(90deg)",
                  fontSize: 56,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.1em",
                  fontFamily: "monospace",
                  opacity: 0.9,
                }}
              >
                <span style={{ color: "#D4AF37", marginRight: 12 }}>№</span>
                {ticketNo}
              </div>
            </div>
          </div>

          {/* Left Notch Wrapper */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              width: 32,
              height: 64,
              overflow: "hidden",
              transform: "translateY(-50%)",
              zIndex: 10,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -32,
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: GOLDEN_GRADIENT,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "#000000",
                }}
              />
            </div>
          </div>

          {/* Right Notch Wrapper */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: 0,
              width: 32,
              height: 64,
              overflow: "hidden",
              transform: "translateY(-50%)",
              zIndex: 10,
            }}
          >
            <div
              style={{
                position: "absolute",
                right: -32,
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: GOLDEN_GRADIENT,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "#000000",
                }}
              />
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!hideActions && (
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={handleShareX}
          className="px-6 py-3 bg-white text-black font-bold rounded-full transition-all hover:bg-white/90 active:scale-95 shadow-xl flex items-center gap-2 text-xs uppercase tracking-widest"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Post on X
        </button>
        <button
          onClick={handleShareImage}
          className="px-6 py-3 bg-[#d4af37] text-black font-bold rounded-full transition-all hover:brightness-110 active:scale-95 shadow-xl flex items-center gap-2 text-xs uppercase tracking-widest"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share to Story
        </button>
        <button
          onClick={handleDownload}
          className="px-6 py-3 bg-transparent text-white border border-white/20 hover:border-white/40 font-bold rounded-full transition-all active:scale-95 flex items-center gap-2 text-xs uppercase tracking-widest"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download
        </button>
      </div>
      )}
    </div>
  );
};
