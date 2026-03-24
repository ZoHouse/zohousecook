import React, { useMemo } from "react";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { isValidString } from "@zo/utils/string";
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

const Leaderboard: React.FC = () => {
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

  const topFounders = useMemo(() => {
    return (
      founderNftsData
        ?.filter((item) => isValidString(item.nickname))
        ?.slice(0, 10) || []
    );
  }, [founderNftsData]);

  return (
    <section className="py-10 md:py-20 snap-center" ref={sectionRef}>
      <div className="text-center">
        <h2
          className={cn(
            "text-[40px] md:text-[80px] leading-[48px] md:leading-[80px] font-extrabold uppercase",
            syneClassName
          )}
        >
          Top
        </h2>
        <h2
          className={cn(
            "text-[40px] md:text-[80px] leading-[48px] md:leading-[80px] font-extrabold uppercase text-zui-yellow",
            syneClassName
          )}
        >
          Builders
        </h2>
        <p
          className={cn(
            "mt-6 font-medium leading-6 text-white/40 text-center",
            rubikClassName
          )}
        >
          Ranked by contribution to the Zo World network
        </p>
      </div>

      <div className="max-w-[1000px] mx-auto mt-12 px-6">
        <div className="border border-zui-stroke rounded-2xl overflow-hidden">
          {/* Header */}
          <div
            className={cn(
              "grid grid-cols-[56px_1fr_80px] md:grid-cols-[56px_1fr_90px_90px_80px] items-center px-7 py-4 text-[10px] tracking-[2px] uppercase text-white/20 bg-white/[0.02]",
              rubikClassName
            )}
          >
            <div>Rank</div>
            <div>Founder</div>
            <div className="hidden md:block">Events</div>
            <div className="hidden md:block">Tags</div>
            <div>NFTs</div>
          </div>

          {/* Rows */}
          {topFounders.map((founder, i) => (
            <div
              key={founder.token_ref_id}
              className="grid grid-cols-[56px_1fr_80px] md:grid-cols-[56px_1fr_90px_90px_80px] items-center px-7 py-5 border-t border-white/[0.04] transition-colors hover:bg-[rgba(255,214,0,0.02)]"
            >
              <div
                className={cn(
                  "text-lg font-bold text-zui-yellow",
                  syneClassName
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex items-center gap-3.5">
                <img
                  className="w-9 h-9 rounded-full border border-zui-stroke flex-shrink-0 object-cover bg-[#111]"
                  src={`https://proxy.cdn.zo.xyz/avatars/${founder.nickname}.png`}
                  alt={founder.nickname}
                  onError={(e) => {
                    e.currentTarget.src = isValidString(founder.pfp_image)
                      ? founder.pfp_image
                      : `https://nft-cdn.zo.xyz/founders/${founder.token_ref_id}.png?w=80`;
                  }}
                />
                <div>
                  <div
                    className={cn(
                      "text-sm font-medium",
                      rubikClassName
                    )}
                  >
                    {founder.nickname}
                  </div>
                  {isValidString(founder.twitter_handle) && (
                    <div
                      className={cn(
                        "text-xs text-white/25",
                        rubikClassName
                      )}
                    >
                      {founder.twitter_handle}
                    </div>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  "hidden md:block text-sm text-white/40",
                  rubikClassName
                )}
              >
                {founder.tags?.length || 0}
              </div>
              <div
                className={cn(
                  "hidden md:block text-sm text-white/40",
                  rubikClassName
                )}
              >
                {founder.tags?.[0] || "—"}
              </div>
              <div
                className={cn(
                  "text-sm font-semibold text-zui-yellow",
                  syneClassName
                )}
              >
                {founder.tokens?.length || 0}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Leaderboard;
