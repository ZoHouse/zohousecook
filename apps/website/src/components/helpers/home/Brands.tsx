import { cn } from "@zo/utils/font";
import { useFadeInOnScroll } from "../../../hooks";
import React from "react";
import { syneClassName } from "../../utils/font";
export type BrandsType = {
  src: string;
  mediaLink: string;
  alt: string;
};
interface BrandsProps {
  brands: BrandsType[];
}

const Brands: React.FC<BrandsProps> = ({ brands }) => {
  const openLink = (link: string) => window.open(link);

  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section ref={sectionRef}>
      <h2 className={cn("sub-heading-3 font-bold text-center", syneClassName)}>
        As seen on
      </h2>
      <div className="mt-10 md:mt-16 grid grid-cols-2 gap-4 align-middle md:flex flex-wrap justify-center md:gap-10">
        {brands.map((brand, index) => (
          <div
            className="flex items-center justify-center bg-zui-light md:bg-transparent max-h-[60px] md:max-h-fit p-6 md:p-0 rounded-2xl md:rounded-none overflow-hidden md:overflow-visible"
            onClick={openLink.bind(null, brand.src)}
            role="button"
            key={`brand-${index}`}
          >
            <img
              src={brand.mediaLink}
              alt={brand.alt}
              className="grayscale opacity-80 hover:opacity-100 object-contain w-fit md:mt-10 place-self-center"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default Brands;
