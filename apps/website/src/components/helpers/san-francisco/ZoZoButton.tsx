import Image from "next/image";
import React, { useState } from "react";

interface ZoZoButtonProps {
  onClick: () => void;
  width: number;
  height: number;
}

const normalImage: string = `${process.env.MEDIA_BASE_URL}/gallery/media/images/a6bb2650-b1b4-4a1e-ba10-2f70c5a0e38d_20241012083550.svg`;
const activeImage: string = `${process.env.MEDIA_BASE_URL}/gallery/media/images/b7e8bb1e-ef96-4e1a-8f70-d0e6f74ca7a7_20241012083604.svg`;

let audio: HTMLAudioElement | null = null; // Declare audio variable

const ZoZoButton: React.FC<ZoZoButtonProps> = ({ onClick, width, height }) => {
  const [isActive, setIsActive] = useState(false);

  React.useEffect(() => {
    audio = new Audio(
      "https://zoworld-static.s3.ap-south-1.amazonaws.com/media/Zo+Zo+Zo.mp3"
    );
  }, []);

  const handleClick = () => {
    setIsActive(true);
    audio?.play();
    onClick();
    setTimeout(() => setIsActive(false), 200);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <Image
        src={isActive ? activeImage : normalImage}
        alt={"Zo Zo ZO"}
        width={width}
        height={height}
      />
    </button>
  );
};

export default ZoZoButton;
