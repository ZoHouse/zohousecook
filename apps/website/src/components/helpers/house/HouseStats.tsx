import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { Stats } from "../../ui";
import { HomePageStatType } from "../../ui/Stats";

const stats: HomePageStatType[] = [
  { value: 12, label: "Years of Operations", valueSuffix: "" },
  { value: "500", label: "Events Hosted", valueSuffix: "+" },
  { value: "501", label: "Founder Members", valueSuffix: "" },
  { value: 34, label: "Spots Across 2 Houses", valueSuffix: "" },
];

const HouseStats: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <div ref={sectionRef}>
      <hr className="w-[80%] md:w-[60%] horizontal-divider my-16 md:my-20" />
      <Stats data={stats} />
      <hr className="w-[80%] md:w-[60%] horizontal-divider my-16 md:my-20" />
    </div>
  );
};

export default HouseStats;
