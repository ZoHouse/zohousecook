import React from "react";
import Link from "next/link";
import { cn } from "../../../lib/cn";
import alumniPageData from "../../../config/alumni";
import { useFadeInOnScroll } from "../../../hooks/useFadeInOnScroll";
import { rubikClassName, syneClassName } from "../../../lib/font";

const NetworkCTA: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();
  const { cta } = alumniPageData;

  return (
    <section
      ref={sectionRef}
      className="min-h-[80vh] flex flex-col items-center justify-center snap-center text-center px-6 relative overflow-hidden"
    >
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,214,0,0.06)_0%,transparent_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <p className={cn("text-xs text-zui-yellow uppercase tracking-[4px] mb-8 relative", rubikClassName)}>
        The Network Is Live
      </p>

      <h2 className={cn("text-[40px] md:text-[80px] leading-[1.05] font-extrabold uppercase relative", syneClassName)}>
        Join the
        <br />
        <span className="text-zui-yellow">Movement</span>
      </h2>

      <p className={cn("mt-6 text-base md:text-lg text-white/50 max-w-[520px] leading-7 relative", rubikClassName)}>
        {cta.subtitle}
      </p>

      <div className="mt-10 flex gap-4 flex-wrap justify-center relative">
        <Link
          href={cta.primaryCta.href}
          className={cn(
            "px-9 py-4 bg-zui-yellow text-black font-bold rounded-lg hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,214,0,0.15)] transition-all",
            syneClassName
          )}
        >
          {cta.primaryCta.label}
        </Link>
        <Link
          href={cta.secondaryCta.href}
          className={cn(
            "px-9 py-4 bg-white/5 text-white font-semibold rounded-lg border border-white/10 hover:bg-white/10 hover:border-white/25 transition-all",
            syneClassName
          )}
        >
          {cta.secondaryCta.label}
        </Link>
      </div>

      <div className={cn("mt-12 flex gap-8 md:gap-12 justify-center relative", rubikClassName)}>
        <div className="text-center">
          <div className={cn("text-xl font-bold", syneClassName)}>2</div>
          <div className="text-[10px] text-white/30 uppercase tracking-[1.5px] mt-1">Houses</div>
        </div>
        <div className="text-center">
          <div className={cn("text-xl font-bold", syneClassName)}>Koramangala</div>
          <div className="text-[10px] text-white/30 uppercase tracking-[1.5px] mt-1">BLRxZo</div>
        </div>
        <div className="text-center">
          <div className={cn("text-xl font-bold", syneClassName)}>Whitefield</div>
          <div className="text-[10px] text-white/30 uppercase tracking-[1.5px] mt-1">WTFxZo</div>
        </div>
      </div>
    </section>
  );
};

export default NetworkCTA;
