import React, { useMemo, useState } from "react";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName, syneClassName } from "../../utils/font";

type FounderNft = {
  token_ref_id: string;
  wallet_address: string;
  nickname: string;
  pfp_image: string;
  twitter_handle: string;
  tokens: GeneralObject[];
  tags: string[];
};

const FounderDirectory: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();
  const [selectedTag, setSelectedTag] = useState<string>("all");

  const { data: founderNftsData } = useQueryApi<FounderNft[]>(
    "WEBTHREE_FOUNDER_NFTS",
    {
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    "",
    "limit=500"
  );

  const { data: founderTags } = useQueryApi<string[]>("BOOKINGS_SEED", {
    select: (data) => [...new Set(data.data.webthree.founders_tags)],
    refetchOnWindowFocus: false,
  });

  const founders = useMemo(() => {
    const valid =
      founderNftsData?.filter((item) => isValidString(item.nickname)) || [];
    if (selectedTag === "all") return valid;
    return valid.filter((item) =>
      item.tags?.includes(selectedTag.toLowerCase())
    );
  }, [founderNftsData, selectedTag]);

  const [showAll, setShowAll] = useState(false);
  const displayedFounders = showAll ? founders : founders.slice(0, 24);

  return (
    <section className="py-10 md:py-20 snap-start" ref={sectionRef}>
      <div className="text-center">
        <h2
          className={cn(
            "text-[40px] md:text-[80px] leading-[48px] md:leading-[80px] font-extrabold uppercase",
            syneClassName
          )}
        >
          All <span className="text-zui-yellow">{founders.length || 500}</span>
        </h2>
        <p
          className={cn(
            "mt-6 font-medium leading-6 text-white/40 text-center",
            rubikClassName
          )}
        >
          Founders, VCs, Devs, Influencers, Crypto Degens, Artists, DAOs,
          Studios & more
        </p>
      </div>

      {/* Category pills */}
      <div className="flex justify-center gap-2 flex-wrap mt-10 px-6">
        <button
          onClick={() => setSelectedTag("all")}
          className={cn(
            "px-5 py-2 rounded-full text-sm font-medium border transition-all",
            rubikClassName,
            selectedTag === "all"
              ? "bg-zui-yellow text-zui-dark border-zui-yellow"
              : "bg-transparent text-white/40 border-zui-stroke hover:border-white/30 hover:text-white/70"
          )}
        >
          All
        </button>
        {founderTags?.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium border transition-all",
              rubikClassName,
              selectedTag === tag
                ? "bg-zui-yellow text-zui-dark border-zui-yellow"
                : "bg-transparent text-white/40 border-zui-stroke hover:border-white/30 hover:text-white/70"
            )}
          >
            {formatCapitalize(tag)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="max-w-[1200px] mx-auto mt-8">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-px bg-white/[0.04]">
          {displayedFounders.map((founder, i) => (
            <div
              key={`${founder.token_ref_id}-${i}`}
              className="bg-black p-6 text-center cursor-pointer transition-colors hover:bg-[#0a0a0a] group"
            >
              <img
                className="w-14 h-14 rounded-full mx-auto mb-3 border border-zui-stroke group-hover:border-zui-yellow transition-colors object-cover bg-[#111]"
                src={`https://proxy.cdn.zo.xyz/avatars/${founder.nickname}.png`}
                alt={founder.nickname}
                onError={(e) => {
                  e.currentTarget.src = isValidString(founder.pfp_image)
                    ? founder.pfp_image
                    : `https://nft-cdn.zo.xyz/founders/${founder.token_ref_id}.png?w=100`;
                }}
              />
              <h6
                className={cn(
                  "text-sm font-medium truncate",
                  rubikClassName
                )}
              >
                {founder.nickname}
              </h6>
              {isValidString(founder.twitter_handle) && (
                <p
                  className={cn(
                    "text-xs text-white/25 truncate mt-0.5",
                    rubikClassName
                  )}
                >
                  {founder.twitter_handle}
                </p>
              )}
            </div>
          ))}
        </div>

        {!showAll && founders.length > 24 && (
          <button
            onClick={() => setShowAll(true)}
            className={cn(
              "w-full py-8 text-sm text-white/30 hover:text-zui-yellow transition-colors",
              rubikClassName
            )}
          >
            View all {founders.length} founders &rarr;
          </button>
        )}
      </div>
    </section>
  );
};

export default FounderDirectory;
