import { cn } from "@zo/utils/font";
import React from "react";
import { Card } from ".";
import { CardProps } from "./Card";

export interface UpdatesSectionProps {
  season: number;
  title: string;
  description1?: string;
  description2?: string;
  cards?: CardProps[];
  floatingCards?: [string, string];
}

const UpdatesSection: React.FC<UpdatesSectionProps> = ({
  floatingCards,
  season,
  title,
  cards,
  description1,
  description2,
}) => {
  return (
    <section className="mt-[400px]">
      <span className="uppercase text-2xl text-zui-silver font-semibold">
        Season {season}
      </span>
      <h4 className="text-5xl font-semibold mt-2 w-[60%]">{title}</h4>
      <div className="flex gap-20  text-xl mt-10">
        <span className={cn(description2 ? "w-[496px]" : "w-[704px]")}>
          {description1}
        </span>
        {description2 && <span className="w-[496px]">{description2}</span>}
        {floatingCards && floatingCards?.length > 0 && (
          <div className="relative">
            <Card
              size="md"
              className="absolute -rotate-[10deg]"
              image={floatingCards[0]}
            />
            <Card
              size="md"
              className="absolute rotate-[10deg] top-[250px] left-20"
              image={floatingCards[1]}
            />
          </div>
        )}
      </div>
      <div className="mt-20 flex flex-wrap max-w-[75%] gap-6 ">
        {cards?.map((card, index) => (
          <Card
            className=""
            size={card.size}
            date=""
            description={card.description}
            image={card.image}
            link={card.link}
            key={index}
          />
        ))}
      </div>
    </section>
  );
};

export default UpdatesSection;
