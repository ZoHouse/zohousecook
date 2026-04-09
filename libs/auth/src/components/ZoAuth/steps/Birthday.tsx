import { FC, useState } from "react";
import useProfile from "../../../hooks/useProfile";
import { validateBirthday } from "./birthdayValidation";

interface BirthdayProps {
  advanceOnboarding: () => void;
}

const Birthday: FC<BirthdayProps> = ({ advanceOnboarding }) => {
  const { updateProfile } = useProfile();
  const [date, setDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const validation = validateBirthday(date);
  const canSubmit = validation.ok && !isSaving;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setIsSaving(true);
    updateProfile(
      { data: { date_of_birth: date } },
      {
        onSuccess: () => advanceOnboarding(),
        onError: () => setIsSaving(false),
      }
    );
  };

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-2xl font-bold mb-2">When&apos;s your Zo Day?</span>
      <span className="text-sm text-white/50 mb-8">We celebrate you</span>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        max={new Date().toISOString().split("T")[0]}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-white/30 transition-colors mb-4"
        autoFocus
      />

      {!validation.ok && date.length > 0 && (
        <span className="text-sm text-red-400 mb-4">{validation.reason}</span>
      )}
      {validation.ok && validation.warning && (
        <span className="text-sm text-yellow-400 mb-4">{validation.warning}</span>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`mt-auto w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
          canSubmit
            ? "bg-white text-black hover:bg-white/90 cursor-pointer"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        {isSaving ? "Saving..." : "Confirm"}
      </button>
    </div>
  );
};

export default Birthday;
