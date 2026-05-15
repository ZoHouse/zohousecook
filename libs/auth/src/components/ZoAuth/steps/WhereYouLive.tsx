import { FC, useRef, useState } from "react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import useProfile from "../../../hooks/useProfile";

interface WhereYouLiveProps {
  advanceOnboarding: () => void;
}

const LIBRARIES: ("places")[] = ["places"];

// "Where do you live" = the city the user semi-permanently resides in.
// Distinct from WHEREABOUTS (geo-located right-now location) and HOMETOWN
// (city the user grew up in). Saves to the `where_do_you_live` field on
// profile — analytics view (proc_user_data_plus) already reads this column;
// backend POST silently drops the field until Daya wires the column on the
// profile model, at which point this step becomes a no-op fix.
const WhereYouLive: FC<WhereYouLiveProps> = ({ advanceOnboarding }) => {
  const { updateProfile } = useProfile();
  const [draft, setDraft] = useState("");
  const [selected, setSelected] = useState<{
    where_do_you_live: string;
    where_do_you_live_ref_id: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries: LIBRARIES,
  });

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.geometry?.location) return;
    const label = place.formatted_address || place.name || "";
    setDraft(label);
    setSelected({
      where_do_you_live: label,
      where_do_you_live_ref_id: place.place_id || "",
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    });
  };

  // Free-text fallback: if Google Places dropdown didn't fire (lib failed
  // to load, network blocked, autocomplete API throttled), the user can
  // still submit the raw text they typed. Saves the string without
  // place_id / lat / lng — backend can geocode later. Without this users
  // got stranded on a disabled "That's where I live" button (Erum hit
  // this on first re-onboarding).
  const canSubmit = !!selected || draft.trim().length >= 2;

  const handleSubmit = () => {
    if (!canSubmit || isSaving) return;
    setIsSaving(true);
    const payload = selected
      ? {
          where_do_you_live: selected.where_do_you_live,
          where_do_you_live_ref_id: selected.where_do_you_live_ref_id,
          where_do_you_live_location: { lat: selected.lat, lng: selected.lng },
        }
      : {
          where_do_you_live: draft.trim(),
        };
    updateProfile(
      { data: payload },
      {
        onSuccess: () => advanceOnboarding(),
        onError: () => setIsSaving(false),
      }
    );
  };

  // Uncontrolled input — no `value` prop. Google Places mutates the DOM
  // directly; a controlled input fights that and drops keystrokes (Erum
  // + multiple onboarders got stuck on a single character because of
  // this — same fix as Hometown step). State stays synced via onChange
  // because Google fires real input events on autocomplete.
  const inputProps = {
    type: "text" as const,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraft(e.target.value);
      if (selected) setSelected(null);
    },
    placeholder: "Bangalore, San Francisco, Mumbai...",
    className:
      "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-white/30 transition-colors mb-4",
    autoFocus: true,
    autoComplete: "off",
    spellCheck: false,
    name: "where_do_you_live_search",
  };

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-xl md:text-2xl font-bold mb-1 md:mb-2">Where do you live?</span>
      <span className="text-sm text-white/50 mb-4 md:mb-8">
        The city you call home base — different from where you grew up
      </span>

      {isLoaded ? (
        <Autocomplete
          onLoad={(ac) => (autocompleteRef.current = ac)}
          onPlaceChanged={handlePlaceChanged}
          types={["(cities)"]}
        >
          <input {...inputProps} />
        </Autocomplete>
      ) : (
        // Maps API failed / still loading — render a plain input so the
        // user can type a city manually and continue.
        <input {...inputProps} />
      )}

      {selected ? (
        <span className="text-sm text-[#66DF48] mb-4">
          ✓ {selected.where_do_you_live}
        </span>
      ) : draft.trim().length >= 2 ? (
        <span className="text-sm text-white/40 mb-4">
          {isLoaded
            ? "Pick a suggestion above, or hit submit to save what you typed"
            : "Type a city and submit"}
        </span>
      ) : null}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || isSaving}
        className={`mt-4 md:mt-8 w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
          canSubmit && !isSaving
            ? "bg-white text-black hover:bg-white/90 cursor-pointer"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        {isSaving ? "Saving..." : "That's where I live"}
      </button>
    </div>
  );
};

export default WhereYouLive;
