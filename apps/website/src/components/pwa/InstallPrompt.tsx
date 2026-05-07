import { useEffect, useState } from "react";

/**
 * Floating "Install Zo" button.
 *
 * Two paths:
 *   1. Chrome/Android: listen for `beforeinstallprompt`, surface a button,
 *      call `prompt()` on click.
 *   2. iOS Safari: no programmatic install — show a small banner with the
 *      Add-to-Home-Screen instruction. Only shown when not already installed.
 *
 * Skipped entirely when:
 *   - already running standalone (`display-mode: standalone` matches)
 *   - user has dismissed it this session (localStorage flag)
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "zo-install-prompt-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS exposes navigator.standalone; everyone else uses the media query.
  const navStandalone = (window.navigator as Navigator & { standalone?: boolean })
    .standalone;
  if (navStandalone) return true;
  return window.matchMedia?.("(display-mode: standalone)").matches ?? false;
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  // iPadOS 13+ reports as Mac; check for touch + Apple as a stand-in.
  const isiOS = /iPhone|iPad|iPod/.test(ua);
  const isiPadOS =
    /Macintosh/.test(ua) && "ontouchend" in document;
  return isiOS || isiPadOS;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    if (isIOS()) {
      // iOS Safari never fires beforeinstallprompt; show the manual hint
      // after a short delay so it doesn't fight first paint.
      const timer = window.setTimeout(() => setShowIos(true), 4000);
      return () => {
        window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.clearTimeout(timer);
      };
    }

    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // localStorage unavailable (Safari private mode etc.) — fine to ignore.
    }
    setDeferred(null);
    setShowIos(false);
  };

  const installViaPrompt = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "dismissed") dismiss();
      else setDeferred(null);
    } catch {
      dismiss();
    }
  };

  if (deferred) {
    return (
      <div
        className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
      >
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/15 bg-black/85 px-4 py-2.5 text-sm text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur">
          <span className="font-semibold">Install Zo</span>
          <button
            onClick={() => void installViaPrompt()}
            className="rounded-full bg-[#F5C542] px-3 py-1 text-xs font-semibold text-black hover:brightness-110"
          >
            Add to home
          </button>
          <button
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="text-white/55 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  if (showIos) {
    return (
      <div
        className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
      >
        <div className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/15 bg-black/85 px-4 py-3 text-xs text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex-1 leading-5">
            <span className="font-semibold">Install Zo on iPhone:</span>{" "}
            tap <span aria-hidden>⎙</span> Share, then{" "}
            <span className="font-semibold">Add to Home Screen</span>.
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss install hint"
            className="text-white/55 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return null;
}
