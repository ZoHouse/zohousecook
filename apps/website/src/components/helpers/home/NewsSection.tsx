import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import NewsCard, { NewsCard as NewsCardType } from "./NewsCard";
import EventCard from "./EventCard";
import { syneClassName } from "../../utils/font";
import { cn } from "@zo/utils/font";

interface NewsSectionProps {
  news: NewsCardType[];
}

const NewsSection: React.FC<NewsSectionProps> = ({ news }) => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <div className="relative z-20" ref={sectionRef}>
      <EventCard />

      <div className={`grid grid-cols-1 md:grid-cols-4 place-content-center gap-4`}>
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
