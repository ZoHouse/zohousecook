import { FC, useCallback, useEffect, useRef, useState } from "react";
import useProfile from "../../../hooks/useProfile";

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

  // Watch for avatar.image appearing → done phase
  useEffect(() => {
    if (phase === "generating" && profile?.avatar?.image) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      setPhase("done");
    }
  }, [phase, profile?.avatar?.image]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleGenerate = () => {
    if (!selected) return;
    updateProfile(
      { data: { body_type: selected } },
      {
        onSuccess: () => startPolling(),
        onError: () => setPhase("select"),
      }
    );
  };

  const BroSilhouette = () => (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <circle cx="60" cy="40" r="25" fill="currentColor" opacity="0.3" />
      <rect x="35" y="70" width="50" height="60" rx="8" fill="currentColor" opacity="0.2" />
      <rect x="25" y="75" width="15" height="45" rx="6" fill="currentColor" opacity="0.15" />
      <rect x="80" y="75" width="15" height="45" rx="6" fill="currentColor" opacity="0.15" />
    </svg>
  );

  const BaeSilhouette = () => (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <circle cx="60" cy="38" r="23" fill="currentColor" opacity="0.3" />
      <path
        d="M38 70 Q38 65 60 65 Q82 65 82 70 L78 130 Q78 135 60 135 Q42 135 42 130 Z"
        fill="currentColor"
        opacity="0.2"
      />
      <rect x="25" y="75" width="14" height="40" rx="6" fill="currentColor" opacity="0.15" />
      <rect x="81" y="75" width="14" height="40" rx="6" fill="currentColor" opacity="0.15" />
    </svg>
  );

  if (phase === "done") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center w-full">
        <img
          src={profile?.avatar?.image}
          alt="Your Zobu"
          className="w-40 h-40 rounded-full mb-6 border-2 border-[#66DF48]/30"
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
      <span className="text-2xl font-bold mb-2">
        Choose your body shape{displayName ? `, ${displayName}` : ""}
      </span>
      <span className="text-sm text-white/50 mb-8">
        This determines your Zobu avatar
      </span>

      <div className="flex gap-4 w-full mb-8">
        {(["bae", "bro"] as BodyType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelected(type)}
            className={`flex-1 flex flex-col items-center p-6 rounded-2xl border-2 transition-all cursor-pointer ${
              selected === type
                ? "border-[#66DF48] bg-white/5"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <div className="w-20 h-28 text-white mb-3">
              {type === "bro" ? <BroSilhouette /> : <BaeSilhouette />}
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">
              {type === "bro" ? "Bro" : "Bae"}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        disabled={!selected}
        className={`mt-auto w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
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
