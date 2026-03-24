import React from "react";
import { rubikClassName, syneClassName } from "../../utils";
import { cn } from "@zo/utils/font";
import { useFadeInOnScroll } from "../../../hooks";

export interface Partner {
  id: number;
  pfp: string;
  name: string;
  review: string;
  clipmask: string;
  title: string;
}

interface PartnersProps {
  partners: Partner[];
}

const Partners: React.FC<PartnersProps> = ({ partners }) => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section className="py-10 md:py-20 px-6 lg:px-[108px] max-w-[1400px] mx-auto" ref={sectionRef}>
      <h4
        className={cn(
          "text-[40px] leading-8 -tracking-[3%] font-bold text-center",
          syneClassName
        )}
      >
        PARTNERS
      </h4>
      <p
        className={cn(
          "mt-4 md:mt-10 md:text-2xl md:leading-8 font-medium text-white/40 text-center tracking-[1%]",
          rubikClassName
        )}
      >
        Accelerate Your 10X Journey with Exclusive Member Discounts on Curated
        Services
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 md:mt-10 justify-items-center">
        {partners.map((partner) => (
          <div
            key={partner.id}
            className="w-full md:w-[392px] mx-auto rounded-3xl py-6 md:p-10"
          >
            <h5
              className={cn(
                syneClassName,
                "mt-6 text-2xl leading-8 font-bold text-center -tracking-[3%] uppercase"
              )}
            >
              {partner.title}
            </h5>
            <img
              src={partner.pfp}
              alt={partner.name}
              className={cn(
                "w-[200px] aspect-square mx-auto rounded-full mt-6",
                partner.clipmask
              )}
            />
            <h6
              className={cn(
                rubikClassName,
                "mt-6 text-2xl leading-8 font-medium text-center tracking-[1%]"
              )}
            >
              {partner.name}
            </h6>
            <p
              className={cn(
                rubikClassName,
                "mt-2 leading-5 font-medium text-center tracking-[1%] text-white/40"
              )}
            >
              {partner.review}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Partners;
