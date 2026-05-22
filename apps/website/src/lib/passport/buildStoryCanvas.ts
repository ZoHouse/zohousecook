/**
 * Builds a 1080×1920 Instagram Story card for a Zo Passport.
 *
 * Visual language mirrors the lobby `CitizenCard.tsx` — dark gradient base
 * + holographic shader overlay + lime→magenta border, square Zobu avatar,
 * bold black handle, "Citizen of Zo World" subtitle. Outer canvas keeps
 * the pearl-ivory lobby background. Stats + XP pill + stamps row sit
 * below the card.
 *
 * When `stats` is provided AND non-empty, renders the rich variant. When
 * absent/empty, renders the card-only fallback (no zeros shipped).
 */

import { stampUrlFor } from "./stampUrl";
// Real Zo brand wordmark — the \z/ typographic mark, canonical brand asset.
import zoLogo from "../../assets/passport-lobby/zo-logo.jpg";

const STORY_W = 1080;
const STORY_H = 1920;

// Lobby palette
const INK = "#2A1B3D";
const INK_SOFT = "#6B5B8E";
const INK_FAINT = "#9A8FB8";
const GOLD_INK = "#A86B2A";
const GOLD_FILL = "#FFE79E";
const PEARL_WHITE = "#FFFFFF";
const PEARL_IVORY = "#FBF8F4";
const PEARL_PINK = "#F2E0EC";
const PEARL_BLUE = "#DBE6F2";
const PEARL_MINT = "#DCEDE8";

// Lobby CitizenCard exact tokens
const HOLO_COLORS = ["#0051FF", "#4DFF00", "#FFE500", "#FF6F00", "#FF2F8E", "#0051FF"];
const BORDER_FROM = "#A7D921"; // lime
const BORDER_TO = "#FF2F8E"; // magenta
const CARD_DARK_TOP = "#292929";
const CARD_DARK_BOT = "#000000";
const HANDLE_TEXT = "#0A0A0A"; // lobby uses near-black on the holo card

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export interface StoryStats {
  xpTotal?: number;
  rankTitle?: string | null;
  destinations?: number;
  stays?: number;
  tribe?: number;
  reels?: number;
  /** Names that map to stamp images via stampUrlFor. */
  stampNames?: string[];
  /** Profile membership tier. 'founder' renders as "Founder of Zo World"
      instead of the default "Citizen of Zo World". */
  membership?: string | null;
}

function hasStatsContent(s?: StoryStats): boolean {
  if (!s) return false;
  if ((s.xpTotal ?? 0) > 0) return true;
  if ((s.destinations ?? 0) > 0) return true;
  if ((s.stays ?? 0) > 0) return true;
  if ((s.tribe ?? 0) > 0) return true;
  if ((s.reels ?? 0) > 0) return true;
  if ((s.stampNames?.length ?? 0) > 0) return true;
  return false;
}

function formatXp(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

/** Pearl-glass tile (stats row, stamps row, URL pill). */
function pearlCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.save();
  ctx.shadowColor = "rgba(120,100,160,0.22)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 14;
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, PEARL_WHITE);
  grad.addColorStop(0.5, PEARL_IVORY);
  grad.addColorStop(1, PEARL_PINK);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
}

