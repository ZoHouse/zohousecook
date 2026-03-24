import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import React, { useCallback, useState } from "react";
import { rubikClassName } from "../utils";

interface ImageViewerMiniProps {
  activeImage: number;
  images: Array<{
    id: number;
    image: string;
    title: string;
    description: string;
  }>;
}

const ImageViewerMini: React.FC<ImageViewerMiniProps> = ({
  activeImage,
  images,
}) => {
  const [currentImage, setCurrentImage] = useState<number>(activeImage || 0);

  const handleBackClick = useCallback(() => {
    setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNextClick = useCallback(() => {
    setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  return (
    <div className="mt-6 h-[540px] flex flex-col justify-center gap-6">
      <div className="relative w-[280px] h-[280px] mx-auto aspect-square flex-1 flex-grow my-6">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`rounded-2xl overflow-hidden w-[280px] h-[280px] absolute rotate-[${
              index * 8
            }deg] drop-shadow-md`}
            style={{
              zIndex: index === currentImage ? images.length : index,
              // transition: "z-index 0.3s ease, transform 0.3s ease",
            }}
          >
            <img
              alt={image.title}
              className="w-full h-full object-cover"
              src={image.image}
            />
          </div>
        ))}
      </div>

      <div className={cn("flex-shrink-0", rubikClassName)}>
        <div className="flex-1 text-center">
          <h4 className="sub-heading-3">{images[currentImage].title}</h4>
          <p className="sub-text-2 text-zui-silver mt-2">
            {images[currentImage].description}
          </p>
        </div>

        <div className="flex justify-center gap-6 mt-4 items-center">
          <button
            onClick={handleBackClick}
            className="p-4 bg-zui-light rounded-full"
          >
            <Icon name="AngleLeft" size={16} fill="#fff" />
          </button>
          <span>{`${currentImage + 1}/${images.length}`}</span>
          <button
            onClick={handleNextClick}
            className="p-4 bg-zui-light rounded-full"
          >
            <Icon name="AngleRight" size={16} fill="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageViewerMini;
