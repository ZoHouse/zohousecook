import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const cities = [
  {
    city: "Dubai",
    tagline: "Pop-up Hacker House",
    description:
      "Three-week builder sprint in the desert. High-signal founders, zero distractions.",
    flag: "\u{1F1E6}\u{1F1EA}",
    images: ["/house/reel-5.png", "/house/reel-4.png"],
  },
  {
    city: "Singapore",
    tagline: "Founder Activation",
    description:
      "TOKEN2049 side event. 200+ founders. The room that launched three companies.",
    flag: "\u{1F1F8}\u{1F1EC}",
    images: ["/house/reel-3.png", "/house/reel-1.png"],
  },
  {
    city: "San Francisco",
    tagline: "Builder Residency",
    description:
      "Two weeks in SOMA. Demo day with top-tier VCs. Six deals closed on-site.",
    flag: "\u{1F1FA}\u{1F1F8}",
    images: ["/house/reel-2.png", "/house/founders-dinner.png"],
  },
];

// Flatten all images for the reel
const allImages = cities.flatMap((c) => c.images);
// Double for seamless loop
const reelImages = [...allImages, ...allImages];

// How many images per city group
const imagesPerCity = cities[0].images.length;

export function TrackRecordScroll() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reelOffset, setReelOffset] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const reel = reelRef.current;
    if (!section || !reel) return;

    const handleScroll = () => {
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.scrollHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / sectionHeight));

      // Which city are we on
      const cityIndex = Math.min(
        cities.length - 1,
        Math.floor(progress * cities.length)
      );
      setActiveIndex(cityIndex);

      // Move the reel — map scroll progress to horizontal translate
      const totalReelWidth = reel.scrollWidth / 2; // half because we doubled
      const offset = progress * totalReelWidth;
      setReelOffset(offset);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: `${(cities.length + 1.5) * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden z-10 bg-black">
        {/* Image reel */}
        <div className="absolute inset-0 z-0">
          <div
            ref={reelRef}
            className="flex h-full items-center gap-4 px-4 will-change-transform"
            style={{
              transform: `translateX(-${reelOffset}px)`,
              transition: "transform 0.1s linear",
            }}
          >
            {reelImages.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="relative flex-shrink-0 h-[70vh] rounded-2xl overflow-hidden border border-white/10"
                style={{ width: "45vw", minWidth: 350 }}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="45vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/30" />
              </div>
            ))}
          </div>
        </div>

        {/* Dark overlay for text */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-[1]" />

        {/* Text content */}
        <div className="relative z-[2] h-full flex flex-col justify-center px-8 md:px-28 max-w-2xl">
          <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-400 uppercase mb-4">
            Track Record
          </span>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-8">
            We&apos;ve done this before.
            <br />
            <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
              Dubai. Singapore. San Francisco.
            </span>
            <br />
            Now it&apos;s India&apos;s turn.
          </h2>

          {/* City names */}
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
      </div>
    </section>
  );
}
