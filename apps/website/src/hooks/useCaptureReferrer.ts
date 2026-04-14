import { useEffect } from "react";

const REFERRER_KEY = "zo_referrer";

export function useCaptureReferrer(handle: string | null) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!handle) return;
    if (window.localStorage.getItem(REFERRER_KEY)) return;
    window.localStorage.setItem(REFERRER_KEY, handle);
  }, [handle]);
}

export function readReferrer(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFERRER_KEY);
}
