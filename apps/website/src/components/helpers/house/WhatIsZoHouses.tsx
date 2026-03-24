import { cn } from "@zo/utils/font";
import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName, syneClassName } from "../../utils/font";

const WhatIsZoHouses: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section
      ref={sectionRef}
      className="flex flex-col md:flex-row items-center gap-10 md:gap-16"
    >
      {/* Text */}
      <div className="flex-1">
        <h2 className={cn("sub-heading-2 font-bold", syneClassName)}>
          India&#39;s First Permanent
          <br />
          <span className="text-zui-yellow">Hacker House.</span>
        </h2>
        <p
          className={cn(
            "mt-6 text-base md:text-lg text-zui-white/70 leading-relaxed max-w-[520px]",
            rubikClassName
          )}
        >
          SF has them. Lisbon has them. India didn&#39;t until now. Two houses in
          Bangalore. 34 beds. Year-round cohorts.
        </p>
        <p
          className={cn(
            "mt-4 text-base md:text-lg text-zui-white/70 leading-relaxed max-w-[520px]",
            rubikClassName
          )}
        >
          Most hacker houses are pop-ups. Two weeks, a month, gone. Zo House
          runs year-round. Cohorts rotate, but the house stays alive. The
          culture compounds because the house never resets.
        </p>
      </div>

      {/* Video */}
      <div className="w-full md:w-[480px] h-[320px] md:h-[400px] rounded-2xl overflow-hidden inner-border shiny-card relative">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          src={`${process.env.MEDIA_BASE_URL}/gallery/media/videos/c243c43c-7199-485e-9e56-8976a594f4f9_20240903100216.mp4`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zui-dark/60 to-transparent" />
      </div>
    </section>
  );
};

export default WhatIsZoHouses;
