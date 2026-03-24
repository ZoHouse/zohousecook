import { cn } from "@zo/utils/font";
import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName, syneClassName } from "../../utils/font";

interface PropertyCardProps {
  name: string;
  location: string;
  description: string;
  beds: string;
  highlights: string[];
  videoSrc: string;
  tracks?: string[];
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  name,
  location,
  description,
  beds,
  highlights,
  videoSrc,
  tracks,
}) => {
  return (
    <div className="w-full rounded-2xl overflow-hidden inner-border shiny-card relative group">
      {/* Video background */}
      <div className="h-[280px] md:h-[360px] overflow-hidden relative">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          src={videoSrc}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zui-dark via-zui-dark/40 to-transparent" />

        {/* Beds badge */}
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-zui-dark/80 backdrop-blur-sm inner-border">
          <span className={cn("text-sm text-zui-yellow font-semibold", rubikClassName)}>
            {beds}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 bg-zui-dark">
        <h3 className={cn("text-2xl md:text-3xl font-bold", syneClassName)}>
          {name}
        </h3>
        <p className={cn("text-sm text-zui-white/50 mt-1", rubikClassName)}>
          {location}
        </p>
        <p
          className={cn(
            "text-base text-zui-white/70 mt-4 leading-relaxed",
            rubikClassName
          )}
        >
          {description}
        </p>

        {/* Tracks */}
        {tracks && tracks.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tracks.map((track) => (
              <span
                key={track}
                className={cn(
                  "px-3 py-1 text-xs rounded-full bg-zui-white/5 text-zui-white/60 inner-border",
                  rubikClassName
                )}
              >
                {track}
              </span>
            ))}
          </div>
        )}

        {/* Highlights */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6">
          {highlights.map((h) => (
            <span
              key={h}
              className={cn(
                "text-sm text-zui-white/50 flex items-center gap-2",
                rubikClassName
              )}
            >
              <span className="w-1 h-1 rounded-full bg-zui-yellow" />
              {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const Properties: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section ref={sectionRef} id="houses" className="mt-10">
      <h2
        className={cn(
          "sub-heading-2 font-bold text-center mb-10 md:mb-16",
          syneClassName
        )}
      >
        Two Houses. <span className="text-zui-yellow">One Network.</span>
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <PropertyCard
          name="BLRxZo"
          location="Koramangala, Bangalore"
          description="13th-floor penthouse in the heart of Bangalore's most vibrant neighbourhood. City views. Best demo day venue in the city. Intimate 14-bed setup for a general all-tech founder cohort."
          beds="14 Beds"
          highlights={[
            "Penthouse",
            "City Views",
            "Podcast Studio",
            "Degen Lounge",
            "Schelling Point",
          ]}
          tracks={["All-Tech Founders"]}
          videoSrc={`${process.env.MEDIA_BASE_URL}/gallery/media/videos/09030328-7d89-49ad-9429-5954fddec56b_20240903101754.mp4`}
        />
        <PropertyCard
          name="WTFxZo"
          location="Whitefield, Bangalore"
          description="Independent 3-storey villa in Whitefield's tech corridor. Pool, pickleball court, outdoor stage, podcast studio, coworking. 20 beds across two specialized tracks."
          beds="20 Beds"
          highlights={[
            "Villa + Pool",
            "Pickleball Court",
            "Flo Zone Coworking",
            "Studio",
            "Schelling Point",
          ]}
          tracks={["CC0 — Crypto Track", "duh.zo — AI/Hardware"]}
          videoSrc={`${process.env.MEDIA_BASE_URL}/gallery/media/videos/0c2806c0-e132-481c-8581-db3473df54ac_20240903100339.mp4`}
        />
      </div>
    </section>
  );
};

export default Properties;
