import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import NewsCard, { NewsCard as NewsCardType } from "./NewsCard";
import { syneClassName } from "../../utils/font";
import { cn } from "@zo/utils/font";

interface NewsSectionProps {
  news: NewsCardType[];
}

const NewsSection: React.FC<NewsSectionProps> = ({ news }) => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <div className="relative z-20" ref={sectionRef}>
      <h2 className={cn("sub-heading-2 text-center font-bold", syneClassName)}>
        ✨ What’s New? ✨
      </h2>

      <div className={`grid grid-cols-1 md:grid-cols-3 place-content-center`}>
        {news.length === 1 && <div />}
        {news.map((news: NewsCardType, index) => (
          <NewsCard
            key={`news-${index}`}
            route={news.route}
            mediaLink={news.mediaLink}
            subtitle={news.subtitle}
            title={news.title}
          />
        ))}
      </div>

      <hr className="w-[80%] md:w-[60%] horizontal-divider my-20" />
    </div>
  );
};

export default NewsSection;
