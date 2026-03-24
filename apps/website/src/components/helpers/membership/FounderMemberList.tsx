import React, { useMemo, useState, memo } from "react";
import Marquee from "react-fast-marquee";
import { useFadeInOnScroll } from "../../../hooks";
import { cn, isImageURL, rubikClassName, syneClassName } from "../../utils";
import ZoWorldSolarSystem, { PlanetData } from "./ZoWorldSolarSystem";

import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { formatCapitalize, isValidString } from "@zo/utils/string";

type FounderNft = {
  token_ref_id: string;
  wallet_address: string;
  nickname: string;
  pfp_image: string;
  twitter_handle: string;
  tokens: GeneralObject[];
  tags: FounderCategory[];
};

export type FounderCategory =
  | "degens"
  | "nfts"
  | "studio"
  | "influencers"
  | "artists"
  | "daos"
  | "web2"
  | "infra"
  | "chains"
  | "gaming"
  | "vcs"
  | "devs"
  | "founders";

interface FounderMemberListProps {}

const FounderMemberList: React.FC<FounderMemberListProps> = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();
  const [selectedFounder, setSelectedFounder] = useState<FounderCategory>("degens");

  const { data: founderNftsData } = useQueryApi<FounderNft[]>(
    "WEBTHREE_FOUNDER_NFTS",
    {
      select: (data) => data.data,
    },
    "",
    "limit=100"
  );

  const founderNfts = useMemo(() => {
    const validFounderEntities =
      founderNftsData?.filter(
        (item: FounderNft) =>
          isValidString(item.tokens?.[0]?.metadata?.animation_url) &&
          isValidString(item.nickname)
      ) || [];

    const foundersInSelectedCategory = validFounderEntities.filter(
      (item: FounderNft) => item.tags.includes(selectedFounder)
    );

    return foundersInSelectedCategory.length > 0
      ? foundersInSelectedCategory.slice(0, 10)
      : validFounderEntities.slice(0, 10);
  }, [founderNftsData, selectedFounder]);

  const { data: founders_tags } = useQueryApi<string[]>(
    "BOOKINGS_SEED",
    {
      select: (data) => [...new Set(data.data.webthree.founders_tags)],
      refetchOnWindowFocus: false,
    },
    "",
    "limit=100"
  );

  const handlePlanetClick = useMemo(() => {
    return (key: FounderCategory) => {
      if (key !== selectedFounder) {
        setSelectedFounder(key);
      }
    };
  }, [selectedFounder]);

  const planetsDetails: PlanetData[] = useMemo(() => {
    return (
      (founders_tags?.map((tag, index) => ({
        modelUrl: "",
        angle: (360 / (founders_tags.length || 1)) * index,
        speed: 0.0003,
        delay: 0,
        label: formatCapitalize(tag),
        key: tag.toLowerCase() as FounderCategory,
      })) as PlanetData[]) || []
    );
  }, [founders_tags]);

  const MemoizedSolarSystem = useMemo(() => (
    <ZoWorldSolarSystem
      planetDetails={planetsDetails}
      onClick={handlePlanetClick}
    />
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [planetsDetails]);

  return (
    <section className="py-10 md:py-20 h-fit" ref={sectionRef}>
      <h2
        className={cn(
          "text-[80px] leading-[64px] font-extrabold uppercase whitespace-nowrap text-center",
          syneClassName
        )}
      >
        500
      </h2>
      <h4
        className={cn(
          "text-[40px] leading-[48px] font-bold  text-center mt-4",
          syneClassName
        )}
      >
        Founder Members
      </h4>

      <p
        className={cn(
          "mt-6 font-medium leading-6 text-white/40 text-center",
          rubikClassName
        )}
      >
        Founders, VCs, Devs, Influencers, Crypto Degens, Artists, DAOs, Studios
        & more
      </p>

      <div className="w-full flex items-center justify-center">
        <div className="md:w-[1224px] md:h-[552px] w-[340px] h-[340px] flex items-center justify-center mx-auto">
          {MemoizedSolarSystem}
        </div>
      </div>

      {/* nft list */}
      <div className="flex gap-10 mt-10 overflow-hidden h-fit scrollbar-hide relative">
        <div className="hidden md:block z-20 h-[400px] w-[200px] bg-gradient-to-r from-black to-transparent absolute top-0 left-0" />
        <div className="hidden md:block z-20 h-[400px] w-[200px] bg-gradient-to-l from-black to-transparent absolute top-0 right-0" />

        <Marquee>
          <div className="flex w-fit py-1 md:py-6">
            {founderNfts?.map((card, i) => (
              <div
                key={i}
                className="mx-3 md:mx-5 w-[166px] md:w-[288px] h-[224px] md:h-[320px] overflow-hidden border border-zui-stroke rounded-2xl flex-shrink-0 relative p-0.5"
              >
                {isImageURL(card.tokens?.[0]?.metadata?.animation_url) ? (
                  <img
                    src={`https://nft-cdn.zo.xyz/founders/${card.token_ref_id}.gif?w=200`}
                    onError={(e) => {
                      e.currentTarget.src = `https://nft-cdn.zo.xyz/founders/${card.token_ref_id}.png?w=200`;
                    }}
                    className="w-full h-full object-cover max-h-[184px] md:max-h-[320px]"
                    alt=""
                  />
                ) : (
                  <video
                    src={card.tokens?.[0]?.metadata?.animation_url}
                    className="w-full h-full object-cover max-h-[184px] md:max-h-[320px]"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                )}

                <div className="absolute bottom-6 left-6 flex items-center gap-3">
                  {isValidString(card.pfp_image) ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={card.pfp_image}
                      alt="pfp"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-zui-neon flex items-center justify-center text-zui-dark">
                      {card.nickname?.charAt(0) || "Zo"}
                    </div>
                  )}
                  <div
                    className={cn(
                      "text-white leading-5 text-sm font-medium",
                      rubikClassName
                    )}
                  >
                    <h6 className="text-sm font-medium">{card.nickname}</h6>
                    <p className="text-zui-silver">{card.twitter_handle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Marquee>
      </div>
    </section>
  );
};

export default memo(FounderMemberList);
