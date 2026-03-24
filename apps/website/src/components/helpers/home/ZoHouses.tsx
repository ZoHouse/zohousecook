import { cn } from "@zo/utils/font";
import Image from "next/image";
import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { Stats } from "../../ui";
import { HomePageStatType } from "../../ui/Stats";
import { rubikClassName, syneClassName } from "../../utils/font";
import ZoHouseCard, { ZoHouseCardProps } from "./ZoHouseCard";
interface ZoHousesProps {
  zoHouses: ZoHouseCardProps[];
}

const stats: HomePageStatType[] = [
  { value: "100,000", label: "Zo Citizens", valueSuffix: "+" },
  { value: 500, label: "Founder Members", valueSuffix: "+" },
  { value: 400, label: "Events Hosted", valueSuffix: "+" },
];
const ZoHouses: React.FC<ZoHousesProps> = ({ zoHouses }) => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();
  const statsSectionRef = useFadeInOnScroll<HTMLDivElement>({
    start: "top 90%",
    end: "top 50%",
  });

  return (
    <section ref={sectionRef} id="zo-house" className="relative z-20">
      <h2 className="sub-heading-2 font-bold text-center flex justify-center items-center gap-6">
        <Image
          className="w-[160px] md:w-[240px] object-contain"
          src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/29f3349e-4fe2-4791-8b7d-275ec9e4754b_20240902062845.svg`}
          alt="zo-house"
          height={48}
          width={240}
        />
      </h2>
      <h2
        className={cn(
          "sub-heading-2 text-center md:w-[80%] mx-auto mt-6 md:mt-10",
          rubikClassName
        )}
      >
        Culturally powerful and technologically abundant clubhouses, with
        exclusive 24x7 access for Founder Members.
      </h2>
      <div className="grid md:grid-cols-3 gap-6 mt-10 z-20">
        {zoHouses.map((house, index) => (
          <ZoHouseCard
            key={`house-${index}`}
            mediaLink={house.mediaLink}
            titleLayeredTextLink={house.titleLayeredTextLink}
            title={house.title}
            link={house.link}
          />
        ))}
      </div>
      <div className="mt-10 md:mt-0 relative z-10 pointer-events-none select-none">
        <div className="hidden md:block -translate-y-10 w-fit h-full relative">
          <img
            className="absolute left-[66.76%] top-[62.15%] w-10 aspect-square"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/338ca184-4bb8-4487-b6e1-79a9b3809f0f_20240828105503.gif`}
            alt="zo-logo"
          />
          <img
            className="absolute left-[58.98%] top-[56.1%] w-10 aspect-square"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/338ca184-4bb8-4487-b6e1-79a9b3809f0f_20240828105503.gif`}
            alt="zo-logo"
          />
          <img
            className="absolute left-[10.29%] top-[46.94%] w-10 aspect-square"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/338ca184-4bb8-4487-b6e1-79a9b3809f0f_20240828105503.gif`}
            alt="zo-logo"
          />
          <img
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/54ec56a8-5098-498d-8a54-ea48f4d85a07_20240902062930.svg`}
            alt="zo-house-world-map"
          />
        </div>
        <h4
          className={cn(
            "sub-heading-2 font-bold text-center md:absolute md:whitespace-nowrap top-32 left-[50%] md:-translate-x-[50%] overflow-visible",
            syneClassName
          )}
        >
          Coming soon to top{" "}
          <span className="text-zui-yellow text-2xl md:text-[40px]">
            50 Global Hubs
          </span>
        </h4>
      </div>
      <hr className="w-[80%] md:w-[60%] horizontal-divider my-20" />
      <div ref={statsSectionRef}>
        <Stats data={stats} />
      </div>
      <hr className="w-[80%] md:w-[60%] horizontal-divider my-20" />
    </section>
  );
};

export default ZoHouses;
