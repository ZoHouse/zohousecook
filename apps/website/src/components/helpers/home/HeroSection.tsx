import { cn } from "@zo/utils/font";
import { useAuth } from "@zo/auth";
import React from "react";
import { Button } from "../../ui";
import { syneClassName } from "../../utils";

interface HeroSectionProps {}

const HeroSection: React.FC<HeroSectionProps> = () => {
  const { showLoginModal, isLoggedIn } = useAuth();

  const handleTuneIn = () => {
    if (isLoggedIn) {
      window.location.href = "/passport";
    } else {
      showLoginModal(undefined, "/passport");
    }
  };

  return (
    <>
      <section className="flex flex-col items-center text-center w-full h-[85vh] md:h-[85vh] md:max-h-[960px] relative">
        <div
          className={cn(
            "h-fit w-full absolute bottom-0 top-[50%] md:top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] md:-translate-y-[50%] z-50 select-none"
          )}
        >
          <h1
            className={cn(
              "text-2xl leading-8 md:text-[80px] md:leading-[96px] font-bold",
              syneClassName
            )}
          >
            Unlock the Future of{" "}
            <span
              className={cn(
                "font-bold text-gradient-white-to-lighter italic ",
                syneClassName
              )}
            >
              Travel, Explore, and Earn
            </span>{" "}
          </h1>
          <p className="text-white/60 text-sm md:text-lg mt-3 md:mt-4 max-w-[90%] md:max-w-[600px] mx-auto leading-relaxed">
            Member-only access to free stays, community experiences, creator
            rewards, referral earnings, and tools to host and build Zo World.
          </p>
          <Button
            onClick={handleTuneIn}
            className="hidden md:block mt-4 w-full md:w-1/4 mx-auto"
            type="primary"
          >
            Become a Citizen
          </Button>
        </div>

        {/* Background Images */}
        <div className="w-full h-full relative">
          {/* Globe Image */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="select-none absolute left-[50%] -translate-x-[50%] translate-y-0 md:-translate-y-[20%] w-72 md:w-[600px] top-0 mix-blend-lighten opacity-60"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/videos/3f49b592-4115-4117-8c80-c1a9e1d889a1_20240925123905.mp4`}
          />

          {/* Travel and Adventure Image */}
          <img
            className="w-14 md:w-32 absolute top-[25%] right-0 md:top-0 md:right-0 -rotate-[15deg] z-20"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/9685203b-b49f-4c52-9caf-7869cce83eb0_20240823082641.png?w=400`}
            alt="Travel and Adventure"
          />
        </div>

        {/* Video Section */}
        <div className="w-[120px] h-[156px] md:w-[260px] md:h-[340px] overflow-hidden absolute right-4 bottom-[12%] md:bottom-[20%] rotate-[8deg] rounded-2xl inner-border">
          <video
            className="w-full h-full object-cover z-100"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/videos/8795e054-5c51-42ac-8570-2279a93f3aaf_20240903101643.mp4`}
            autoPlay
            muted
            loop
            playsInline
          ></video>
        </div>
        <img
          className="w-20 md:w-[200px] absolute aspect-square bottom-[0%] md:bottom-0 right-[50%] translate-x-[50%] md:translate-x-0 md:right-[15%] -rotate-[30deg]"
          src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/21fec23a-6a98-4ece-8483-5d6017e18102_20240823082620.png?w=400`}
          alt="science and tech"
        />

        <div className="w-[120px] h-[156px] md:w-[260px] md:h-[340px] overflow-hidden absolute left-0 bottom-[5%] md:bottom-[5%] -rotate-[9deg] rounded-2xl inner-border">
          <video
            className="w-full h-full object-cover z-100"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/videos/c243c43c-7199-485e-9e56-8976a594f4f9_20240903100216.mp4`}
            autoPlay
            muted
            loop
            playsInline
          ></video>
        </div>

        <img
          className="w-20 md:w-[200px] absolute top-[15%] md:top-0 z-10 -left-5 md:left-0"
          src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/75adf59a-9b67-41e7-a067-1bcea94c4082_20240823082424.png?w=320`}
          alt="science and tech"
        />
      </section>
      <hr className="w-[80%] md:w-[60%] horizontal-divider my-10" />
    </>
  );
};

export default HeroSection;
