import { FC, useMemo, useState } from "react";
import useProfile from "../../../hooks/useProfile";
import countries from "../../../data/countries.json";

interface CitizenProps {
  advanceOnboarding: () => void;
}

interface Country {
  code: string;
  name: string;
  flag: string;
}

const Citizen: FC<CitizenProps> = ({ advanceOnboarding }) => {
  const { updateProfile } = useProfile();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Country | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return countries as Country[];
    const q = query.toLowerCase();
    return (countries as Country[]).filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSubmit = () => {
    if (!selected || isSaving) return;
    setIsSaving(true);
    // Save the full country object — the onboarding queue (and the Profile
    // type in @zo/definitions/auth) expect `country` to be
    // { code, name, flag }, not a bare ISO string. Saving the string meant
    // `profile.country?.code` stayed undefined on the next ONBOARDING_CHECK,
    // re-queuing CITIZEN forever.
    updateProfile(
      {
        data: {
          country: {
            code: selected.code,
            name: selected.name,
            flag: selected.flag,
          },
        },
      },
      {
        onSuccess: () => advanceOnboarding(),
        onError: () => setIsSaving(false),
      }
    );
  };

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
        Where are you a proud citizen of?
      </span>
      <span className="text-sm text-white/50 mb-4 md:mb-8">
        We&apos;ll fly your country&apos;s flag on your passport
      </span>

      {selected && (
        <div className="w-full text-center mb-3 md:mb-4 text-4xl md:text-6xl">{selected.flag}</div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search countries..."
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors mb-4"
        autoFocus
      />

      <div className="w-full flex-1 overflow-y-auto max-h-40 md:max-h-64 border border-white/10 rounded-lg">
        {filtered.map((country) => (
          <button
            key={country.code}
            onClick={() => {
              setSelected(country);
              // Clear the search so the dropdown shows the full list again,
              // not a single-row "India" sitting under an input that also
              // shows "India" — Erum flagged the duplicate as confusing.
              setQuery("");
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              selected?.code === country.code
                ? "bg-white/10"
                : "hover:bg-white/5"
            }`}
          >
            <span className="text-2xl">{country.flag}</span>
            <span className="text-white">{country.name}</span>
            <span className="text-white/30 text-sm ml-auto">{country.code}</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected || isSaving}
        className={`mt-4 md:mt-8 w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
          selected && !isSaving
            ? "bg-white text-black hover:bg-white/90 cursor-pointer"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        {isSaving ? "Saving..." : "That's my country"}
      </button>
    </div>
  );
};

export default Citizen;
