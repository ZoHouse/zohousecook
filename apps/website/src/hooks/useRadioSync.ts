import { useState, useCallback, useRef, useEffect } from "react";

const RADIO_API =
  process.env.NEXT_PUBLIC_ZO_RADIO_URL ||
  "https://zo-radio-production.up.railway.app";

interface NowPlayingData {
  song: {
    id: string;
    title: string;
    artist: string;
    mood: string;
    genre: string;
  };
  seekTo: number;
  duration: number;
  slot: { name: string; mood: string; djName: string; voice: string };
  nextSong: { id: string; title: string; artist: string };
  previousSong: { id: string; title: string; artist: string };
  playlistIndex: number;
  playlistLength: number;
  serverTime: number;
}

interface RadioState {
  status:
    | "prefetching"
    | "ready"
    | "loading"
    | "playing"
    | "dj-speaking"
    | "error";
  currentSong: NowPlayingData["song"] | null;
  slot: NowPlayingData["slot"] | null;
  djScript: string;
  error: string | null;
}

function getDJStyle(mood: string): string {
  const styles: Record<string, string> = {
    energetic:
      "Morning energy at a Zo House. You sound like the first person up making chai for everyone. Warm, excited, ready to build.",
    chill: "Midday wind-down vibes. You sound like someone on the common room couch after a productive morning.",
    focus:
      "Deep work hours. You are the quietest DJ — minimal words, maximum respect for concentration.",
    romantic:
      "Pre-dawn intimacy. You sound like a late-night conversation on the rooftop that got deep.",
    party:
      "Evening gathering energy. You sound like the one who just connected the aux at a Zo House party. Bold, warm, inclusive.",
    "late-night":
      "Post-midnight philosopher. You sound like the last three people awake in the kitchen having the realest conversation.",
  };
  return styles[mood] || styles.chill;
}

