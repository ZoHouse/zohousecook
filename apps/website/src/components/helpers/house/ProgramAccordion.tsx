import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const items = [
  {
    title: "Mentor Sessions",
    when: "Weekly",
    description:
      "Access to founders who\u2019ve built it, operators who\u2019ve scaled it, investors who\u2019ve funded it.",
    image: "/house/nikhil-kamath.png",
  },
  {
    title: "Founder Dinners",
    when: "Monthly",
    description:
      "Curated guests. Chef-prepared. No agenda. The conversations that change trajectories.",
    image: "/house/founders-dinner.png",
  },
  {
    title: "Demo Days",
    when: "Every month",
    description:
      "Ship something. Show it. Peers, mentors, investors in the room.",
    image: "/house/demo-day.png",
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
      <div className="sticky top-0 h-screen flex items-center px-8 md:px-28 bg-black z-10">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-8 md:gap-16">
          {/* Left - text + accordion */}
          <div className="md:w-1/2 flex flex-col justify-center">
            <h2 className="text-4xl md:text-5xl font-light mb-4 tracking-tight">
              India&apos;s first permanent{" "}
              <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
                hacker house.
              </span>
            </h2>
            <p className="text-neutral-400 text-base md:text-lg font-light max-w-xl mb-10">
              Founders live together in Bangalore. Monthly cohorts. Build
              alongside serious peers. The house doesn&apos;t reset when a
              cohort ends — it compounds.
            </p>

            {/* Accordion */}
            <div className="flex flex-col">
              {items.map((item, i) => {
                const isActive = i === activeIndex;
                return (
                  <div
                    key={item.title}
                    className="border-t border-white/10 last:border-b cursor-pointer"
                    onClick={() => setActiveIndex(i)}
                  >
                    <div className="flex items-center justify-between py-4 md:py-5">
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-xs font-mono transition-colors duration-300 ${
                            isActive ? "text-[#c9a84c]" : "text-neutral-600"
                          }`}
                        >
                          0{i + 1}
                        </span>
                        <h3
                          className={`text-lg md:text-xl font-bold tracking-tight uppercase transition-colors duration-300 ${
                            isActive ? "text-white" : "text-neutral-500"
                          }`}
                        >
                          {item.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-[10px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 hidden md:block ${
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

          {/* Right - image */}
          <div className="md:w-1/2 flex items-center justify-center">
            <div className="relative w-full aspect-[3/4] max-h-[75vh] rounded-2xl overflow-hidden border border-white/10">
              {items.map((item, i) => (
                <div
                  key={item.title}
                  className={`absolute inset-0 transition-all duration-700 ${
                    i === activeIndex
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-105"
                  }`}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
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
