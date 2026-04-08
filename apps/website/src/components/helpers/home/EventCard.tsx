import { cn } from "@zo/utils/font";
import React, { useEffect, useState } from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { syneClassName } from "../../utils";

const PHRASES = [
  "share experiences",
  "feel real connections",
  "build stories that become a part of you",
  "become the best version of yourself",
] as const;
const ROTATION_INTERVAL = 2500;

const EventCard: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PHRASES.length);
    }, ROTATION_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="border border-transparent rounded-2xl mt-8 mb-10 inner-border"
    >
      <div className="flex flex-col items-center justify-center bg-zui-dark text-white rounded-xl mx-auto p-10 md:p-16 gap-4">
        <h3
          className={cn(
            "text-2xl md:text-[40px] md:leading-[52px] font-bold text-center",
            syneClassName
          )}
        >
          You were looking for your people
        </h3>
        <div className="relative w-full h-[3.5em] md:h-[2em] overflow-hidden mt-3 md:mt-4">
          {PHRASES.map((phrase, index) => (
            <span
              key={phrase}
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-700 transform text-[#cfff50] text-xl md:text-[36px] font-bold text-center",
                syneClassName,
                index === currentIndex
                  ? "opacity-100 translate-y-0"
                  : index < currentIndex
                  ? "opacity-0 -translate-y-full"
                  : "opacity-0 translate-y-full"
              )}
            >
              to {phrase}
            </span>
          ))}
        </div>
        <p className="text-sm md:text-base text-white/50 text-center max-w-[480px] mt-2">
          The Zo World community is coming together to build this human-first world.
        </p>
      </div>
    </section>
  );
};

export default EventCard;
