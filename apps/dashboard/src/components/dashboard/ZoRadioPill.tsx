import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRadioSync } from "../../hooks/useRadioSync";

// Load YouTube IFrame API script once
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
  const { status, currentSong, slot, djScript, tuneIn, playerRef, onPlayerReady, onPlayerEnd } = useRadioSync();
  const containerRef = useRef<HTMLDivElement>(null);
  const playerCreatedRef = useRef(false);
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
      div.id = "zo-radio-dash-player";
      containerRef.current.appendChild(div);

      new (window as any).YT.Player("zo-radio-dash-player", {
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

  const handleClick = useCallback(() => {
    if (isActive && !paused) {
      // Pause playback
      if (playerRef.current?.pauseVideo) {
        playerRef.current.pauseVideo();
      }
      setPaused(true);
    } else if (isActive && paused) {
      // Resume playback
      if (playerRef.current?.playVideo) {
        playerRef.current.playVideo();
      }
      setPaused(false);
    } else if (status === "ready" || status === "prefetching") {
      setPaused(false);
      tuneIn();
    }
  }, [isActive, paused, status, tuneIn, playerRef]);

  return (
    <div className="flex items-center gap-2">
      <div ref={containerRef} className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none" />

      <div
        className="flex items-center gap-1.5 rounded-full cursor-pointer select-none
          sm:px-2.5 sm:py-1 sm:bg-white/5 sm:border sm:border-dash-border sm:hover:border-dash-border-hover sm:max-w-[300px] transition-colors"
        onClick={handleClick}
      >
        <span className="flex-shrink-0 w-8 h-8 sm:w-5 sm:h-5 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform">
          {isPlaying ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-green-400 sm:w-2 sm:h-2">
              <rect x="5" y="4" width="5" height="16" rx="1" />
              <rect x="14" y="4" width="5" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-dash-text-50 sm:w-2 sm:h-2">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          )}
        </span>

        {isPlaying ? (
          <span className="hidden sm:flex gap-[2px] items-end h-3 flex-shrink-0">
            <span className={`w-[2px] rounded-full animate-pulse h-2 ${isDJSpeaking ? "bg-amber-400" : "bg-green-400"}`} />
            <span className={`w-[2px] rounded-full animate-pulse h-3 ${isDJSpeaking ? "bg-amber-400" : "bg-green-400"}`} style={{ animationDelay: "150ms" }} />
            <span className={`w-[2px] rounded-full animate-pulse h-1.5 ${isDJSpeaking ? "bg-amber-400" : "bg-green-400"}`} style={{ animationDelay: "300ms" }} />
          </span>
        ) : (
          <span className="hidden sm:flex gap-[2px] items-end h-3 flex-shrink-0">
            <span className="w-[2px] bg-dash-text-40 rounded-full h-1.5" />
            <span className="w-[2px] bg-dash-text-40 rounded-full h-2" />
            <span className="w-[2px] bg-dash-text-40 rounded-full h-1" />
          </span>
        )}

        <span className={`hidden sm:inline text-[10px] font-medium truncate ${
          isDJSpeaking ? "text-amber-400" : isPlaying ? "text-green-400" : "text-dash-text-60"
        }`}>
          {isDJSpeaking
            ? (djScript ? djScript.slice(0, 30) + "..." : "RJ speaking...")
            : songTitle}
        </span>

        {slotName && !isDJSpeaking && (
          <span className={`text-[9px] flex-shrink-0 hidden sm:inline px-1.5 py-0.5 rounded-full ${
            isPlaying ? "bg-green-500/10 text-green-400/60" : "bg-white/5 text-dash-text-40"
          }`}>
            {slotName}
          </span>
        )}
      </div>
    </div>
  );
}
