import { sendGTMEvent } from "@next/third-parties/google";
import { cn } from "@zo/utils/font";
import { isValidString } from "@zo/utils/string";
import Image from "next/image";
import React from "react";
import { Button } from "../../ui";
import { rubikClassName } from "../../utils";

export interface ZoHouseCardProps {
  mediaLink: string;
  titleLayeredTextLink: string;
  title: string;
  link?: string;
  buttonLabel?: string;
}
const ZoHouseCard: React.FC<ZoHouseCardProps> = ({
  mediaLink,
  title,
  link,
  buttonLabel,
  titleLayeredTextLink,
}) => {
  const isImage =
    mediaLink?.includes("png") ||
    mediaLink?.includes("jpg") ||
    mediaLink?.includes("jpeg") ||
    mediaLink?.includes("gif") ||
    mediaLink?.includes("blob");

  const openLink = (link: string | undefined) => {
    sendGTMEvent({ event: "click_card" });
    isValidString(link) && window.open(link);
  };

  return (
    <div
      onClick={openLink.bind(null, link)}
      role="button"
      className="w-full h-[400px] md:h-[520px] bg-zui-dark overflow-hidden rounded-2xl relative shiny-card z-30 inner-border"
    >
      {!isImage ? (
        <video
          className="h-full w-full object-cover z-10 rounded-2xl"
          autoPlay
          playsInline
          muted
          loop
          src={mediaLink}
        ></video>
      ) : (
        <img
          className="h-full w-full object-cover z-10 rounded-2xl"
          src={mediaLink}
          alt={title}
        />
      )}

      <div className="w-full h-[75%] bg-gradient-to-t from-zui-dark to-transparent absolute bottom-0 left-0 z-20" />
      <div className="relative">
        <div className="absolute bottom-0 p-6 pb-0 -translate-y-6 md:-translate-y-10 z-50 w-full group">
          <Image
            src={titleLayeredTextLink}
            className="w-[168px] h-[72px] mx-auto"
            width={1}
            height={72}
            alt={title}
          />
          <p
            className={cn(
              "text-zui-white md:text-2xl font-medium text-center mt-4",
              rubikClassName
            )}
          >
            {title}
          </p>
          <Button type="secondary" className="w-full mt-6 md:hidden">
            {buttonLabel || "Experience IRL"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ZoHouseCard;
