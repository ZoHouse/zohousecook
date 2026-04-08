import React from "react";
import { cn } from "@zo/utils/font";
import Marquee from "react-fast-marquee";
import { useFadeInOnScroll } from "../../../hooks";
import { syneClassName, rubikClassName } from "../../utils/font";
import {
  LOGO_ZOSTEL,
  LOGO_ZOSTEL_PLUS,
  LOGO_ZO_TRIPS,
  LOGO_ZO_SELECTIONS,
  LOGO_ZO_HOUSE,
  LOGO_ZO_HOMES,
} from "./brand-logos";

const MEDIA = process.env.MEDIA_BASE_URL || "";

const brands = [
  {
    name: "Zostel",
    logo: LOGO_ZOSTEL,
    description: "Social backpacker hostels. Events, vibes, new friends.",
    badge: "India's Largest Backpack Chain",
    video: `${MEDIA}/gallery/media/videos/cfaed441-be10-47a3-a7ab-0e51079b6776_20240903100520.mp4`,
  },
  {
    name: "Zostel Plus",
    logo: LOGO_ZOSTEL_PLUS,
    description: "Premium hostels with curated experiences and aesthetic spaces.",
    video: `${MEDIA}/gallery/media/videos/cfabdbd5-6f9c-4b26-956d-a5c12f60fef7_20241007084352.mp4`,
  },
  {
    name: "Zo Trips",
    logo: LOGO_ZO_TRIPS,
    description: "Handcrafted tours, all-inclusive. Domestic and international.",
    video: `${MEDIA}/gallery/media/videos/8795e054-5c51-42ac-8570-2279a93f3aaf_20240903101643.mp4`,
  },
  {
    name: "Zo Selections",
    logo: LOGO_ZO_SELECTIONS,
    description: "Curated collection of boutique hotels, resorts, and immersive stays.",
    video: `${MEDIA}/gallery/media/videos/c243c43c-7199-485e-9e56-8976a594f4f9_20240903100216.mp4`,
  },
  {
    name: "Zo House",
    logo: LOGO_ZO_HOUSE,
    description: "Members-only clubhouses. Culture, tech, and 24/7 access for Founders.",
    video: `${MEDIA}/gallery/media/videos/0df691c1-8dd0-4cb9-a57a-b5eaead7cc59_20240903101502.mp4`,
  },
  {
    name: "Zostel Homes",
    logo: LOGO_ZO_HOMES,
    description: "Private homestays, villas, and offbeat escapes for families.",
    video: `${MEDIA}/gallery/media/videos/f1e4b823-d5fd-4d80-ad25-5105ffbcbe7a_20240903101554.mp4`,
  },
];

function BrandCard({ brand }: { brand: (typeof brands)[number] }) {
  return (
    <div
      className="relative flex flex-col justify-between w-[220px] md:w-[260px] h-[320px] md:h-[380px] rounded-2xl overflow-hidden flex-shrink-0 mx-2 md:mx-3"
      style={{
        boxShadow:
          "inset 0px 1px 4px rgba(255,255,255,0.15), 0px 4px 12px rgba(0,0,0,0.4)",
      }}
    >
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        src={brand.video}
      />
      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

      {/* Logo */}
      <div className="relative z-10 p-5 pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brand.logo}
          alt={brand.name}
          className="h-5 md:h-6 object-contain object-left"
        />
      </div>

      {/* Bottom content */}
      <div className="relative z-10 p-5 flex flex-col gap-2 mt-auto">
        {brand.badge && (
          <span
            className={cn(
              "text-[10px] px-2.5 py-1 rounded-full w-fit font-medium",
              rubikClassName
            )}
            style={{ background: "rgba(255,180,60,0.15)", color: "#FFB43C" }}
          >
            {brand.badge}
          </span>
        )}
        <p
          className={cn(
            "text-sm md:text-[15px] leading-[22px] text-white/90",
            rubikClassName
          )}
        >
          {brand.description}
        </p>
      </div>
    </div>
  );
}

const DiscoverZoWorld: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section ref={sectionRef} className="mt-20 md:mt-[120px]">
      <div className="text-center mb-10 px-6">
        <h2
          className={cn(
            "text-3xl md:text-[48px] md:leading-[58px] font-semibold text-white",
            syneClassName
          )}
        >
          Discover Zo World
        </h2>
        <p
          className={cn(
            "text-sm md:text-base text-white/60 mt-3 max-w-[520px] mx-auto",
            rubikClassName
          )}
        >
          Vibrant stays for solo travellers and group of friends in
          awe-inspiring locations
        </p>
      </div>

      {/* Auto-scrolling marquee */}
      <div className="relative w-full">
        <div className="hidden md:block w-24 h-full absolute top-0 -left-1 bg-gradient-to-r from-[#111] to-transparent z-10" />
        <div className="hidden md:block w-24 h-full absolute top-0 -right-1 bg-gradient-to-l from-[#111] to-transparent z-10" />
        <Marquee pauseOnHover speed={25} gradient={false}>
          {brands.map((brand) => (
            <BrandCard key={brand.name} brand={brand} />
          ))}
        </Marquee>
      </div>
    </section>
  );
};

export default DiscoverZoWorld;
