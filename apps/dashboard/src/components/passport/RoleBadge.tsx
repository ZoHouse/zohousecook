import React from "react";
import { rubikClassName } from "../../utils/font";

interface RoleBadgeProps {
  type: "creator" | "tribebuilder";
}

const StarIcon: React.FC<{ color: string; letter: string }> = ({
  color,
  letter,
}) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 1L12.35 7.1L19 7.65L14 11.95L15.55 18.5L10 15.15L4.45 18.5L6 11.95L1 7.65L7.65 7.1L10 1Z"
      fill={color}
    />
    <text
      x="10"
      y="13"
      textAnchor="middle"
      fill="white"
      fontSize="7"
      fontWeight="bold"
    >
      {letter}
    </text>
  </svg>
);

const config = {
  creator: {
    background:
      "linear-gradient(106deg, #fff 16%, #e7c9ff 73%, #daacff 99%)",
    color: "#950dff",
    label: "Creator",
    letter: "C",
  },
  tribebuilder: {
    background:
      "linear-gradient(115deg, #fff 16%, #ffeec9 73%, #ffe6ac 99%)",
    color: "#e39406",
    label: "TribeBUILDER",
    letter: "T",
  },
};

const RoleBadge: React.FC<RoleBadgeProps> = ({ type }) => {
  const { background, color, label, letter } = config[type];

  return (
    <div
      className={`flex items-center gap-1 p-2 rounded-xl ${rubikClassName}`}
      style={{ background }}
    >
      <StarIcon color={color} letter={letter} />
      <span className="text-[13px] font-bold" style={{ color }}>
        {label}
      </span>
    </div>
  );
};

export default RoleBadge;
