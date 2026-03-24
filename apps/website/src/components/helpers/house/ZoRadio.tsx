import { cn } from "@zo/utils/font";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { rubikClassName } from "../../utils/font";

const ZO_RADIO_API = "https://zo-radio-production.up.railway.app";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type YTPlayer = any;

// --- YouTube IFrame API loader (SSR-safe) ---
let ytApiLoaded = false;
let ytApiCallbacks: (() => void)[] = [];

function loadYTApi(cb: () => void) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).YT?.Player) {
    ytApiLoaded = true;
    cb();
    return;
  }
  if (ytApiLoaded) { cb(); return; }
  ytApiCallbacks.push(cb);
  if (ytApiCallbacks.length > 1) return;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  tag.onerror = () => { ytApiCallbacks = []; };
  document.head.appendChild(tag);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = (window as any).onYouTubeIframeAPIReady;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).onYouTubeIframeAPIReady = () => {
    ytApiLoaded = true;
    if (typeof existing === "function") existing();
    ytApiCallbacks.forEach((fn) => fn());
    ytApiCallbacks = [];
  };
}

// --- Smooth volume fade for YouTube player ---
function fadeVolume(
  player: YTPlayer,
  from: number,
  to: number,
  durationMs: number,
  onDone?: () => void
): ReturnType<typeof setInterval> | null {
  if (!player) { onDone?.(); return null; }
  const steps = 20;
  const stepMs = durationMs / steps;
  const stepSize = (to - from) / steps;
  let current = from;
  let step = 0;
  try { player.setVolume(from); } catch { /* ignore */ }
  const interval = setInterval(() => {
    step++;
    current += stepSize;
    try { player.setVolume(Math.round(current)); } catch { /* ignore */ }
    if (step >= steps) {
      clearInterval(interval);
      try { player.setVolume(to); } catch { /* ignore */ }
      onDone?.();
    }
  }, stepMs);
  return interval;
}

interface NowPlayingData {
  song: { id: string; title: string; artist: string; mood: string };
  seekTo: number;
  duration: number;
  slot: { name: string; mood: string; djName: string; voice: string };
  previousSong: { id: string; title: string; artist: string };
  serverTime: number;
}

const DJ_STYLES: Record<string, string> = {
  energetic: "Morning energy at a Zo House. Warm, excited, ready to build.",
  chill: "Midday wind-down vibes. Calm, reflective, afternoon light.",
  focus: "Deep work hours. Minimal words, maximum respect for concentration.",
  romantic: "Pre-dawn intimacy. Late-night conversation on the rooftop.",
  party: "Evening gathering energy. Bold, warm, inclusive.",
  "late-night": "Post-midnight philosopher. The last people awake having the realest conversation.",
};

const MUSIC_VOLUME = 80;
const DJ_BED_VOLUME = 10; // music bed under Suki's voice
const FADE_DOWN_MS = 2000; // 2s fade down before Suki
const FADE_UP_MS = 3000; // 3s fade up after Suki
const CROSSFADE_MS = 3000; // 3s crossfade between songs
const CROSSFADE_LEAD_S = 5; // start crossfade 5s before song ends
const YT_POLL_INTERVAL = 1000; // check YouTube position every 1s

