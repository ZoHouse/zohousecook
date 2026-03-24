import { cn } from "@zo/utils/font";
import React from "react";

export interface ZoHotelCardProps {
  mediaLink: string;
  className?: string;
}

const CommunityVibesCard: React.FC<ZoHotelCardProps> = ({
  mediaLink,
  className,
}) => {
  return (
    <div
      className={cn(
        `rounded-2xl border border-zui-stroke overflow-hidden relative`,
        className
      )}
    >
      <video
        playsInline
        autoPlay
        loop
        muted
        className="w-full h-full object-cover rounded-2xl"
        src={mediaLink}
      ></video>
    </div>
  );
};

export default CommunityVibesCard;
