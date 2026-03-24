import { cn } from "@zo/utils/font";
import React from "react";
import { rubikClassName } from "../../utils";

interface ZoPartyCardProps {
  size: "sm" | "lg";
  title: string;
  time: string;
  price: string;
  subcategories: string;
  operator: string;
  image: string;
  registrationLink: string;
  location: string;
  className?: string;
}
const ZoPartyCard: React.FC<ZoPartyCardProps> = ({
  title,
  time,
  price,
  subcategories,
  operator,
  image,
  registrationLink,
  location,
  className,
  size,
}) => {
  return (
    <div
      className={cn(
        "p-4 border border-zui-stroke rounded-2xl ",
        size === "sm" ? "space-y-6" : " grid grid-cols-2 gap-4",
        rubikClassName,
        className
      )}
    >
      <div className={cn("flex overflow-hidden", size === "sm" && "gap-2")}>
        <img
          src={image}
          className={cn(
            " object-cover border border-zui-stroke rounded-lg",
            size === "sm" ? "h-16 w-16 aspect-square" : "h-full"
          )}
          alt=""
        />
        {size === "sm" && (
          <div>
            <h2
              className={cn(
                "text-zui-white text-base font-semibold",
                rubikClassName
              )}
            >
              {title}
            </h2>
            <span className="flex items-center justify-between text-zui-silver text-sm font-medium">
              <p>{time}</p>
              <p>{price}</p>
            </span>
          </div>
        )}
      </div>
      <div
        className={cn(
          "text-sm text-zui-silver",
          size === "lg" && "flex flex-col justify-between"
        )}
      >
        <div>
          {size === "lg" && (
            <div>
              <h2
                className={cn(
                  "text-zui-white text-base font-semibold",
                  rubikClassName
                )}
              >
                {title}
              </h2>
              <span className="flex items-center justify-between text-zui-silver text-sm font-medium">
                <p className="bg-zui-green px-2 py-1 text-xs rounded-full font-semibold">
                  {time}
                </p>
                <p>{price}</p>
              </span>
            </div>
          )}
          <p
            className={cn("font-medium", size === "lg" && "mt-6 tracking-[1%]")}
          >
            🤝 {subcategories}
          </p>
          <div className="flex items-center justify-between">
            <p className="font-medium tracking-[1%]">📍 {operator}</p>
            {size === "sm" && (
              <button className="text-zui-white text-sm font-medium py-2 px-3 border border-zui-stroke rounded-full">
                Register
              </button>
            )}
          </div>
        </div>
        {size === "lg" && (
          <div className="flex items-center justify-between">
            <button className="text-zui-white text-sm font-medium py-2 px-3 border border-zui-stroke rounded-full">
              Register
            </button>
            <button className="text-zui-white text-sm font-medium py-2 px-3 border border-zui-stroke rounded-full">
              Register
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZoPartyCard;
