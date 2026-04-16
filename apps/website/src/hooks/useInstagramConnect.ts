import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useProfile } from "@zo/auth";
import { toast } from "sonner";

const IG_APP_ID = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";
const ZO_API = process.env.API_BASE_URL || "https://api.io.zo.xyz";

function getZoAuthHeaders(): Record<string, string> {
  const token =
    localStorage.getItem("zo-admin-token") ||
    localStorage.getItem("zo-web-token") ||
    "";
  const deviceId =
    localStorage.getItem("zo-admin-device-id") ||
    localStorage.getItem("zo-web-device-id") ||
    "";
  const deviceSecret =
    localStorage.getItem("zo-admin-device-secret") ||
    localStorage.getItem("zo-web-device-secret") ||
    "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "client-device-id": deviceId,
    "client-device-secret": deviceSecret,
  };
}

export interface InstagramAccount {
  username: string;
  account_type: string;
  verified: boolean;
}

interface UseInstagramConnectReturn {
  isLoading: boolean;
  isConnected: boolean;
  account: InstagramAccount | null;
  connect: () => void;
  disconnect: () => Promise<void>;
}

export default function useInstagramConnect(): UseInstagramConnectReturn {
  const { profile, refetchProfile } = useProfile();
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const account = useMemo<InstagramAccount | null>(() => {
    if (!profile?.socials) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ig = (profile.socials as any[]).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => s.category === "instagram"
    );
    if (!ig) return null;
    const username = ig.link
      ? ig.link.replace(/.*instagram\.com\//, "").replace(/\/$/, "")
      : "";
    return {
      username,
      account_type: ig.account_type || "",
      verified: !!ig.verified,
    };
  }, [profile?.socials]);

  useEffect(() => {
    if (router.query.ig_connected === "true") {
      toast.success("Instagram connected!");
      refetchProfile?.();
      const { ig_connected: _ignored, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, {
        shallow: true,
      });
    }
    if (router.query.ig_error) {
      toast.error(`Instagram: ${router.query.ig_error}`);
      const { ig_error: _ignored, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, {
        shallow: true,
      });
    }
  }, [router.query.ig_connected, router.query.ig_error]); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = useCallback(() => {
    if (!profile) {
      toast.error("Please log in first");
      return;
    }
    if (!IG_APP_ID) {
      toast.error("Instagram not configured");
      return;
    }
    const redirectUri = `${APP_URL}/auth/instagram`;
    // Instagram Business Login (new API; Basic Display was deprecated Dec 2024).
    // Scopes: `instagram_business_basic` is the minimum for identity + username.
    // Add `instagram_business_content_publish` / `_manage_messages` / `_manage_comments`
    // later if quest features need them — narrower scope = faster user approval.
    const params = new URLSearchParams({
      enable_fb_login: "0",
      force_authentication: "1",
      client_id: IG_APP_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "instagram_business_basic",
    });
    window.location.href = `https://www.instagram.com/oauth/authorize?${params}`;
  }, [profile]);

  const disconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch(`${ZO_API}/api/v1/oauth/instagram/disconnect/`, {
        method: "DELETE",
        headers: getZoAuthHeaders(),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("Instagram disconnected");
        refetchProfile?.();
      } else {
        toast.error(data?.errors?.[0] || "Failed to disconnect");
      }
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setIsDisconnecting(false);
    }
  }, [refetchProfile]);

  return {
    isLoading: isDisconnecting,
    isConnected: account !== null,
    account,
    connect,
    disconnect,
  };
}
