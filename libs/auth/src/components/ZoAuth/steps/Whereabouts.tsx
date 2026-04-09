import { FC, useState } from "react";
import { reverseGeocode } from "../../../utils/geocoding";
import { postWhereabouts } from "../../../utils/whereabouts";

interface WhereaboutsProps {
  advanceOnboarding: () => void;
}

type Phase = "ask" | "requesting" | "geocoding" | "saving" | "done" | "error";

const Whereabouts: FC<WhereaboutsProps> = ({ advanceOnboarding }) => {
  const [phase, setPhase] = useState<Phase>("ask");
  const [error, setError] = useState<string | null>(null);
  const [savedPlaceName, setSavedPlaceName] = useState<string | null>(null);

  const handleShareLocation = () => {
    setPhase("requesting");
    setError(null);

    if (!navigator.geolocation) {
      setPhase("error");
      setError("Your browser can't share location.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: long } = pos.coords;
        setPhase("geocoding");

        const geo = await reverseGeocode(lat, long);
        if (!geo) {
          setPhase("error");
          setError("Couldn't identify your location.");
          return;
        }

        setPhase("saving");
        try {
          await postWhereabouts({
            place_name: geo.place_name,
            place_ref_id: geo.place_id,
            location: { lat, long }, // NOTE: long, not lng
          });
          setSavedPlaceName(geo.place_name);
          setPhase("done");
          setTimeout(() => advanceOnboarding(), 800);
        } catch (e) {
          setPhase("error");
          setError("Couldn't save — try again.");
        }
      },
      (err) => {
        setPhase("error");
        if (err.code === err.PERMISSION_DENIED) {
          setError("We need your location to continue.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("Couldn't get your location — try again.");
        } else if (err.code === err.TIMEOUT) {
          setError("Took too long — try again.");
        } else {
          setError("Something went wrong.");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  if (phase === "done" && savedPlaceName) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center w-full">
        <span className="text-4xl mb-4">📍</span>
        <span className="text-xl font-bold text-white">{savedPlaceName}</span>
        <span className="text-sm text-white/50 mt-2">Locked in</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-start w-full">
      <span className="text-2xl font-bold mb-2">
        Where in Zo World are you right now?
      </span>
      <span className="text-sm text-white/50 mb-8">
        We&apos;ll use this to show you stuff happening near you
      </span>

      <div className="flex-1 flex items-center justify-center w-full">
        {phase === "ask" || phase === "error" ? (
          <span className="text-6xl">📍</span>
        ) : (
          <i className="uil uil-spinner animate-spin text-4xl" />
        )}
      </div>

      {phase === "requesting" && (
        <span className="text-sm text-white/60 text-center w-full mb-4">
          Asking for permission...
        </span>
      )}
      {phase === "geocoding" && (
        <span className="text-sm text-white/60 text-center w-full mb-4">
          Finding your spot...
        </span>
      )}
      {phase === "saving" && (
        <span className="text-sm text-white/60 text-center w-full mb-4">
          Locking it in...
        </span>
      )}
      {phase === "error" && error && (
        <span className="text-sm text-red-400 text-center w-full mb-4">
          {error}
        </span>
      )}

      <button
        onClick={handleShareLocation}
        disabled={phase === "requesting" || phase === "geocoding" || phase === "saving"}
        className={`mt-auto w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
          phase === "requesting" || phase === "geocoding" || phase === "saving"
            ? "bg-white/10 text-white/30 cursor-not-allowed"
            : "bg-white text-black hover:bg-white/90 cursor-pointer"
        }`}
      >
        {phase === "error" ? "Try Again" : "Share my Location"}
      </button>
    </div>
  );
};

export default Whereabouts;