export function useRadioSync() {
  const [state, setState] = useState<RadioState>({
    status: "prefetching",
    currentSong: null,
    slot: null,
    djScript: "",
    error: null,
  });

  const playerRef = useRef<YT.Player | null>(null);
  const currentSongIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const djPlayedForRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isActiveRef = useRef(false);
  const prefetchedRef = useRef<NowPlayingData | null>(null);
  const playerReadyRef = useRef(false);
  const transitionInProgressRef = useRef(false);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const monitorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prefetchStartedForRef = useRef<string | null>(null);
  const crossfadeStartedForRef = useRef<string | null>(null);
  const serverFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const performCrossfadeRef = useRef<() => void>(() => {});
  const prefetchedDJRef = useRef<{
    audioBlob: Blob;
    script: string;
    forSongId: string;
  } | null>(null);
  const latestDataRef = useRef<NowPlayingData | null>(null);
  const crossfadeCompletedAtRef = useRef<number>(0);
  const durationReportedForRef = useRef<Set<string>>(new Set());
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNowPlaying = useCallback(
    async (): Promise<NowPlayingData | null> => {
      try {
        const res = await fetch(`${RADIO_API}/api/radio/now-playing`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return await res.json();
      } catch (err) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: err instanceof Error ? err.message : "Failed to connect",
        }));
        return null;
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    fetchNowPlaying().then((data) => {
      if (cancelled || !data) return;
      prefetchedRef.current = data;
      setState((prev) => ({ ...prev, status: "ready", slot: data.slot }));
    });
    return () => {
      cancelled = true;
    };
  }, [fetchNowPlaying]);

  const fadeVolume = useCallback(
    (target: number, durationMs = 800): Promise<void> => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
      const player = playerRef.current;
      if (!player) return Promise.resolve();

      return new Promise<void>((resolve) => {
        const start = player.getVolume();
        if (Math.abs(start - target) < 2) {
          player.setVolume(target);
          resolve();
          return;
        }
        const steps = Math.max(10, Math.floor(durationMs / 50));
        const stepMs = durationMs / steps;
        const delta = (target - start) / steps;
        let step = 0;

        fadeIntervalRef.current = setInterval(() => {
          step++;
          if (step >= steps) {
            player.setVolume(target);
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
            resolve();
          } else {
            player.setVolume(Math.round(start + delta * step));
          }
        }, stepMs);
      });
    },
    []
  );

  const createDJAudio = useCallback(
    async (
      blob: Blob
    ): Promise<{ audio: HTMLAudioElement; done: Promise<void> }> => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.volume = 1.0;

      const done = new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.play().catch(() => {
          URL.revokeObjectURL(url);
          resolve();
        });
      });

      return { audio, done };
    },
    []
  );

  const generateDJClipOnce = useCallback(
    async (
      slot: NowPlayingData["slot"],
      previousSong: { title: string; artist: string },
      nextSong: { id?: string; title: string; artist: string }
    ): Promise<{ blob: Blob; script: string } | null> => {
      const scriptRes = await fetch(`${RADIO_API}/api/dj/script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: slot.mood,
          previousSong,
          nextSong,
          djName: slot.djName,
          djStyle: getDJStyle(slot.mood),
        }),
      });
      if (!scriptRes.ok) return null;
      const { script } = await scriptRes.json();

      const ttsRes = await fetch(`${RADIO_API}/api/dj/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: script, voice: slot.voice }),
      });
      if (!ttsRes.ok) return null;

      const blob = await ttsRes.blob();
      return { blob, script };
    },
    []
  );

  const generateDJClip = useCallback(
    async (
      slot: NowPlayingData["slot"],
      previousSong: { title: string; artist: string },
      nextSong: { id?: string; title: string; artist: string }
    ): Promise<{ blob: Blob; script: string } | null> => {
      try {
        const result = await generateDJClipOnce(slot, previousSong, nextSong);
        if (result) return result;
        await new Promise((r) => setTimeout(r, 500));
        return await generateDJClipOnce(slot, previousSong, nextSong);
      } catch {
        try {
          await new Promise((r) => setTimeout(r, 500));
          return await generateDJClipOnce(slot, previousSong, nextSong);
        } catch {
          return null;
        }
      }
    },
    [generateDJClipOnce]
  );

  const scheduleServerFallback = useCallback(
    (remainingSeconds: number) => {
      if (serverFallbackTimerRef.current)
        clearTimeout(serverFallbackTimerRef.current);
      if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);

      const prefetchMs = Math.max((remainingSeconds - 25) * 1000, 2000);
      prefetchTimerRef.current = setTimeout(() => {
        if (!isActiveRef.current || transitionInProgressRef.current) return;
        if (
          prefetchStartedForRef.current ===
          (currentSongIdRef.current || latestDataRef.current?.song.id)
        )
          return;
        const data = latestDataRef.current;
        if (!data) return;
        const songId = currentSongIdRef.current || data.song.id;
        prefetchStartedForRef.current = songId;
        generateDJClip(data.slot, data.song, data.nextSong).then((result) => {
          if (result && isActiveRef.current) {
            prefetchedDJRef.current = {
              audioBlob: result.blob,
              script: result.script,
              forSongId: data.nextSong.id,
            };
          }
        });
      }, prefetchMs);

      const fallbackMs = Math.max((remainingSeconds - 15) * 1000, 5000);
      serverFallbackTimerRef.current = setTimeout(() => {
        if (!isActiveRef.current || transitionInProgressRef.current) return;
        if (crossfadeStartedForRef.current) return;
        const data = latestDataRef.current;
        if (data) {
          crossfadeStartedForRef.current =
            currentSongIdRef.current || data.song.id;
          fadeVolume(15, 5000);
          performCrossfadeRef.current();
        }
      }, fallbackMs);
    },
    [fadeVolume, generateDJClip]
  );

  const performCrossfade = useCallback(async () => {
    if (!isActiveRef.current || transitionInProgressRef.current) return;
    transitionInProgressRef.current = true;

    const data = latestDataRef.current;
    if (!data) {
      transitionInProgressRef.current = false;
      return;
    }

    djPlayedForRef.current = data.nextSong.id;

    try {
      let djBlob: Blob | null = null;
      let djScript = "";

      const prefetched = prefetchedDJRef.current;
      if (prefetched && prefetched.forSongId === data.nextSong.id) {
        djBlob = prefetched.audioBlob;
        djScript = prefetched.script;
        prefetchedDJRef.current = null;
      } else {
        prefetchedDJRef.current = null;
        fadeVolume(10, 3000);
        const result = await generateDJClip(
          data.slot,
          data.song,
          data.nextSong
        );
        if (result && isActiveRef.current) {
          djBlob = result.blob;
          djScript = result.script;
        }
      }

      if (!isActiveRef.current) return;

      if (djBlob) {
        setState((prev) => ({ ...prev, djScript, status: "dj-speaking" }));
        fadeVolume(8, 1000);

        const { audio: djAudio, done: djDone } = await createDJAudio(djBlob);

        const nextSong = data.nextSong;
        const loadNextSongUnderDJ = () => {
          if (!djAudio.duration || !isActiveRef.current) return;
          const checkInterval = setInterval(() => {
            if (!djAudio.duration) return;
            const progress = djAudio.currentTime / djAudio.duration;
            if (progress > 0.75) {
              clearInterval(checkInterval);
              const player = playerRef.current;
              if (player) {
                currentSongIdRef.current = nextSong.id;
                player.setVolume(0);
                player.loadVideoById({ videoId: nextSong.id, startSeconds: 0 });
                setState((prev) => ({
                  ...prev,
                  currentSong: {
                    id: nextSong.id,
                    title: nextSong.title,
                    artist: nextSong.artist,
                    mood: data.slot.mood,
                    genre: prev.currentSong?.genre || "",
                  },
                }));
                fetchNowPlaying().then((fresh) => {
                  if (fresh) {
                    latestDataRef.current =
                      fresh.song.id === nextSong.id
                        ? fresh
                        : {
                            ...fresh,
                            song: {
                              id: nextSong.id,
                              title: nextSong.title,
                              artist: nextSong.artist,
                              mood: data.slot.mood,
                              genre: "",
                            },
                          };
                  }
                });
              }
            }
          }, 200);
          djAudio.addEventListener("ended", () => clearInterval(checkInterval), {
            once: true,
          });
        };

        setTimeout(loadNextSongUnderDJ, 500);
        await djDone;
      } else {
        await fadeVolume(0, 2000);
        const nextSong = data.nextSong;
        if (isActiveRef.current && playerRef.current) {
          currentSongIdRef.current = nextSong.id;
          playerRef.current.setVolume(0);
          playerRef.current.loadVideoById({
            videoId: nextSong.id,
            startSeconds: 0,
          });
          setState((prev) => ({
            ...prev,
            currentSong: {
              id: nextSong.id,
              title: nextSong.title,
              artist: nextSong.artist,
              mood: data.slot.mood,
              genre: prev.currentSong?.genre || "",
            },
            slot: data.slot,
          }));
          fetchNowPlaying().then((fresh) => {
            if (fresh) {
              latestDataRef.current =
                fresh.song.id === nextSong.id
                  ? fresh
                  : {
                      ...fresh,
                      song: {
                        id: nextSong.id,
                        title: nextSong.title,
                        artist: nextSong.artist,
                        mood: data.slot.mood,
                        genre: "",
                      },
                    };
            }
          });
        }
      }

      if (!isActiveRef.current) return;

      const player = playerRef.current;
      if (player) {
        if (currentSongIdRef.current !== data.nextSong.id) {
          currentSongIdRef.current = data.nextSong.id;
          player.setVolume(0);
          player.loadVideoById({
            videoId: data.nextSong.id,
            startSeconds: 0,
          });
          setState((prev) => ({
            ...prev,
            currentSong: {
              id: data.nextSong.id,
              title: data.nextSong.title,
              artist: data.nextSong.artist,
              mood: data.slot.mood,
              genre: prev.currentSong?.genre || "",
            },
            slot: data.slot,
          }));
        }

        await new Promise((r) => setTimeout(r, 500));
        await fadeVolume(80, 2500);
      }

      setState((prev) => ({ ...prev, status: "playing", djScript: "" }));
      crossfadeCompletedAtRef.current = Date.now();
      prefetchStartedForRef.current = null;
      crossfadeStartedForRef.current = null;

      const freshData = latestDataRef.current;
      if (freshData) {
        const remaining = freshData.duration - freshData.seekTo;
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        pollTimerRef.current = setTimeout(
          syncToServerFn,
          Math.min(remaining * 1000 + 2000, 30000)
        );
        scheduleServerFallback(remaining);
      }
    } catch {
      const fresh = await fetchNowPlaying();
      if (fresh && playerRef.current && isActiveRef.current) {
        currentSongIdRef.current = fresh.song.id;
        latestDataRef.current = fresh;
        playerRef.current.loadVideoById({
          videoId: fresh.song.id,
          startSeconds: fresh.seekTo,
        });
        playerRef.current.setVolume(80);
        setState((prev) => ({
          ...prev,
          currentSong: fresh.song,
          slot: fresh.slot,
          status: "playing",
          djScript: "",
        }));
      }
    } finally {
      transitionInProgressRef.current = false;
    }
  }, [
    fadeVolume,
    createDJAudio,
    generateDJClip,
    fetchNowPlaying,
    scheduleServerFallback,
  ]);

  performCrossfadeRef.current = performCrossfade;

  const startMonitor = useCallback(() => {
    if (monitorRef.current) clearInterval(monitorRef.current);

    monitorRef.current = setInterval(() => {
      if (!isActiveRef.current || transitionInProgressRef.current) return;

      const player = playerRef.current;
      const data = latestDataRef.current;
      if (!player || !data) return;

      let ytDuration: number;
      let ytCurrent: number;
      try {
        ytDuration = player.getDuration();
        ytCurrent = player.getCurrentTime();
      } catch {
        return;
      }

      if (!ytDuration || ytDuration <= 0) return;

      const actualSongId = currentSongIdRef.current || data.song.id;
      if (
        !durationReportedForRef.current.has(actualSongId) &&
        Math.abs(ytDuration - data.duration) > 2
      ) {
        durationReportedForRef.current.add(actualSongId);
        fetch(`${RADIO_API}/api/radio/duration-correction`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            songId: actualSongId,
            actualDuration: ytDuration,
          }),
        }).catch(() => {});
      }

      const remaining = ytDuration - ytCurrent;

      if (
        remaining < 26 &&
        remaining > 5 &&
        prefetchStartedForRef.current !== actualSongId
      ) {
        prefetchStartedForRef.current = actualSongId;
        generateDJClip(data.slot, data.song, data.nextSong).then((result) => {
          if (result && isActiveRef.current) {
            prefetchedDJRef.current = {
              audioBlob: result.blob,
              script: result.script,
              forSongId: data.nextSong.id,
            };
          }
        });
      }

      if (
        remaining < 16 &&
        remaining > 2 &&
        crossfadeStartedForRef.current !== actualSongId
      ) {
        crossfadeStartedForRef.current = actualSongId;
        fadeVolume(15, 5000);
        performCrossfade();
      }
    }, 1000);
  }, [generateDJClip, fadeVolume, performCrossfade]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const syncToServerFn = useCallback(async () => {
    if (!isActiveRef.current) return;

    const data = await fetchNowPlaying();
    if (!data || !isActiveRef.current) return;

    latestDataRef.current = data;

    const player = playerRef.current;
    if (!player) return;

    const inGracePeriod =
      Date.now() - crossfadeCompletedAtRef.current < 10000;

    if (currentSongIdRef.current !== data.song.id) {
      if (transitionInProgressRef.current || inGracePeriod) {
        if (inGracePeriod && currentSongIdRef.current) {
          latestDataRef.current = {
            ...data,
            song: { ...data.song, id: currentSongIdRef.current },
          };
        }
        return;
      }

      const isOrganicTransition = currentSongIdRef.current !== null;

      if (isOrganicTransition) {
        performCrossfade();
        return;
      } else {
        currentSongIdRef.current = data.song.id;
        player.loadVideoById({
          videoId: data.song.id,
          startSeconds: data.seekTo,
        });
        player.setVolume(80);
        startMonitor();

        setState((prev) => ({
          ...prev,
          currentSong: data.song,
          slot: data.slot,
          status: "playing",
          error: null,
        }));

        djPlayedForRef.current = data.song.id;
        generateDJClip(
          data.slot,
          null as unknown as { title: string; artist: string },
          data.song
        ).then(async (result) => {
          if (!result || !isActiveRef.current) return;
          setState((prev) => ({
            ...prev,
            djScript: result.script,
            status: "dj-speaking",
          }));
          await fadeVolume(12, 600);
          const { done } = await createDJAudio(result.blob);
          await done;
          await new Promise((r) => setTimeout(r, 400));
          await fadeVolume(80, 1000);
          if (isActiveRef.current) {
            setState((prev) => ({
              ...prev,
              status: "playing",
              djScript: "",
            }));
          }
        });

        const firstRemaining = data.duration - data.seekTo;
        scheduleServerFallback(firstRemaining);
      }
    } else {
      setState((prev) => ({
        ...prev,
        slot: data.slot,
        status: prev.status === "dj-speaking" ? "dj-speaking" : "playing",
        error: null,
      }));
    }

    const remainingSeconds = data.duration - data.seekTo;
    const nextCheckMs = Math.min(remainingSeconds * 1000 + 2000, 30000);
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = setTimeout(syncToServerFn, nextCheckMs);
  }, [
    fetchNowPlaying,
    performCrossfade,
    startMonitor,
    generateDJClip,
    fadeVolume,
    createDJAudio,
    scheduleServerFallback,
  ]);

  const tuneIn = useCallback(() => {
    isActiveRef.current = true;

    const player = playerRef.current;
    const data = prefetchedRef.current;

    if (!player || !data) {
      setState((prev) => ({ ...prev, status: "loading", error: null }));
      syncToServerFn();
      return;
    }

    const elapsed = Math.floor((Date.now() - data.serverTime) / 1000);
    const adjustedSeek = data.seekTo + elapsed;

    currentSongIdRef.current = data.song.id;
    latestDataRef.current = { ...data, seekTo: adjustedSeek };
    player.loadVideoById({
      videoId: data.song.id,
      startSeconds: adjustedSeek,
    });
    player.setVolume(80);

    setState({
      status: "playing",
      currentSong: data.song,
      slot: data.slot,
      djScript: "",
      error: null,
    });

    startMonitor();

    djPlayedForRef.current = data.song.id;
    generateDJClip(
      data.slot,
      null as unknown as { title: string; artist: string },
      data.song
    ).then(async (result) => {
      if (!result || !isActiveRef.current) return;
      setState((prev) => ({
        ...prev,
        djScript: result.script,
        status: "dj-speaking",
      }));
      await fadeVolume(12, 600);
      const { done } = await createDJAudio(result.blob);
      await done;
      await new Promise((r) => setTimeout(r, 400));
      await fadeVolume(80, 1000);
      if (isActiveRef.current) {
        setState((prev) => ({ ...prev, status: "playing", djScript: "" }));
      }
    });

    const remaining = data.duration - adjustedSeek;
    pollTimerRef.current = setTimeout(
      syncToServerFn,
      Math.min(remaining * 1000 + 2000, 30000)
    );
    scheduleServerFallback(remaining);

    fetchNowPlaying().then((fresh) => {
      if (!fresh || !isActiveRef.current) return;
      latestDataRef.current = fresh;
      if (fresh.song.id !== currentSongIdRef.current) {
        currentSongIdRef.current = fresh.song.id;
        if (playerRef.current) {
          playerRef.current.loadVideoById({
            videoId: fresh.song.id,
            startSeconds: fresh.seekTo,
          });
        }
        setState((prev) => ({
          ...prev,
          currentSong: fresh.song,
          slot: fresh.slot,
        }));
      }
    });
  }, [
    fetchNowPlaying,
    syncToServerFn,
    startMonitor,
    generateDJClip,
    fadeVolume,
    createDJAudio,
    scheduleServerFallback,
  ]);

  const onPlayerEnd = useCallback(() => {
    if (!isActiveRef.current) return;
    if (transitionInProgressRef.current) return;
    performCrossfade();
  }, [performCrossfade]);

  const onPlayerReady = useCallback((event: { target: YT.Player }) => {
    playerRef.current = event.target;
    playerReadyRef.current = true;
    event.target.setVolume(80);
  }, []);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (monitorRef.current) clearInterval(monitorRef.current);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (serverFallbackTimerRef.current)
        clearTimeout(serverFallbackTimerRef.current);
      if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    tuneIn,
    playerRef,
    onPlayerReady,
    onPlayerEnd,
  };
}
