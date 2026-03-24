import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { cn, rubikClassName, syneClassName } from "../../utils";
interface VibeNetworkProps {}

const VibeNetwork: React.FC<VibeNetworkProps> = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section
      className="w-full md:h-[90vh] flex flex-col md:flex-row items-center justify-center snap-center md:gap-4"
      ref={sectionRef}
    >
      <video
        className="w-full mx-auto md:max-w-[60%]"
        autoPlay
        loop
        playsInline
        controls={false}
        controlsList="nodownload"
        muted
        src={`${process.env.MEDIA_BASE_URL}/gallery/media/videos/36d8c488-738b-42db-91cb-d72c8fd66f94_20241206054520.mp4`}
      ></video>

      <div className="text-center md:text-left">
        <h2
          className={cn(
            "text-5xl leading-10 font-extrabold -tracking-[3%]",
            syneClassName
          )}
        >
          Vibe <br /> Network
        </h2>

        <p
          className={cn(
            "md:text-2xl md:leading-8 text-white mt-10 tracking-[1%]",
            rubikClassName
          )}
        >
          It’s all about curating vibrations. <br />
          <br />
          When curated people of high calibre and authenticity meet in places of
          culture, great vibes happens. <br />
          <br /> Zo World is a network of such people & spaces and founder
          members are the building blocks.
        </p>
      </div>
    </section>
  );
};

export default VibeNetwork;
