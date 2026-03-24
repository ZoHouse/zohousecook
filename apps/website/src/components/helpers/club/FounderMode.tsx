import React, { useCallback, useEffect, useMemo, useState } from "react";
import Marquee from "react-fast-marquee";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { isValidString } from "@zo/utils/string";
import { useFadeInOnScroll } from "../../../hooks";
import { isImageURL, rubikClassName, syneClassName } from "../../utils";

type FounderNft = {
  token_ref_id: string;
  wallet_address: string;
  nickname: string;
  pfp_image: string;
  twitter_handle: string;
  tokens: GeneralObject[];
  tags: string[];
};

const FounderMode: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  const { data: founderNftsData } = useQueryApi<FounderNft[]>(
    "WEBTHREE_FOUNDER_NFTS",
    {
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    "",
    "limit=100"
  );

  const founderNfts = useMemo(() => {
    return (
      founderNftsData?.filter(
        (item: FounderNft) =>
          isValidString(item.tokens?.[0]?.metadata?.animation_url) &&
          isValidString(item.nickname)
      ) || []
    );
  }, [founderNftsData]);

  // Spotlight founders — all founders with nicknames, rotate every 5s
  const spotlightFounders = useMemo(() => {
    return founderNfts.slice(0, 10);
  }, [founderNfts]);

  const [spotlightIndex, setSpotlightIndex] = useState(0);

  useEffect(() => {
    if (spotlightFounders.length <= 1) return;
    const timer = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % spotlightFounders.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [spotlightFounders.length]);

  const featured = spotlightFounders[spotlightIndex] || founderNfts[0];

  return (
    <section className="py-10 md:py-20 snap-center" ref={sectionRef}>
      <div className="text-center">
        <h2
          className={cn(
            "text-[40px] md:text-[80px] leading-[48px] md:leading-[80px] font-extrabold uppercase text-center",
            syneClassName
          )}
        >
          Founder
        </h2>
        <h2
          className={cn(
            "text-[40px] md:text-[80px] leading-[48px] md:leading-[80px] font-extrabold uppercase text-center text-zui-yellow",
            syneClassName
          )}
        >
          Mode
        </h2>
        <p
          className={cn(
            "mt-6 font-medium leading-6 text-white/40 text-center",
            rubikClassName
          )}
        >
          Builders who shaped the house. Curated stories from the community.
        </p>
      </div>

      {/* Featured spotlight — uses pfp, auto-rotates */}
      {featured && (
        <div className="max-w-[1200px] mx-auto mt-12 px-6">
          <div
            key={featured.token_ref_id}
            className="grid grid-cols-1 md:grid-cols-2 border border-zui-stroke rounded-2xl overflow-hidden animate-[fadeIn_0.5s_ease]"
          >
            {/* PFP visual */}
            <div className="min-h-[300px] md:min-h-[480px] bg-gradient-to-br from-[#1a1600] to-black flex items-center justify-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_50%,rgba(255,214,0,0.06),transparent_60%)]" />
              <div className="relative z-10 flex flex-col items-center gap-4">
                <img
                  src={`https://proxy.cdn.zo.xyz/avatars/${featured.nickname}.png`}
                  alt={featured.nickname}
                  className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] rounded-full object-cover border-2 border-zui-yellow/20 shadow-[0_0_80px_rgba(255,214,0,0.1)]"
                  onError={(e) => {
                    e.currentTarget.src = isValidString(featured.pfp_image)
                      ? featured.pfp_image
                      : `https://nft-cdn.zo.xyz/founders/${featured.token_ref_id}.png?w=300`;
                  }}
                />
                {isValidString(featured.twitter_handle) && (
                  <p
                    className={cn(
                      "text-sm text-zui-silver",
                      rubikClassName
                    )}
                  >
                    {featured.twitter_handle}
                  </p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-8 md:p-14 flex flex-col justify-center">
              {featured.tags?.[0] && (
                <span
                  className={cn(
                    "text-[10px] tracking-[3px] uppercase text-zui-yellow border border-zui-yellow/20 px-4 py-1.5 rounded-full w-fit mb-6",
                    rubikClassName
                  )}
                >
                  {featured.tags[0]}
                </span>
              )}
              <h3
                className={cn(
                  "text-[28px] md:text-[32px] font-bold",
                  syneClassName
                )}
              >
                {featured.nickname}
              </h3>
              {isValidString(featured.twitter_handle) && (
                <p
                  className={cn(
                    "text-sm text-zui-yellow mt-1 mb-6",
                    rubikClassName
                  )}
                >
                  {featured.twitter_handle}
                </p>
              )}
              <p
                className={cn(
                  "text-base text-white/40 font-normal leading-7",
                  rubikClassName
                )}
              >
                Zo World Founder Member. Building the vibe network one
                connection at a time.
              </p>

              {/* Rotation indicator dots */}
              {spotlightFounders.length > 1 && (
                <div className="flex gap-2 mt-8">
                  {spotlightFounders.slice(0, 10).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSpotlightIndex(i)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        i === spotlightIndex
                          ? "bg-zui-yellow w-6"
                          : "bg-white/20 hover:bg-white/40"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NFT Marquee */}
      <div className="flex gap-10 mt-10 overflow-hidden h-fit scrollbar-hide relative">
        <div className="hidden md:block z-20 h-[400px] w-[200px] bg-gradient-to-r from-black to-transparent absolute top-0 left-0" />
        <div className="hidden md:block z-20 h-[400px] w-[200px] bg-gradient-to-l from-black to-transparent absolute top-0 right-0" />

        <Marquee>
          <div className="flex w-fit py-1 md:py-6">
            {founderNfts.slice(0, 10).map((card, i) => (
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
                      {card.nickname?.charAt(0) || "Z"}
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

export default FounderMode;
