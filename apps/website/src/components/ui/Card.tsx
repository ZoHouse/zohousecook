import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import React from "react";

export interface CardProps {
  image: string;
  description?: string;
  date?: string;
  className?: string;
  link?: string;
  size?: "md" | "lg" | "xl";
}

const cardWidth: GeneralObject = {
  md: "w-[288px]",
  lg: "w-[392px]",
  xl: "w-[600px]",
};
const cardHeight: GeneralObject = {
  md: "h-[288px]",
  lg: "h-[312px]",
  xl: "h-[288px]",
};

const Card: React.FC<CardProps> = ({
  description,
  image,
  date,
  link,
  className,
  size = "lg",
}) => {
  return (
    <div className={cn("card-clip-path", cardWidth[size], className)}>
      <div className={cn("mb-6", cardHeight[size], cardWidth[size])}>
        <img
          className="h-full w-full object-cover"
          src={image}
          alt="Card"
          width={392}
          height={312}
        />
      </div>
      <div className="flex flex-col">
        {description &&
          (link ? (
            <a
              className={cn(
                "underline underline-offset-4 mb-4 text-white",
                size === "lg" ? "text-2xl" : "text-lg"
              )}
              href=""
            >
              {description}
            </a>
          ) : (
            <span
              className={cn(
                "mb-4 text-white",
                size === "lg" ? "text-2xl" : "text-lg"
              )}
            >
              {description}
            </span>
          ))}

        {date && <span className="text-zui-silver text-sm">{date}</span>}
      </div>
    </div>
  );
};

export default Card;
