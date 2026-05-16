import { FC, useMemo, useState } from "react";
import useProfile from "../../../hooks/useProfile";
import { validateBirthday } from "./birthdayValidation";

interface BirthdayProps {
  advanceOnboarding: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

const selectClass =
  "flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-white text-sm outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer";

const Birthday: FC<BirthdayProps> = ({ advanceOnboarding }) => {
  const { updateProfile } = useProfile();
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const daysInMonth = useMemo(() => {
    if (!month || !year) return 31;
    return new Date(Number(year), Number(month), 0).getDate();
  }, [month, year]);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Build YYYY-MM-DD string for validation and API
  const date =
    year && month && day
      ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      : "";

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
      <span className="text-xl md:text-2xl font-bold mb-1 md:mb-2">When&apos;s your birthday?</span>
      <span className="text-sm text-white/50 mb-4 md:mb-8">We celebrate you on your birthday</span>

      <div className="flex gap-2 w-full mb-4">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className={selectClass}
        >
          <option value="" disabled className="bg-[#1a1a1a] text-white/40">
            Month
          </option>
          {MONTHS.map((m, i) => (
            <option key={m} value={String(i + 1)} className="bg-[#1a1a1a] text-white">
              {m}
            </option>
          ))}
        </select>

        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className={selectClass}
        >
          <option value="" disabled className="bg-[#1a1a1a] text-white/40">
            Day
          </option>
          {days.map((d) => (
            <option key={d} value={String(d)} className="bg-[#1a1a1a] text-white">
              {d}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className={selectClass}
        >
          <option value="" disabled className="bg-[#1a1a1a] text-white/40">
            Year
          </option>
          {years.map((y) => (
            <option key={y} value={String(y)} className="bg-[#1a1a1a] text-white">
              {y}
            </option>
          ))}
        </select>
      </div>

      {!validation.ok && date.length > 0 && (
        <span className="text-sm text-red-400 mb-4">{validation.reason}</span>
      )}
      {validation.ok && validation.warning && (
        <span className="text-sm text-yellow-400 mb-4">{validation.warning}</span>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`mt-4 md:mt-8 w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
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
