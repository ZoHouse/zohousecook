import { FC, useEffect, useMemo, useState } from "react";
import useProfile from "../../../hooks/useProfile";
import useQueryApi from "../../../hooks/useQueryApi";

interface CulturesProps {
  advanceOnboarding: () => void;
}

interface Culture {
  id: string;
  key: string;
  name: string;
  icon?: string;
}

const Cultures: FC<CulturesProps> = ({ advanceOnboarding }) => {
  const { profile, updateProfile } = useProfile();
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // CRITICAL: pre-fill from existing cultures so REPLACE doesn't wipe them.
  // Without this, a returning user editing one culture would silently lose all others.
  useEffect(() => {
    if (profile?.cultures) {
      setSelectedKeys(new Set(profile.cultures.map((c: { key: string }) => c.key)));
    }
  }, [profile?.cultures]);

  const { data, isLoading } = useQueryApi(
    "CAS_CULTURES",
    { enabled: true, refetchOnWindowFocus: false },
    "",
    "limit=50"
  );

  const cultures: Culture[] = useMemo(
    () => data?.data?.results || [],
    [data]
  );

  const toggle = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const canSubmit = selectedKeys.size >= 1 && !isSaving;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setIsSaving(true);
    updateProfile(
      { data: { cultures: Array.from(selectedKeys) } }, // REPLACE — full array
      {
        onSuccess: () => advanceOnboarding(),
        onError: () => setIsSaving(false),
      }
    );
  };

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-xl md:text-2xl font-bold mb-1 md:mb-2">What&apos;s your culture?</span>
      <span className="text-sm text-white/50 mb-4">
        Pick everything that&apos;s you
      </span>

      <span className="text-xs text-white/40 mb-4">
        {selectedKeys.size} selected
      </span>

      {isLoading ? (
        <div className="flex items-center justify-center w-full py-12">
          <i className="uil uil-spinner animate-spin text-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full mb-4 md:mb-6 max-h-40 md:max-h-64 overflow-y-auto">
          {cultures.map((c) => {
            const isSelected = selectedKeys.has(c.key);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.key)}
                data-selected={isSelected ? "true" : "false"}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? "border-[#66DF48] bg-[#66DF48]/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                {c.icon && (
                  <img src={c.icon} alt="" className="w-6 h-6" />
                )}
                <span className="text-sm text-white">{c.name}</span>
              </button>
            );
          })}
        </div>
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
        {isSaving ? "Saving..." : "Lock it in"}
      </button>
    </div>
  );
};

export default Cultures;
