import { cn } from "@zo/utils/font";
import React, { useEffect, useState } from "react";
import { Button } from "../../ui";
import { syneClassName, rubikClassName } from "../../utils/font";
import ZoRadio from "./ZoRadio";

const WORDS = ["build", "ship", "raise", "connect", "create"] as const;
const WORD_INTERVAL = 2200;
const APPLY_URL = "https://zostel.typeform.com/to/LgcBfa0M";

const HouseHero: React.FC = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % WORDS.length);
    }, WORD_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleApply = () => {
    window.open(APPLY_URL, "_blank");
  };

  return (
    <section className="flex flex-col items-center text-center w-full min-h-[90vh] md:min-h-screen md:max-h-[1400px] relative overflow-hidden">
      {/* Background blob */}
      <div className="blob" />

      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover opacity-40 z-0"
        src="/hero.mp4"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-zui-dark/60 via-zui-dark/40 to-zui-dark z-10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center flex-1 px-4 max-w-[900px] mx-auto">
        {/* Radio pill */}
        <div className="mb-8">
          <ZoRadio />
        </div>

        {/* Headline */}
        <h1
          className={cn(
            "text-4xl leading-[1.1] md:text-[80px] md:leading-[1.1] font-bold",
            syneClassName
          )}
        >
          Where Founders
          <br />
          <span className="relative inline-block w-full h-[1.2em] overflow-hidden">
            {WORDS.map((word, index) => (
              <span
                key={word}
                className={cn(
                  "absolute inset-x-0 top-0 text-zui-yellow transition-all duration-700 transform",
                  index === currentWordIndex
                    ? "opacity-100 translate-y-0 scale-100"
                    : index < currentWordIndex
                    ? "opacity-0 -translate-y-full scale-95"
                    : "opacity-0 translate-y-full scale-95"
                )}
              >
                {word}.
              </span>
            ))}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className={cn(
            "mt-6 md:mt-8 text-base md:text-xl text-zui-white/60 max-w-[600px] leading-relaxed",
            rubikClassName
          )}
        >
          Best shipping environments to accelerate yourself.
        </p>

        {/* CTA */}
        <div className="flex flex-col md:flex-row items-center gap-4 mt-10">
          <Button onClick={handleApply} type="primary" className="w-[240px]">
            Apply for Cohort 1
          </Button>
          <Button
            onClick={() => {
              const el = document.getElementById("houses");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            type="secondary"
            className="w-[240px]"
          >
            Explore Houses
          </Button>
        </div>

      </div>

      {/* Scroll indicator */}
      <div className="relative z-20 pb-8 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-zui-white/20 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 rounded-full bg-zui-white/40" />
        </div>
      </div>
    </section>
  );
};

export default HouseHero;
