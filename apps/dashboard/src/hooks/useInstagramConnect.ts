import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useProfile } from "@zo/auth";
import { toast } from "sonner";

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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<InstagramAccount | null>(null);

  const zoUserCode = profile?.code as string | undefined;
  const basePath = router.basePath || "";

  const fetchStatus = useCallback(async () => {
    if (!zoUserCode) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${basePath}/api/auth/instagram/status?zo_user_code=${encodeURIComponent(zoUserCode)}`
      );
      const data = await res.json();
      setAccount(data.connected ? data.account : null);
    } catch {
      setAccount(null);
    } finally {
      setIsLoading(false);
    }
  }, [zoUserCode, basePath]);

  // Fetch on mount and when zoUserCode changes
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle query params from OAuth redirect
  useEffect(() => {
    if (router.query.ig_connected === "true") {
      toast.success("Instagram connected!");
      fetchStatus();
      const { ig_connected: _ig_connected, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, {
        shallow: true,
      });
    }
    if (router.query.ig_error) {
      toast.error(`Instagram: ${router.query.ig_error}`);
      const { ig_error: _ig_error, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, {
        shallow: true,
      });
    }
  }, [router.query.ig_connected, router.query.ig_error]); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = useCallback(() => {
    if (!zoUserCode) {
      toast.error("Please log in first");
      return;
    }
    window.location.href = `${basePath}/api/auth/instagram?zo_user_code=${encodeURIComponent(zoUserCode)}`;
  }, [zoUserCode, basePath]);

  const disconnect = useCallback(async () => {
    if (!zoUserCode) return;

    try {
      const res = await fetch(`${basePath}/api/auth/instagram/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zo_user_code: zoUserCode }),
      });
      if (res.ok) {
        setAccount(null);
        toast.success("Instagram disconnected");
      } else {
        toast.error("Failed to disconnect");
      }
    } catch {
      toast.error("Failed to disconnect");
    }
  }, [zoUserCode, basePath]);

  return {
    isLoading,
    isConnected: account !== null,
    account,
    connect,
    disconnect,
    refetch: fetchStatus,
  };
}
