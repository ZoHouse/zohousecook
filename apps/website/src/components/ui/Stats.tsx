import { cn } from "@zo/utils/font";
import { useWindowSize } from "@zo/utils/hooks";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import React from "react";
import { rubikClassName } from "../utils";

gsap.registerPlugin(ScrollTrigger);

export type HomePageStatType = {
  value: number | string;
  label: string;
  valuePrefix?: string;
  valueSuffix?: string;
  formattedValue?: string;
};

interface StatsProps {
  data: HomePageStatType[];
  className?: string;
}

const Stats: React.FC<StatsProps> = ({ className, data }) => {
  const { isMobile } = useWindowSize();

  const formatLabel = (label: string) => {
    const middle = Math.floor(label.length / 2);
    const spaceIndex = label.lastIndexOf(" ", middle);
    const breakPoint = spaceIndex !== -1 ? spaceIndex : label.lastIndexOf(" ");

    const firstHalf = label.slice(0, breakPoint).trim();
    const secondHalf = label.slice(breakPoint).trim();

    return (
      <>
        {firstHalf}
        <br />
        {secondHalf}
      </>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row items-center justify-center gap-6 md:gap-20 w-fit mx-auto",
        className
      )}
    >
      {data.map((stat, index) => (
        <div
          key={`stat-${index}`}
          className="flex flex-col md:flex-row items-center gap-2"
        >
          <h4
            className={cn(
              "text-2xl md:text-[56px] leading-6 md:leading-[80px] tracking-[1%] text-zui-yellow font-medium",
              rubikClassName
            )}
          >
            {`${stat.valuePrefix || ""} ${stat.value}${stat.valueSuffix || ""}`}
          </h4>
          <span className="text-sm md:text-base leading-6 tracking-[1%] text-zui-white block w-[fit-content] break-normal text-left">
            {isMobile ? stat.label : formatLabel(stat.label)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Stats;
