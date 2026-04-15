/**
 * Builds a 1080×1920 Instagram Story card for a Zo Passport.
 *
 * Shared between ShareModal (share icon button on private passport) and
 * ShareQuestButtons (5-destination quick-share grid). Keep the visual
 * output identical across both entry points — both paths call this fn.
 */

const STORY_W = 1080;
const STORY_H = 1920;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function buildStoryCanvas(
  displayName: string,
  handle: string,
  profileUrl: string,
  avatarUrl?: string | null,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const bg = ctx.createLinearGradient(0, 0, STORY_W, STORY_H);
  bg.addColorStop(0, "#0d0d16");
  bg.addColorStop(0.6, "#12082a");
  bg.addColorStop(1, "#0a0a12");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  const glow = ctx.createRadialGradient(
    STORY_W / 2,
    STORY_H * 0.42,
    0,
    STORY_W / 2,
    STORY_H * 0.42,
    700,
  );
  glow.addColorStop(0, "rgba(120,60,220,0.22)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ZO WORLD", STORY_W / 2, 220);

  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(STORY_W / 2 - 120, 260);
  ctx.lineTo(STORY_W / 2 + 120, 260);
  ctx.stroke();

  const avatarSize = 360;
  const avatarY = STORY_H * 0.32 - avatarSize / 2;
  let avatarRendered = false;

  if (avatarUrl) {
    try {
      const img = await loadImage(avatarUrl);
      const avatarX = (STORY_W - avatarSize) / 2;
      const r = 48;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, r);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, r);
      ctx.stroke();

      avatarRendered = true;
    } catch {
      // CORS-denied or 404 — fall through to text-only layout
    }
  }

  const textStart = avatarRendered ? avatarY + avatarSize + 120 : STORY_H * 0.46;

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "bold 110px system-ui, sans-serif";
  ctx.fillText("Zo Passport", STORY_W / 2, textStart);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 88px system-ui, sans-serif";
  ctx.fillText(displayName || handle, STORY_W / 2, textStart + 140);

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "52px system-ui, sans-serif";
  ctx.fillText(
    handle.endsWith(".zo") ? handle : `${handle}.zo`,
    STORY_W / 2,
    textStart + 230,
  );

  const pillY = STORY_H - 280;
  const pillW = 760;
  const pillH = 90;
  const pillX = (STORY_W - pillW) / 2;
  const pillR = 45;
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "38px monospace";
  ctx.fillText(
    profileUrl.replace(/^https?:\/\//, ""),
    STORY_W / 2,
    pillY + 58,
  );

  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "40px system-ui, sans-serif";
  ctx.fillText("Follow my journey →", STORY_W / 2, STORY_H - 140);

  return canvas;
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Share or download a story card blob. Returns a result so callers can
 * show the appropriate toast / fallback instructions.
 */
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
            // User cancelled or share failed — fall through to download.
            // Don't resolve cancelled here; give them the PNG to upload manually.
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
