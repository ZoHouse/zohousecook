import { cn } from "@zo/utils/font";
import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName, syneClassName } from "../../utils/font";

interface StackItem {
  emoji: string;
  title: string;
  description: string;
}

const stack: StackItem[] = [
  {
    emoji: "🏠",
    title: "Housing + Hospitality",
    description:
      "Beds, common spaces, kitchen, pool, pickleball, studio. 12 years of Zostel ops DNA.",
  },
  {
    emoji: "🎯",
    title: "12-Week Curriculum",
    description:
      "Discover → Design → Build → Pitch → Demo → Launch. Weekly milestones. Extension based on progress.",
  },
  {
    emoji: "🧠",
    title: "Mentors",
    description:
      "Mentor-in-Residence rotates weekly. Not office hours — they live with you.",
  },
  {
    emoji: "💰",
    title: "Capital Access",
    description:
      "VC office runs to Accel, Stellaris, Peak XV, Kalaari, Bessemer. Demo Day with 100+ attendees.",
  },
  {
    emoji: "📢",
    title: "GTM + Media",
    description:
      "Podcast studio. Content pipeline. Social amplification. Founders get visibility building alone never provides.",
  },
  {
    emoji: "🌐",
    title: "Network",
    description:
      "501 Founder Members. Growing alumni base. Cross-house access. The network compounds with every cohort.",
  },
  {
    emoji: "🎮",
    title: "$Zo XP System",
    description:
      "Everything earns XP. Standups, showcases, poker nights, run club. Reputation = access. Level up.",
  },
  {
    emoji: "🎪",
    title: "Culture + Rituals",
    description:
      "Monday standups. Wednesday dinners. Friday showcases. Poker, art jams, bio-hack, pickleball. The house is always alive.",
  },
];

const FounderStack: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section ref={sectionRef} className="mt-20 md:mt-[120px]">
      <h2
        className={cn(
          "sub-heading-2 font-bold text-center",
          syneClassName
        )}
      >
        The Founder <span className="text-zui-yellow">Stack</span>
      </h2>
      <p
        className={cn(
          "text-center text-base md:text-lg text-zui-white/50 mt-4 max-w-[500px] mx-auto",
          rubikClassName
        )}
      >
        What you actually get. No overpromises. Promise less, deliver more.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 md:mt-16">
        {stack.map((item) => (
          <div
            key={item.title}
            className="p-6 rounded-2xl inner-border bg-zui-dark group"
          >
            <span className="text-3xl">{item.emoji}</span>
            <h3
              className={cn(
                "text-base md:text-lg font-bold mt-4",
                rubikClassName
              )}
            >
              {item.title}
            </h3>
            <p
              className={cn(
                "text-sm text-zui-white/50 mt-2 leading-relaxed",
                rubikClassName
              )}
            >
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FounderStack;
