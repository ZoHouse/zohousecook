import { cn } from "@zo/utils/font";
import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName, syneClassName } from "../../utils/font";

interface PhaseProps {
  week: string;
  name: string;
  description: string;
  gate: string;
}

const phases: PhaseProps[] = [
  {
    week: "1–2",
    name: "Discover",
    description: "Problem framing. 10 customer interviews. Market mapping.",
    gate: "Validated problem + 10 interview transcripts",
  },
  {
    week: "3–4",
    name: "Design",
    description: "Product architecture. Design sprint. Wireframing.",
    gate: "Product spec + wireframes",
  },
  {
    week: "5–8",
    name: "Build",
    description:
      "Four weeks of building. Weekly reviews. Peer code reviews. Beta launch by Week 8.",
    gate: "Working MVP with real users",
  },
  {
    week: "9–10",
    name: "Pitch",
    description:
      "Pitch crafting. Demo video. VC panel feedback. Office runs to Accel, Stellaris, Peak XV.",
    gate: "Polished deck + 2-min demo video",
  },
  {
    week: "11",
    name: "Demo",
    description:
      "Dress rehearsal. Final mentor sessions. Demo Day with 50–100+ attendees.",
    gate: "Demo Day presentation",
  },
  {
    week: "12",
    name: "Launch",
    description:
      "Investor follow-ups. Warm intros. Alumni onboarding. Fundraising pipeline activated.",
    gate: "Next chapter begins",
  },
];

const Program: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section ref={sectionRef} className="mt-20 md:mt-[120px]">
      <h2
        className={cn(
          "sub-heading-2 font-bold text-center",
          syneClassName
        )}
      >
        12 Weeks. Idea to{" "}
        <span className="text-zui-yellow">Demo-Ready.</span>
      </h2>
      <p
        className={cn(
          "text-center text-base md:text-lg text-zui-white/50 mt-4 max-w-[500px] mx-auto",
          rubikClassName
        )}
      >
        Every founder goes through the same structured journey. Every milestone
        scored through the Zo Club App.
      </p>

      {/* Timeline */}
      <div className="mt-10 md:mt-16 relative">
        {/* Vertical line */}
        <div className="hidden md:block absolute left-[50%] top-0 bottom-0 w-px bg-gradient-to-b from-zui-white/10 via-zui-yellow/30 to-zui-white/10" />

        <div className="space-y-6 md:space-y-0">
          {phases.map((phase, index) => {
            const isLeft = index % 2 === 0;
            return (
              <div
                key={phase.name}
                className={cn(
                  "md:flex items-center relative",
                  isLeft ? "md:flex-row" : "md:flex-row-reverse"
                )}
              >
                {/* Content */}
                <div
                  className={cn(
                    "md:w-[calc(50%-2rem)] p-6 rounded-2xl inner-border bg-zui-dark",
                    isLeft ? "md:mr-auto" : "md:ml-auto"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded bg-zui-yellow/10 text-zui-yellow font-semibold",
                        rubikClassName
                      )}
                    >
                      W{phase.week}
                    </span>
                    <h3
                      className={cn(
                        "text-xl md:text-2xl font-bold",
                        syneClassName
                      )}
                    >
                      {phase.name}
                    </h3>
                  </div>
                  <p
                    className={cn(
                      "text-sm md:text-base text-zui-white/70 leading-relaxed",
                      rubikClassName
                    )}
                  >
                    {phase.description}
                  </p>
                  <p
                    className={cn(
                      "text-xs text-zui-white/40 mt-3 italic",
                      rubikClassName
                    )}
                  >
                    Gate: {phase.gate}
                  </p>
                </div>

                {/* Center dot */}
                <div className="hidden md:flex absolute left-[50%] -translate-x-[50%] w-4 h-4 rounded-full bg-zui-yellow/80 border-4 border-zui-dark z-10" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Program;
