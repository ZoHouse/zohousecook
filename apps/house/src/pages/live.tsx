import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { MetaTags } from "../components/common/MetaTags";
import { BlurFade } from "../components/helpers/house";

type Amenity = { label: string; imgs: string[] };

type House = {
  code: string;
  area: string;
  residents: number;
  eir: number;
  dorm: string;
  private: string;
  render: string;
  amenities: Amenity[];
};

const HOUSES: House[] = [
  {
    code: "BLRxZo",
    area: "Koramangala",
    residents: 14,
    eir: 1,
    dorm: "₹1,500",
    private: "₹4,000",
    render:
      "https://proxy.cdn.zo.xyz/gallery/media/images/e5f37895-b82e-4968-bae9-f8a473709108_20260519085907.webp",
    amenities: [
      {
        label: "Schelling Point",
        imgs: [
          "https://proxy.cdn.zostel.com/zostel/gallery/images/jGBRgUEtQsi3iFcdlY0c5A/zo-house-koramangala-20250526110719.jpg",
        ],
      },
      {
        label: "Flo-Zone",
        imgs: [
          "https://proxy.cdn.zostel.com/zostel/gallery/images/g6Dj0oi-RQ6z07jzGNQl3w/zo-house-koramangala-20250526110623.jpg",
          "https://proxy.cdn.zostel.com/zostel/gallery/images/X8uzfhCVQcOJYVcR5ecoYQ/zo-house-koramangala-20250526110625.jpg",
          "https://proxy.cdn.zostel.com/zostel/gallery/images/GqBogMV9RuqIYAyN4nLJ_Q/zo-house-koramangala-20250526110622.jpg",
        ],
      },
      {
        label: "Cafe Zomad",
        imgs: [
          "https://proxy.cdn.zostel.com/zostel/gallery/images/ATjpMZrRQqOhTFGE3TRS-g/zo-house-koramangala-20250526110538.jpg",
        ],
      },
      {
        label: "Studio",
        imgs: [
          "https://proxy.cdn.zostel.com/zostel/gallery/images/0SOvv6cXSRG6Ld9784tCYw/zo-house-koramangala-20250526110743.jpg",
          "https://proxy.cdn.zostel.com/zostel/gallery/images/KxPv7eQSQOqLlnCeEVNXAQ/zo-house-koramangala-20250526110742.jpg",
        ],
      },
      {
        label: "Soundproof booth",
        imgs: [
          "https://proxy.cdn.zostel.com/zostel/gallery/images/uC_JMJRIRjuiNCyZAjvCMg/zo-house-koramangala-20250526110521.jpg",
        ],
      },
      {
        label: "Lounge",
        imgs: [
          "https://proxy.cdn.zostel.com/zostel/gallery/images/kyM6RYMuRSGEB0a7JIwByA/zo-house-koramangala-20250526110508.jpg",
        ],
      },
    ],
  },
  {
    code: "WTFxZo",
    area: "Whitefield",
    residents: 19,
    eir: 1,
    dorm: "₹1,200",
    private: "₹3,500",
    render:
      "https://proxy.cdn.zo.xyz/gallery/media/images/86a77698-2b1f-41ce-b039-918b0f585dcf_20260519085908.webp",
    amenities: [
      {
        label: "Liquidity Pool",
        imgs: [
          "https://proxy.cdn.zostel.com/zostel/gallery/images/v9OrerRoRIqNKKPlf5jxTQ/zo-house-bangalore-whitefield-20250828123338.jpg",
        ],
      },
      {
        label: "Sauna",
        imgs: [
          "https://proxy.cdn.zostel.com/zostel/gallery/images/rDDo8vUPRUGkFy_rZ24u3w/zo-house-bangalore-whitefield-20250828123230.jpg",
        ],
      },
      {
        label: "Cafe Zomad",
        imgs: [
          "https://proxy.cdn.zostel.com/zostel/gallery/images/dwcaIa9GTqiN1Ntuxhayeg/zo-house-bangalore-whitefield-20250828123408.jpg",
        ],
      },
      {
        label: "Flo-Zone",
        imgs: [
          "https://proxy.cdn.zostel.com/zostel/gallery/images/gdYArsGSQ72EnD6kMqvmFA/zo-house-bangalore-whitefield-20250828123325.jpg",
          "https://proxy.cdn.zostel.com/zostel/gallery/images/hVshxHHHRVWVdAdhWRNZDQ/zo-house-bangalore-whitefield-20250828123327.jpg",
          "https://proxy.cdn.zostel.com/zostel/gallery/images/_LDvqVVzQqKj6zwuPcDO1A/zo-house-bangalore-whitefield-20250828123322.jpg",
        ],
      },
      {
        label: "Lounge",
        imgs: [
          "https://proxy.cdn.zostel.com/zostel/gallery/images/FZFXWvPcRKKcinI3PEwugQ/zo-house-bangalore-whitefield-20250828123241.jpg",
        ],
      },
      {
        label: "Multipurpose Court",
        imgs: [
          "https://proxy.cdn.zostel.com/zostel/gallery/images/ZvoJSyQVSb2Y9_M3m2dUOA/zo-house-bangalore-whitefield-20250828123355.jpg",
        ],
      },
    ],
  },
];

