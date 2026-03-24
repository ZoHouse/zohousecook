import { useQueriesApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isValidString } from "@zo/utils/string";
import React, { useMemo } from "react";
import Marquee from "react-fast-marquee";
import { useFadeInOnScroll } from "../../../hooks";
import { Button } from "../../ui";
import CommunityVibesCard from "./CommunityVibesCard";
import TweetCard from "./TweetCard";

interface CommunityVibeSectionProps {}

const CommunityVibeSection: React.FC<CommunityVibeSectionProps> = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  const { data: fetchedBulletinsData } = useQueryApi<GeneralObject>(
    "ZOWORLD_DESTINATIONS",
    {
      enabled: isValidString("SFO"),
      select: (data) => data.data.data.bulletins,
      refetchOnWindowFocus: false,
    },
    `${"SFO"}/`
  );

  const queries = useMemo(() => {
    if (fetchedBulletinsData) {
      return fetchedBulletinsData.map((address: string) => {
        return [`${address}/`, ``];
      });
    } else {
      return [];
    }
  }, [fetchedBulletinsData]);

  const bulletinsData = useQueriesApi(
    "ZOWORLD_PUBLIC_BULLETINS",
    {
      enabled: queries.length > 0,
      select: (data) =>
        data.map((response: GeneralObject) => response.data.data),
    },
    queries as [string, string][]
  );

  const bulletins = useMemo(() => {
    if (bulletinsData && bulletinsData?.length > 0) {
      return bulletinsData
        .map((resp: GeneralObject) => resp.data?.data?.results)
        .flat();
    } else {
      return [];
    }
  }, [bulletinsData]);

  const handleBookDayPass = () => {
    window.open("https://zostel.typeform.com/to/LgcBfa0M", "_blank");
  };

  const media = useMemo(() => {
    if (bulletins.length > 0) {
      return bulletins.filter((item) => {
        return item?.type !== "tweet";
      });
    } else {
      return [];
    }
  }, [bulletins]);

  return (
    <section ref={sectionRef} className="mt-10 py-6 md:py-10">
      <p className="text-center text-zui-white sub-heading-2 font-semibold">
        Community Vibes
      </p>
      {media.length > 0 && (
        <div className="mt-6 md:mt-10 overflow-x-scroll hide-scrollbar">
          <div className="flex items-center gap-6 w-fit">
            <div className="mt-6 md:mt-10 overflow-x-scroll hide-scrollbar">
              <div className="flex items-center gap-6 w-fit">
                {media.length > 0 ? (
                  media.map((item) => {
                    return isValidString(item?.media[0]?.url) ? (
                      <CommunityVibesCard
                        key={`index-${item.id}`}
                        mediaLink={item?.media[0]?.url}
                        className="w-[120px] h-[200px] md:w-[224px] md:h-[400px]"
                      />
                    ) : null;
                  })
                ) : (
                  <div>No bulletins available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative w-full mt-6">
        <div className="hidden md:block w-24 h-full absolute top-0 -left-1 bg-gradient-to-r from-zui-dark to-transparent z-10" />
        <div className="hidden md:block w-24 h-full absolute top-0 -right-1 bg-gradient-to-l from-zui-dark to-transparent z-10" />
        <Marquee pauseOnHover direction="right">
          <div className="flex items-center p-2">
            {bulletins
              .filter((item) => item?.type === "tweet")
              .map((tweet) => (
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
      </div>
      <div className="my-6 md:my-10 px-6 md:px-0">
        <p className="text-center mb-6 text-zui-white text-base md:text-2xl font-medium">
          You may book any of the spaces to host events, meet ups, parties and
          more
        </p>
        <div className="flex flex-col md:flex-row items-center  justify-center">
          <Button
            onClick={handleBookDayPass}
            type="secondary"
            className="px-4 whitespace-nowrap bg-zui-dark"
          >
            Book Space at Zo House
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CommunityVibeSection;
