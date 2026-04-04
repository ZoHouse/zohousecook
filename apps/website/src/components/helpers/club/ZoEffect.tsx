import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@zo/utils/font";
import alumniPageData from "../../../config/alumni";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName, syneClassName } from "../../utils/font";

const AVATAR_CDN = "https://proxy.cdn.zo.xyz/avatars";

const ZoEffect: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();
  const featured = useMemo(
    () => alumniPageData.curated.filter((m) => m.featured),
    []
  );
  const companies = useMemo(
    () =>
      alumniPageData.curated
        .filter((m) => m.featured || m.fundingAmount)
        .slice(0, 6),
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-10 rounded-2xl bg-[rgba(255,214,0,0.02)] border border-[rgba(255,214,0,0.1)] mb-10">
          <div className="flex flex-col justify-center">
            {spotlight.featuredQuote && (
              <p className={cn("text-white/70 text-lg italic leading-relaxed border-l-2 border-zui-yellow pl-5 mb-6", rubikClassName)}>
                "{spotlight.featuredQuote}"
              </p>
            )}
            <h3 className={cn("text-2xl font-bold", syneClassName)}>{spotlight.name}</h3>
            <p className="text-zui-yellow text-sm mt-1">{spotlight.company} — {spotlight.description}</p>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { label: "Sector", value: spotlight.sector },
              { label: "Backed by", value: spotlight.backedBy || "—" },
              { label: "Zo House proof", value: spotlight.featuredProof || "—" },
              { label: "Story type", value: spotlight.storyType || "—" },
            ].map((s) => (
              <div key={s.label} className="flex justify-between py-3 border-b border-white/5 last:border-0">
                <span className={cn("text-white/40 text-sm", rubikClassName)}>{s.label}</span>
                <span className={cn("text-white font-semibold text-sm", syneClassName)}>
                  {s.value}
                </span>
              </div>
            ))}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
        {companies.map((member) => (
          <div
            key={member.nickname}
            className="bg-[rgba(255,255,255,0.03)] p-6 hover:bg-[rgba(255,214,0,0.03)] transition-colors"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img
                  src={`${AVATAR_CDN}/${member.nickname}.png?w=96`}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.parentElement!.innerHTML = `<span class="${syneClassName} text-zui-yellow font-bold text-sm">${member.name.split(" ").map((n) => n[0]).join("")}</span>`;
                  }}
                />
              </div>
              <div>
                <h4 className={cn("font-semibold text-sm", syneClassName)}>{member.name}</h4>
                <span className="text-zui-yellow text-xs">{member.company}</span>
              </div>
            </div>
            <p className={cn("text-white/50 text-sm leading-relaxed mb-4", rubikClassName)}>
              {member.description}
            </p>
            <div className="flex gap-2 flex-wrap">
              {member.fundingAmount && (
                <span className="text-[10px] uppercase tracking-[0.5px] px-3 py-1 rounded-full border border-[rgba(255,214,0,0.3)] text-zui-yellow">
                  {member.fundingAmount}
                </span>
              )}
              <span className="text-[10px] uppercase tracking-[0.5px] px-3 py-1 rounded-full border border-white/10 text-white/50">
                {member.sector}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ZoEffect;
