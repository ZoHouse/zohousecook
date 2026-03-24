import { cn } from "@zo/utils/font";
import Image from "next/image";
import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { Stats } from "../../ui";
import { HomePageStatType } from "../../ui/Stats";
import { rubikClassName } from "../../utils";

interface ZoStudioProps {}

const stats: HomePageStatType[] = [
  { value: 100, label: "Artists Launched", valueSuffix: "+" },
  {
    value: "12,000",
    label: "NFTs Sold",
    valueSuffix: "+",
  },
  {
    value: "$600,000",
    label: "Artist Revenues",
    valueSuffix: "+",
  },
];

const ZoStudio: React.FC<ZoStudioProps> = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  const statsSectionRef = useFadeInOnScroll<HTMLDivElement>({
    start: "top 90%",
    end: "top 50%",
  });

  return (
    <section ref={sectionRef} id="zo-studio" className="relative z-20">
      <h2 className="sub-heading-2 text-center flex justify-center font-bold items-center gap-6">
        <Image
          className="w-[160px] md:w-[240px] object-contain"
          src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/5e83ddb8-d54e-40b9-a14c-db7afd58f764_20240902071537.svg`}
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
        A creative powerhouse, where a new generation of artists can ideate,
        produce, & seamlessly ship their work.
      </h2>

      <p
        className={cn(
          "mt-4 md:mt-6 sub-text-1 leading-8 font-medium text-center text-zui-silver md:w-[50%] mx-auto",
          rubikClassName
        )}
      >
        Discover & collaborate with artists. Supercharge brand growth via custom
        playbooks & resources.
      </p>

      <div ref={statsSectionRef}>
        <Stats data={stats} className="my-16" />
      </div>

      <div className="grid md:grid-cols-4 grid-rows-1 place-content-center">
        <img
          className="object-cover w-[200px] md:w-full h-full aspect-square rounded-2xl -rotate-[8deg] inner-border-2"
          src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/00667b31-348c-4845-b0b5-9bbabc781d11_20240815101011.jpeg?w=520`}
          alt=""
        />

        <img
          className="object-cover w-[200px] md:w-full h-full aspect-square rounded-2xl rotate-[4deg] inner-border-2"
          src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/917a2e59-32d7-4b87-b876-5bdf43133c5d_20240815101029.png?w=520`}
          alt=""
        />
        <img
          className="object-cover w-[200px] md:w-full h-full aspect-square rounded-2xl -rotate-[4deg] inner-border-2"
          src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/8311fab6-2bd6-4eb9-847d-02c27d51b663_20240815101106.png?w=520`}
          alt=""
        />
        <img
          className="object-cover w-[200px] md:w-full h-full aspect-square rounded-2xl rotate-[8deg] inner-border-2"
          src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/e235a762-7efe-4ae2-95c7-473f1589c076_20240820094336.png?w=520`}
          alt=""
        />
      </div>
    </section>
  );
};

export default ZoStudio;
