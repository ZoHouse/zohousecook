import React from "react";
import { cn } from "@zo/utils/font";
import alumniPageData from "../../../config/alumni";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName, syneClassName } from "../../utils/font";

const ProgrammingProof: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();
  const { events, partners } = alumniPageData;

  return (
    <section ref={sectionRef} className="snap-center py-24 px-6 max-w-[1100px] mx-auto">
      <p className={cn("text-xs text-zui-yellow uppercase tracking-[3px] mb-3", rubikClassName)}>
        What Happens Here
      </p>
      <h2 className={cn("text-[32px] md:text-[56px] font-extrabold leading-tight", syneClassName)}>
        450+ Events. Year-round.
      </h2>
      <p className={cn("text-white/40 text-base max-w-[500px] mt-2 mb-10", rubikClassName)}>
        Recurring formats that turn density into output. Not one-offs.
      </p>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {events.map((event) => (
          <div
            key={event.name}
            className="flex-shrink-0 w-[280px] rounded-xl border border-white/[0.08] overflow-hidden hover:border-[rgba(255,214,0,0.2)] transition-colors"
          >
            <div className="h-40 bg-neutral-900 overflow-hidden">
              <video
                className="w-full h-full object-cover"
                autoPlay
                loop
                playsInline
                muted
                src={event.media}
              />
            </div>
            <div className="p-5">
              <h3 className={cn("font-bold text-base", syneClassName)}>{event.name}</h3>
              <p className="text-zui-yellow text-xs mt-1">{event.frequency}</p>
              <p className={cn("text-white/40 text-sm mt-2 leading-relaxed", rubikClassName)}>
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-white/[0.06]">
        <p className={cn("text-[10px] uppercase tracking-[2px] text-white/30 mb-4", rubikClassName)}>
          Program Partners
        </p>
        <div className="flex gap-4 flex-wrap">
          {partners.map((p) => (
            <span
              key={p.name}
              className={cn(
                "px-4 py-2 text-sm text-white/40 border border-white/[0.08] rounded-lg font-semibold",
                syneClassName
              )}
            >
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgrammingProof;
