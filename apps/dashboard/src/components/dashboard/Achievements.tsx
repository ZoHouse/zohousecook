import React, { useState } from "react";
import { GlassCard } from "./GlassCard";
import { useMyXp } from "../../hooks/useMyXp";
import {
  countryIndia, countrySpain, countryFrance,
  countryJapan, countryRussia, countryElSalvador,
} from "../../assets";

const COUNTRY_CARDS = [
  { id: "india", name: "India", src: countryIndia, region: "Asia", desc: "Explored destinations across incredible India, from the Himalayas to the coasts." },
  { id: "spain", name: "Spain", src: countrySpain, region: "Europe", desc: "Vibrant culture, tapas, and beaches across España." },
  { id: "france", name: "France", src: countryFrance, region: "Europe", desc: "Paris to Provence, unlock the heart of France." },
  { id: "japan", name: "Japan", src: countryJapan, region: "Asia", desc: "Ancient temples, neon cities, and zen gardens." },
  { id: "russia", name: "Russia", src: countryRussia, region: "Europe", desc: "The world's largest country, Moscow to Siberia." },
  { id: "el-salvador", name: "El Salvador", src: countryElSalvador, region: "Americas", desc: "Volcanoes, surf, and the first Bitcoin nation." },
];

// Map trip destination names to country IDs for achievement unlocking
const TRIP_COUNTRY_MAP: Record<string, string> = {
  "bhutan": "india", // Bhutan unlocks — but we don't have a Bhutan card yet, count as Asia neighbor
  "japan": "japan",
  "bali": "india", // Indonesia — no card yet
  "annapurna base camp trek": "india", // Nepal — no card yet
  "nepal": "india",
};

// Trips that indicate domestic India travel
const INDIA_TRIP_KEYWORDS = [
  "spiti", "ladakh", "kashmir", "kedarnath", "sikkim", "arunachal", "meghalaya",
  "kerala", "kareri", "tirthan", "mcleodganj", "triund", "darjeeling", "chopta",
  "tungnath", "chikkamagaluru", "auli", "yulla kanda",
];

function getUnlockedCountries(destinations: string[], tripDestinations?: string[]): Set<string> {
  const countries = new Set<string>();

  // Zostel stays → India
  if (destinations.length > 0) {
    countries.add("india");
  }

  // Zo Trips → match to countries
  for (const trip of (tripDestinations || [])) {
    const lower = trip.toLowerCase();

    // Check direct country map
    for (const [keyword, country] of Object.entries(TRIP_COUNTRY_MAP)) {
      if (lower.includes(keyword)) countries.add(country);
    }

    // Check India keywords
    if (INDIA_TRIP_KEYWORDS.some(k => lower.includes(k))) {
      countries.add("india");
    }
  }

  return countries;
}

function AchievementModal({
  card,
  isUnlocked,
  onClose,
}: {
  card: typeof COUNTRY_CARDS[0];
  isUnlocked: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal container */}
      <div
        className="relative max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card image */}
        <div className={`relative rounded-2xl overflow-hidden border-2 ${
          isUnlocked ? "border-dash-accent/40" : "border-white/10"
        }`}>
          <img
            src={card.src}
            alt={card.name}
            className={`w-full aspect-[3/4] object-cover ${isUnlocked ? "" : "grayscale opacity-50"}`}
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          {/* Lock icon for locked cards */}
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-black/50 border border-white/20 flex items-center justify-center">
                <span className="text-3xl">🔒</span>
              </div>
            </div>
          )}

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            {isUnlocked && (
              <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-dash-accent bg-dash-accent/20 border border-dash-accent/30 rounded-dash-pill mb-3">
                Unlocked
              </span>
            )}
            {!isUnlocked && (
              <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/50 bg-white/10 border border-white/10 rounded-dash-pill mb-3">
                Locked
              </span>
            )}
            <h2 className="text-2xl font-bold text-white mb-1">{card.name}</h2>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">{card.region}</p>
            <p className="text-sm text-white/70 leading-relaxed">{card.desc}</p>

            {!isUnlocked && (
              <p className="text-xs text-white/40 mt-3 italic">
                Visit a Zostel or take a Zo Trip to {card.name} to unlock
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Achievements() {
  const [expanded, setExpanded] = useState(false);
  const [selectedCard, setSelectedCard] = useState<typeof COUNTRY_CARDS[0] | null>(null);
  const { myXp } = useMyXp();

  const unlocked = getUnlockedCountries(myXp?.destinationNames || [], myXp?.tripDestinations);
  const unlockedCount = unlocked.size;
  const totalCount = COUNTRY_CARDS.length;

  return (
    <>
      <GlassCard className="px-dash-lg py-dash-md overflow-hidden transition-all duration-300">
        {/* Collapsed pill */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex -space-x-2">
            {COUNTRY_CARDS.slice(0, 5).map((card) => {
              const isUnlocked = unlocked.has(card.id);
              return (
                <div
                  key={card.id}
                  className={`w-7 h-7 rounded-full border-2 border-dash-bg-solid overflow-hidden flex-shrink-0 ${
                    isUnlocked ? "" : "opacity-30 grayscale"
                  }`}
                  title={card.name}
                >
                  <img
                    src={card.src}
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              );
            })}
          </div>
          <span className="text-sm text-white/80 flex-1">
            <span className="font-medium text-white">{unlockedCount}/{totalCount}</span>{" "}
            Achievements
          </span>
          <span
            className="text-white/50 text-xs transition-transform duration-300"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▼
          </span>
        </div>

        {/* Expanded card grid */}
        <div
          className="grid grid-cols-3 gap-2 transition-all duration-300"
          style={{
            maxHeight: expanded ? "400px" : "0px",
            marginTop: expanded ? "12px" : "0px",
            opacity: expanded ? 1 : 0,
          }}
        >
          {COUNTRY_CARDS.map((card) => {
            const isUnlocked = unlocked.has(card.id);
            return (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`relative rounded-dash-md overflow-hidden border text-left transition-transform hover:scale-[1.03] ${
                  isUnlocked
                    ? "border-dash-accent/30"
                    : "border-white/[0.06] opacity-40 grayscale"
                }`}
              >
                <img
                  src={card.src}
                  alt={card.name}
                  className="w-full aspect-[3/4] object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-[9px] font-medium text-white truncate">{card.name}</p>
                  {isUnlocked && (
                    <p className="text-[7px] text-dash-accent">Unlocked</p>
                  )}
                </div>
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg">🔒</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Popup modal */}
      {selectedCard && (
        <AchievementModal
          card={selectedCard}
          isUnlocked={unlocked.has(selectedCard.id)}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  );
}
