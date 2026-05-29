import { FC, useRef, useState } from "react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import useProfile from "../../../hooks/useProfile";

interface HometownProps {
  advanceOnboarding: () => void;
}

const LIBRARIES: ("places")[] = ["places"];
const MIN_LENGTH = 2;

const Hometown: FC<HometownProps> = ({ advanceOnboarding }) => {
  const { updateProfile } = useProfile();
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<{
    place_name: string;
    place_id: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries: LIBRARIES,
  });

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.geometry?.location) return;
    setSelected({
      place_name: place.formatted_address || place.name || "",
      place_id: place.place_id || "",
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setText(v);
    if (selected && v !== selected.place_name) setSelected(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.preventDefault();
  };

  const handleSubmit = () => {
    const typed = text.trim();
    if (typed.length < MIN_LENGTH || isSaving) return;
    setIsSaving(true);

    // If the user picked a city from Google's autocomplete, we always send
    // the coords. Previously we gated this on `selected.place_name === typed`,
    // but Google's formatted_address ("Bengaluru, Karnataka, India") almost
    // never matches what the user typed ("bangalore"), so the equality check
    // dropped the lat/lng for most users. The recommender's first check is
    // `coordinates = user.home_coordinates`; if that's null it returns no
    // quests at all — which is exactly the empty-lobby bug Erum was hitting.
    //
    // Behaviour now:
    //   selected (picked from dropdown)  → send name + ref_id + lat/lng
    //   no selected (typed-only fallback) → send the typed text only
    //
    // The on-screen confirmation chip below already shows the resolved
    // place_name, so the user knows their pick was registered even when it
    // doesn't match what they typed character-for-character.
    const payload = selected
      ? {
          place_name: selected.place_name,
          place_ref_id: selected.place_id,
          home_location: { lat: selected.lat, lng: selected.lng }, // NOTE: lng, not long
        }
      : { place_name: typed };

    updateProfile(
      { data: payload },
      {
        onSuccess: () => advanceOnboarding(),
        onError: () => setIsSaving(false),
      }
    );
  };

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-white/30 transition-colors mb-4";

  const canSubmit = text.trim().length >= MIN_LENGTH && !isSaving;

  // Uncontrolled input — no `value` prop. Google Places mutates the DOM
  // directly; a controlled input fights that and drops keystrokes. State
  // stays synced via onChange because Google fires real input events on
  // autocomplete.
  const inputProps = {
    type: "text" as const,
    placeholder: "Bangalore, Bengaluru...",
    className: inputClass,
    onChange: handleInputChange,
    onKeyDown: handleKeyDown,
    autoFocus: true,
    autoComplete: "off",
    spellCheck: false,
  };

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-xl md:text-2xl font-bold mb-1 md:mb-2">Where is your Hometown?</span>
      <span className="text-sm text-white/50 mb-4 md:mb-8">
        Your roots — the city you call yours
      </span>

      {isLoaded && !loadError ? (
        <Autocomplete
          onLoad={(ac) => (autocompleteRef.current = ac)}
          onPlaceChanged={handlePlaceChanged}
          types={["(cities)"]}
        >
          <input {...inputProps} />
        </Autocomplete>
      ) : (
        <input {...inputProps} />
      )}

      {selected && (
        <span className="text-sm text-[#66DF48] mb-4">
          ✓ {selected.place_name}
        </span>
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
        {isSaving ? "Saving..." : "That's home"}
      </button>
    </div>
  );
};

export default Hometown;
