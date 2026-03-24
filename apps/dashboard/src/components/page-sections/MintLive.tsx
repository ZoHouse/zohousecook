/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-empty-interface */
import React from "react";
import { Button } from "../common";

interface MintLiveProps {}

const MintLive: React.FC<MintLiveProps> = () => {
  const openMint = () => {
    window.open("https://zo.xyz/membership");
  };

  return (
    <div className="w-full bg-zui-red border border-zui-red flex flex-col text-zui-black p-4 h-content overflow-hidden">
      <h3 className=" flex-shrink-0 font-bold text-5xl">Mint is Live</h3>

      <div className="flex-grow flex flex-col overflow-hidden mt-4">
        <p className="text-2xl flex-shrink-0 font-semibold w-5/6">
          Last chance to become a<br /> Founder of Zo World.
        </p>

        <Button
          fixedsize
          icon="arrow-right"
          className="justify-between mt-4"
          iconClassName="text-2xl"
          onClick={openMint}
        >
          Let&apos;s go!
        </Button>
      </div>
    </div>
  );
};

export default MintLive;
