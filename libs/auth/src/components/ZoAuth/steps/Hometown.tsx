import { FC, useRef, useState } from "react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import useProfile from "../../../hooks/useProfile";

interface HometownProps {
  advanceOnboarding: () => void;
}

const LIBRARIES: ("places")[] = ["places"];

const Hometown: FC<HometownProps> = ({ advanceOnboarding }) => {
  const { updateProfile } = useProfile();
  const [input, setInput] = useState("");
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
    const place_name = place.formatted_address || place.name || "";
    setSelected({
      place_name,
      place_id: place.place_id || "",
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    });
    setInput(place_name);
  };

  const handleSubmit = () => {
    const typed = input.trim();
    if (!typed || isSaving) return;
    setIsSaving(true);

    const useStructured = selected && selected.place_name === typed;
    const payload = useStructured
      ? {
          place_name: selected!.place_name,
          place_ref_id: selected!.place_id,
          home_location: { lat: selected!.lat, lng: selected!.lng }, // NOTE: lng, not long
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (selected && e.target.value !== selected.place_name) setSelected(null);
  };

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-white/30 transition-colors mb-4";

  const canSubmit = input.trim().length > 0 && !isSaving;

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-xl md:text-2xl font-bold mb-1 md:mb-2">Where&apos;s home?</span>
      <span className="text-sm text-white/50 mb-4 md:mb-8">
        Your roots — the city you call yours
      </span>

      {isLoaded && !loadError ? (
        <Autocomplete
          onLoad={(ac) => (autocompleteRef.current = ac)}
          onPlaceChanged={handlePlaceChanged}
          types={["(cities)"]}
        >
          <input
            type="text"
            placeholder="Bangalore, Bengaluru..."
            className={inputClass}
            value={input}
            onChange={handleInputChange}
            autoFocus
          />
        </Autocomplete>
      ) : (
        <input
          type="text"
          placeholder="Bangalore, Bengaluru..."
          className={inputClass}
          value={input}
          onChange={handleInputChange}
          autoFocus
        />
      )}

      {selected && selected.place_name === input && (
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
        {isSaving ? "Saving..." : "That's me"}
      </button>
    </div>
  );
};

export default Hometown;
