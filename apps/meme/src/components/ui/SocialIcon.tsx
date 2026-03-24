/* eslint-disable @next/next/no-img-element */
import React from "react";

interface SocialIconProps {
  src: string;
  imgSrc: string;
  tooltip?: string;
  alt: string;
}

const SocialIcon: React.FC<SocialIconProps> = ({
  alt,
  imgSrc,
  src,
  tooltip,
}) => {
  return (
    <a className="relative group" href={src || "#"}>
      <label className="group-hover:opacity-100 opacity-0 bg-white text-black px-4 py-1 absolute rounded-full text-sm whitespace-nowrap -top-8 -left-10">{tooltip}</label>
      <img className="h-8 w-8 md:h-14 md:w-14 aspect-square"  src={imgSrc} alt={alt} />
    </a>
  );
};

export default SocialIcon;
