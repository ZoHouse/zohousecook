import { useCallback, useMemo } from "react";
import { useProfile } from "@zo/auth";
import { toast } from "sonner";

/**
 * Stub hook — the full IG Connect flow is being rewritten against Daya's
 * new Zo backend. See `docs/superpowers/plans/2026-04-16-instagram-connect-v2.md`
 * for the implementation plan (held until passport lobby PR merges).
 *
 * For now:
 * - Reads IG state from `profile.socials` (category === "instagram") so
 *   users who already connected via the legacy dashboard flow see their
 *   account here.
 * - `connect()` shows a "coming soon" toast (no more broken redirect to
 *   /api/auth/instagram/* routes that don't exist in the website app).
 * - `disconnect()` is a no-op toast.
 */

export interface InstagramAccount {
  ig_username: string;
  display_name: string;
  followers_count: number;
  profile_picture_url: string | null;
  biography: string | null;
  connected_at: string;
}

interface UseInstagramConnectReturn {
  isLoading: boolean;
  isConnected: boolean;
  account: InstagramAccount | null;
  connect: () => void;
  disconnect: () => Promise<void>;
  refetch: () => void;
}

export default function useInstagramConnect(): UseInstagramConnectReturn {
  const { profile } = useProfile();

  const account = useMemo<InstagramAccount | null>(() => {
    if (!profile?.socials) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ig = (profile.socials as any[]).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => s?.category === "instagram"
    );
    if (!ig) return null;
    const username = ig.link
      ? String(ig.link).replace(/.*instagram\.com\//i, "").replace(/\/$/, "")
      : "";
    return {
      ig_username: username,
      display_name: username,
      followers_count: 0,
      profile_picture_url: null,
      biography: null,
      connected_at: "",
    };
  }, [profile?.socials]);

  const connect = useCallback(() => {
    if (!profile) {
      toast.error("Please log in first");
      return;
    }
    toast("Instagram Connect is rolling out soon", {
      description:
        "We're rebuilding IG OAuth on our new backend. Get early access by upgrading to Pro.",
    });
  }, [profile]);

  const disconnect = useCallback(async () => {
    toast("Not available yet", {
      description: "Reconnect will be live once IG v2 ships.",
    });
  }, []);

  const refetch = useCallback(() => {
    // No-op — status comes from profile.socials which refetches via useProfile
  }, []);

  return {
    isLoading: false,
    isConnected: account !== null,
    account,
    connect,
    disconnect,
    refetch,
  };
}
