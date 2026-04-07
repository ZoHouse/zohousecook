import { useState, useRef, useCallback, useEffect } from "react";
import { useRadioAutoplay } from "./HouseWrapper";
import { useRadioSync } from "../../../hooks/useRadioSync";

let ytApiLoaded = false;
let ytApiReady = false;
const ytReadyCallbacks: (() => void)[] = [];

function loadYTApi() {
  if (ytApiLoaded) return;
  ytApiLoaded = true;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
  (window as any).onYouTubeIframeAPIReady = () => {
    ytApiReady = true;
    ytReadyCallbacks.forEach((cb) => cb());
    ytReadyCallbacks.length = 0;
  };
}

function onYTReady(cb: () => void) {
  if (ytApiReady) { cb(); return; }
  ytReadyCallbacks.push(cb);
}

export function ZoRadioPill() {
  const autoplay = useRadioAutoplay();
  const { status, currentSong, slot, djScript, tuneIn, playerRef, onPlayerReady, onPlayerEnd } = useRadioSync();
  const containerRef = useRef<HTMLDivElement>(null);
  const playerCreatedRef = useRef(false);
  const autoStarted = useRef(false);
  const [paused, setPaused] = useState(false);

  const isActive = status === "playing" || status === "dj-speaking";
  const isPlaying = isActive && !paused;
  const isDJSpeaking = status === "dj-speaking" && !paused;
  const songTitle = currentSong?.title || "Zo Radio";
  const slotName = slot?.name || "";

  // Create hidden YouTube player on mount
  useEffect(() => {
    loadYTApi();
    onYTReady(() => {
      if (!containerRef.current || playerCreatedRef.current) return;
      playerCreatedRef.current = true;
      const div = document.createElement("div");
      div.id = "zo-radio-house-player";
      containerRef.current.appendChild(div);

      new (window as any).YT.Player("zo-radio-house-player", {
        height: "1",
        width: "1",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: (e: any) => {
            if (e.data === 0) onPlayerEnd();
          },
          onError: (e: any) => {
            console.warn("[ZoRadio] YouTube player error:", e.data);
          },
        },
      });
    });
  }, [onPlayerReady, onPlayerEnd]);

  // Auto-start when user clicks through frequency gate
  useEffect(() => {
    if (autoplay && !autoStarted.current && status === "ready") {
      autoStarted.current = true;
      tuneIn();
    }
  }, [autoplay, status, tuneIn]);

  const handleClick = useCallback(() => {
    if (isActive && !paused) {
      // Pause
      playerRef.current?.pauseVideo?.();
      setPaused(true);
    } else if (isActive && paused) {
      // Resume
      playerRef.current?.playVideo?.();
      setPaused(false);
    } else if (status === "ready" || status === "prefetching") {
      tuneIn();
    }
  }, [isActive, paused, status, tuneIn, playerRef]);

  return (
    <div className="flex items-center">
      <div ref={containerRef} className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none" />
      <div
        className="flex items-center gap-1.5 md:gap-2 rounded-full cursor-pointer select-none px-2 py-1 md:px-3 md:py-1.5 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 max-w-[160px] md:max-w-[260px]"
        onClick={handleClick}
      >
        <span className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform">
          {isPlaying ? (
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-white md:w-[10px] md:h-[10px]">
              <rect x="5" y="4" width="5" height="16" rx="1" />
              <rect x="14" y="4" width="5" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-neutral-400 md:w-[10px] md:h-[10px]">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          )}
        </span>
        {isPlaying ? (
          <span className="flex gap-[2px] items-end h-3 flex-shrink-0">
            <span className={`w-[2px] rounded-full animate-pulse h-2 ${isDJSpeaking ? "bg-amber-400" : "bg-white"}`} />
            <span className={`w-[2px] rounded-full animate-pulse h-3 ${isDJSpeaking ? "bg-amber-400" : "bg-white"}`} style={{ animationDelay: "150ms" }} />
            <span className={`w-[2px] rounded-full animate-pulse h-1.5 ${isDJSpeaking ? "bg-amber-400" : "bg-white"}`} style={{ animationDelay: "300ms" }} />
          </span>
        ) : (
          <span className="flex gap-[2px] items-end h-3 flex-shrink-0">
            <span className="w-[2px] bg-neutral-500 rounded-full h-1.5" />
            <span className="w-[2px] bg-neutral-500 rounded-full h-2" />
            <span className="w-[2px] bg-neutral-500 rounded-full h-1" />
          </span>
        )}
        <span className={`text-[9px] md:text-[10px] font-medium truncate ${isDJSpeaking ? "text-amber-400" : isPlaying ? "text-white" : "text-neutral-400"}`}>
          {paused ? "Paused" : isDJSpeaking ? (djScript ? djScript.slice(0, 30) + "..." : "RJ speaking...") : songTitle}
        </span>
        {slotName && !isDJSpeaking && !paused && (
          <span className={`text-[9px] flex-shrink-0 hidden md:inline px-1.5 py-0.5 rounded-full ${isPlaying ? "bg-white/10 text-white/50" : "bg-white/5 text-neutral-500"}`}>
            {slotName}
          </span>
        )}
      </div>
    </div>
  );
}
