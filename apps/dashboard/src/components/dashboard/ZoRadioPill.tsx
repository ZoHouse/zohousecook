import React, { useState, useRef, useCallback, useEffect } from "react";

const RADIO_API = "https://zo-radio-production.up.railway.app/api/radio/now-playing";

interface NowPlayingData {
  song: { id: string; title: string; artist: string };
  seekTo: number;
  duration: number;
  slot: { name: string; mood: string };
  serverTime: number;
}

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [songTitle, setSongTitle] = useState("Zo Radio");
  const [slotName, setSlotName] = useState("");
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentSongIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dataRef = useRef<NowPlayingData | null>(null);

  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch(RADIO_API);
      const data: NowPlayingData = await res.json();
      dataRef.current = data;
      const newTitle = data.song?.title || "Zo Radio";
      const newSlot = data.slot?.name || "";
      setSongTitle((prev) => (prev === newTitle ? prev : newTitle));
      setSlotName((prev) => (prev === newSlot ? prev : newSlot));
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchNowPlaying();
    loadYTApi();
  }, [fetchNowPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    pollRef.current = setInterval(async () => {
      const data = await fetchNowPlaying();
      if (data && playerRef.current && data.song.id !== currentSongIdRef.current) {
        const elapsed = Math.floor((Date.now() - data.serverTime) / 1000);
        const adjustedSeek = data.seekTo + elapsed;
        currentSongIdRef.current = data.song.id;
        playerRef.current.loadVideoById({ videoId: data.song.id, startSeconds: adjustedSeek });
        playerRef.current.setVolume(80);
      }
    }, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isPlaying, fetchNowPlaying]);

  const startPlaying = useCallback(async () => {
    const data = await fetchNowPlaying();
    if (!data) return;

    const elapsed = Math.floor((Date.now() - data.serverTime) / 1000);
    const adjustedSeek = data.seekTo + elapsed;

    if (playerRef.current) {
      currentSongIdRef.current = data.song.id;
      playerRef.current.loadVideoById({ videoId: data.song.id, startSeconds: adjustedSeek });
      playerRef.current.setVolume(80);
      setIsPlaying(true);
      return;
    }

    onYTReady(() => {
      if (!containerRef.current) return;
      const div = document.createElement("div");
      div.id = "zo-radio-player";
      containerRef.current.appendChild(div);

      playerRef.current = new (window as any).YT.Player("zo-radio-player", {
        height: "1",
        width: "1",
        videoId: data.song.id,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          start: adjustedSeek,
        },
        events: {
          onReady: (e: any) => {
            currentSongIdRef.current = data.song.id;
            e.target.setVolume(80);
            e.target.playVideo();
          },
          onStateChange: (e: any) => {
            if (e.data === 0) {
              fetchNowPlaying().then((next) => {
                if (next && playerRef.current) {
                  const el = Math.floor((Date.now() - next.serverTime) / 1000);
                  const adj = next.seekTo + el;
                  currentSongIdRef.current = next.song.id;
                  playerRef.current.loadVideoById({ videoId: next.song.id, startSeconds: adj });
                  playerRef.current.setVolume(80);
                }
              });
            }
          },
        },
      });
      setIsPlaying(true);
    });
  }, [fetchNowPlaying]);

  const stopPlaying = useCallback(() => {
    if (playerRef.current?.pauseVideo) {
      playerRef.current.pauseVideo();
    }
    setIsPlaying(false);
  }, []);

  const togglePlay = () => {
    if (isPlaying) stopPlaying();
    else startPlaying();
  };

  return (
    <div className="flex items-center gap-2">
      <div ref={containerRef} className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none" />

      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-dash-border hover:border-dash-border-hover transition-colors cursor-pointer select-none max-w-[300px]"
        onClick={togglePlay}
      >
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
          {isPlaying ? (
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-green-400">
              <rect x="5" y="4" width="5" height="16" rx="1" />
              <rect x="14" y="4" width="5" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-dash-text-50">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          )}
        </span>

        {isPlaying ? (
          <span className="flex gap-[2px] items-end h-3 flex-shrink-0">
            <span className="w-[2px] bg-green-400 rounded-full animate-pulse h-2" />
            <span className="w-[2px] bg-green-400 rounded-full animate-pulse h-3" style={{ animationDelay: "150ms" }} />
            <span className="w-[2px] bg-green-400 rounded-full animate-pulse h-1.5" style={{ animationDelay: "300ms" }} />
          </span>
        ) : (
          <span className="flex gap-[2px] items-end h-3 flex-shrink-0">
            <span className="w-[2px] bg-dash-text-40 rounded-full h-1.5" />
            <span className="w-[2px] bg-dash-text-40 rounded-full h-2" />
            <span className="w-[2px] bg-dash-text-40 rounded-full h-1" />
          </span>
        )}

        <span className={`text-[10px] font-medium truncate ${isPlaying ? "text-green-400" : "text-dash-text-60"}`}>
          {songTitle}
        </span>

        {slotName && (
          <span className={`text-[9px] flex-shrink-0 hidden sm:inline px-1.5 py-0.5 rounded-full ${isPlaying ? "bg-green-500/10 text-green-400/60" : "bg-white/5 text-dash-text-40"}`}>
            {slotName}
          </span>
        )}
      </div>
    </div>
  );
}
