import { cn } from "@zo/utils/font";
import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName, syneClassName } from "../../utils/font";

interface PillarProps {
  title: string;
  description: string;
  signal: string;
  accent: string;
}

const pillars: PillarProps[] = [
  {
    title: "Culture",
    description:
      "The rituals, values, cadence, and collective behavior that shape daily life. Weekly showcases, demo days, content pipelines, founders tipping each other.",
    signal: "Demo days drawing crowds. Content pipeline producing. Members showing up.",
    accent: "text-zui-purple",
  },
  {
    title: "Vibes",
    description:
      "The emotional temperature — energy, flow, harmony, human chemistry. You can't fake it. You can only architect the conditions for it.",
    signal: "Residents renewing. Friends referring friends. Waitlist growing without ads.",
    accent: "text-zui-pink",
  },
  {
    title: "Unit Economics",
    description:
      "Every Zo House must be operationally stable and making money. No dependency on subsidies. The 70/30 model is the engine.",
    signal: "Monthly P&L positive. Occupancy above 75%. Multiple revenue streams active.",
    accent: "text-zui-green",
  },
];

const SacredPillars: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section ref={sectionRef} className="mt-20 md:mt-[120px]">
      <h2
        className={cn(
          "sub-heading-2 font-bold text-center",
          syneClassName
        )}
      >
        The Three Sacred Pillars
      </h2>
      <p
        className={cn(
          "text-center text-base md:text-lg text-zui-white/50 mt-4 max-w-[500px] mx-auto",
          rubikClassName
        )}
      >
        If any one collapses, the house is in trouble. The magic is in all three
        working together.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-10 md:mt-16">
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            className="p-6 md:p-8 rounded-2xl inner-border bg-zui-dark shiny-card"
          >
            <h3
              className={cn(
                "text-2xl md:text-3xl font-bold",
                pillar.accent,
                syneClassName
              )}
            >
              {pillar.title}
            </h3>
            <p
              className={cn(
                "mt-4 text-sm md:text-base text-zui-white/70 leading-relaxed",
                rubikClassName
              )}
            >
              {pillar.description}
            </p>
            <div className="mt-6 pt-4 border-t border-zui-white/5">
              <p
                className={cn(
                  "text-xs md:text-sm text-zui-white/40 italic",
                  rubikClassName
                )}
              >
                {pillar.signal}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SacredPillars;
