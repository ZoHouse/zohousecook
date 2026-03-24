import { cn } from "@zo/utils/font";
import { isValidString } from "@zo/utils/string";
import React from "react";
import Marquee from "react-fast-marquee";
import { useFadeInOnScroll } from "../../../hooks";
import { isImageURL } from "../../utils";
import { rubikClassName, syneClassName } from "../../utils/font";

import ArrowOutwardOutlinedIcon from "@mui/icons-material/ArrowOutwardOutlined";
import LockPersonOutlinedIcon from "@mui/icons-material/LockPersonOutlined";

export interface CommunityCard {
  title: string;
  media: string;
  subtitle: string;
  description: string;
  link: string;
}

interface CommunitiesProps {
  communities: CommunityCard[];
}

const Communities: React.FC<CommunitiesProps> = ({ communities }) => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  const handleCommunityClick = (link: string) => {
    if (isValidString(link)) {
      window.open(link, "_blank");
    }
  };

  return (
    <section className="py-10 md:py-20" ref={sectionRef}>
      <div>
        <h2
          className={cn(
            "text-[28px] md:text-[80px] leading-8 md:leading-[80px] font-extrabold uppercase md:whitespace-nowrap text-center",
            syneClassName
          )}
        >
          10x <br className="md:hidden" /> yourself
        </h2>

        <p
          className={cn(
            "mt-6 leading-6 font-medium text-white/40 text-center tracking-[1%]",
            rubikClassName
          )}
        >
          with Communities, Nodes, Events & Partners
        </p>
      </div>

      <div>
        <h4
          className={cn(
            "hidden md:block text-[40px] leading-8 -tracking-[3%] font-bold text-center mt-20",
            syneClassName
          )}
        >
          Communities
        </h4>

        <p
          className={cn(
            "hidden md:block mt-10 text-2xl leading-8 font-medium text-white/40 text-center tracking-[1%]",
            rubikClassName
          )}
        >
          Exclusive sub communities for founders, investors and degens
        </p>

        <div className="mt-10">
          <div className="md:hidden flex flex-col gap-6">
            {communities.map((community) => (
              <div
                onClick={handleCommunityClick.bind(null, community.link)}
                className={cn("w-full rounded-3xl p-6 bg-[#11111170] relative")}
                key={community.title}
              >
                <h4
                  className={cn(
                    "text-[24px] leading-[24px] font-bold -tracking-[3%] uppercase",
                    syneClassName
                  )}
                >
                  {community.title}
                </h4>
                <div className="w-full h-[320px] rounded-2xl overflow-hidden mt-6 border border-zui-dark/10 community-card-shadow relative">
                  <div className="flex items-center justify-center absolute bg-black/40 rounded-full z-40 top-4 right-4 w-10 aspect-square opacity-100">
                    {community.link ? (
                      <ArrowOutwardOutlinedIcon className="text-2xl text-white" />
                    ) : (
                      <LockPersonOutlinedIcon className="text-2xl text-white" />
                    )}
                  </div>

                  {isImageURL(community.media) ? (
                    <img
                      src={community.media}
                      alt={community.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      className="h-full w-full object-cover"
                      src={community.media}
                      autoPlay
                      loop
                      playsInline
                      controls={false}
                      controlsList="nodownload"
                      muted
                    />
                  )}
                </div>

                <p
                  className={cn(
                    "mt-6 font-medium leading-5 text-zui-silver",
                    rubikClassName
                  )}
                >
                  <a className="text-white underline">{community.subtitle}</a>
                  <br />
                  {community.description}
                </p>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Marquee pauseOnHover pauseOnClick>
              <div className="card-hover-animation-3d w-fit flex items-center justify-center">
                {communities.map((community) => (
                  <div
                    onClick={handleCommunityClick.bind(null, community.link)}
                    className="mx-3 w-[392px] rounded-3xl p-6 bg-[#11111170] group relative cursor-pointer"
                    key={community.title}
                  >
                    <div className="hidden md:flex items-center justify-center absolute inset-0 bg-black/40 rounded-full z-40 w-[216px] h-[216px] left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                      {community.link ? (
                        <ArrowOutwardOutlinedIcon
                          style={{ fontSize: "80px" }}
                          className="text-6xl text-white rotate-45 group-hover:rotate-0 delay-300 ease-out"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <LockPersonOutlinedIcon
                            style={{ fontSize: "80px" }}
                            className="text-6xl text-white vibrate"
                          />
                          <p className="text-white font-medium">
                            Founders exclusive
                          </p>
                        </div>
                      )}
                    </div>
                    <h4
                      className={cn(
                        "text-[24px] leading-[24px] font-bold -tracking-[3%]",
                        syneClassName
                      )}
                    >
                      {community.title}
                    </h4>
                    <div className="w-[344px] h-[320px] rounded-2xl overflow-hidden mt-6">
                      {isImageURL(community.media) ? (
                        <img
                          src={community.media}
                          alt={community.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          className="h-full w-full object-cover"
                          src={community.media}
                          autoPlay
                          loop
                          muted
                        />
                      )}
                    </div>

                    <p
                      className={cn(
                        "mt-6 font-medium leading-5 text-zui-silver",
                        rubikClassName
                      )}
                    >
                      <a className="text-white">{community.subtitle}</a>
                      <br />
                      {community.description}
                    </p>
                  </div>
                ))}
              </div>
            </Marquee>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Communities;
