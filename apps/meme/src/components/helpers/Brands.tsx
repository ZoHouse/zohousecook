/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import React from "react";
import Marquee from "react-fast-marquee";
import { backersList } from "../../config";

interface BrandsProps {}

const Brands: React.FC<BrandsProps> = () => {
  return (
    <div className="flex flex-col justify-center items-center my-16 md:my-32">
      <h4 className="text-base md:text-2xl text-zui-silver font-medium ">
        from the backers of
      </h4>

      <Marquee className="align-baseline mt-6 md:mt-10" >
        {backersList.map((imgSrc, index) => (
          <div className="h-6 md:h-14 mx-4 md:mx-10" key={index}>
            <img
              src={imgSrc}
              alt={`Backer ${index}`}
              className="object-contain h-full grayscale"
            />
          </div>
        ))}
      </Marquee>

      <h4 className="text-base md:text-2xl text-zui-silver font-medium mt-14 md:mt-32">
        as not seen on
      </h4>
      <img
        className="px-10 w-full md:px-32 object-contain md:-translate-y-5 mt-4"
        src="https://cdn.zo.xyz/gallery/media/images/fa3b5587-2cee-4212-862e-cc6a57459b15_20240724130310.png"
        alt=""
      />
    </div>
  );
};

export default Brands;
