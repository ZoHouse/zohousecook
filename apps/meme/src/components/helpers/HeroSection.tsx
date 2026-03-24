/* eslint-disable @next/next/no-img-element */
import Icon from "@zo/assets/icons";
import { useResponseFlash } from "@zo/utils/hooks";
import { copyTextToClipboard, isValidString } from "@zo/utils/string";
import React, { useRef, useState } from "react";
import Marquee from "react-fast-marquee";
import { sociaLinks } from "../../config";
import { PlayButtonIcon, SocialIcon } from "../ui";
import { cn, comicNeueClassName } from "../utils";

interface HeroSectionProps {}

const videoLinks = [
  "https://cdn.zo.xyz/gallery/media/videos/b25a1b95-3969-4e1c-ab31-89ff234da688_20240804080700.mp4",
  "https://cdn.zo.xyz/gallery/media/videos/16e1a723-6eb0-4f47-9ea0-33cc1d8b8a3e_20240804080555.mp4",
];

const HeroSection: React.FC<HeroSectionProps> = () => {
  const [copied, setCopied] = useResponseFlash(2000);

  const videoRef = useRef<HTMLVideoElement>(null);

  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(true);

  const copy = (copyText: string) => {
    copyTextToClipboard(copyText);
    setCopied("copied");
  };

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const handleVideoMuteUnMute = () => {
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

  const handleVideoEnded = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videoLinks.length);
  };

  return (
    <div
      className={cn(
        "w-screen md:min-h-screen z-10 relative overflow-hidden",
        comicNeueClassName
      )}
    >
      <Marquee speed={80}>
        <div className={cn("flex items-center", comicNeueClassName)}>
          {Array(10)
            .fill(0)
            .map((e, i) => (
              <span key={i} className="mt-10 md:mt-4 mx-4 flex items-center">
                <img
                  className="h-[40px] w-[40px] mx-2"
                  src="https://zoworld-static.s3.ap-south-1.amazonaws.com/media/meme/Unicorn+Graphic+949003.gif"
                  alt="UNICORNS ARE REAL"
                />
                <h1 className="text-2xl font-bold mx-2">UNICORNS ARE REAL</h1>
              </span>
            ))}
        </div>
      </Marquee>

      <div className="flex flex-col justify-end items-center mt-6 relative">
        <img
          className="h-[80px] md:h-[200px] left-6 md:left-[20%] absolute z-10"
          src="https://zoworld-static.s3.ap-south-1.amazonaws.com/media/meme/Green+Day+Unicorn.gif"
          alt="Green Day Unicorn"
        />
        <div className="relative" role="button" onClick={handleVideoMuteUnMute}>
          <PlayButtonIcon
            isPlaying={!isVideoMuted}
            className="absolute top-4 right-4"
          />
          <video
            ref={videoRef}
            autoPlay
            playsInline
            loop={false}
            muted
            controlsList="nofullscreen "
            className="w-[280px] md:w-[600px] h-[180px] md:h-[336px] object-cover mx-2"
            src={videoLinks[currentVideoIndex]}
            onEnded={handleVideoEnded}
          >
            Video is Unsupported.
          </video>
        </div>

        <img
          className="h-[80px] md:h-[200px] absolute right-6 md:right-[20%] z-10"
          src="https://zoworld-static.s3.ap-south-1.amazonaws.com/media/meme/Dance+unicorn.gif"
          alt="Dance Unicorn"
        />
      </div>

      {/* copy address fields */}
      <div className="flex flex-col items-center mt-6 px-6">
        <h2 className="my-4 text-2xl md:text-[56px] font-bold ">
          $Unicorn from San Francisco
        </h2>
        <p className="flex items-center mx-8 sm:mx-0 gap-2 border p-2 rounded-full whitespace-nowrap text-sm md:text-base mt-4ro md:mt-6">
          Contract Address (Solana):
          <a href="#" className="text-blue-400 ">
            {" "}
            Coming Soon
          </a>
          <button onClick={copy.bind(null, String(""))}>
            <Icon
              name={isValidString(copied) ? "Check" : "Copy"}
              size="24"
              fill="#FFF"
            />
          </button>
        </p>
      </div>

      <div className="md:px-[10%] flex justify-center md:justify-between items-center">
        {/* first unicorn */}
        <div className="hidden md:block relative group">
          <img
            className="h-[139px] w-40 md:w-[130px]"
            src="https://zoworld-static.s3.ap-south-1.amazonaws.com/media/meme/Unicorn+Graphic+120677.gif"
            alt="Unicorn Graphic 120677"
          />
          <div className="absolute -top-10 left-6 text-zui-dark bg-zui-white px-4 p-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            I must fulfil my destiny
          </div>
        </div>

        {/* socials */}
        <div className="flex flex-row justify-center items-center space-x-8 mt-4 md:mt-6">
          {sociaLinks.map((link, index) => (
            <SocialIcon
              key={index}
              alt={link.alt}
              imgSrc={link.imgSrc}
              src={link.link}
              tooltip={link.tooltip}
            />
          ))}
        </div>

        {/* another unicorn */}
        <div className="hidden md:block relative group">
          <img
            className="h-[139px] w-40 md:w-[130px]"
            src="https://zoworld-static.s3.ap-south-1.amazonaws.com/media/meme/Unicorn+Smiles+Rainbow.gif"
            alt="Unicorn Smiles Rainbow"
          />
          <div className="absolute -top-8 right-8 text-zui-dark bg-zui-white px-4 p-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            when you catch a mystical creature <br />
            you never let go 🌈🦄🌈🦄
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
