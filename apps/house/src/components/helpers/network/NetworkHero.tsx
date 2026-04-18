import React from "react";
import { cn } from "../../../lib/cn";
import { rubikClassName, syneClassName } from "../../../lib/font";
import alumniPageData from "../../../config/alumni";
import { useFounderStats } from "../../../lib/alumni-founders";

const NetworkHero: React.FC = () => {
  const founderStats = useFounderStats();

  const memberCount = founderStats?.total_supply || 500;
  const { raised, eventsHosted, buildersHosted } = alumniPageData.stats;

  const stats = [
    { value: `${memberCount}+`, label: "Members" },
    { value: raised, label: "Raised" },
    { value: eventsHosted, label: "Events Hosted" },
    { value: buildersHosted, label: "Builders Hosted" },
  ];

  return (
    <section className="min-h-screen flex flex-col items-center justify-center snap-center relative overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        autoPlay
        loop
        playsInline
        controls={false}
        controlsList="nodownload"
        muted
        src={`${process.env.MEDIA_BASE_URL}/gallery/media/videos/36d8c488-738b-42db-91cb-d72c8fd66f94_20241206054520.mp4`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />

      <div className="relative z-10 text-center px-6">
        <p className={cn("text-sm font-medium text-white/40 uppercase tracking-[4px] mb-8", rubikClassName)}>
          Zo World
        </p>
        <h1 className={cn("text-[40px] sm:text-[60px] md:text-[120px] leading-[0.9] font-extrabold uppercase -tracking-[3%]", syneClassName)}>
          The
          <br />
          <span className="text-zui-yellow">Network</span>
        </h1>
        <p className={cn("mt-8 text-base md:text-lg text-white/40 font-medium max-w-[520px] mx-auto leading-7", rubikClassName)}>
          Builders, founders, and operators who lived and built at India's permanent startup house.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 justify-center mt-12 max-w-[800px] mx-auto pt-8 border-t border-white/10">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <h3 className={cn("text-2xl sm:text-3xl md:text-5xl font-bold text-white", syneClassName)}>
                {stat.value}
              </h3>
              <span className={cn("text-[10px] md:text-xs text-white/40 uppercase tracking-[2px] mt-2 block", rubikClassName)}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-6 h-10 border-2 border-white/15 rounded-xl z-10">
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-2 bg-zui-yellow rounded-full animate-bounce" />
      </div>
    </section>
  );
};

export default NetworkHero;