const PARTNERS = [
  {
    name: "Mentibus",
    blurb: "The intelligence layer for the frontier economy. Team builds out of WTFxZo.",
    house: "WTFxZo",
    slots: 5,
    href: "https://mentibus.xyz",
  },
  {
    name: "Residency Bangalore",
    blurb: "Founder network across 12 cities. Bangalore chapter inside BLRxZo.",
    house: "BLRxZo",
    slots: null,
    href: "https://www.residencyblr.com",
  },
];

const SHARED = [
  {
    title: "Build sprints",
    body: "Focused build cycles with the house around you.",
  },
  {
    title: "Mentor sessions",
    body: "Office hours with operators, founders, investors.",
  },
  {
    title: "Founder dinners",
    body: "Long-table dinners with the cohort.",
  },
  {
    title: "Demo days",
    body: "Ship it. Show it. Peers and investors in the room.",
  },
];

// Photos of house programming, shown as a scrolling strip under the rituals
// grid. Order is interleaved so the strip mixes event types rather than
// running six build-sprint shots in a row.
const PROGRAMMING_PHOTOS = [
  { src: "/programming/build-sprint-1.jpg", label: "Build sprint" },
  { src: "/programming/founders-dinner-1.jpg", label: "Founder dinner" },
  { src: "/programming/mentor-1.jpg", label: "Mentor session" },
  { src: "/programming/build-sprint-2.jpg", label: "Build sprint" },
  { src: "/programming/demo-day-1.jpg", label: "Demo day" },
  { src: "/programming/build-sprint-3.jpg", label: "Build sprint" },
  { src: "/programming/founders-dinner-2.jpg", label: "Founder dinner" },
  { src: "/programming/build-sprint-4.jpg", label: "Build sprint" },
  { src: "/programming/mentor-2.jpg", label: "Mentor session" },
  { src: "/programming/build-sprint-5.jpg", label: "Build sprint" },
  { src: "/programming/demo-day-2.jpg", label: "Demo day" },
  { src: "/programming/founders-dinner-3.jpg", label: "Founder dinner" },
  { src: "/programming/build-sprint-6.jpg", label: "Build sprint" },
];

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[9px] md:text-[10px] tracking-[3px] uppercase text-white/40 font-mono">
    {children}
  </p>
);

