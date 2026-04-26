/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://elvaqxadfewcsohrswsi.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const PUBLIC_BASE = process.env.WEB_BASE_URL || "https://zo.house";

const VALID_PLATFORMS = new Set(["x", "l", "g", "i", "y", "u"]);

interface LeadRow {
  full_name: string | null;
  share_slug: string;
  created_at: string;
}

// Fetch a Google Font's binary as ArrayBuffer, suitable for Satori.
async function loadGoogleFont(
  family: string,
  weight: number,
  italic: boolean
): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:ital,wght@${italic ? 1 : 0},${weight}&display=swap`;
  const css = await fetch(cssUrl, {
    headers: {
      // Without a desktop UA, Google serves WOFF (not WOFF2) which Satori can't parse.
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  }).then((r) => r.text());
  const match = css.match(/src:\s*url\((https:\/\/[^)]+\.(?:woff2?|ttf))\)/);
  if (!match) throw new Error(`font url not found for ${family}`);
  return fetch(match[1]).then((r) => r.arrayBuffer());
}

function avatarUrl(platform: string, handle: string): string {
  switch (platform) {
    case "x":
      return `https://unavatar.io/x/${handle}?fallback=https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(handle)}%26backgroundColor=D4AF37%26textColor=000000`;
    case "g":
      return `https://unavatar.io/github/${handle}`;
    case "i":
      return `https://unavatar.io/instagram/${handle}`;
    case "y":
      return `https://unavatar.io/youtube/${handle}`;
    case "l":
      return `https://unavatar.io/linkedin/${handle}`;
    default:
      return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        handle
      )}&backgroundColor=D4AF37&textColor=000000`;
  }
}

async function fetchLead(slug: string): Promise<LeadRow | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/pipeline_leads?share_slug=eq.${encodeURIComponent(
      slug
    )}&select=full_name,share_slug,created_at&limit=1`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as LeadRow[];
  return rows[0] || null;
}

async function fetchWaitlistPosition(createdAt: string): Promise<number> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/pipeline_leads?source=eq.zo.house&created_at=lte.${encodeURIComponent(
      createdAt
    )}&select=id`,
    {
      method: "HEAD",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
    }
  );
  // Supabase returns "Content-Range: 0-0/<count>" — parse the count.
  const range = res.headers.get("content-range") || "";
  const match = range.match(/\/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

export default async function handler(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    // /api/og/<platform>/<handle>
    const platform = (parts[2] || "").toLowerCase();
    const handle = parts.slice(3).join("/");

    if (!VALID_PLATFORMS.has(platform) || !handle) {
      return new Response("Not found", { status: 404 });
    }

    const slug = `${platform}/${handle}`;
    const lead = await fetchLead(slug);
    if (!lead) {
      return new Response("Not found", { status: 404 });
    }

    const ticketNo =
      lead.created_at != null
        ? String(await fetchWaitlistPosition(lead.created_at)).padStart(6, "0")
        : "000000";

    const name = lead.full_name || "Zo Citizen";
    const avatar = avatarUrl(platform, handle);
    const ticketBg = `${PUBLIC_BASE}/ticket.jpg`;

    const [playfairItalic, inter] = await Promise.all([
      loadGoogleFont("Playfair Display", 700, true),
      loadGoogleFont("Inter", 700, false),
    ]);

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            background: "#000",
            position: "relative",
            fontFamily: "Inter",
          }}
        >
          {/* Background photo with dark overlay */}
          <img
            src={ticketBg}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              inset: 0,
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.78)",
              display: "flex",
            }}
          />

          {/* Main content */}
          <div
            style={{
              position: "relative",
              flex: 1,
              padding: "72px 88px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              zIndex: 2,
            }}
          >
            {/* Top: avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <img
                src={avatar}
                alt={name}
                width={128}
                height={128}
                style={{
                  width: 128,
                  height: 128,
                  borderRadius: 64,
                  border: "3px solid #D4AF37",
                  objectFit: "cover",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    fontSize: 44,
                    color: "#FFFFFF",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {name}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    color: "rgba(255,255,255,0.45)",
                    fontWeight: 500,
                    marginTop: 4,
                  }}
                >
                  @{handle}
                </div>
              </div>
            </div>

            {/* Middle: cult headline */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontFamily: "Playfair Display",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: 124,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
              }}
            >
              <div style={{ color: "#FFFFFF", display: "flex" }}>
                You&apos;ve been
              </div>
              <div style={{ color: "#D4AF37", display: "flex" }}>seen.</div>
            </div>

            {/* Bottom: branding + URL */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    fontSize: 20,
                    color: "rgba(255,255,255,0.7)",
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Waitlist Pass
                </div>
                <div
                  style={{
                    fontSize: 18,
                    color: "rgba(255,255,255,0.4)",
                    marginTop: 6,
                    letterSpacing: "0.1em",
                  }}
                >
                  ZO HOUSE · BANGALORE · 2026
                </div>
              </div>
              <div
                style={{
                  fontSize: 22,
                  color: "#D4AF37",
                  fontFamily: "Inter",
                  letterSpacing: "0.06em",
                }}
              >
                zo.house
              </div>
            </div>
          </div>

          {/* Ticket stub (right column) */}
          <div
            style={{
              position: "relative",
              width: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
              borderLeft: "2px dashed rgba(212,175,55,0.45)",
            }}
          >
            <div
              style={{
                transform: "rotate(90deg)",
                fontSize: 80,
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "0.12em",
                fontFamily: "Inter",
                display: "flex",
                alignItems: "center",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: "#D4AF37", marginRight: 16 }}>№</span>
              {ticketNo}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Playfair Display",
            data: playfairItalic,
            style: "italic",
            weight: 700,
          },
          {
            name: "Inter",
            data: inter,
            style: "normal",
            weight: 700,
          },
        ],
      }
    );
  } catch (err) {
    console.error("og render failed:", err);
    return new Response("Internal error", { status: 500 });
  }
}
