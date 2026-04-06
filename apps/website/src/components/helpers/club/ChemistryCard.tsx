import React from "react";
import { cn } from "@zo/utils/font";
import Link from "next/link";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName, syneClassName } from "../../utils/font";

const ChemistryCard: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section
      ref={sectionRef}
      className="py-16 px-6 snap-center"
    >
      <div className="max-w-[1100px] mx-auto">
        <Link href="/club/chemistry" className="block group">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8 md:p-10 hover:border-zui-yellow/30 transition-all duration-500">
            {/* Background glow */}
            <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(255,214,0,0.08)_0%,transparent_70%)] pointer-events-none group-hover:scale-150 transition-transform duration-700" />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left */}
              <div className="flex items-center gap-5">
                {/* Visual — two circles with bolt */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-zui-yellow/20 to-zui-yellow/5 border border-zui-yellow/20 flex items-center justify-center">
                    <span className={cn("text-sm font-bold text-zui-yellow", syneClassName)}>A</span>
                  </div>
                  <span className="text-zui-yellow text-lg">⚡</span>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                    <span className={cn("text-sm font-bold text-white/50", syneClassName)}>B</span>
                  </div>
                </div>

                {/* Text */}
                <div>
                  <h3 className={cn("text-[22px] md:text-[28px] font-extrabold leading-tight", syneClassName)}>
                    Founder <span className="text-zui-yellow">Chemistry</span>
                  </h3>
                  <p className={cn("mt-1 text-sm text-white/35", rubikClassName)}>
                    Every builder vibrates different. Simulate how synergies compound.
                  </p>
                </div>
              </div>

              {/* Right — CTA */}
              <div className={cn("inline-flex items-center gap-2 text-zui-yellow text-sm font-semibold group-hover:gap-3 transition-all shrink-0", rubikClassName)}>
                Try it
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform">
                  <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default ChemistryCard;
