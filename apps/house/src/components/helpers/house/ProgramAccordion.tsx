import { useEffect, useRef, useState } from "react";
import { HOUSE_MEDIA } from "../../../config/house-media";

const CDN = "https://cdn.zo.xyz";

const items = [
  {
    title: "Build Sprints",
    when: "Every cohort",
    description:
      "Intense, focused building blocks. Ship hard with the house around you.",
    video: HOUSE_MEDIA.hackathon,
  },
  {
    title: "Mentor Sessions",
    when: "Weekly",
    description:
      "Access to founders who\u2019ve built it, operators who\u2019ve scaled it, investors who\u2019ve funded it.",
    video: `${CDN}/gallery/media/videos/c243c43c-7199-485e-9e56-8976a594f4f9_20240903100216.mp4`,
  },
  {
    title: "Founder Dinners",
    when: "Monthly",
    description:
      "Curated guests. Chef-prepared. No agenda. The conversations that change trajectories.",
    video: `${CDN}/gallery/media/videos/cfabdbd5-6f9c-4b26-956d-a5c12f60fef7_20241007084352.mp4`,
  },
  {
    title: "Demo Days",
    when: "Every month",
    description:
      "Ship something. Show it. Peers, mentors, investors in the room.",
    video: HOUSE_MEDIA.demoday,
  },
];

export function ProgramAccordion() {
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleScroll = () => {
      const rect = wrapper.getBoundingClientRect();
      const scrollable = wrapper.scrollHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollable));
      const index = Math.min(
        items.length - 1,
        Math.floor(progress * items.length)
      );
      setActiveIndex(index);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{ height: `${(items.length + 1) * 100}vh` }}
      className="relative"
    >
      <div className="sticky top-0 h-screen flex items-center px-6 md:px-28 bg-black z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-4 md:gap-16">
          {/* Left - text + accordion */}
          <div className="md:w-1/2 flex flex-col justify-center">
            <h2 className="text-2xl md:text-5xl font-light mb-2 md:mb-4 tracking-tight">
              India&apos;s first permanent{" "}
              <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
                hacker house.
              </span>
            </h2>
            <p className="text-neutral-400 text-sm md:text-lg font-light max-w-xl mb-4 md:mb-10">
              Founders live together in Bangalore. Monthly cohorts. Build
              alongside serious peers. The house doesn&apos;t reset when a
              cohort ends. It compounds.
            </p>

            {/* Mobile: single active item */}
            <div className="md:hidden">
              <div className="border-t border-b border-white/10 py-3">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-mono text-[#c9a84c]">
                    0{activeIndex + 1}
                  </span>
                  <h3 className="text-base font-bold tracking-tight uppercase text-white">
                    {items[activeIndex].title}
                  </h3>
                </div>
                <p className="text-neutral-400 text-xs font-light leading-relaxed pl-8">
                  {items[activeIndex].description}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 mt-3">
                {items.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      i === activeIndex ? "bg-[#c9a84c]" : "bg-neutral-700"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop: full accordion */}
            <div className="hidden md:flex flex-col">
              {items.map((item, i) => {
                const isActive = i === activeIndex;
                return (
                  <div
                    key={item.title}
                    className="border-t border-white/10 last:border-b cursor-pointer"
                    onClick={() => setActiveIndex(i)}
                  >
                    <div className="flex items-center justify-between py-5">
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-xs font-mono transition-colors duration-300 ${
                            isActive ? "text-[#c9a84c]" : "text-neutral-600"
                          }`}
                        >
                          0{i + 1}
                        </span>
                        <h3
                          className={`text-xl font-bold tracking-tight uppercase transition-colors duration-300 ${
                            isActive ? "text-white" : "text-neutral-500"
                          }`}
                        >
                          {item.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-[10px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${
                            isActive ? "text-[#c9a84c]" : "text-neutral-600"
                          }`}
                        >
                          {item.when}
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform duration-300 ${
                            isActive
                              ? "rotate-180 text-white"
                              : "text-neutral-600"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    <div
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        isActive
                          ? "max-h-32 opacity-100 pb-4"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <p className="text-neutral-400 text-sm font-light leading-relaxed pl-10 max-w-md">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right - video */}
          <div className="md:w-1/2 flex items-center justify-center">
            <div className="relative w-full aspect-[4/3] md:aspect-[3/4] max-h-[35vh] md:max-h-[75vh] rounded-2xl overflow-hidden border border-white/10">
              {items.map((item, i) => (
                <div
                  key={item.title}
                  className={`absolute inset-0 transition-all duration-700 ${
                    i === activeIndex
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-105"
                  }`}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    src={item.video}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
