import { cn } from "@zo/utils/font";
import React from "react";
import { rubikClassName } from "../../utils/font";

export interface ZoHotelCardProps {
  mediaLink: string;
  title: string;
}

const ZoHotelCard: React.FC<ZoHotelCardProps> = ({ mediaLink, title }) => {
  const isImage =
    mediaLink?.includes("png") ||
    mediaLink?.includes("jpg") ||
    mediaLink?.includes("jpeg") ||
    mediaLink?.includes("gif") ||
    mediaLink?.includes("blob");

  return (
    <div className="w-full h-fit overflow-hidden relative">
      <div className="w-full h-[280px] overflow-hidden rounded-2xl inner-border shiny-card">
        {!isImage ? (
          <video
            playsInline
            autoPlay
            loop
            muted
            className="w-full h-full object-cover rounded-2xl"
            src={mediaLink}
          ></video>
        ) : (
          <img
            className="w-full h-full object-cover rounded-2xl"
            src={mediaLink}
            alt={title}
          />
        )}
      </div>

      <h6
        className={cn(
          "mt-4 md:text-2xl leading-8 font-medium text-center",
          rubikClassName
        )}
      >
        {title}
      </h6>
    </div>
  );
};

export default ZoHotelCard;
