import React, { useState } from "react";
import { toast } from "sonner";
import {
  buildStoryCanvas,
  shareStoryCanvas,
} from "../../lib/passport/buildStoryCanvas";
import { fixAvatarUrl } from "../../hooks/usePublicPassport";
import { trackActivity } from "../../lib/analytics/trackActivity";

interface ShareQuestButtonsProps {
  handle: string;
  origin?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

function linkFor(handle: string, origin?: string): string {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "https://zo.xyz");
  return `${base}/@${handle}`;
}

function shareText(handle: string): string {
  return `Check out ${handle}.zo on Zo World — unlock your Passport and join the tribe.`;
}

function openInNewTab(url: string) {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ShareQuestButtons({
  handle,
  origin,
  displayName,
  avatarUrl,
}: ShareQuestButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const passportUrl = linkFor(handle, origin);
  const message = shareText(handle);
  const fixedAvatar = fixAvatarUrl(avatarUrl || undefined) || null;
  const resolvedName = displayName || handle;
  const shareTitle = `${resolvedName}'s Zo Passport`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(passportUrl);
      setCopied(true);
      toast.success("Passport link copied");
      setTimeout(() => setCopied(false), 2000);
      void trackActivity("passport_share_quest_click", { handle, destination: "copy_link" });
    } catch {
      toast.error("Could not copy — select and copy manually");
    }
  };

  const shareToIgStory = async () => {
    // Generate a branded 1080x1920 passport card and push it through the
    // mobile share sheet (Instagram appears as a share target). Desktop
    // falls back to PNG download + instructions to upload to IG.
    if (generating) return;
    setGenerating(true);
    void trackActivity("passport_share_quest_click", { handle, destination: "ig_story" });
    try {
      const canvas = await buildStoryCanvas(
        resolvedName,
        handle,
        passportUrl,
        fixedAvatar,
      );
      const result = await shareStoryCanvas(canvas, shareTitle);
      if (result.kind === "shared") {
        toast.success("Shared to your story");
        void trackActivity("passport_ig_story_shared", { handle });
      } else if (result.kind === "downloaded") {
        // Also copy the URL so the user can paste it as an IG sticker
        // after uploading the downloaded image.
        try {
          await navigator.clipboard.writeText(passportUrl);
        } catch {
          /* noop */
        }
        toast.success("Image downloaded — upload to Instagram Story");
        openInNewTab("https://www.instagram.com/create/story/");
        void trackActivity("passport_ig_story_download", { handle });
      } else if (result.kind === "failed") {
        toast.error("Could not generate story image");
      }
    } catch {
      toast.error("Could not generate story image");
    } finally {
      setGenerating(false);
    }
  };

  const shareToWhatsApp = () => {
    // wa.me share intent — message box prefilled with passport URL.
    void trackActivity("passport_share_quest_click", { handle, destination: "whatsapp" });
    const text = encodeURIComponent(`${message}\n\n${passportUrl}`);
    openInNewTab(`https://wa.me/?text=${text}`);
  };

  const shareToWhatsAppStatus = () => {
    // No direct "post to status" web intent exists. Copy link + open WhatsApp
    // so the user can attach it to a status from the mobile app.
    void trackActivity("passport_share_quest_click", { handle, destination: "whatsapp_status" });
    copyLink();
    openInNewTab("https://web.whatsapp.com/");
  };

  const copyToIgBio = () => {
    void trackActivity("passport_share_quest_click", { handle, destination: "ig_bio" });
    copyLink();
    openInNewTab("https://www.instagram.com/accounts/edit/");
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <p className="text-[10px] text-white/40 uppercase tracking-wider">
        Share Passport Quest
      </p>
      <div className="grid grid-cols-2 gap-2">
        <ShareButton label={copied ? "Copied ✓" : "Copy link"} onClick={copyLink} />
        <ShareButton label="Copy to IG bio" onClick={copyToIgBio} />
        <ShareButton
          label={generating ? "Building…" : "IG story"}
          onClick={shareToIgStory}
          disabled={generating}
        />
        <ShareButton label="WhatsApp" onClick={shareToWhatsApp} />
        <ShareButton
          label="WhatsApp status"
          onClick={shareToWhatsAppStatus}
          className="col-span-2"
        />
      </div>
      <p className="text-[10px] text-white/30 leading-relaxed">
        Copy your Passport link to IG bio. Earn commission on every booking
        from anyone who unlocks their Passport through your link, for up to 1 year.
      </p>
    </div>
  );
}

function ShareButton({
  label,
  onClick,
  className = "",
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`py-2.5 px-3 rounded-full bg-white/10 text-white text-xs font-medium border border-white/15 hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-wait ${className}`}
    >
      {label}
    </button>
  );
}
