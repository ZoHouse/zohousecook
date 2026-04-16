import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useProfile } from "@zo/auth";

const ZO_API = process.env.API_BASE_URL || "https://api.io.zo.xyz";
const TIMEOUT_MS = 20000;

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

export default function InstagramCallbackPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const calledRef = useRef(false);

  // Timeout: if profile never loads, redirect with error after 20s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true;
        router.push("/passport?ig_error=auth_timeout");
      }
    }, TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (!router.isReady || calledRef.current) return;
    if (!profile) return;

    const rawCode = (router.query.code as string) || "";
    if (!rawCode) {
      calledRef.current = true;
      router.push("/passport?ig_error=no_code");
      return;
    }

    const code = rawCode.replace(/#_$/, "");
    calledRef.current = true;

    fetch(`${ZO_API}/api/v1/oauth/instagram/connect/`, {
      method: "POST",
      headers: getZoAuthHeaders(),
      body: JSON.stringify({ code }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          router.push("/passport?ig_connected=true");
        } else {
          router.push(
            `/passport?ig_error=${encodeURIComponent(
              data?.errors?.[0] || "connect_failed"
            )}`
          );
        }
      })
      .catch(() => {
        router.push("/passport?ig_error=connect_failed");
      });
  }, [router.isReady, router.query.code, profile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <p className="text-white/60 text-sm">Connecting Instagram...</p>
    </div>
  );
}
