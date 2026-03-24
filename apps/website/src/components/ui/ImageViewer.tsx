import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import React, { useCallback, useEffect, useState } from "react";
import { rubikClassName } from "../utils";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  activeImage: number;
  images: Array<{
    id: number | string;
    image: string;
    title: string;
    description: string;
  }>;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  activeImage,
  images,
  isOpen,
  onClose,
}) => {
  const [currentImage, setCurrentImage] = useState<number>(activeImage || 0);

  const handleBackClick = useCallback(() => {
    setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNextClick = useCallback(() => {
    setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        handleBackClick();
      } else if (event.key === "ArrowRight") {
        handleNextClick();
      }
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleBackClick, handleNextClick, onClose]);

  return isOpen ? (
    <div className="w-screen h-screen fixed top-0 left-0  z-100">
      <div className="bg-zui-dark w-full h-full z-10" onClick={onClose} />
      <button
        onClick={onClose}
        className="absolute bg-zui-light p-3 rounded-full top-6 right-6 z-10"
      >
        <Icon name="Cross" size={24} fill="#fff" />
      </button>

      <div className="flex flex-col gap-6 absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] w-[75%] aspect-video">
        <div className="flex-1 overflow-hidden rounded-2xl aspect-video">
          <img
            className="w-full h-full object-cover"
            src={images[currentImage].image}
            alt=""
          />
        </div>

        {/* controls */}
        <div className="flex items-center justify-between flex-shrink-0">
          <button
            onClick={handleBackClick}
            className="p-7 bg-zui-light rounded-full"
          >
            <Icon name="AngleLeft" size={16} fill="#fff" />
          </button>
          <div className={cn("flex-1 text-center", rubikClassName)}>
            <h4 className="sub-heading-3">{images[currentImage].title}</h4>
            <p className="sub-text-2 text-zui-silver mt-2">
              {images[currentImage].description}
            </p>
          </div>
          <button
            onClick={handleNextClick}
            className="p-7 bg-zui-light rounded-full"
          >
            <Icon name="AngleRight" size={16} fill="#fff" />
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

export default ImageViewer;
