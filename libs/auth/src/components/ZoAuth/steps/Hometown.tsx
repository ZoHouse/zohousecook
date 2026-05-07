import { FC, useRef, useState } from "react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import useProfile from "../../../hooks/useProfile";

interface HometownProps {
  advanceOnboarding: () => void;
}

const LIBRARIES: ("places")[] = ["places"];

const Hometown: FC<HometownProps> = ({ advanceOnboarding }) => {
  const { updateProfile } = useProfile();
  const [draft, setDraft] = useState("");
  const [selected, setSelected] = useState<{
    place_name: string;
    place_id: string;
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
      place_name: label,
      place_id: place.place_id || "",
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    });
  };

  // Free-text fallback: if Google Places dropdown didn't fire (lib failed
  // to load, network blocked, autocomplete API throttled), the user can
  // still submit the raw text they typed. Saves the string without
  // place_id / lat / lng — backend can geocode later.
  const canSubmit = !!selected || draft.trim().length >= 2;

  const handleSubmit = () => {
    if (!canSubmit || isSaving) return;
    setIsSaving(true);
    const payload = selected
      ? {
          place_name: selected.place_name,
          place_ref_id: selected.place_id,
          home_location: { lat: selected.lat, lng: selected.lng }, // NOTE: lng, not long
        }
      : {
          place_name: draft.trim(),
        };
    updateProfile(
      { data: payload },
      {
        onSuccess: () => advanceOnboarding(),
        onError: () => setIsSaving(false),
      }
    );
  };

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-xl md:text-2xl font-bold mb-1 md:mb-2">Where&apos;s home?</span>
      <span className="text-sm text-white/50 mb-4 md:mb-8">
        Your roots — the city you call yours
      </span>

      {isLoaded ? (
        <Autocomplete
          onLoad={(ac) => (autocompleteRef.current = ac)}
          onPlaceChanged={handlePlaceChanged}
          types={["(cities)"]}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (selected) setSelected(null);
            }}
            placeholder="Bangalore, Bengaluru..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-white/30 transition-colors mb-4"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            name="hometown_search"
          />
        </Autocomplete>
      ) : (
        // Maps API failed / still loading — render a plain input so the
        // user can type a city manually and continue.
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Bangalore, Bengaluru..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-white/30 transition-colors mb-4"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          name="hometown_search"
        />
      )}

      {selected ? (
        <span className="text-sm text-[#66DF48] mb-4">
          ✓ {selected.place_name}
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
        {isSaving ? "Saving..." : "That's me"}
      </button>
    </div>
  );
};

export default Hometown;
