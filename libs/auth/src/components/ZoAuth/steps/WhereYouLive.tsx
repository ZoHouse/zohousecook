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
    setSelected({
      where_do_you_live: place.formatted_address || place.name || "",
      where_do_you_live_ref_id: place.place_id || "",
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    });
  };

  const handleSubmit = () => {
    if (!selected || isSaving) return;
    setIsSaving(true);
    updateProfile(
      {
        data: {
          where_do_you_live: selected.where_do_you_live,
          where_do_you_live_ref_id: selected.where_do_you_live_ref_id,
          where_do_you_live_location: { lat: selected.lat, lng: selected.lng },
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
          <input
            type="text"
            placeholder="Bangalore, San Francisco, Mumbai..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-white/30 transition-colors mb-4"
            autoFocus
          />
        </Autocomplete>
      ) : (
        <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/40 mb-4">
          Loading search...
        </div>
      )}

      {selected && (
        <span className="text-sm text-[#66DF48] mb-4">
          ✓ {selected.where_do_you_live}
        </span>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selected || isSaving}
        className={`mt-4 md:mt-8 w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
          selected && !isSaving
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
