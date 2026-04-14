import React, { useState } from "react";
import { toast } from "sonner";

interface ShareQuestButtonsProps {
  handle: string;
  origin?: string;
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

export function ShareQuestButtons({ handle, origin }: ShareQuestButtonsProps) {
  const [copied, setCopied] = useState(false);

  const passportUrl = linkFor(handle, origin);
  const message = shareText(handle);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(passportUrl);
      setCopied(true);
      toast.success("Passport link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select and copy manually");
    }
  };

  const shareToIgStory = () => {
    // IG has no public "new story with URL tag" deep link. Best effort: open
    // IG, let the user paste. On mobile this opens the app; on desktop the
    // profile page. We also copy the passport URL so the user can paste the
    // sticker after the camera opens.
    copyLink();
    openInNewTab("https://www.instagram.com/create/story/");
  };

  const shareToWhatsApp = () => {
    // wa.me share intent — message box prefilled with passport URL.
    const text = encodeURIComponent(`${message}\n\n${passportUrl}`);
    openInNewTab(`https://wa.me/?text=${text}`);
  };

  const shareToWhatsAppStatus = () => {
    // No direct "post to status" web intent exists. Copy link + open WhatsApp
    // so the user can attach it to a status from the mobile app.
    copyLink();
    openInNewTab("https://web.whatsapp.com/");
  };

  const copyToIgBio = () => {
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
        <ShareButton label="IG story" onClick={shareToIgStory} />
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
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2.5 px-3 rounded-full bg-white/10 text-white text-xs font-medium border border-white/15 hover:bg-white/15 transition-colors ${className}`}
    >
      {label}
    </button>
  );
}
