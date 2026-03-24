import React from "react";
import { zoHouseData } from "../../../config";
import { useFadeInOnScroll } from "../../../hooks";
import ZoHouseCard from "../home/ZoHouseCard";

interface ZoHouseSectionProps {}

const ZoHouseSection: React.FC<ZoHouseSectionProps> = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section ref={sectionRef} className="relative z-20">
      <h2 className="sub-heading-2 text-center">
        Zo Houses where you can vibe today
      </h2>
      <div className="grid md:grid-cols-3 gap-6 mt-10">
        {zoHouseData.map((house, index) => (
          <ZoHouseCard
            key={`house-${index}`}
            mediaLink={house.mediaLink}
            titleLayeredTextLink={house.titleLayeredTextLink}
            title={house.title}
            link={house.link}
          />
        ))}
      </div>
      <hr className="w-[80%] md:w-[60%] horizontal-divider my-20" />
    </section>
  );
};

export default ZoHouseSection;
