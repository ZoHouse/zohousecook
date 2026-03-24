import { sendGTMEvent } from "@next/third-parties/google";
import React from "react";
import { useFadeInOnScroll } from "../../../hooks";

interface LocationSectionProps {}

const LocationSection: React.FC<LocationSectionProps> = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  const openLocation = () => {
    sendGTMEvent({ event: "click_view_map" });
    window.open("https://maps.app.goo.gl/1e7VBA11KjUjt85q9");
  };

  return (
    <section ref={sectionRef} id="location" className="relative z-20">
      <h2 className="sub-heading-2 text-center">Experience IRL</h2>
      {/* location card */}
      <div
        role="button"
        onClick={openLocation}
        className="w-full md:w-1/3 mx-auto aspect-square h-full mt-6 md:mt-10 rounded-2xl overflow-hidden h-[328px] relative inner-border"
      >
        <div className="z-20 absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%]">
          <img
            className="w-10 aspect-square object-contain"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/338ca184-4bb8-4487-b6e1-79a9b3809f0f_20240828105503.gif`}
            alt="zo-zo"
          />
        </div>
        <p className="absolute z-20 left-[50%] -translate-x-[50%] bottom-8">
          View on Map
        </p>

        <div className="absolute w-full h-full z-10 bg-zui-dark opacity-80" />
        <img
          className="w-full h-full object-cover"
          src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/1a285a9b-54f8-4f96-8b84-72e5e5bbf244_20240821141535.png`}
          alt=""
        />
      </div>
      <hr className="w-[80%] md:w-[60%] horizontal-divider my-20" />
    </section>
  );
};

export default LocationSection;
