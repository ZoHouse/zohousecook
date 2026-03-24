import { cn } from "@zo/utils/font";
import Image from "next/image";
import React from "react";
import Marquee from "react-fast-marquee";
import { useFadeInOnScroll } from "../../../hooks";
import { Button, Stats } from "../../ui";
import { HomePageStatType } from "../../ui/Stats";
import { rubikClassName } from "../../utils";

interface ZostelProps {}

const stats: HomePageStatType[] = [
  { value: 100, label: "Destinations in India, SEA", valueSuffix: "+" },
  {
    value: "120",
    label: "Hostels & Homes",
    valueSuffix: "+",
  },
  {
    value: "4M",
    label: "Travelers Hosted",
    valueSuffix: "+",
  },
  {
    value: "600k",
    label: "Solo Females",
    valueSuffix: "+",
  },
];

const zostelImages = [
  `${process.env.MEDIA_BASE_URL}/gallery/media/images/11d3f444-ba7e-4180-b86d-3856dedae504_20250312175533.png?w=320`,
  `${process.env.MEDIA_BASE_URL}/gallery/media/images/21687f90-568e-4f3b-bccf-5d9839fc40aa_20250312175603.png?w=320`,
  `${process.env.MEDIA_BASE_URL}/gallery/media/images/998e168e-43b4-47ae-8c74-4efc4ba0cb87_20250312175636.png?w=320`,
  `${process.env.MEDIA_BASE_URL}/gallery/media/images/f3d23b4d-ea77-4700-883c-8415f5e60092_20250312175653.png?w=320`,
  `${process.env.MEDIA_BASE_URL}/gallery/media/images/17b0b2b6-7f64-4937-aff0-9070c264464f_20250312175704.png?w=320`,
  `${process.env.MEDIA_BASE_URL}/gallery/media/images/dd3e5ab2-9db0-4508-bcc3-5dca20307c6f_20250312175711.png?w=320`,
  `${process.env.MEDIA_BASE_URL}/gallery/media/images/ab662a5e-f7c7-4654-a7fe-ce9069522a41_20250312175718.png?w=320`,
  `${process.env.MEDIA_BASE_URL}/gallery/media/images/d15aa05c-7047-4349-9531-08f5a5331dd2_20250312175728.png?w=320`,
];

const Zostel: React.FC<ZostelProps> = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  const statsSectionRef = useFadeInOnScroll<HTMLDivElement>({
    start: "top 90%",
    end: "top 50%",
  });

  const openZostel = () => {
    window.open("https://www.zostel.com/", "_blank");
  };

  return (
    <section ref={sectionRef} id="zostel" className="relative z-20">
      <h2 className="sub-heading-2 text-center flex justify-center font-bold items-center gap-6">
        <Image
          className="w-[160px] md:w-[240px] object-contain"
          src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/8eea8fe8-323d-4ca9-a274-2523bd33974d_20250312175318.svg`}
          alt="zo-studio"
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
        World&apos;s Largest Backpacker Hostel Chain.
      </h2>

      <p
        className={cn(
          "mt-4 md:mt-6 sub-text-1 leading-8 font-medium text-center text-zui-silver md:w-[50%] mx-auto",
          rubikClassName
        )}
      >
        Community first hostels in unexplored destinations.
      </p>

      <div ref={statsSectionRef}>
        <Stats data={stats} className="my-16" />
      </div>

      <div className="w-full overflow-hidden hidden md:block mt-8 mb-6 relative">
        {/* Left gradient overlay */}
        <div className="absolute left-0 top-0 w-24 h-full z-10 pointer-events-none bg-gradient-to-r from-zui-dark to-transparent" />

        {/* Right gradient overlay */}
        <div className="absolute right-0 top-0 w-24 h-full z-10 pointer-events-none bg-gradient-to-l from-zui-dark to-transparent" />

        <Marquee pauseOnHover direction="left" loop={0} className="py-4">
          {zostelImages.map((src, index) => (
            <div
              key={`img-${index}`}
              className="gallery-item w-[320px] px-3 aspect-square relative"
            >
              <img
                src={src}
                alt={`Zostel destination ${index + 1}`}
                className="w-full h-full object-cover rounded-3xl hover:scale-105 transition-transform duration-300 inner-border-2 hover:z-20 relative"
              />
            </div>
          ))}
        </Marquee>
      </div>
      <div className="md:hidden overflow-hidden relative">
        <Marquee pauseOnHover direction="left" loop={0} speed={30}>
          <div className="flex items-center h-[220px] gap-4 px-2">
            {zostelImages.map((src, index) => (
              <img
                key={`mobile-img-${index}`}
                className={`object-cover w-[160px] h-[180px] rounded-2xl inner-border-2 flex-shrink-0 ${
                  index % 2 === 0 ? "-rotate-[4deg]" : "rotate-[4deg]"
                }`}
                src={src}
                alt={`Zostel destination ${index + 1}`}
              />
            ))}
          </div>
        </Marquee>
      </div>

      <div className="grid place-content-center mt-6 md:mt-8">
        <Button
          onClick={openZostel}
          className="flex mt-2 w-full md:w-72"
          type="primary"
        >
          Explore Zostel
        </Button>
      </div>
    </section>
  );
};

export default Zostel;
