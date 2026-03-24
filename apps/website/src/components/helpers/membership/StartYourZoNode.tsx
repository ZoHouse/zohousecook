import React from "react";
import { cn } from "@zo/utils/font";
import { rubikClassName, syneClassName } from "../../utils/font";
import { Button } from "../../ui";
import { useFadeInOnScroll } from "../../../hooks";

export interface StartYourZoNodeStep {
  media: string;
  title: string;
}

interface StartYourZoNodeProps {
  steps: StartYourZoNodeStep[];
}

const StartYourZoNode: React.FC<StartYourZoNodeProps> = ({ steps }) => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section className="py-10 md:py-20" ref={sectionRef}>
      <p
        className={cn(
          "text-2xl leading-8 font-medium text-white/40 text-center whitespace-nowrap",
          rubikClassName
        )}
      >
        Already a founder member?
      </p>
      <h2
        className={cn(
          "mt-4 text-[40px] font-bold leading-[48px] text-center uppercase",
          syneClassName
        )}
      >
        start your zo node
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:py-10 mb-10">
        {steps.map((step) => {
          const isImage = step.media.includes(".png");
          return (
            <div key={step.title} className="w-full md:max-w-[392px]">
              {isImage ? (
                <img
                  className="w-full h-full object-contain aspect-square"
                  src={step.media}
                  alt={step.title}
                />
              ) : (
                <video
                  src={step.media}
                  autoPlay
                  loop
                  playsInline
                  controls={false}
                  controlsList="nodownload"
                  muted
                  className="w-full h-full object-contain aspect-square"
                />
              )}

              <h3
                className={cn(
                  "text-2xl font-medium tracking-[-1%] text-center mt-6",
                  rubikClassName
                )}
              >
                {step.title}
              </h3>
            </div>
          );
        })}
      </div>

      <Button disabled type="primary" className="mt-20">
        Coming Soon
      </Button>
    </section>
  );
};

export default StartYourZoNode;
