import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import React from "react";
import { rubikClassName } from "../../utils";

export interface NewsCard {
  onClick?: () => void;
  mediaLink: string;
  title: string;
  subtitle: string;
  route?: string;
}

const NewsCard: React.FC<NewsCard> = ({
  onClick,
  mediaLink,
  subtitle,
  title,
  route,
}) => {
  const isImage =
    mediaLink?.includes("png") ||
    mediaLink?.includes("jpg") ||
    mediaLink?.includes("jpeg") ||
    mediaLink?.includes("gif") ||
    mediaLink?.includes("blob");

  return (
    <a
      href={route}
      target="_blank"
      role="button"
      onClick={onClick}
      className="group w-full mx-auto border mt-10 border-zui-stroke rounded-2xl overflow-hidden relative shiny-card rotating-gradient-border"
    >
      <div className="relative m-0.5 z-20 bg-zui-dark rounded-xl overflow-hidden">
        <button className="hidden group-hover:block bg-zui-dark/80 rounded-full absolute top-6 right-6 z-20 p-2">
          <Icon name="ArrowUp" className="rotate-45" size={16} />
        </button>
        <div className="w-full h-[260px] relative">
          <div className="h-44 w-full bg-gradient-to-t from-zui-dark to-transparent absolute bottom-0 left-0" />
          {!isImage ? (
            <video
              className=" object-cover h-full w-full"
              src={mediaLink}
              playsInline
              muted
              preload="none"
              autoPlay
              loop
            >
              Video Not Supported
            </video>
          ) : (
            <img
              src={mediaLink}
              className=" object-cover h-full w-full"
              alt={title}
            />
          )}
        </div>

        <div className={cn("p-6 md:pb-10", rubikClassName)}>
          <h6 className={"text-2xl leading-8 text-center"}>{title}</h6>
          <p className={"text-zui-silver text-center mt-2"}>{subtitle}</p>
        </div>
      </div>
    </a>
  );
};

export default NewsCard;
