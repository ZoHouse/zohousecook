import { sendGTMEvent } from "@next/third-parties/google";
import { cn } from "@zo/utils/font";
import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { Button } from "../../ui";
import { rubikClassName, scrollToId } from "../../utils";
interface FeaturesSectionProps {
  features: Array<{ emoji: string; description: string }>;
}
const FeaturesSection: React.FC<FeaturesSectionProps> = ({ features }) => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  const handleApplyToOwnClick = () => {
    sendGTMEvent({ event: "click_cta" });
    scrollToId("apply");
  };
  return (
    <section id="features" ref={sectionRef}>
      <h2 className="w-full md:w-[60%] sub-heading-2 mx-auto text-center">
        A one-time subscription for a lifetime of social wins
      </h2>

      <div
        className={cn(
          "md:mt-10 flex flex-wrap justify-center md:grid grid-cols-2 md:grid-cols-3 md:gap-10 md:px-10",
          rubikClassName
        )}
      >
        {features.map((feature, index) => (
          <div className="w-1/2 md:w-full text-center mt-10 md:mt-0 p-1 md:p-0" key={`feature-${index}`}>
            <h4 className="sub-heading-2">{feature.emoji}</h4>
            <p className="sub-text-1 font-medium">{feature.description}</p>{" "}
          </div>
        ))}
        <div />
      </div>
      <Button
        onClick={handleApplyToOwnClick}
        className="mt-10 mx-auto"
        type="primary"
      >
        Become a Partner
      </Button>

      <hr className="w-[80%] md:w-[60%] horizontal-divider my-20" />
    </section>
  );
};

export default FeaturesSection;
