import { cn } from "@zo/utils/font";
import { useWindowSize } from "@zo/utils/hooks";
import React, { useState } from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { ImageViewer, ImageViewerMini } from "../../ui";
import { rubikClassName } from "../../utils";

interface GallerySectionProps {
  images: Array<{
    id: number;
    image: string;
    title: string;
    description: string;
  }>;
}

const GallerySection: React.FC<GallerySectionProps> = ({ images }) => {
  const { isMobile } = useWindowSize();

  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  const [activeImage, setActiveImage] = useState<number>(0);
  const [isImageViewerOpen, setImageViewerOpen] = useState<boolean>(false);

  const handleImageClick = (index: number) => {
    setActiveImage(index);
    setImageViewerOpen(true);
  };

  return (
    <>
      <section ref={sectionRef} id="gallery" className="relative z-20">
        <h2 className="w-full full md:w-[75%] sub-heading-2 mx-auto text-center">
          Spaces designed for limitless indulgence, creativity, & productivity
        </h2>

        {isMobile ? (
          <div className="grid">
            <ImageViewerMini activeImage={activeImage} images={images} />
          </div>
        ) : (
          <div className="grid gap-6 text-black mt-10">
            {/* Desktop and Tablet */}
            <div className="hidden md:grid md:grid-cols-4 md:grid-rows-5 md:gap-6 max-h-[900px]">
              <div className="col-span-3 row-span-2 grid grid-cols-5 gap-6">
                <div
                  onClick={handleImageClick.bind(null, 0)}
                  className="col-span-2 w-full h-full overflow-hidden rounded-2xl relative cursor-pointer inner-border"
                >
                  <img
                    className="w-full h-full object-cover hover:opacity-80 cursor-pointer transition-opacity duration-300 ease-in-out"
                    src={`${images[0]?.image}?w=600`}
                    alt=""
                  />
                  <div className="absolute inset-0 flex items-end justify-center pb-10 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 ease-in-out">
                    <span
                      className={cn(
                        "text-white text-base font-medium",
                        rubikClassName
                      )}
                    >
                      {images[0]?.title}
                    </span>
                  </div>
                </div>
                <div
                  onClick={handleImageClick.bind(null, 1)}
                  className="col-span-3 w-full h-full overflow-hidden rounded-2xl relative cursor-pointer inner-border"
                >
                  <img
                    className="w-full h-full object-cover hover:opacity-80 cursor-pointer transition-opacity duration-300 ease-in-out"
                    src={`${images[1]?.image}?w=600`}
                    alt=""
                  />
                  <div className="absolute inset-0 flex items-end justify-center pb-10 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 ease-in-out">
                    <span
                      className={cn(
                        "text-white text-base font-medium",
                        rubikClassName
                      )}
                    >
                      {images[1]?.title}
                    </span>
                  </div>
                </div>
              </div>
              <div
                onClick={handleImageClick.bind(null, 2)}
                className="col-span-1 row-span-2 grid gap-6"
              >
                <div className="w-full h-full overflow-hidden rounded-2xl relative cursor-pointer inner-border">
                  <img
                    className="w-full h-full object-cover hover:opacity-80 cursor-pointer transition-opacity duration-300 ease-in-out"
                    src={`${images[2]?.image}?w=600`}
                    alt=""
                  />
                  <div className="absolute inset-0 flex items-end justify-center pb-10 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 ease-in-out">
                    <span
                      className={cn(
                        "text-white text-base font-medium",
                        rubikClassName
                      )}
                    >
                      {images[2]?.title}
                    </span>
                  </div>
                </div>
                <div
                  onClick={handleImageClick.bind(null, 3)}
                  className="w-full h-full overflow-hidden rounded-2xl relative cursor-pointer inner-border"
                >
                  <img
                    className="w-full h-full object-cover hover:opacity-80 cursor-pointer transition-opacity duration-300 ease-in-out"
                    src={`${images[3]?.image}?w=600`}
                    alt=""
                  />
                  <div className="absolute inset-0 flex items-end justify-center pb-10 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 ease-in-out">
                    <span
                      className={cn(
                        "text-white text-base font-medium",
                        rubikClassName
                      )}
                    >
                      {images[3]?.title}
                    </span>
                  </div>
                </div>
              </div>
              <div
                onClick={handleImageClick.bind(null, 4)}
                className="col-span-1 row-span-1 w-full h-full overflow-hidden rounded-2xl relative cursor-pointer inner-border"
              >
                <img
                  className="w-full h-full object-cover hover:opacity-80 cursor-pointer transition-opacity duration-300 ease-in-out"
                  src={`${images[4]?.image}?w=600`}
                  alt=""
                />
                <div className="absolute inset-0 flex items-end justify-center pb-10 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 ease-in-out">
                  <span
                    className={cn(
                      "text-white text-base font-medium",
                      rubikClassName
                    )}
                  >
                    {images[4]?.title}
                  </span>
                </div>
              </div>
              <div
                onClick={handleImageClick.bind(null, 5)}
                className="col-span-1 row-span-1 w-full h-full overflow-hidden rounded-2xl relative cursor-pointer inner-border"
              >
                <img
                  className="w-full h-full object-cover hover:opacity-80 cursor-pointer transition-opacity duration-300 ease-in-out"
                  src={`${images[5]?.image}?w=600`}
                  alt=""
                />
                <div className="absolute inset-0 flex items-end justify-center pb-10 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 ease-in-out">
                  <span
                    className={cn(
                      "text-white text-base font-medium",
                      rubikClassName
                    )}
                  >
                    {images[5]?.title}
                  </span>
                </div>
              </div>
              <div
                onClick={handleImageClick.bind(null, 6)}
                className="col-span-1 row-span-1 w-full h-full overflow-hidden rounded-2xl relative cursor-pointer inner-border"
              >
                <img
                  className="w-full h-full object-cover hover:opacity-80 cursor-pointer transition-opacity duration-300 ease-in-out"
                  src={`${images[6]?.image}?w=600`}
                  alt=""
                />
                <div className="absolute inset-0 flex items-end justify-center pb-10 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 ease-in-out">
                  <span
                    className={cn(
                      "text-white text-base font-medium",
                      rubikClassName
                    )}
                  >
                    {images[6]?.title}
                  </span>
                </div>
              </div>
              <div
                onClick={handleImageClick.bind(null, 7)}
                className="col-span-1 row-span-1 w-full h-full overflow-hidden rounded-2xl relative cursor-pointer inner-border"
              >
                <img
                  className="w-full h-full object-cover hover:opacity-80 cursor-pointer transition-opacity duration-300 ease-in-out"
                  src={`${images[7]?.image}?w=600`}
                  alt=""
                />
                <div className="absolute inset-0 flex items-end justify-center pb-10 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 ease-in-out">
                  <span
                    className={cn(
                      "text-white text-base font-medium",
                      rubikClassName
                    )}
                  >
                    {images[7]?.title}
                  </span>
                </div>
              </div>
              <div className="col-span-1 row-span-2 grid gap-6">
                <div
                  onClick={handleImageClick.bind(null, 8)}
                  className="w-full h-full overflow-hidden rounded-2xl relative cursor-pointer inner-border"
                >
                  <img
                    className="w-full h-full object-cover hover:opacity-80 cursor-pointer transition-opacity duration-300 ease-in-out"
                    src={`${images[8]?.image}?w=600`}
                    alt=""
                  />
                  <div className="absolute inset-0 flex items-end justify-center pb-10 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 ease-in-out">
                    <span
                      className={cn(
                        "text-white text-base font-medium",
                        rubikClassName
                      )}
                    >
                      {images[8]?.title}
                    </span>
                  </div>
                </div>
                <div
                  onClick={handleImageClick.bind(null, 9)}
                  className="w-full h-full overflow-hidden rounded-2xl relative cursor-pointer inner-border"
                >
                  <img
                    className="w-full h-full object-cover hover:opacity-80 cursor-pointer transition-opacity duration-300 ease-in-out"
                    src={`${images[9]?.image}?w=600`}
                    alt=""
                  />
                  <div className="absolute inset-0 flex items-end justify-center pb-10 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 ease-in-out">
                    <span
                      className={cn(
                        "text-white text-base font-medium",
                        rubikClassName
                      )}
                    >
                      {images[9]?.title}
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-span-3 row-span-2 grid grid-cols-5 gap-6">
                <div
                  onClick={handleImageClick.bind(null, 10)}
                  className="col-span-2 w-full h-full overflow-hidden rounded-2xl relative cursor-pointer inner-border"
                >
                  <img
                    className="w-full h-full object-cover hover:opacity-80 cursor-pointer transition-opacity duration-300 ease-in-out"
                    src={`${images[10]?.image}?w=600`}
                    alt=""
                  />
                  <div className="absolute inset-0 flex items-end justify-center pb-10 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 ease-in-out">
                    <span
                      className={cn(
                        "text-white text-base font-medium",
                        rubikClassName
                      )}
                    >
                      {images[10]?.title}
                    </span>
                  </div>
                </div>
                <div
                  onClick={handleImageClick.bind(null, 11)}
                  className="col-span-3 w-full h-full overflow-hidden rounded-2xl relative cursor-pointer inner-border"
                >
                  <img
                    className="w-full h-full object-cover hover:opacity-80 cursor-pointer transition-opacity duration-300 ease-in-out"
                    src={`${images[11]?.image}?w=600`}
                    alt=""
                  />
                  <div className="absolute inset-0 flex items-end justify-center pb-10 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 ease-in-out">
                    <span
                      className={cn(
                        "text-white text-base font-medium",
                        rubikClassName
                      )}
                    >
                      {images[11]?.title}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <hr className="w-[80%] md:w-[60%] horizontal-divider my-20" />
      </section>
      {isImageViewerOpen && (
        <ImageViewer
          images={images}
          activeImage={activeImage}
          isOpen={isImageViewerOpen}
          onClose={setImageViewerOpen.bind(null, false)}
        />
      )}
    </>
  );
};

export default GallerySection;
