import React from "react";

interface ResearchSectionProps {}

const ResearchSection: React.FC<ResearchSectionProps> = () => {
  return (
    <div className="w-screen h-auto mt-24 overflow-hidden relative">
      <div className="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] z-30 text-center">
        <h3 className="text-base md:text-2xl leading-[24px]  md:leading-snug md:text-[56px] font-bold">
          $20b research into making a rainbow pooping unicorn which will fly to
          space
        </h3>
      </div>
      <div className="w-full h-full z-10 bg-black opacity-40 absolute" />
      <video
        autoPlay
        playsInline
        loop
        controls={false}
        muted={true}
        className="w-full h-full object-cover"
      >
        <source
          src="https://cdn.zo.xyz/gallery/media/videos/422c78fa-e90f-44c2-9c54-7ebd4bf8f853_20240724124940.mp4"
          type="video/mp4"
        />
      </video>
    </div>
  );
};

export default ResearchSection;
