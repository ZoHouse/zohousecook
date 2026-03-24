import { cn } from "@zo/utils/font";
import React, { useEffect, useState } from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { syneClassName } from "../../utils";

interface EventCardProps {}

const WORDS = [
  "app",
  "protocol",
  "token",
  "community",
  "agent",
  "game",
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
      <div className="flex flex-col-reverse md:flex-row items-center justify-between bg-zui-dark text-white rounded-xl mx-auto">
        <div className="flex-1 p-10 w-full flex flex-col items-center md:items-start">
          <h3
            className={cn(
              "sub-heading-2 font-bold text-center md:text-left",
              syneClassName
            )}
          >
            Host an event at Zo Houses <br />
            <span className="whitespace-nowrap inline-flex items-center">
              for your{"    "}
              <span className="relative ml-2 inline-block w-[140px]">
                <span className="words-slide absolute inset-0 flex items-center">
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

          <button
            onClick={handleHostEvent}
            className="w-full mt-10 bg-white cursor-pointer md:w-[288px] text-base relative items-center text-zui-dark px-10 py-4 rounded-xl font-bold"
          >
            Host Event
          </button>
        </div>

        <div className="w-full md:w-[468px] h-[288px] rounded-t-2xl md:rounded-none md:rounded-r-2xl overflow-hidden">
          <video
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/videos/45bee30e-a08d-4f07-8179-0fc6816e14a9_20250213064533.mp4`}
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
          />
        </div>
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
