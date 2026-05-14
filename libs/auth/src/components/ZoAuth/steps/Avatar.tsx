import { FC, useCallback, useEffect, useRef, useState } from "react";
import broSample from "../../../assets/bro-sample.svg";
import baeSample from "../../../assets/bae-sample.svg";
import useProfile from "../../../hooks/useProfile";

const AVATAR_SAMPLES = {
  bro: typeof broSample === "string" ? broSample : (broSample as any).src,
  bae: typeof baeSample === "string" ? baeSample : (baeSample as any).src,
};

interface AvatarProps {
  advanceOnboarding: () => void;
}

type BodyType = "bro" | "bae";
type Phase = "select" | "generating" | "done";

const Avatar: FC<AvatarProps> = ({ advanceOnboarding }) => {
  const { profile, updateProfile, refetchProfile } = useProfile();
  const [selected, setSelected] = useState<BodyType | null>(null);
  const [phase, setPhase] = useState<Phase>("select");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  // Snapshot the pre-generation avatar URL so polling can detect a *new*
  // one. Without this, a re-onboarding user (whose previous avatar URL is
  // already truthy on first refetch) saw the old avatar flash through to
  // the "Looking good!" screen.
  const prevAvatarUrlRef = useRef<string | undefined>(undefined);

  const displayName =
    profile?.custom_nickname?.replace(".zo", "") ||
    profile?.first_name ||
    "";

  const startPolling = useCallback(() => {
    setPhase("generating");
    pollCountRef.current = 0;

    pollRef.current = setInterval(() => {
      pollCountRef.current++;
      refetchProfile();

      if (pollCountRef.current >= 10) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        // Timeout — proceed anyway
        advanceOnboarding();
      }
    }, 1000);
  }, [refetchProfile, advanceOnboarding]);

  // Watch for avatar.image *changing* from the snapshotted previous URL.
  // The previous check (`if (profile?.avatar?.image)`) fired immediately
  // when a re-onboarding user's old avatar URL was still in the cache.
  useEffect(() => {
    if (phase !== "generating") return;
    const newUrl = profile?.avatar?.image;
    if (!newUrl) return;
    if (newUrl === prevAvatarUrlRef.current) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    setPhase("done");
  }, [phase, profile?.avatar?.image]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleGenerate = () => {
    if (!selected) return;
    prevAvatarUrlRef.current = profile?.avatar?.image;
    updateProfile(
      { data: { body_type: selected } },
      {
        onSuccess: () => startPolling(),
        onError: () => setPhase("select"),
      }
    );
  };

  // Cache-bust the rendered URL so a backend that returns the same path
  // with new content does not serve a stale browser cache.
  const displayedAvatarUrl = profile?.avatar?.image
    ? `${profile.avatar.image}${profile.avatar.image.includes("?") ? "&" : "?"}v=${selected || "init"}`
    : undefined;


  if (phase === "done") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center w-full">
        <img
          src={displayedAvatarUrl}
          alt="Your Zobu"
          className="w-28 h-28 md:w-40 md:h-40 rounded-full mb-4 md:mb-6 border-2 border-[#66DF48]/30"
        />
        <span className="text-lg text-white/60 mb-8">Looking good!</span>
        <button
          onClick={advanceOnboarding}
          className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider bg-white text-black hover:bg-white/90 cursor-pointer transition-all"
        >
          Zo Zo Zo! Let&apos;s Go
        </button>
      </div>
    );
  }

  if (phase === "generating") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center w-full">
        <i className="uil uil-spinner animate-spin text-4xl mb-4" />
        <span className="text-lg">Generating your Zobu...</span>
        <span className="text-sm text-white/40 mt-2">This takes a few seconds</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
        Choose your body shape{displayName ? `, ${displayName}` : ""}
      </span>
      <span className="text-sm text-white/50 mb-4 md:mb-8">
        This determines your Zobu avatar
      </span>

      <div className="flex gap-3 md:gap-4 w-full mb-4 md:mb-8">
        {(["bae", "bro"] as BodyType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelected(type)}
            className={`flex-1 flex flex-col items-center p-3 md:p-6 rounded-2xl border-2 transition-all cursor-pointer ${
              selected === type
                ? "border-[#66DF48] bg-white/5"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <img
              src={AVATAR_SAMPLES[type]}
              alt={type === "bro" ? "Bro Zobu" : "Bae Zobu"}
              className="w-16 h-16 md:w-20 md:h-20 rounded-lg mb-2 md:mb-3"
            />
            <span className="text-sm font-bold uppercase tracking-wider">
              {type === "bro" ? "Bro" : "Bae"}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        disabled={!selected}
        className={`mt-4 md:mt-8 w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
          selected
            ? "bg-white text-black hover:bg-white/90 cursor-pointer"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        Generate Avatar
      </button>
    </div>
  );
};

export default Avatar;
