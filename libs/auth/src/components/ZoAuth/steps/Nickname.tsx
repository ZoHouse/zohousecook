import { FC, useEffect, useState } from "react";
import useProfile from "../../../hooks/useProfile";
import useQueryApi from "../../../hooks/useQueryApi";

interface NicknameProps {
  advanceOnboarding: () => void;
}

const Nickname: FC<NicknameProps> = ({ advanceOnboarding }) => {
  const { updateProfile } = useProfile();
  const [input, setInput] = useState("");
  const [checkEnabled, setCheckEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isValidLength = input.length >= 4 && input.length <= 16;
  const isAlphanumeric = /^[a-z0-9]+$/i.test(input);
  const isLocallyValid = isValidLength && isAlphanumeric;

  // Debounce the availability check by 500ms after the user stops typing
  useEffect(() => {
    setCheckEnabled(false);
    if (!isLocallyValid) return;
    const timer = setTimeout(() => setCheckEnabled(true), 500);
    return () => clearTimeout(timer);
  }, [input, isLocallyValid]);

  const { data: availabilityData, isLoading: isCheckingAvailability } =
    useQueryApi(
      "PROFILE_CUSTOM_NICKNAME_AVAILABLE",
      {
        enabled: checkEnabled,
        refetchOnWindowFocus: false,
        retry: false,
      },
      "",
      `nickname=${input.toLowerCase()}.zo`
    );

  const isAvailable = availabilityData?.data?.available === true;
  const allValid =
    isLocallyValid && checkEnabled && isAvailable && !isCheckingAvailability;

  const handleSubmit = () => {
    if (!allValid || isSaving) return;
    setIsSaving(true);
    updateProfile(
      { data: { custom_nickname: `${input.toLowerCase()}.zo` } },
      {
        onSuccess: () => advanceOnboarding(),
        onError: () => setIsSaving(false),
      }
    );
  };

  const renderCheck = (
    label: string,
    passed: boolean,
    checking?: boolean
  ) => (
    <div className="flex items-center gap-2 text-sm">
      {checking ? (
        <i className="uil uil-spinner animate-spin text-white/40" />
      ) : passed ? (
        <span className="text-[#66DF48]">✓</span>
      ) : input.length > 0 ? (
        <span className="text-red-400">✗</span>
      ) : (
        <span className="text-white/20">○</span>
      )}
      <span className={passed ? "text-white/80" : "text-white/40"}>{label}</span>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-2xl font-bold mb-2">Pick your .zo handle</span>
      <span className="text-sm text-white/50 mb-8">
        Your permanent identity in Zo World
      </span>

      <div className="flex items-center w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus-within:border-white/30 transition-colors">
        <input
          type="text"
          value={input}
          onChange={(e) =>
            setInput(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))
          }
          placeholder="yourname"
          className="bg-transparent text-white text-lg flex-1 outline-none placeholder-white/20"
          maxLength={16}
          autoFocus
        />
        <span className="text-white/30 text-lg">.zo</span>
      </div>

      <div className="flex flex-col gap-1.5 mb-8">
        {renderCheck("4-16 characters", isValidLength)}
        {renderCheck(
          "Letters and numbers only",
          input.length > 0 ? isAlphanumeric : false
        )}
        {renderCheck(
          isAvailable ? "Available!" : "Available",
          isAvailable,
          isCheckingAvailability || (isLocallyValid && !checkEnabled)
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allValid || isSaving}
        className={`mt-auto w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
          allValid && !isSaving
            ? "bg-white text-black hover:bg-white/90 cursor-pointer"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        {isSaving ? "Claiming..." : "Claim it"}
      </button>
    </div>
  );
};

export default Nickname;
