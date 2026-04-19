import { useEffect, useState } from "react";
import Image from "next/image";
import Marquee from "react-fast-marquee";
import { HOUSE_MEDIA } from "../../../config/house-media";

const cities = [
  {
    city: "Dubai",
    tagline: "Pop-up Hacker House",
    description:
      "Three-week builder sprint in the desert. High-signal founders, zero distractions.",
    flag: "\u{1F1E6}\u{1F1EA}",
    images: [HOUSE_MEDIA.reel5, HOUSE_MEDIA.reel4, HOUSE_MEDIA.reel6],
  },
  {
    city: "Singapore",
    tagline: "Founder Activation",
    description:
      "TOKEN2049 side event. 200+ founders. The room that launched three companies.",
    flag: "\u{1F1F8}\u{1F1EC}",
    images: [HOUSE_MEDIA.reel3, HOUSE_MEDIA.reel7],
  },
  {
    city: "San Francisco",
    tagline: "Builder Residency",
    description:
      "Two weeks in SOMA. Demo day with top-tier VCs. Six deals closed on-site.",
    flag: "\u{1F1FA}\u{1F1F8}",
    images: [HOUSE_MEDIA.foundersDinner, HOUSE_MEDIA.reel8],
  },
];

const allImages = cities.flatMap((c) => c.images);

const CITY_ROTATE_MS = 4000;

export function TrackRecordScroll() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % cities.length);
    }, CITY_ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative h-screen overflow-hidden bg-black">
      {/* Marquee reel */}
      <div className="absolute inset-0 z-0 flex items-center">
        <Marquee speed={40} gradient={false} pauseOnHover>
          {allImages.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative flex-shrink-0 h-[70vh] mx-2 rounded-2xl overflow-hidden border border-white/10"
              style={{ width: "45vw", minWidth: 350 }}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="45vw"
                className="object-cover"
                style={src.includes("reel-7") ? { objectPosition: "95% center" } : undefined}
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>
          ))}
        </Marquee>
      </div>

      {/* Dark overlay for text */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-[1]" />

      {/* Text content */}
      <div className="relative z-[2] h-full flex flex-col justify-center px-8 md:px-28 max-w-2xl">
        <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-8">
          We&apos;ve done this before.
          <br />
          <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
            Dubai. Singapore. San Francisco.
          </span>
          <br />
          Now it&apos;s India&apos;s turn.
        </h2>

        <div className="flex flex-col gap-4 mt-4">
          {cities.map((c, i) => (
            <div
              key={c.city}
              className={`transition-all duration-500 ${
                i === activeIndex ? "opacity-100" : "opacity-30"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.flag}</span>
                <h3
                  className={`text-2xl md:text-4xl font-bold tracking-tight transition-all duration-500 ${
                    i === activeIndex ? "text-white" : "text-neutral-600"
                  }`}
                >
                  {c.city}
                </h3>
              </div>
              <div
                className={`overflow-hidden transition-all duration-500 ${
                  i === activeIndex
                    ? "max-h-24 opacity-100 mt-2"
                    : "max-h-0 opacity-0 mt-0"
                }`}
              >
                <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-400 uppercase">
                  {c.tagline}
                </span>
                <p className="text-neutral-300 text-sm font-light mt-1 max-w-sm">
                  {c.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
