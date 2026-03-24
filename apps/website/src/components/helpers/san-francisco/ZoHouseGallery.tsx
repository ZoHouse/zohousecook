import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import { useWindowSize } from "@zo/utils/hooks";
import { useRouter } from "next/router";
import React, { useMemo, useState } from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { Button, ImageViewer } from "../../ui";
import { rubikClassName } from "../../utils";
import { isValidString } from "@zo/utils/string";
import { BookingOperatorResponse, Media } from "../../../config";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";

interface GallerySectionProps {}

interface GallerySectionProps {}

const GallerySection: React.FC<GallerySectionProps> = () => {
  const router = useRouter();
  const { isMobile } = useWindowSize();

  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  const [activeImage, setActiveImage] = useState<number>(0);
  const [isImageViewerOpen, setImageViewerOpen] = useState<boolean>(false);

  const { data: operator } = useQueryApi<BookingOperatorResponse>(
    "BOOKINGS_STAY_OPERATORS",
    {
      select: (data: GeneralObject) => data.data,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      enabled: isValidString(process.env.ZOHOUSE_SFO_PID),
    },
    `${process.env.ZOHOUSE_SFO_PID}`
  );

  const handleImageClick = (index: number) => {
    setActiveImage(index);
    setImageViewerOpen(true);
  };

  const handleBookDayPass = () => {
    window.open("https://lu.ma/zowork", "_blank");
  };

  const openMembership = () => {
    router.push("/membership");
  };

  const images: Array<{
    id: string;
    image: string;
    title: string;
    description: string;
  }> = useMemo(() => {
    return (
      operator?.media
        ?.sort((a, b) => {
          const priorityA = b.sort_index ?? Number.MAX_VALUE;
          const priorityB = a.sort_index ?? Number.MAX_VALUE;
          return priorityA - priorityB;
        })
        .map((media: Media) => ({
          id: media.id || "",
          image: media.url || "",
          title: media.metadata.title || "",
          description: media.metadata.description || "",
        })) || []
    );
  }, [operator]);

  return (
    <>
      <section
        ref={sectionRef}
        id="gallery"
        className="relative z-20 py-10 md:py-20 px-6 md:px-0"
      >
        <div className="md:w-3/4 mx-auto text-center">
          <p className="text-center text-zui-white text-[40px] font-semibold">
            Zo House SF
          </p>
          <br />
          <span className="text-zui-neon font-bold">
            Members only Techno Optimist Clubhouse in Downtown SF
          </span>
          <p className="mt-6 text-zui-silver font-medium">
            I am Zo House SF, where San Francisco’s rebellious soul and the
            duality of Burning Man pulse through every wall. <br />
            <br /> By day, it’s a crucible for innovation—an avant-garde
            playground for tech disruptors and creatives pushing boundaries with
            super intelligence, deep work, immersive quests and events. <br />
            <br />
            By night, the space embraces its wilder, untamed side, hosting
            underground parties, raw performances, and spontaneous artistic
            collisions, all in tune with SF’s quantum consciousness. <br />
            <br />
            Here, the future isn’t just shaped—it’s reimagined, night and day.
          </p>

          <div className="flex flex-col gap-6 text-center text-zui-white text-base font-medium mt-6">
            <a
              target="_blank"
              href="https://maps.app.goo.gl/XSvUT92kxq4Hx65s7"
              className="underline underline-offset-2"
            >
              300 4th St, San Francisco
            </a>
          </div>

          <div className="mt-6 flex gap-4 items-center justify-center">
            <a href="https://t.me/sfoxzo" target="_blank">
              <Icon name="Telegram" fill="#fff" size={24} />
            </a>
            <a href=" https://x.com/SFOxZo" target="_blank">
              <Icon name="X" fill="#fff" size={24} />
            </a>
          </div>
        </div>

        {isMobile ? (
          <div className="w-full overflow-x-scroll my-6 hide-scrollbar snap-x snap-mandatory">
            {images.length > 0 ? (
              <div className="flex items-center gap-6 w-fit">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="w-[280px] h-full aspect-square rounded-2xl snap-center relative border border-zui-stroke overflow-hidden"
                  >
                    <img
                      className="w-full h-full object-cover rounded-2xl"
                      src={image.image}
                      alt={image.title}
                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-20 text-center z-10 w-full  items-center flex justify-center bg-gradient-to-t from-black/80 to-transparent" />
                    <span
                      className={cn(
                        "text-white text-base font-medium absolute bottom-6 left-1/2 -translate-x-1/2 z-20",
                        rubikClassName
                      )}
                    >
                      {image?.title}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-between bg-zui-light py-20 my-10">
                <h3 className="text-xl">No Images for this Zo house</h3>
                <span className="text-zui-silver mt-2">
                  Ask Admin to upload
                </span>
              </div>
            )}
          </div>
        ) : images.length > 0 ? (
          <div className="grid gap-6 text-black mt-20">
            <div className="hidden md:grid md:grid-cols-4 md:grid-rows-3 md:gap-6 max-h-[530px]">
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
                {images[1] && ( // Render only if image exists
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
                )}
              </div>
              <div className="col-span-1 row-span-2 grid gap-6">
                {images[2] && ( // Render only if image exists
                  <div
                    onClick={handleImageClick.bind(null, 2)}
                    className="w-full h-full overflow-hidden rounded-2xl relative cursor-pointer inner-border"
                  >
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
                )}
                {images[3] && ( // Render only if image exists
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
                )}
              </div>
              {images[4] && ( // Render only if image exists
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
              )}
              {images[5] && ( // Render only if image exists
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
              )}
              {images[6] && ( // Render only if image exists
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
              )}
              {images[7] && ( // Render only if image exists
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
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-between bg-zui-light py-20 my-10">
            <h3 className="text-xl">No Images for this Zo house</h3>
            <span className="text-zui-silver mt-2">Ask Admin to upload</span>
          </div>
        )}
        <div className="flex flex-col md:flex-row items-center gap-6 justify-center md:mt-20">
          <Button className="m-0" onClick={openMembership} type="primary">
            Become a Member
          </Button>
          <Button onClick={handleBookDayPass} type="secondary">
            Book a Day Pass
          </Button>
        </div>
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
