/* eslint-disable @next/next/no-img-element */
import React from "react";

interface DetailSectionProps {}

const DetailSection: React.FC<DetailSectionProps> = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative mt-20 px-10 md:px-0">
      <div className="hidden md:block">
        <img
          className="w-[292px] rotate-15"
          src="https://cdn.zo.xyz/gallery/media/images/e4617dcd-70cf-471a-90f9-38efd66ea9b7_20240724121442.gif?w=300"
          alt=""
        />
        <img
          className="w-[292px] -rotate-15 -translate-x-10"
          src="https://cdn.zo.xyz/gallery/media/images/56910c1c-e0d5-4df6-9809-477532c775e1_20240724121358.gif"
          alt=""
        />
      </div>

      <div className="md:w-1/3 flex flex-col items-center ">
        <img
          className="w-[120px] md:w-44 h-auto"
          src="https://cdn.zo.xyz/gallery/media/images/d33f3425-fa81-404d-889e-3bbe1fa01bdb_20240724121333.png"
          alt=""
        />

        <div className="text-center mx-auto ">
          <p className="font-normal md:font-bold text-base md:text-2xl mt-4">
            After searching for eons and numerous claims of finding one and some
            becoming one, Silicon Valley has finally made a real Unicorn!
            <br />
            <br />
            Rumours say, it turned out a bit retarded.
          </p>
        </div>
        <img
          className="w-[280px] md:w-[410px] mt-10"
          src="https://cdn.zo.xyz/gallery/media/images/0c10afbd-b857-4585-bce4-a48737bcfc97_20240730125558.png"
          alt=""
        />
      </div>

      <div className="flex md:block">
        <img
          className="md:hidden w-[120px] h-auto object-contain rotate-15"
          src="https://cdn.zo.xyz/gallery/media/images/e4617dcd-70cf-471a-90f9-38efd66ea9b7_20240724121442.gif?w=300"
          alt=""
        />
        <img
          className="md:hidden w-[120px] h-auto object-contain -rotate-15 -translate-x-10 translate-y-20"
          src="https://cdn.zo.xyz/gallery/media/images/56910c1c-e0d5-4df6-9809-477532c775e1_20240724121358.gif"
          alt=""
        />
        <img
          className="w-[120px] md:w-[292px] h-auto object-contain -rotate-15 -translate-x-10 md:translate-x-5"
          src="https://cdn.zo.xyz/gallery/media/images/214e2ae5-9484-4d93-bf4f-2d201023de95_20240724121431.gif"
          alt=""
        />
        <img
          className="w-[90px] md:w-[292px] rotate-15 h-auto object-contain -translate-x-36 translate-y-20 md:translate-x-5"
          src="https://cdn.zo.xyz/gallery/media/images/160367f0-dd4a-4820-9fd6-9e3d77c3eae8_20240724121412.gif"
          alt=""
        />
      </div>
    </div>
  );
};

export default DetailSection;