/** Paints the lobby's holographic CitizenCard at (x,y,w,h). */
async function drawCitizenCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  handle: string,
  displayName: string,
  avatarUrl: string | null | undefined,
  xpPillText?: string,
  subtitle?: string,
) {
  const r = 44;

  // Outer drop shadow (slimmed to avoid the gaudy feel)
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.40)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = CARD_DARK_BOT;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.restore();

  // Card clip — everything inside the rounded rect
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();

  // Dark base gradient (matches lobby `GRADIENT_PRIVATE_CARD`)
  const base = ctx.createLinearGradient(x, y, x, y + h);
  base.addColorStop(0, CARD_DARK_TOP);
  base.addColorStop(1, CARD_DARK_BOT);
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);

  // Holographic foil — conic gradient approximating MeshGradient sweep
  const conic = (ctx as unknown as {
    createConicGradient?: (a: number, x: number, y: number) => CanvasGradient;
  }).createConicGradient?.(-Math.PI / 3, x + w / 2, y + h / 2);
  if (conic) {
    HOLO_COLORS.forEach((c, i) => {
      conic.addColorStop(i / (HOLO_COLORS.length - 1), c);
    });
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = conic;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  } else {
    // Fallback for runtimes without createConicGradient — diagonal sweep.
    const linear = ctx.createLinearGradient(x, y + h, x + w, y);
    HOLO_COLORS.forEach((c, i) => linear.addColorStop(i / (HOLO_COLORS.length - 1), c));
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = linear;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  // Subtle sheen (toned down for elegance)
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  const sheen = ctx.createLinearGradient(x, y, x + w, y + h);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.45, "rgba(255,255,255,0.12)");
  sheen.addColorStop(0.55, "rgba(255,255,255,0.22)");
  sheen.addColorStop(0.7, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  // === Avatar ============================================================
  const PAD = 36;
  const avX = x + PAD;
  const avY = y + PAD;
  const avSize = w - PAD * 2;
  const avR = 24;

  // Avatar inner rounded-rect (square frame, matches lobby Avatar2D wrapper)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(avX, avY, avSize, avSize, avR);
  ctx.clip();

  // Soft purple avatar bg (lobby's Avatar2D draws purple #843DFA behind Zobu)
  const avBg = ctx.createLinearGradient(avX, avY, avX, avY + avSize);
  avBg.addColorStop(0, "#9844FF");
  avBg.addColorStop(1, "#5F00E2");
  ctx.fillStyle = avBg;
  ctx.fillRect(avX, avY, avSize, avSize);

  let imgRendered = false;
  if (avatarUrl) {
    try {
      const img = await loadImage(avatarUrl);
      ctx.drawImage(img, avX, avY, avSize, avSize);
      imgRendered = true;
    } catch {
      // CORS / 404 — fall through to letter
    }
  }
  if (!imgRendered) {
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${Math.round(avSize * 0.42)}px system-ui, sans-serif`;
    ctx.fillText(
      (displayName || handle).charAt(0).toUpperCase(),
      avX + avSize / 2,
      avY + avSize / 2,
    );
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  // === Handle + subtitle (refined — lighter weight, smaller, breathing) ===
  const textTop = avY + avSize + 58;
  ctx.textAlign = "left";
  ctx.fillStyle = HANDLE_TEXT;
  ctx.font = "700 64px system-ui, sans-serif";
  ctx.fillText(handle.endsWith(".zo") ? handle : `${handle}.zo`, avX, textTop);

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.font = "500 26px system-ui, sans-serif";
  ctx.fillText(subtitle || "Citizen of Zo World", avX, textTop + 38);

  // === XP rank pill — dark glass (same primitive the lobby share button uses)
  // centered full-width below the subtitle. Larger to read as an achievement.
  if (xpPillText) {
    ctx.font = "600 32px system-ui, sans-serif";
    const tw = ctx.measureText(xpPillText).width;
    const pw = tw + 48;
    const ph = 60;
    const px = x + (w - pw) / 2;
    const py = textTop + 74;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, ph / 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.textAlign = "center";
    ctx.fillText(xpPillText, px + pw / 2, py + 41);
    ctx.textAlign = "left";
  }

  ctx.restore(); // end card clip

  // === Border beam — slim static lime → magenta sweep ====================
  const beamCtx = ctx;
  const conic2 = (beamCtx as unknown as {
    createConicGradient?: (a: number, x: number, y: number) => CanvasGradient;
  }).createConicGradient?.(-Math.PI / 2, x + w / 2, y + h / 2);
  beamCtx.save();
  beamCtx.lineWidth = 2.5;
  beamCtx.lineJoin = "round";
  if (conic2) {
    conic2.addColorStop(0, BORDER_FROM);
    conic2.addColorStop(0.25, BORDER_TO);
    conic2.addColorStop(0.5, BORDER_FROM);
    conic2.addColorStop(0.75, BORDER_TO);
    conic2.addColorStop(1, BORDER_FROM);
    beamCtx.strokeStyle = conic2;
  } else {
    const linBeam = beamCtx.createLinearGradient(x, y, x + w, y + h);
    linBeam.addColorStop(0, BORDER_FROM);
    linBeam.addColorStop(1, BORDER_TO);
    beamCtx.strokeStyle = linBeam;
  }
  beamCtx.beginPath();
  beamCtx.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, r - 1.5);
  beamCtx.stroke();
  beamCtx.restore();
}

export async function buildStoryCanvas(
  displayName: string,
  handle: string,
  profileUrl: string,
  avatarUrl?: string | null,
  stats?: StoryStats,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const richLayout = hasStatsContent(stats);
  const safeName = displayName || handle;
  const handleClean = handle.endsWith(".zo") ? handle : `${handle}.zo`;

  // === Outer pearl-ivory background — matches lobby ========================
  const bg = ctx.createLinearGradient(0, 0, STORY_W, STORY_H);
  bg.addColorStop(0, PEARL_IVORY);
  bg.addColorStop(0.35, PEARL_BLUE);
  bg.addColorStop(0.65, PEARL_MINT);
  bg.addColorStop(1, PEARL_PINK);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  const glow = ctx.createRadialGradient(STORY_W / 2, 760, 0, STORY_W / 2, 760, 800);
  glow.addColorStop(0, "rgba(192,165,232,0.28)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // Hex-mote shimmer dust
  ctx.save();
  ctx.fillStyle = "rgba(194,107,232,0.18)";
  const seedRand = (i: number) => {
    const x = Math.sin(i * 73.31) * 10000;
    return x - Math.floor(x);
  };
  for (let i = 0; i < 36; i++) {
    const px = seedRand(i + 1) * STORY_W;
    const py = seedRand(i + 31) * STORY_H;
    const size = 4 + seedRand(i + 61) * 7;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // No outer frame — composition rests directly on the pearl wash.
  // Minimal wordmark eyebrow.
  ctx.textAlign = "center";
  ctx.fillStyle = INK_FAINT;
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillText("Z O   W O R L D", STORY_W / 2, 90);

  // === Hero holo card ======================================================
  const cardW = 860;
  const cardH = 1080;
  const cardX = (STORY_W - cardW) / 2;
  const cardY = 140;
  // XP pill is rendered INSIDE the card (per design lock-in 2026-05-21).
  const xpPillText =
    richLayout && stats && (stats.xpTotal ?? 0) > 0
      ? `★ ${formatXp(stats.xpTotal!)} XP${stats.rankTitle ? ` · ${stats.rankTitle}` : ""}`
      : undefined;
  // Membership-aware subtitle — Founder citizens get their own line.
  const subtitle = stats?.membership === "founder" ? "Founder of Zo World" : "Citizen of Zo World";
  await drawCitizenCard(ctx, cardX, cardY, cardW, cardH, handle, safeName, avatarUrl, xpPillText, subtitle);

  // Stamps + URL pill anchor directly below the card.
  let belowY = cardY + cardH + 40;

  // === Stamps row — first 3 + "+N MORE" pill (stats row removed; the gold
  //     XP pill + stamps row carry the achievement signal) =================
  if (richLayout && stats) {
    // Stamps row — first 3 + "+N MORE" pill
    const all = stats.stampNames ?? [];
    if (all.length > 0) {
      const SHOW = 3;
      const shown = all.slice(0, SHOW);
      const more = Math.max(0, all.length - SHOW);
      const tileCount = shown.length + (more > 0 ? 1 : 0);
      const stampSize = 220;
      const stampGap = 24;
      const totalW = stampSize * tileCount + stampGap * (tileCount - 1);
      const startX = (STORY_W - totalW) / 2;

      await Promise.all(
        shown.map(async (name, i) => {
          const url = stampUrlFor(name);
          const sx = startX + i * (stampSize + stampGap);
          pearlCard(ctx, sx, belowY, stampSize, stampSize, 30);
          if (!url) {
            ctx.fillStyle = INK;
            ctx.font = "600 30px system-ui, sans-serif";
            ctx.textAlign = "center";
            const short = name.length > 9 ? name.slice(0, 8) + "…" : name;
            ctx.fillText(short, sx + stampSize / 2, belowY + stampSize / 2 + 9);
            return;
          }
          const proxied = `/api/stamp-proxy?url=${encodeURIComponent(url)}`;
          try {
            const img = await loadImage(proxied);
            const pad = 24;
            ctx.drawImage(img, sx + pad, belowY + pad, stampSize - pad * 2, stampSize - pad * 2);
          } catch {
            ctx.fillStyle = INK;
            ctx.font = "600 30px system-ui, sans-serif";
            ctx.textAlign = "center";
            const short = name.length > 9 ? name.slice(0, 8) + "…" : name;
            ctx.fillText(short, sx + stampSize / 2, belowY + stampSize / 2 + 9);
          }
        }),
      );

      if (more > 0) {
        const sx = startX + shown.length * (stampSize + stampGap);
        pearlCard(ctx, sx, belowY, stampSize, stampSize, 30);
        ctx.fillStyle = INK;
        ctx.font = "600 68px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`+${more}`, sx + stampSize / 2, belowY + stampSize / 2 - 14);
        ctx.fillStyle = INK_FAINT;
        ctx.font = "600 22px system-ui, sans-serif";
        ctx.fillText("MORE", sx + stampSize / 2, belowY + stampSize / 2 + 42);
        ctx.textBaseline = "alphabetic";
      }
      belowY += stampSize + 30;
    }
  }

  // === Slim URL pill — anchored just below the stamps, tight composition
  const pillY = belowY + 20;
  const pillW = 560;
  const pillH = 60;
  const pillX = (STORY_W - pillW) / 2;
  const pillR = 30;

  ctx.save();
  ctx.shadowColor = "rgba(120,100,160,0.12)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = INK;
  ctx.font = "600 24px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillText(profileUrl.replace(/^https?:\/\//, ""), STORY_W / 2, pillY + 40);

  // Real Zo brand wordmark — load the canonical JPG and blend with multiply
  // so the white background fades into the pearl canvas. Falls back to the
  // text glyph if the asset fails to load.
  try {
    const logo = await loadImage(zoLogo.src);
    const lw = 120;
    const lh = Math.round(120 * (logo.height / logo.width));
    const lx = (STORY_W - lw) / 2;
    const ly = pillY + pillH + 18;
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(logo, lx, ly, lw, lh);
    ctx.restore();
    ctx.fillStyle = INK_FAINT;
    ctx.font = "500 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Follow your heart", STORY_W / 2, ly + lh + 30);
  } catch {
    ctx.fillStyle = INK;
    ctx.font = "900 56px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("\\z/", STORY_W / 2, pillY + pillH + 72);
    ctx.fillStyle = INK_FAINT;
    ctx.font = "500 20px system-ui, sans-serif";
    ctx.fillText("Follow your heart", STORY_W / 2, pillY + pillH + 110);
  }

  return canvas;
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export type StoryShareResult =
  | { kind: "shared" }
  | { kind: "downloaded" }
  | { kind: "cancelled" }
  | { kind: "failed"; error: unknown };

export async function shareStoryCanvas(
  canvas: HTMLCanvasElement,
  shareTitle: string,
  filename = "zo-passport-story.png",
): Promise<StoryShareResult> {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve({ kind: "failed", error: new Error("toBlob returned null") });
        return;
      }
      if (isMobileDevice() && typeof navigator !== "undefined" && navigator.canShare) {
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: shareTitle });
            resolve({ kind: "shared" });
            return;
          } catch (err) {
            // eslint-disable-next-line no-void
            void err;
          }
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      resolve({ kind: "downloaded" });
    }, "image/png");
  });
}
