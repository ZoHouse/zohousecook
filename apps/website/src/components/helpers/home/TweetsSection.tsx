import { useQueryApi } from "@zo/auth";
import React, { useMemo } from "react";
import Marquee from "react-fast-marquee";
import { Tweets } from "../../../config";
import TweetCard from "./TweetCard";

interface TweetsSectionProps {}

const TweetsSection: React.FC<TweetsSectionProps> = () => {
  const { data: tweets } = useQueryApi<Tweets[]>("ZOWORLD_BULLETIN_SOCIALS", {
    select: (data) => data.data.results,
  });

  const tweetsRow1 = useMemo(
    () => (tweets ? tweets.slice(0, tweets.length / 2) : []),
    [tweets]
  );
  const tweetsRow2 = useMemo(
    () => (tweets ? tweets.slice(tweets.length / 2) : []),
    [tweets]
  );

  return (
    <section className="mt-20 md:mt-[120px] relative w-full">
      {/* overlays */}
      <div className="hidden md:block w-24 h-full absolute top-0 -left-1 bg-gradient-to-r from-zui-dark to-transparent z-10" />
      <div className="hidden md:block w-24 h-full absolute top-0 -right-1 bg-gradient-to-l from-zui-dark to-transparent z-10" />
      {/*  */}
      <Marquee pauseOnHover direction="right">
        <div className="flex items-center py-1">
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
        </div>
      </Marquee>
      <Marquee className="mt-6" pauseOnHover>
        <div className="flex items-center py-1">
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
        </div>
      </Marquee>
    </section>
  );
};

export default TweetsSection;
