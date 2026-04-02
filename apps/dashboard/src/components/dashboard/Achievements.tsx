import React, { useState } from "react";
import { useRouter } from "next/router";
import { GlassCard } from "./GlassCard";
import { useMyXp } from "../../hooks/useMyXp";

// Country achievements — unlocked when user has visited destinations in that country
const COUNTRY_CARDS = [
  { id: "india", name: "India", file: "Country-card_India.gif" },
  { id: "spain", name: "Spain", file: "Country-Cards_Spain.gif" },
  { id: "france", name: "France", file: "Country-Cards_France.gif" },
  { id: "japan", name: "Japan", file: "Country-Cards_Japan.gif" },
  { id: "russia", name: "Russia", file: "Country-Cards_Russia.gif" },
  { id: "el-salvador", name: "El Salvador", file: "Country-Cards_El-Salvador.gif" },
];

// Map destination names to countries (Zostel destinations are all in India currently)
function getUnlockedCountries(destinations: string[]): Set<string> {
  const countries = new Set<string>();
  if (destinations.length > 0) {
    // All current Zostel destinations are in India
    countries.add("india");
  }
  // Future: map international destinations to countries
  return countries;
}

export function Achievements() {
  const [expanded, setExpanded] = useState(false);
  const { basePath } = useRouter();
  const { myXp } = useMyXp();

  const unlocked = getUnlockedCountries(myXp?.destinationNames || []);
  const unlockedCount = unlocked.size;
  const totalCount = COUNTRY_CARDS.length;

  return (
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
                  src={`${basePath}/dashboard-assets/${card.file}`}
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
            <div
              key={card.id}
              className={`relative rounded-dash-md overflow-hidden border ${
                isUnlocked
                  ? "border-dash-accent/30"
                  : "border-white/[0.06] opacity-40 grayscale"
              }`}
            >
              <img
                src={`${basePath}/dashboard-assets/${card.file}`}
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
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
