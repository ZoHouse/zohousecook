import Icon from "@zo/assets/icons";
import { useWindowSize } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { cn, isImageURL, rubikClassName } from "../utils";

export interface MediaCarouselItem {
  id: string;
  url: string;
  description?: string;
}

interface MediaCarouselProps {
  media: MediaCarouselItem[];
  className?: string;
  activeImage?: number;
  autoScroll?: boolean;
  autoScrollInterval?: number;
  mediaClassName?: string;
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({
  media,
  className,
  activeImage = 0,
  autoScroll = false,
  autoScrollInterval = 5000,
  mediaClassName,
}) => {
  const { isMobile } = useWindowSize();
  const [currentImage, setCurrentImage] = useState<number>(activeImage);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);

  const handleNextClick = () => {
    setDirection("next");
    setCurrentImage((prev) => (prev + 1) % media.length);
  };

  const handleBackClick = () => {
    setDirection("prev");
    setCurrentImage((prev) => (prev - 1 + media.length) % media.length);
  };

  // Auto-scroll logic
  useEffect(() => {
    if (autoScroll) {
      const interval = setInterval(() => {
        handleNextClick();
      }, autoScrollInterval);
      return () => clearInterval(interval);
    }
  }, [autoScroll, autoScrollInterval]);

  return (
    <div className={cn("relative overflow-hidden", rubikClassName, className)}>
      <div
        className={cn(
          "relative h-[200px] w-full md:h-[400px] border border-zui-stroke rounded-2xl overflow-hidden",
          mediaClassName
        )}
      >
        {media.map((item, index) => (
          <motion.div
            key={item.id}
            className="absolute inset-0 w-full h-full"
            initial={{
              x:
                index === currentImage
                  ? 0
                  : index < currentImage
                  ? "-100%"
                  : "100%",
            }}
            animate={{
              x:
                index === currentImage
                  ? 0
                  : index < currentImage
                  ? "-100%"
                  : "100%",
            }}
            exit={{
              x:
                index === currentImage
                  ? direction === "next"
                    ? "-100%"
                    : "100%"
                  : 0,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 40 }} // Adjusted for smoother animation
          >
            {!isImageURL(item.url) ? (
              <video
                playsInline
                autoPlay
                muted
                loop
                className="w-full h-full object-cover rounded-2xl"
                src={item.url}
              />
            ) : (
              <img
                className="w-full h-full object-cover rounded-2xl"
                src={`${item.url}?w=900`}
                alt={`carousel-media-${index + 1}`}
              />
            )}
            {isValidString(item.description) && !isMobile && (
              <div className="absolute flex items-center justify-center bottom-0 left-1/2 -translate-x-1/2 text-sm text-zui-white mt-2 w-full h-1/2 bg-gradient-to-t from-black to-transparent">
                <p className="w-[80%] text-center mx-auto">
                  {item.description}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {isValidString(media[currentImage].description) && isMobile && (
        <div className="text-xs text-zui-silver text-center mt-2 bottom-0 left-0 w-full tracking-[1%] min-h-[128px]">
          {media[currentImage].description}
        </div>
      )}

      <div className="flex justify-center gap-6 mt-4 items-center">
        <button
          onClick={handleBackClick}
          className="p-4 bg-zui-light rounded-full"
        >
          <Icon name="AngleLeft" size={16} fill="#fff" />
        </button>
        <span>{`${currentImage + 1}/${media.length}`}</span>
        <button
          onClick={handleNextClick}
          className="p-4 bg-zui-light rounded-full"
        >
          <Icon name="AngleRight" size={16} fill="#fff" />
        </button>
      </div>
    </div>
  );
};

export default MediaCarousel;
