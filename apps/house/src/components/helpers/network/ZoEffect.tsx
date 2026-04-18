import React, { useEffect, useMemo, useState } from "react";
import { cn } from "../../../lib/cn";
import alumniPageData from "../../../config/alumni";
import { useFadeInOnScroll } from "../../../hooks/useFadeInOnScroll";
import { rubikClassName, syneClassName } from "../../../lib/font";
import { fixAvatarUrl } from "./utils";

const ZoEffect: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  const featured = useMemo(
    () => alumniPageData.curated.filter((m) => m.featured),
    []
  );
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % featured.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featured.length]);

  const spotlight = featured[spotlightIndex];

  return (
    <section ref={sectionRef} className="snap-center py-24 px-6 max-w-[1100px] mx-auto">
      <p className={cn("text-xs text-zui-yellow uppercase tracking-[3px] mb-3", rubikClassName)}>
        Alumni
      </p>
      <h2 className={cn("text-[32px] md:text-[56px] font-extrabold leading-tight", syneClassName)}>
        The Zo Effect
      </h2>
      <p className={cn("text-white/40 text-base max-w-[550px] mt-2 mb-10", rubikClassName)}>
        Companies founded, funded, and scaled from inside the Zo House network.
      </p>

      {spotlight && (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-0 rounded-2xl bg-[rgba(255,214,0,0.02)] border border-[rgba(255,214,0,0.1)] mb-10 overflow-hidden">
          <div className="relative h-[280px] md:h-auto bg-gradient-to-br from-neutral-900 to-neutral-800">
            {spotlight.photo ? (
              <img
                src={spotlight.photo}
                alt={spotlight.name}
                className="w-full h-full object-cover"
              />
            ) : fixAvatarUrl(spotlight.pfp) ? (
              <div className="w-full h-full flex items-center justify-center p-8">
                <img
                  src={fixAvatarUrl(spotlight.pfp)!}
                  alt={spotlight.name}
                  referrerPolicy="no-referrer"
                  className="w-40 h-40 object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className={`${syneClassName} text-zui-yellow font-bold text-4xl`}>{spotlight.name.split(" ").map((n) => n[0]).join("")}</span>
              </div>
            )}
            {fixAvatarUrl(spotlight.pfp) && spotlight.photo && (
              <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full overflow-hidden border-2 border-black/50 bg-neutral-900 shadow-lg">
                <img
                  src={fixAvatarUrl(spotlight.pfp)!}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          <div className="p-6 md:p-10 flex flex-col justify-between">
            <div>
              {spotlight.featuredQuote && (
                <p className={cn("text-white/70 text-lg italic leading-relaxed border-l-2 border-zui-yellow pl-5 mb-6", rubikClassName)}>
                  &ldquo;{spotlight.featuredQuote}&rdquo;
                </p>
              )}
              <h3 className={cn("text-2xl font-bold", syneClassName)}>{spotlight.name}</h3>
              <p className="text-zui-yellow text-sm mt-1">{spotlight.company} · {spotlight.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {[
                { label: "Sector", value: spotlight.sector, accent: true },
                { label: "Story type", value: spotlight.storyType || "", accent: false },
                { label: "Backed by", value: spotlight.backedBy || "", accent: false },
                { label: "Zo House proof", value: spotlight.featuredProof || "", accent: false },
              ].filter((s) => s.value).map((s) => (
                <div key={s.label} className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                  <span className={cn("text-white/30 text-[10px] uppercase tracking-[2px]", rubikClassName)}>{s.label}</span>
                  <p className={cn("mt-1 text-sm font-semibold", syneClassName, s.accent ? "text-zui-yellow" : "text-white")}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {featured.length > 1 && (
        <div className="flex gap-2 justify-center mb-10">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setSpotlightIndex(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === spotlightIndex ? "bg-zui-yellow w-6" : "bg-white/20"
              )}
              aria-label={`View spotlight ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ZoEffect;
