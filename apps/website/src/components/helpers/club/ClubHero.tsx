import React from "react";
import { useQueryApi } from "@zo/auth";
import { cn } from "@zo/utils/font";
import { rubikClassName, syneClassName } from "../../utils/font";

const ClubHero: React.FC = () => {
  const { data: founderStats } = useQueryApi<{ total_supply?: number }>(
    "CAS_FOUNDER_TOKENS_STATS",
    {
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    }
  );

  const founderCount = founderStats?.total_supply || 500;

  return (
    <section className="min-h-screen flex flex-col items-center justify-center snap-center relative overflow-hidden">
      {/* Background video — Zo flag */}
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

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <p
          className={cn(
            "text-sm font-medium text-white/40 uppercase tracking-[4px] mb-8",
            rubikClassName
          )}
        >
          Zo World
        </p>

        <h1
          className={cn(
            "text-[80px] md:text-[160px] leading-[0.85] font-extrabold uppercase -tracking-[3%]",
            syneClassName
          )}
        >
          Vibe
          <br />
          <span className="text-zui-yellow">Network</span>
        </h1>

        <p
          className={cn(
            "mt-10 text-base md:text-lg text-white/40 font-medium max-w-[500px] mx-auto leading-7",
            rubikClassName
          )}
        >
          It's all about curating vibrations. When curated people of high
          calibre and authenticity meet in places of culture, great vibes
          happens. Zo World is a network of such people & spaces and founder
          members are the building blocks.
        </p>

        {/* Stats */}
        <div className="flex gap-12 md:gap-16 justify-center mt-16">
          <div className="text-center">
            <h3
              className={cn(
                "text-4xl md:text-[56px] font-medium text-zui-yellow",
                rubikClassName
              )}
            >
              {founderCount}
            </h3>
            <span
              className={cn(
                "text-xs text-white/40 uppercase tracking-[2px]",
                rubikClassName
              )}
            >
              Founders
            </span>
          </div>
          <div className="text-center">
            <h3
              className={cn(
                "text-4xl md:text-[56px] font-medium text-zui-yellow",
                rubikClassName
              )}
            >
              331
            </h3>
            <span
              className={cn(
                "text-xs text-white/40 uppercase tracking-[2px]",
                rubikClassName
              )}
            >
              Events
            </span>
          </div>
          <div className="text-center">
            <h3
              className={cn(
                "text-4xl md:text-[56px] font-medium text-zui-yellow",
                rubikClassName
              )}
            >
              2
            </h3>
            <span
              className={cn(
                "text-xs text-white/40 uppercase tracking-[2px]",
                rubikClassName
              )}
            >
              Houses
            </span>
          </div>
        </div>
      </div>

      {/* Scroll pill */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-6 h-10 border-2 border-white/15 rounded-xl z-10">
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-2 bg-zui-yellow rounded-full animate-bounce" />
      </div>
    </section>
  );
};

export default ClubHero;
