import { cn } from "@zo/utils/font";
import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName, syneClassName } from "../../utils/font";

interface ZoBrand {
  title: string;
  subtitle: string;
  videoUrl: string;
  link: string;
}

const brands: ZoBrand[] = [
  {
    title: "Zostel",
    subtitle: "India's largest hostel chain",
    videoUrl: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/09030328-7d89-49ad-9429-5954fddec56b_20240903101754.mp4`,
    link: "https://www.zostel.com",
  },
  {
    title: "Zo Trips",
    subtitle: "Curated group experiences",
    videoUrl: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/c243c43c-7199-485e-9e56-8976a594f4f9_20240903100216.mp4`,
    link: "https://zo.xyz/trips",
  },
  {
    title: "Zo Selection",
    subtitle: "Premium boutique stays",
    videoUrl: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/0c2806c0-e132-481c-8581-db3473df54ac_20240903100339.mp4`,
    link: "https://www.zostel.com/zo-selection/",
  },
  {
    title: "Zo Houses",
    subtitle: "Clubhouses for founders",
    videoUrl: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/cfabdbd5-6f9c-4b26-956d-a5c12f60fef7_20241007084352.mp4`,
    link: "https://zo.xyz",
  },
];

const ZoBrandsSection: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section
      ref={sectionRef}
      className="min-h-fit pt-4 md:pt-6 pb-10 md:pb-20 px-6 lg:px-[108px] max-w-[1400px] mx-auto"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {brands.map((brand) => (
          <a
            key={brand.title}
            href={brand.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-full h-[280px] md:h-[400px] rounded-2xl overflow-hidden inner-border"
          >
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              src={brand.videoUrl}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 md:p-6 z-10">
              <h3
                className={cn(
                  "text-xl md:text-2xl font-bold",
                  syneClassName
                )}
              >
                {brand.title}
              </h3>
              <p
                className={cn(
                  "text-sm md:text-base text-white/60 mt-1",
                  rubikClassName
                )}
              >
                {brand.subtitle}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default ZoBrandsSection;