const ZoRadio: React.FC = () => {
  const [playing, setPlaying] = useState(false);
  const [songInfo, setSongInfo] = useState<{
    title: string;
    artist: string;
    slotName: string;
  } | null>(null);
  const [djScript, setDjScript] = useState<string | null>(null);

  const playerRef = useRef<YTPlayer>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ytPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIdRef = useRef<string | null>(null);
  const activeRef = useRef(false);
  const djPlayedForRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const crossfadingRef = useRef(false);

  const fetchNowPlaying = useCallback(async (): Promise<NowPlayingData | null> => {
    try {
      const res = await fetch(`${ZO_RADIO_API}/api/radio/now-playing`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  // --- DJ clip with proper radio crossfade ---
  const playDJClip = useCallback(async (data: NowPlayingData) => {
    if (!activeRef.current) return;
    if (djPlayedForRef.current === data.song.id) return;

    djPlayedForRef.current = data.song.id;
    console.log("[zo-radio] DJ starting for:", data.song.title);

    try {
      // 1. Fade music DOWN (2s smooth fade)
      await new Promise<void>((resolve) => {
        fadeRef.current = fadeVolume(
          playerRef.current,
          MUSIC_VOLUME,
          DJ_BED_VOLUME,
          FADE_DOWN_MS,
          resolve
        );
      });

      if (!activeRef.current) throw new Error("stopped");

      // 2. Fetch DJ script
      console.log("[zo-radio] Fetching script...");
      const scriptRes = await fetch(`${ZO_RADIO_API}/api/dj/script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: data.slot.mood,
          previousSong: data.previousSong,
          nextSong: data.song,
          djName: data.slot.djName,
          djStyle: DJ_STYLES[data.slot.mood] || DJ_STYLES.chill,
        }),
      });

      if (!scriptRes.ok) {
        console.warn("[zo-radio] Script failed:", scriptRes.status);
        throw new Error("skip");
      }
      if (!activeRef.current) throw new Error("stopped");

      const { script } = await scriptRes.json();
      console.log("[zo-radio] Suki:", script);
      setDjScript(script);

      // 3. Fetch TTS audio
      console.log("[zo-radio] Fetching TTS...");
      const ttsRes = await fetch(`${ZO_RADIO_API}/api/dj/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: script, voice: data.slot.voice }),
      });

      if (!ttsRes.ok) {
        console.warn("[zo-radio] TTS failed:", ttsRes.status);
        throw new Error("skip");
      }
      if (!activeRef.current) throw new Error("stopped");

      const blob = await ttsRes.blob();
      console.log("[zo-radio] TTS received, size:", blob.size);
      const url = URL.createObjectURL(blob);

      // 4. Play Suki's voice at full volume over the music bed
      await new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.volume = 1.0;

        audio.onended = () => {
          console.log("[zo-radio] Suki finished");
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.play().catch((err) => {
          console.warn("[zo-radio] Audio play blocked:", err);
          URL.revokeObjectURL(url);
          resolve();
        });
      });

      if (!activeRef.current) throw new Error("stopped");

      // 5. Fade music back UP (3s smooth fade)
      await new Promise<void>((resolve) => {
        fadeRef.current = fadeVolume(
          playerRef.current,
          DJ_BED_VOLUME,
          MUSIC_VOLUME,
          FADE_UP_MS,
          resolve
        );
      });
    } catch (err) {
      console.warn("[zo-radio] DJ error:", err);
      // Always restore volume on error
      try { playerRef.current?.setVolume(MUSIC_VOLUME); } catch { /* ignore */ }
    } finally {
      if (fadeRef.current) { clearInterval(fadeRef.current); fadeRef.current = null; }
      if (activeRef.current) setDjScript(null);
    }
  }, []);

  const syncRef = useRef<(crossfade?: boolean) => void>(() => {});

  // --- Monitor YouTube playback and trigger crossfade at the right time ---
  const startYTPoll = useCallback(() => {
    if (ytPollRef.current) clearInterval(ytPollRef.current);
    ytPollRef.current = setInterval(() => {
      if (!activeRef.current || crossfadingRef.current) return;
      const player = playerRef.current;
      if (!player) return;
      try {
        const ytDuration = player.getDuration();
        const ytCurrent = player.getCurrentTime();
        if (!ytDuration || ytDuration <= 0) return;
        const remaining = ytDuration - ytCurrent;
        if (remaining < CROSSFADE_LEAD_S && remaining > 1) {
          crossfadingRef.current = true;
          syncRef.current(true);
        }
      } catch { /* player not ready */ }
    }, YT_POLL_INTERVAL);
  }, []);

  // --- Sync to server and play ---
  const syncAndPlay = useCallback(async (crossfade = false) => {
    if (!activeRef.current) return;

    const data = await fetchNowPlaying();
    if (!data || !activeRef.current) return;

    const player = playerRef.current;
    if (!player) return;

    const isNewSong = currentIdRef.current !== data.song.id;

    try {
      if (isNewSong) {
        if (crossfade && currentIdRef.current) {
          await new Promise<void>((resolve) => {
            fadeRef.current = fadeVolume(
              player,
              MUSIC_VOLUME,
              0,
              CROSSFADE_MS,
              resolve
            );
          });
          if (!activeRef.current) return;
        }

        currentIdRef.current = data.song.id;
        setSongInfo({
          title: data.song.title,
          artist: data.song.artist,
          slotName: data.slot.name,
        });

        player.loadVideoById({
          videoId: data.song.id,
          startSeconds: data.seekTo,
        });
        player.setVolume(0);
        player.playVideo();

        await new Promise<void>((resolve) => {
          fadeRef.current = fadeVolume(
            player,
            0,
            MUSIC_VOLUME,
            CROSSFADE_MS,
            resolve
          );
        });

        crossfadingRef.current = false;
        playDJClip(data);
      } else {
        setSongInfo({
          title: data.song.title,
          artist: data.song.artist,
          slotName: data.slot.name,
        });
        player.setVolume(MUSIC_VOLUME);
        player.playVideo();
        crossfadingRef.current = false;
      }
    } catch {
      crossfadingRef.current = false;
    }

    // Start polling YouTube's actual playback position
    startYTPoll();
  }, [fetchNowPlaying, playDJClip, startYTPoll]);

  // Keep ref in sync so YT poll can call latest syncAndPlay
  syncRef.current = syncAndPlay;

  const cleanup = useCallback(() => {
    activeRef.current = false;
    crossfadingRef.current = false;
    if (pollRef.current) clearTimeout(pollRef.current);
    if (ytPollRef.current) clearInterval(ytPollRef.current);
    if (fadeRef.current) clearInterval(fadeRef.current);
    pollRef.current = null;
    ytPollRef.current = null;
    fadeRef.current = null;
    try { audioRef.current?.pause(); audioRef.current = null; } catch { /* ignore */ }
    try { playerRef.current?.stopVideo(); playerRef.current?.destroy(); } catch { /* ignore */ }
    playerRef.current = null;
    currentIdRef.current = null;
    djPlayedForRef.current = null;
    if (containerRef.current) containerRef.current.innerHTML = "";
  }, []);

  const toggle = useCallback(() => {
    if (playing) {
      cleanup();
      setPlaying(false);
      setSongInfo(null);
      setDjScript(null);
      return;
    }

    setPlaying(true);
    activeRef.current = true;

    loadYTApi(() => {
      if (!activeRef.current || !containerRef.current) return;
      const div = document.createElement("div");
      div.id = "zo-radio-yt-" + Date.now();
      containerRef.current.appendChild(div);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const YT = (window as any).YT;
      if (!YT?.Player) {
        setPlaying(false);
        activeRef.current = false;
        return;
      }

      new YT.Player(div.id, {
        height: "1",
        width: "1",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onReady: (e: any) => {
            if (!activeRef.current) return;
            playerRef.current = e.target;
            syncAndPlay();
          },
          onError: () => {
            if (activeRef.current && pollRef.current === null) {
              pollRef.current = setTimeout(syncAndPlay, 3000);
            }
          },
        },
      });
    });
  }, [playing, syncAndPlay, cleanup]);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (pollRef.current) clearTimeout(pollRef.current);
      if (ytPollRef.current) clearInterval(ytPollRef.current);
      if (fadeRef.current) clearInterval(fadeRef.current);
      try { audioRef.current?.pause(); playerRef.current?.stopVideo(); playerRef.current?.destroy(); } catch { /* ignore */ }
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="fixed w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
        aria-hidden="true"
      />
      <button
        onClick={toggle}
        className={cn(
          "inline-flex items-center gap-2.5 px-4 py-2 rounded-full inner-border hover:bg-white/5 transition-all cursor-pointer",
          playing && "bg-white/5",
          rubikClassName
        )}
      >
        {playing ? (
          <>
            <span className="flex items-end gap-[2px] h-3">
              {[1, 2, 3, 2, 1].map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] bg-red-400 rounded-full animate-pulse"
                  style={{
                    height: `${h * 4}px`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: `${0.5 + i * 0.1}s`,
                  }}
                />
              ))}
            </span>
            <span className="text-sm text-zui-white/90 max-w-[200px] truncate">
              {djScript ? "Suki on air..." : songInfo?.title}
            </span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-zui-white/70">Zo Zo Zo: Tune In</span>
          </>
        )}
      </button>
    </>
  );
};

export default ZoRadio;
