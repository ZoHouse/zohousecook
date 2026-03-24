import { cn } from "@zo/utils/font";
import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName, syneClassName } from "../../utils/font";

interface CulturalProtocolProps {}

const CulturalProtocol: React.FC<CulturalProtocolProps> = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();
  return (
    <section className="py-10 md:py-20" ref={sectionRef}>
      <h2
        className={cn(
          "text-[40px] md:text-[80px] leading-[48px] md:leading-[80px] font-extrabold uppercase whitespace-nowrap text-center",
          syneClassName
        )}
      >
        $Zo
      </h2>

      <h4
        className={cn(
          "mt-4 text-[24px] md:text-[40px] leading-8 md:leading-[48px] -tracking-[3%] font-bold text-center uppercase ",
          rubikClassName
        )}
      >
        Cultural Protocol
      </h4>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-6 md:py-10">
        <video
          src={`${process.env.MEDIA_BASE_URL}/gallery/media/videos/e43298e8-bc4e-4a73-a616-a10068da0284_20241204120335.mp4`}
          className="w-full h-[328px] md:w-[600px] md:h-[384px] aspect-square md:aspect-auto"
          autoPlay
          loop
          playsInline
          controls={false}
          controlsList="nodownload"
          muted
        ></video>

        <div>
          <p
            className={cn(
              "md:text-2xl leading-6 md:leading-8 font-medium text-white/40 md:text-white",
              rubikClassName
            )}
          >
            Zo World is a reality where cultures lead humanity to follow their
            heart. $Zo is accelerating towards such a future. $Zo powers Zo
            world and incentivises cultural events and participation.
            <br />
            <br />
            $Zo unlocks fully in 10years, fairly distributed over time with
            quarterly emissions & ability to mine at Zo Nodes.
            <br />
            <br />
            Zo World Founders are the building blocks of this world and get the
            first chance to run Zo Nodes and $Zo by building the Zo World
            together.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CulturalProtocol;
