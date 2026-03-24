import { cn } from "@zo/utils/font";
import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName, syneClassName } from "../../utils/font";

interface CultureVertical {
  name: string;
  emoji: string;
  description: string;
}

const verticals: CultureVertical[] = [
  { name: "Poker", emoji: "🃏", description: "150+ members. WSOP participants." },
  { name: "Art", emoji: "🎨", description: "120+ artists across 30 countries." },
  { name: "Run Club", emoji: "🏃", description: "Morning runs. City runs. Streaks." },
  { name: "Bio Hack", emoji: "🧊", description: "Cold plunge. Breathwork. Wellness." },
  { name: "Flo Zone", emoji: "🎧", description: "Deep work sprints. Flow state." },
  { name: "Battlefield", emoji: "🏓", description: "Pickleball. Physical challenges." },
  { name: "PSN", emoji: "🎮", description: "FIFA. Fortnite. Gaming tournaments." },
  { name: "Follow Your Heart", emoji: "🍳", description: "Cooking. Dinners. Food culture." },
  { name: "Mafia", emoji: "🕵️", description: "Social deduction. Game nights." },
];

const CultureSection: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section ref={sectionRef} className="mt-20 md:mt-[120px]">
      <h2
        className={cn(
          "sub-heading-2 font-bold text-center",
          syneClassName
        )}
      >
        Culture That <span className="text-zui-yellow">Compounds</span>
      </h2>
      <p
        className={cn(
          "text-center text-base md:text-lg text-zui-white/50 mt-4 max-w-[600px] mx-auto",
          rubikClassName
        )}
      >
        Not just &quot;work together.&quot; Founders compete across 9 cultural
        verticals. Every activity earns $Zo XP on the Culture Leaderboard.
      </p>

      {/* Culture verticals carousel */}
      <div className="mt-10 md:mt-16 overflow-x-auto hide-scrollbar">
        <div className="flex gap-4 pb-4 min-w-max md:min-w-0 md:grid md:grid-cols-3 lg:grid-cols-3">
          {verticals.map((v) => (
            <div
              key={v.name}
              className="flex items-center gap-4 p-4 rounded-xl inner-border bg-zui-dark min-w-[240px] md:min-w-0 shiny-card"
            >
              <span className="text-2xl">{v.emoji}</span>
              <div>
                <h4
                  className={cn(
                    "text-base font-bold text-zui-white",
                    rubikClassName
                  )}
                >
                  {v.name}
                </h4>
                <p
                  className={cn(
                    "text-xs text-zui-white/50 mt-0.5",
                    rubikClassName
                  )}
                >
                  {v.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly cadence */}
      <div className="mt-10 p-6 md:p-8 rounded-2xl inner-border bg-zui-dark">
        <h3 className={cn("text-lg md:text-xl font-bold mb-6", syneClassName)}>
          The Weekly Rhythm
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { day: "Mon", event: "Weekly Standup", color: "bg-zui-yellow/10 text-zui-yellow" },
            { day: "Tue", event: "Workshop", color: "bg-zui-blue/10 text-zui-blue" },
            { day: "Wed", event: "Founder Dinner", color: "bg-zui-green/10 text-zui-green" },
            { day: "Thu", event: "Culture Night", color: "bg-zui-purple/10 text-zui-purple" },
            { day: "Fri", event: "Weekly Showcase", color: "bg-zui-pink/10 text-zui-pink" },
            { day: "Daily", event: "Morning Standup", color: "bg-zui-orange/10 text-zui-orange" },
          ].map((item) => (
            <div key={item.day} className="text-center">
              <span
                className={cn(
                  "inline-block px-3 py-1 rounded-full text-xs font-semibold",
                  item.color,
                  rubikClassName
                )}
              >
                {item.day}
              </span>
              <p
                className={cn(
                  "text-sm text-zui-white/60 mt-2",
                  rubikClassName
                )}
              >
                {item.event}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CultureSection;
