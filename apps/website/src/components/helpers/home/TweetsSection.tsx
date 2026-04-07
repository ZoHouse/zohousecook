import { useQueryApi } from "@zo/auth";
import moment from "moment";
import React, { useMemo } from "react";
import Marquee from "react-fast-marquee";
import { Tweets } from "../../../config";
import TweetCard from "./TweetCard";

interface TweetsSectionProps {}

const TweetsSection: React.FC<TweetsSectionProps> = () => {
  const CRYPTO_FILTER = /crypto|nft|airdrop|collectible|web3|mint|token|\.eth|foundation world|on-chain|onchain|blockchain|wallet/i;
  const ZO_HOUSE_FILTER = /@?BLRxZo|@?blrxzo|Zo House BLR|Zo House Koramangala/i;

  const { data: tweets } = useQueryApi<Tweets[]>("ZOWORLD_BULLETIN_SOCIALS", {
    select: (data) => data.data.results.filter(
      (t: Tweets) => {
        const text = t?.content?.tweet?.text ?? "";
        const date = t?.content?.tweet?.created_at;
        const username = t?.content?.tweet?.includes?.users?.[0]?.username ?? "";
        if (CRYPTO_FILTER.test(text) || CRYPTO_FILTER.test(username)) return false;
        if (ZO_HOUSE_FILTER.test(text) || ZO_HOUSE_FILTER.test(username)) return false;
        if (!date || !moment(date).isValid()) return false;
        return true;
      }
    ),
  });

  const tweetsRow1 = useMemo(
    () => tweets ?? [],
    [tweets]
  );
  const tweetsRow2 = useMemo(
    () => (tweets ? [...tweets].reverse() : []),
    [tweets]
  );

  return (
    <section className="mt-20 md:mt-[120px] relative w-full">
      {/* overlays */}
      <div className="hidden md:block w-24 h-full absolute top-0 -left-1 bg-gradient-to-r from-zui-dark to-transparent z-10" />
      <div className="hidden md:block w-24 h-full absolute top-0 -right-1 bg-gradient-to-l from-zui-dark to-transparent z-10" />
      {/*  */}
      <Marquee pauseOnHover direction="right" speed={30}>
        {tweetsRow1.map((tweet) => (
          <TweetCard
            className="mx-3"
            tweetContent={tweet?.content?.tweet?.text ?? ""}
            tweetLink={tweet?.data?.tweet_url ?? ""}
            key={tweet?.id ?? ""}
            username={
              tweet?.content?.tweet?.includes?.users?.[0]?.username ?? ""
            }
            name={tweet?.content?.tweet?.includes?.users?.[0]?.name ?? ""}
            timestamp={tweet?.content?.tweet?.created_at ?? ""}
            pfp={
              tweet?.content?.tweet?.includes?.users?.[0]
                ?.profile_image_url ?? ""
            }
          />
        ))}
      </Marquee>
      <Marquee className="mt-6" pauseOnHover speed={30}>
        {tweetsRow2.map((tweet) => (
          <TweetCard
            className="mx-3"
            tweetContent={tweet?.content?.tweet?.text ?? ""}
            tweetLink={tweet?.data?.tweet_url ?? ""}
            key={tweet?.id ?? ""}
            username={
              tweet?.content?.tweet?.includes?.users?.[0]?.username ?? ""
            }
            name={tweet?.content?.tweet?.includes?.users?.[0]?.name ?? ""}
            timestamp={tweet?.content?.tweet?.created_at ?? ""}
            pfp={
              tweet?.content?.tweet?.includes?.users?.[0]
                ?.profile_image_url ?? ""
            }
          />
        ))}
      </Marquee>
    </section>
  );
};

export default TweetsSection;
