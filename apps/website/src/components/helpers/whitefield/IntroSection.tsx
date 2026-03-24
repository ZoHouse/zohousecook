import { sendGTMEvent } from "@next/third-parties/google";
import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import React, { useEffect, useRef, useState } from "react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Button } from "../../ui";
import Stats from "../../ui/Stats";
import { rubikClassName, scrollToId } from "../../utils";
import ViewBrochureModal from "./ViewBrochureModal";

interface IntroSectionProps {}

const IntroSection: React.FC<IntroSectionProps> = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isBrochureModalOpen, setBrochureModalOpen] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(true);

  const handleVideoMuteUnMute = () => {
    sendGTMEvent({ event: "unmute_video" });

    const video = videoRef.current;

    if (video) {
      if (video.muted) {
        video.muted = false;
        setIsVideoMuted(false);
        video.play();
      } else {
        video.muted = true;
        setIsVideoMuted(true);
      }
    }
  };

  const handleBecomeMemberClick = () => {
    sendGTMEvent({ event: "click_cta" });
    scrollToId("apply");
  };

  const handleToggleFullscreen: React.MouseEventHandler<HTMLButtonElement> = (
    e
  ) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.requestFullscreen();
    }
  };
  const handleViewBrochureClick = () => {
    sendGTMEvent({ event: "click_cta" });
    setBrochureModalOpen(true);
  };

  useEffect(() => {
    const videoElement = videoRef.current;

    const handleVideoEnd = () => {
      sendGTMEvent({ event: "complete_video" });
    };

    if (videoElement) {
      videoElement.addEventListener("ended", handleVideoEnd);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener("ended", handleVideoEnd);
      }
    };
  }, []);

  return (
    <>
      {" "}
      <section className="text-center mt-10 z-20 relative">
        <div className="relative min-h-fit">
          <span
            className={cn(
              "text-2xl md:text-[200px] leading-2 md:leading-[106px] font-semibold italic pointer-events-none shiny-text",
              rubikClassName
            )}
          >
            Launching
          </span>
          <div className="md:absolute w-fit mx-auto left-[50%] mt-6 md:mt-auto md:-translate-x-[50%] md:-bottom-18">
            <img
              className="w-[152px] md:w-[280px] h-auto"
              src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/ad739b3b-d923-4c75-8600-50ce4435efc9_20240904125350.svg`}
              alt="white-field-layered-subtitle"
            />
          </div>
        </div>

        <h2 className="sub-heading-2 md:w-[75%] mx-auto mt-6 md:mt-24">
          <span className="text-zui-yellow">Be a partner </span>
          at a next-gen luxury clubhouse.{" "}
          <span className="text-zui-yellow">Get lifetime</span> access to Zo
          Houses, worldwide.
        </h2>

        <div className="flex flex-col md:flex-row items-center gap-6 justify-center mt-10">
          <Button
            className="m-0"
            onClick={handleBecomeMemberClick}
            type="primary"
          >
            Become a Partner
          </Button>
          <Button onClick={handleViewBrochureClick} type="secondary">
            View Brochure
          </Button>
        </div>

        <div
          role="button"
          onClick={handleVideoMuteUnMute}
          className="relative mt-6 md:mt-20 rounded-2xl overflow-hidden w-full h-[400px] md:h-full md:aspect-video"
        >
          <button className="absolute top-6 right-6 bg-zui-dark/80 rounded-full p-4 z-10">
            <Icon name={!isVideoMuted ? "SoundOn" : "SoundOff"} size={18} />
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="absolute bottom-4 right-4 md:bottom-6 md:right-6 rounded-full p-4 z-10"
          >
            <Icon name={"Scanner"} size={24} />
          </button>
          <video
            ref={videoRef}
            muted
            loop
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/videos/2974f360-66ca-4cc3-9f4a-f37b5cc12e6e_20240822111919.mp4`}
          >
            Video Not Supported
          </video>
        </div>

        <Stats
          className="mt-20"
          data={[
            { label: "MemberShip spots Left", value: "420/500" },
            {
              label: "Sq.ft Space",
              value: "36K",
              valueSuffix: "+",
            },
            { label: "Futuristic Amenities", value: 20, valueSuffix: "+" },
          ]}
        />
        <hr className="w-[80%] md:w-[60%] horizontal-divider my-20" />
      </section>
      <ViewBrochureModal
        isOpen={isBrochureModalOpen}
        onClose={setBrochureModalOpen.bind(null, false)}
      />
    </>
  );
};

export default IntroSection;
