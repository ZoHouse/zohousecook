import React from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { rubikClassName } from "../../utils/font";

interface CultureTagProps {
  name: string;
  icon?: string;
}

const cultureIconMap: Record<string, string> = {
  music: "culture-music.png",
  "music & entertainment": "culture-music.png",
  spiritual: "culture-spiritual.png",
  spirituality: "culture-spiritual.png",
  photography: "culture-photography.png",
  travel: "culture-travel.png",
  "travel & adventure": "culture-travel.png",
};

const CultureTag: React.FC<CultureTagProps> = ({ name, icon }) => {
  const { basePath } = useRouter();
  const iconFile = icon || cultureIconMap[name.toLowerCase()];

  return (
    <div
      className={`flex items-center gap-1 bg-[#202020] px-2 py-1 rounded-2xl ${rubikClassName}`}
    >
      {iconFile && (
        <Image
          src={`${basePath}/passport/${iconFile}`}
          alt={name}
          width={24}
          height={24}
          className="object-cover"
        />
      )}
      <span className="text-white text-[12px] tracking-wider">{name}</span>
    </div>
  );
};

export default CultureTag;
