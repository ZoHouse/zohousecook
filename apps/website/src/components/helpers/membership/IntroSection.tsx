import { CircularProgress } from "@mui/material";
import { useQueryApi } from "@zo/auth";
import { cn } from "@zo/utils/font";
import React from "react";
import { formatEther } from "viem";
import { Button } from "../../ui";
import { rubikClassName, syneClassName } from "../../utils/font";

interface IntroSectionProps {}

const IntroSection: React.FC<IntroSectionProps> = () => {
  const { data: floorPrice, isLoading } = useQueryApi<string | number>(
    "WEBTHREE_FOUNDER_MARKETPLACE_LISTINGS",
    {
      select: (data) => {
        const price = data.data?.listings?.[0]?.price?.current;
        if (price) {
          return Number(formatEther(BigInt(String(price.value)))).toFixed(2);
        }
        return 0;
      },
      refetchOnWindowFocus: false,
    }
  );

  const openOpensea = () => {
    window.open("https://opensea.io/collection/founders-of-zo-world", "_blank");
  };

  const openBlur = () => {
    window.open("https://blur.io/collection/founders-of-zo-world", "_blank");
  };

  const openFounderWhiteListForm = () => {
    window.open("https://form.typeform.com/to/ePm7XcXz", "_blank");
  };

  return (
    <section className="flex flex-col-reverse flex-wrap-reverse lg:flex-nowrap md:flex-row justify-center items-center md:h-screen">
      <div className="relative z-10">
        <h1
          className={cn(
            "text-[32px] md:text-[64px] leading-8 md:leading-[64px] font-[600] -tracking-[3%] text-center md:text-left",
            syneClassName
          )}
        >
          Become a <br />
          <span className="text-[32px] md:text-[80px] font-extrabold uppercase whitespace-nowrap">
            Zo World <br />
            Founder
          </span>
        </h1>

        <p
          className={cn(
            "text-center md:text-left mt-6 font-medium leading-5 text-white/40 px-6 md:px-0",
            rubikClassName
          )}
        >
          Join an exclusive club of entrepreneurs, innovators and creators.
          Access an elite network, lifestyle & 10x yourself, following your
          heart.
        </p>

        <h5
          className={cn(
            "mt-6 font-medium leading-5 text-white text-center md:text-left",
            rubikClassName
          )}
        >
          Buy Membership NFT on
        </h5>

        <div className="mt-6 flex items-center justify-center md:justify-start gap-4 relative z-20 w-full md:w-1/2">
          <div className="primary-button rounded-xl w-1/2">
            <Button
              showEffect={true}
              type="primary"
              onClick={openOpensea}
              className={cn(
                "bg-zui-white rounded-xl flex items-center gap-1 px-8 py-1 text-zui-dark font-semibold md:w-full",
                rubikClassName
              )}
            >
              <span className="flex items-center gap-1">
                <img
                  className="w-12 aspect-square"
                  src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/d85be9c8-f5fe-4185-9b5e-85a2d586abbb_20241203124040.png`}
                  alt="open-sea"
                />
                {isLoading ? (
                  <CircularProgress size={16} />
                ) : (
                  <span className="whitespace-nowrap">{floorPrice} ETH</span>
                )}
              </span>
            </Button>
          </div>
          <div className="primary-button rounded-xl w-1/2 ">
            <Button
              showEffect={false}
              type="secondary"
              onClick={openBlur}
              className={cn(
                "rounded-xl flex items-center gap-1 px-8 py-1 text-white font-semibold md:w-full  bg-black border-2 border-zui-stroke",
                rubikClassName
              )}
            >
              <span className="flex items-center gap-1">
                <img
                  className="w-12 aspect-square mix-blend-screen"
                  src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/8e269e03-4409-43e2-98f3-c2270c4dea99_20241203124645.png`}
                  alt="blur"
                />
                <span className="whitespace-nowrap">Blur</span>
              </span>
            </Button>
          </div>
        </div>

        <p
          className={cn(
            "mt-6 text-white/40 font-medium text-center md:text-left",
            rubikClassName
          )}
        >
          <button
            className="underline text-white"
            onClick={openFounderWhiteListForm}
          >
            Vibe Check
          </button>{" "}
          for special offer
        </p>
      </div>
      <img
        className="w-[480px]"
        src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/e99191ba-5c0d-4466-8d63-76b8ef0a1f4c_20241203121131.gif`}
        alt=""
      />
    </section>
  );
};

export default IntroSection;
