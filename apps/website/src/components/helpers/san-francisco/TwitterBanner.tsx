import Icon from "@zo/assets/icons";
import { fontClassName } from "@zo/utils/font";
import Image from "next/image";
import React from "react";
import { Button } from "../../ui";
import { cn } from "../../utils";

interface TwitterBannerProps {}

const TwitterBanner: React.FC<TwitterBannerProps> = () => {
  const handleShare = () => {
    const text = encodeURIComponent(
      "The best way to trip in SF - sf.zo.xyz @the_zo_world #ZoHouseSF"
    );
    const url = encodeURIComponent(window.location.href);
    const hashtags = "ZohouseSF";

    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`;

    window.open(twitterUrl, "_blank");
  };

  return (
    <section className="my-10 md:my-20 relative h-[256px] w-full px-6 md:px-0 rounded-2xl overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full  flex flex-col md:flex-row items-center gap-6 md:gap-0 justify-center md:justify-between z-20 p-6 md:py-0 md:px-[108px] text-center md:text-left">
        <div className={cn(fontClassName)}>
          <h6 className="font-semibold sub-heading-2">
            10 Day-pass raffle for <br />
            all those who love us
          </h6>
        </div>
        <Button
          onClick={handleShare}
          className="w-3/4 md:w-[208px] md:mx-0"
          showEffect={false}
        >
          <span className="flex items-center justify-center gap-4">
            <Icon name="X" size={24} />
            Share on X
          </span>
        </Button>
      </div>

      <div className="absolute top-0 left-0 w-full h-full bg-black/10" />
      <Image
        src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/95676411-f687-4900-81bc-f461cad7961e_20241013103716.png`}
        alt="Twitter Banner"
        className="w-full h-full object-cover rounded-2xl"
        width={1440}
        height={256}
      />
    </section>
  );
};

export default TwitterBanner;
