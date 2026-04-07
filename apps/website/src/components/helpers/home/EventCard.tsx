import { cn } from "@zo/utils/font";
import React, { useEffect, useState } from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { syneClassName } from "../../utils";

interface EventCardProps {}

const WORDS = [
  "Quests",
  "Badges",
  "Earn",
] as const;
const WORD_ROTATION_INTERVAL = 2000;
const TYPEFORM_URL = "https://zostel.typeform.com/to/LgcBfa0M";

const EventCard: React.FC<EventCardProps> = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % WORDS.length);
    }, WORD_ROTATION_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleHostEvent = () => {
    window.open(TYPEFORM_URL, "_blank");
  };

  return (
    <section
      ref={sectionRef}
      className="border border-transparent rounded-2xl my-20 md:my-[120px] inner-border"
    >
      <div className="flex items-center justify-center bg-zui-dark text-white rounded-xl mx-auto p-10">
          <h3
            className={cn(
              "sub-heading-2 font-bold text-center",
              syneClassName
            )}
          >
            One passport. Unlimited ways to belong. <br />
            <span className="whitespace-nowrap inline-flex items-center justify-center">
              <span className="relative inline-block w-[140px] h-[1.2em]">
                <span className="words-slide absolute inset-0 flex items-center justify-center">
                  {WORDS.map((word, index) => (
                    <AnimatedWord
                      key={word}
                      word={word}
                      isActive={index === currentWordIndex}
                      position={
                        index === currentWordIndex
                          ? "current"
                          : index < currentWordIndex
                          ? "before"
                          : "after"
                      }
                    />
                  ))}
                </span>
              </span>
            </span>
          </h3>
      </div>
    </section>
  );
};

export default EventCard;

const AnimatedWord: React.FC<{
  word: string;
  isActive: boolean;
  position: "before" | "current" | "after";
}> = ({ word, isActive, position }) => {
  const getTransformClass = () => {
    if (isActive) return "opacity-100 scale-100 translate-y-0";
    return position === "before"
      ? "opacity-0 scale-95 -translate-y-full"
      : "opacity-0 scale-95 translate-y-full";
  };

  return (
    <span
      className={`absolute text-zui-yellow transition-all duration-700 transform ${getTransformClass()}`}
    >
      {word}
    </span>
  );
};