// Auto-advancing photo carousel for house programming. It scrolls one card
// every few seconds, pauses while the pointer is over it, and exposes prev/
// next arrows for manual control. Reaching either end loops back around.
const ProgrammingGallery: React.FC = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    const atStart = el.scrollLeft <= 8;
    if (dir === 1 && atEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else if (dir === -1 && atStart) {
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    } else {
      el.scrollBy({ left: dir * step, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) scrollByCard(1);
    }, 3500);
    return () => clearInterval(id);
  }, [scrollByCard]);

  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 z-10 grid place-items-center w-9 h-9 rounded-full bg-black/70 border border-white/15 text-white/80 backdrop-blur-sm hover:bg-black hover:text-white hover:border-white/40 transition-colors";

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <button
        type="button"
        aria-label="Previous photos"
        onClick={() => scrollByCard(-1)}
        className={`${arrowClass} left-0 sm:-left-3`}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next photos"
        onClick={() => scrollByCard(1)}
        className={`${arrowClass} right-0 sm:-right-3`}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <div
        ref={scrollerRef}
        className="flex gap-3 md:gap-4 overflow-x-auto pb-3 px-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PROGRAMMING_PHOTOS.map((photo) => (
          <div
            key={photo.src}
            data-card
            className="group shrink-0 snap-start w-[230px] sm:w-[280px] md:w-[320px] p-2 bg-white/[0.03] border border-white/10"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={photo.src}
                alt={photo.label}
                fill
                sizes="320px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3">
                <p className="text-[9px] tracking-[2px] uppercase text-white/70 font-mono">
                  {photo.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AmenityCard: React.FC<{ amenity: Amenity }> = ({ amenity }) => {
  const [idx, setIdx] = useState(0);
  const multi = amenity.imgs.length > 1;

  useEffect(() => {
    if (!multi) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % amenity.imgs.length),
      4500
    );
    return () => clearInterval(t);
  }, [multi, amenity.imgs.length]);

  return (
    <li className="shrink-0 snap-start w-56 md:w-64 group/amen">
      <div className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black transition-colors group-hover/amen:border-[#c5a572]/40">
        {amenity.imgs.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={amenity.label}
            fill
            className={`object-cover transition-opacity duration-700 ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
            sizes="(max-width: 768px) 224px, 256px"
          />
        ))}
        {multi && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {amenity.imgs.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === idx ? "bg-white w-4" : "bg-white/30 w-1"
                }`}
              />
            ))}
          </div>
        )}
      </div>
      <p className="mt-2 text-[13px] md:text-sm tracking-wide text-white/90 font-medium leading-tight flex items-center gap-2">
        {amenity.label}
        {multi && (
          <span className="text-[9px] text-white/40 font-mono">
            {idx + 1}/{amenity.imgs.length}
          </span>
        )}
      </p>
    </li>
  );
};

