import { cn } from "@zo/utils/font";
import Image from "next/image";
import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName } from "../../utils";
import ZoHotelCard, { ZoHotelCardProps } from "./ZoHotelCard";

interface ZoHotelsProps {
  zoHotels: ZoHotelCardProps[];
}

const ZoHotels: React.FC<ZoHotelsProps> = ({ zoHotels }) => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section ref={sectionRef} id="zo-hotels" className="relative z-20">
      <div className={cn("w-fit mx-auto relative", rubikClassName)}>
        <Image
          className="w-[160px] md:w-[240px] object-contain"
          src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/aeec1c78-9c5b-456b-911c-6be3b206f2ea_20240902071433.svg`}
          alt="zo-hotel-heading"
          height={48}
          width={240}
        />
        <span className="absolute text-sm text-zui-green mt-2 green-glow left-[25%] md:top-0 md:right-0 md:translate-x-[110%]">
          COMING SOON
        </span>
      </div>

      <h2
        className={cn(
          "sub-heading-2 text-center md:w-[80%] mx-auto mt-10",
          rubikClassName
        )}
      >
        Destination hotels designed for travellers, offering connectivity &
        homely luxury around the world.
      </h2>

      {/* cards */}
      <div className="mt-10 grid md:grid-cols-3 gap-10 md:gap-6">
        {zoHotels.map((hotel, index) => (
          <ZoHotelCard
            key={`index-${index}`}
            mediaLink={hotel.mediaLink}
            title={hotel.title}
          />
        ))}
      </div>

      <h6
        className={cn(
          "sub-text-1 leading-8 font-medium text-center text-zui-silver mt-16",
          rubikClassName
        )}
      >
        + More flagship Zo Hotels soon
      </h6>

      <hr className="w-[80%] md:w-[60%] horizontal-divider my-20" />
    </section>
  );
};

export default ZoHotels;