const HouseCard: React.FC<{
  house: House;
  open: boolean;
  onToggle: () => void;
}> = ({ house, open, onToggle }) => (
  <article
    className={`house-card group relative overflow-hidden border bg-gradient-to-b from-neutral-950/40 to-black transition-all duration-500 ${
      open
        ? "border-[#c5a572]/40"
        : "border-white/10 hover:border-[#c5a572]/50 hover:-translate-y-0.5"
    }`}
  >
    {/* Ambient glow halo */}
    <div
      aria-hidden
      className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
        open ? "opacity-70" : "opacity-40 group-hover:opacity-90"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at 50% 35%, rgba(197,165,114,0.18) 0%, transparent 65%)",
      }}
    />

    {/* Clickable header: image + name */}
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={`house-panel-${house.code}`}
      className="relative block w-full text-left focus:outline-none cursor-pointer"
    >
      {/* House render */}
      <div className="relative aspect-[16/9] sm:aspect-[16/8] overflow-hidden">
        <Image
          src={house.render}
          alt={`${house.code} isometric render`}
          fill
          className={`object-contain p-3 md:p-4 transition-transform duration-700 ease-out ${
            open ? "scale-[1.02]" : "group-hover:scale-[1.04]"
          }`}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        {/* Sheen sweep (hidden until hover, paused while open) */}
        {!open && (
          <div
            aria-hidden
            className="house-sheen pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        )}
        {/* Area tag */}
        <span className="absolute top-2.5 left-2.5 inline-block bg-black/60 backdrop-blur-sm text-[9px] tracking-[2px] uppercase text-white/70 font-mono px-2 py-0.5 border border-white/10">
          {house.area}
        </span>
        {/* Open/close pill */}
        <span
          className={`absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 backdrop-blur-sm text-[9px] tracking-[2px] uppercase font-mono px-2.5 py-1 border transition-all ${
            open
              ? "bg-[#c5a572] text-black border-[#c5a572]"
              : "bg-black/60 text-[#c5a572] border-[#c5a572]/30 opacity-70 group-hover:opacity-100 group-hover:border-[#c5a572]"
          }`}
        >
          {open ? (
            <>
              Close <span aria-hidden>×</span>
            </>
          ) : (
            <>
              Tap to enter <span aria-hidden>→</span>
            </>
          )}
        </span>
      </div>

      {/* Name + headline */}
      <div className="relative px-5 md:px-6 py-4 md:py-5 flex items-end justify-between gap-3 border-t border-white/5">
        <div>
          <h3 className="font-[family-name:var(--font-headline)] italic text-3xl md:text-4xl shiny-gold leading-none">
            {house.code}
          </h3>
          <p className="mt-2 text-[10px] tracking-[2px] uppercase text-white/40 font-mono">
            From <span className="text-[#c5a572] font-medium">{house.dorm}</span> / night
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-base md:text-lg font-medium text-white leading-none">
            {house.residents}
            <span className="text-[11px] text-neutral-500 ml-0.5">+ {house.eir}</span>
          </p>
          <p className="text-[8px] tracking-[2px] uppercase text-white/40 mt-1 font-mono">
            Residents · EIR
          </p>
        </div>
      </div>
    </button>

    {/* Expandable body */}
    <div
      id={`house-panel-${house.code}`}
      className={`grid transition-[grid-template-rows] duration-500 ease-out ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">
        <div className="px-5 md:px-6 pb-6 md:pb-8 pt-2 space-y-6 border-t border-white/5">
          {/* Pricing */}
          <div className="grid grid-cols-2 border border-white/10">
            <div className="p-4 border-r border-white/10">
              <p className="text-[9px] tracking-[2px] uppercase text-white/40 font-mono">Dorm</p>
              <p className="mt-1.5 text-2xl md:text-3xl font-medium shiny-gold leading-none">
                {house.dorm}
              </p>
              <p className="mt-1 text-[10px] text-neutral-500">per night</p>
            </div>
            <div className="p-4 bg-white/[0.015]">
              <p className="text-[9px] tracking-[2px] uppercase text-white/40 font-mono">Private</p>
              <p className="mt-1.5 text-2xl md:text-3xl font-medium shiny-gold leading-none">
                {house.private}
              </p>
              <p className="mt-1 text-[10px] text-neutral-500">per night</p>
            </div>
          </div>

          {/* Amenity carousel (auto-scrolling marquee) */}
          <div>
            <p className="text-[9px] tracking-[2px] uppercase text-white/40 font-mono mb-3">
              What's inside · {house.amenities.length} spaces
            </p>
            <div className="amen-marquee-wrap -mx-5 md:-mx-6 overflow-hidden">
              <ul className="amen-marquee-track flex gap-3 pl-5 md:pl-6 w-max">
                {[...house.amenities, ...house.amenities].map((a, i) => (
                  <AmenityCard key={`${a.label}-${i}`} amenity={a} />
                ))}
              </ul>
            </div>
          </div>

          {/* Apply CTA */}
          <Link
            href="/?apply=1"
            className="block text-center bg-white text-black font-bold text-[11px] tracking-[3px] uppercase rounded-full px-6 py-3.5 hover:bg-[#c5a572] active:scale-95 transition-all duration-300"
          >
            Apply to {house.code}
          </Link>
        </div>
      </div>
    </div>
  </article>
);

const Live: React.FC = () => {
  const [openCode, setOpenCode] = useState<string | null>(null);

  return (
    <main
      className="bg-black min-h-screen text-white"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <MetaTags
        title="Live · Zo House"
        description="India's first permanent hacker house. The hub where founders live, cohorts run, and companies compound. BLRxZo and WTFxZo, two nodes in Bangalore."
      />

      <style jsx global>{`
        @keyframes house-sheen-anim {
          0% { transform: translateX(-150%) skewX(-12deg); opacity: 0; }
          20% { opacity: 0.45; }
          60% { opacity: 0.25; }
          100% { transform: translateX(350%) skewX(-12deg); opacity: 0; }
        }
        .house-card .house-sheen {
          background: linear-gradient(
            100deg,
            transparent 0%,
            transparent 35%,
            rgba(255, 255, 255, 0.12) 45%,
            rgba(197, 165, 114, 0.35) 50%,
            rgba(255, 255, 255, 0.12) 55%,
            transparent 65%,
            transparent 100%
          );
          mix-blend-mode: screen;
        }
        .house-card:hover .house-sheen {
          animation: house-sheen-anim 2s ease-in-out infinite;
        }

        @keyframes amen-marquee-anim {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .amen-marquee-track {
          animation: amen-marquee-anim 60s linear infinite;
        }
        .amen-marquee-wrap:hover .amen-marquee-track {
          animation-play-state: paused;
        }
        .amen-marquee-wrap {
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0,
            black 24px,
            black calc(100% - 24px),
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0,
            black 24px,
            black calc(100% - 24px),
            transparent 100%
          );
        }
      `}</style>

      <header className="fixed top-0 left-0 w-full z-50 px-5 md:px-10 lg:px-20 py-4 bg-black/50 backdrop-blur-md flex justify-between items-center">
        <Link
          href="/"
          className="text-base md:text-lg font-black tracking-tighter font-[family-name:var(--font-headline)] italic shiny-gold"
        >
          Zo House
        </Link>
        <Link
          href="/"
          className="text-[10px] tracking-[3px] uppercase text-white/50 hover:text-white transition-colors"
        >
          ← Back
        </Link>
      </header>

      {/* Hero */}
      <section className="relative pt-20 md:pt-28 pb-10 md:pb-14 px-5 md:px-10 lg:px-20 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(197,165,114,0.12) 0%, transparent 55%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <BlurFade inView delay={0.1} direction="up">
            <SectionLabel>The civilisation · Two compounds · Bangalore</SectionLabel>
            <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1]">
              Inside the{" "}
              <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
                compound.
              </span>
            </h1>
            <p className="mt-5 text-sm md:text-base text-neutral-300 font-light leading-relaxed max-w-xl mx-auto">
              Founders move in. Partners set up shop. Cohorts run their programs. Companies get built. Two compounds in Bangalore, permanent, compounding.
            </p>
          </BlurFade>

          <BlurFade inView delay={0.25} direction="up">
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              <Link
                href="/?apply=1"
                className="inline-flex items-center justify-center bg-white text-black font-bold text-[10px] tracking-[3px] uppercase rounded-full px-5 py-2.5 hover:bg-[#c5a572] hover:scale-[1.02] active:scale-95 transition-all duration-300"
              >
                Apply to stay
              </Link>
              <a
                href="#partners"
                className="inline-flex items-center justify-center border border-white/20 text-white/80 font-bold text-[10px] tracking-[3px] uppercase rounded-full px-5 py-2.5 hover:border-white hover:text-white transition-all duration-300"
              >
                Host your team
              </a>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* House cards (expandable in place) */}
      <section className="px-5 md:px-10 lg:px-20 pb-14 md:pb-20">
        <div className="max-w-6xl mx-auto">
          <BlurFade inView delay={0.05} direction="up">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-7 md:mb-9">
              <div>
                <SectionLabel>The nodes</SectionLabel>
                <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-medium tracking-tight leading-[1.1]">
                  Pick your{" "}
                  <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
                    house
                  </span>
                </h2>
              </div>
              <p className="text-[11px] md:text-xs text-neutral-400 font-light max-w-md md:text-right">
                Tap a house to expand it. Spaces, pricing, and how to move in.
              </p>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-start">
            {HOUSES.map((house) => (
              <BlurFade key={house.code} inView delay={0.15} direction="up">
                <HouseCard
                  house={house}
                  open={openCode === house.code}
                  onToggle={() =>
                    setOpenCode(openCode === house.code ? null : house.code)
                  }
                />
              </BlurFade>
            ))}
          </div>

          <p className="mt-6 md:mt-8 text-center text-[10px] text-neutral-500 max-w-xl mx-auto">
            Includes Wi-Fi, coworking, housekeeping. Food at Cafe Zomad billed separately.
          </p>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="relative px-5 md:px-10 lg:px-20 pb-14 md:pb-20 scroll-mt-20">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
        <div className="max-w-6xl mx-auto pt-12 md:pt-16">
          <BlurFade inView delay={0.05} direction="up">
            <div className="text-center max-w-2xl mx-auto mb-7 md:mb-10">
              <SectionLabel>Partners in residence</SectionLabel>
              <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-medium tracking-tight leading-[1.1]">
                Set up in the{" "}
                <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
                  compound
                </span>
              </h2>
              <p className="mt-3 text-[11px] md:text-xs text-neutral-400 font-light leading-relaxed">
                Companies build from inside. Cohorts move in for a season. Founders take a corner and stay. Same walls, same kitchen, different missions.
              </p>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {PARTNERS.map(({ name, blurb, house, slots, href }) => {
              const Inner = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-[family-name:var(--font-headline)] italic text-xl md:text-2xl shiny-gold leading-none">
                      {name}
                    </h3>
                    <span className="font-mono text-[8px] md:text-[9px] tracking-[2px] uppercase text-white/40 whitespace-nowrap text-right shrink-0 pt-1">
                      {slots ? (
                        <>
                          <span className="text-[#c5a572]">{slots} slots</span>
                          <br />
                          {house}
                        </>
                      ) : (
                        house
                      )}
                    </span>
                  </div>
                  <p className="mt-3 text-[12px] md:text-[13px] text-neutral-400 font-light leading-relaxed">
                    {blurb}
                  </p>
                  {href && (
                    <p className="mt-4 text-[9px] tracking-[3px] uppercase text-white/40 font-mono group-hover:text-[#c5a572] transition-colors">
                      Visit →
                    </p>
                  )}
                </>
              );
              return (
                <BlurFade key={name} inView delay={0.15} direction="up">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block h-full border border-white/10 bg-gradient-to-b from-neutral-950/30 to-black p-4 md:p-5 transition-all duration-500 hover:border-[#c5a572]/40 hover:-translate-y-0.5"
                    >
                      {Inner}
                    </a>
                  ) : (
                    <div className="block h-full border border-white/10 bg-gradient-to-b from-neutral-950/30 to-black p-4 md:p-5">
                      {Inner}
                    </div>
                  )}
                </BlurFade>
              );
            })}

            <BlurFade inView delay={0.25} direction="up">
              <a
                href="mailto:blrxzo@zo.xyz?subject=Your%20project%20at%20Zo%20House"
                className="group block h-full border border-dashed border-white/15 hover:border-[#c5a572]/40 bg-gradient-to-b from-neutral-950/10 to-transparent p-4 md:p-5 transition-all duration-500 hover:-translate-y-0.5"
              >
                <h3 className="font-[family-name:var(--font-headline)] italic text-xl md:text-2xl text-white/50 group-hover:text-[#c5a572] leading-none transition-colors">
                  Your project
                </h3>
                <p className="mt-3 text-[12px] md:text-[13px] text-neutral-400 font-light leading-relaxed">
                  Running a cohort, accelerator, residency, studio, or experiment? Take a corner of the compound.
                </p>
                <p className="mt-4 text-[9px] tracking-[3px] uppercase text-white/40 font-mono group-hover:text-[#c5a572] transition-colors">
                  Talk to us →
                </p>
              </a>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* Shared programming */}
      <section className="relative px-5 md:px-10 lg:px-20 pb-14 md:pb-20">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
        <div className="max-w-6xl mx-auto pt-12 md:pt-16">
          <BlurFade inView delay={0.05} direction="up">
            <div className="text-center max-w-2xl mx-auto mb-7 md:mb-10">
              <SectionLabel>House programming</SectionLabel>
              <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-medium tracking-tight leading-[1.1]">
                What you{" "}
                <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
                  walk into
                </span>
              </h2>
              <p className="mt-3 text-[11px] md:text-xs text-neutral-400 font-light leading-relaxed">
                House-level rituals both nodes run. On top of whatever cohort you join.
              </p>
            </div>
          </BlurFade>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {SHARED.map(({ title, body }) => (
              <BlurFade key={title} inView delay={0.12} direction="up">
                <div className="group h-full border border-white/10 bg-gradient-to-b from-neutral-950/30 to-black p-4 md:p-5 transition-all duration-500 hover:border-[#c5a572]/30">
                  <p className="font-[family-name:var(--font-headline)] italic text-base md:text-lg shiny-gold leading-tight">
                    {title}
                  </p>
                  <p className="mt-2 text-[11px] md:text-xs text-neutral-400 font-light leading-relaxed">
                    {body}
                  </p>
                </div>
              </BlurFade>
            ))}
          </div>

          {/* Programming gallery: auto-advancing photo carousel with arrows */}
          <BlurFade inView delay={0.18} direction="up">
            <div className="mt-9 md:mt-12">
              <p className="text-center text-[9px] tracking-[3px] uppercase text-white/30 mb-4">
                In the house
              </p>
              <ProgrammingGallery />
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-5 md:px-10 lg:px-20 pb-14 md:pb-20">
        <div className="max-w-3xl mx-auto">
          <BlurFade inView delay={0.05} direction="up">
            <div className="relative border border-white/10 bg-gradient-to-br from-neutral-950 via-black to-neutral-950 p-6 md:p-10 text-center overflow-hidden">
              <div
                aria-hidden
                className="absolute inset-0 opacity-50 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(197,165,114,0.1) 0%, transparent 60%)",
                }}
              />
              <div className="relative">
                <SectionLabel>Ready to compound?</SectionLabel>
                <h2 className="mt-3 text-xl sm:text-2xl md:text-3xl font-medium tracking-tight leading-[1.1]">
                  Take a corner of the{" "}
                  <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
                    civilisation
                  </span>
                </h2>
                <Link
                  href="/?apply=1"
                  className="mt-6 inline-flex items-center justify-center bg-white text-black font-bold text-[10px] tracking-[3px] uppercase rounded-full px-6 py-2.5 hover:bg-[#c5a572] hover:scale-[1.02] active:scale-95 transition-all duration-300"
                >
                  Apply now
                </Link>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      <footer className="px-5 md:px-10 lg:px-20 py-5 pb-20 md:pb-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/5 pt-5">
          <div className="text-center md:text-left">
            <span className="text-sm md:text-base font-black text-white font-[family-name:var(--font-headline)] italic shiny-gold">
              Zo House
            </span>
            <p className="text-[9px] font-bold tracking-widest uppercase text-neutral-500 mt-1">
              &copy; 2026 Zo House. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-5 md:gap-8">
            <Link
              href="/build"
              className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase hover:text-white transition-colors"
            >
              Build
            </Link>
            <Link
              href="/network"
              className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase hover:text-white transition-colors"
            >
              Network
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Live;
