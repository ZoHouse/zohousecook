import React from "react";

interface CitizenSealProps {
  year?: string;
  size?: number;
}

const CitizenSeal: React.FC<CitizenSealProps> = ({ year = "2024", size = 95 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 95 95" fill="none">
      <defs>
        <filter id="sealShadow">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#c4956a" floodOpacity="0.3" />
        </filter>
        <path
          id="topArc"
          d="M 15 47.5 A 32.5 32.5 0 0 1 80 47.5"
          fill="none"
        />
        <path
          id="bottomArc"
          d="M 80 47.5 A 32.5 32.5 0 0 1 15 47.5"
          fill="none"
        />
      </defs>

      {/* Outer circle */}
      <circle
        cx="47.5"
        cy="47.5"
        r="45"
        fill="white"
        stroke="#F15824"
        strokeWidth="2"
        filter="url(#sealShadow)"
      />

      {/* Inner decorative ring */}
      <circle
        cx="47.5"
        cy="47.5"
        r="38"
        fill="none"
        stroke="#F15824"
        strokeWidth="0.5"
        strokeDasharray="2 2"
      />

      {/* Curved text - top */}
      <text
        fill="#F15824"
        fontSize="8"
        fontWeight="700"
        letterSpacing="2"
      >
        <textPath href="#topArc" startOffset="50%" textAnchor="middle">
          CITIZEN OF ZO WORLD
        </textPath>
      </text>

      {/* Center star */}
      <path
        d="M47.5 28L51.5 38.5L62.5 39.5L54 47L56.5 58L47.5 52.5L38.5 58L41 47L32.5 39.5L43.5 38.5L47.5 28Z"
        fill="#F1563F"
      />
      <text
        x="47.5"
        y="48"
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="bold"
      >
        Z
      </text>

      {/* Curved text - bottom */}
      <text
        fill="#F15824"
        fontSize="7"
        fontWeight="600"
        letterSpacing="1.5"
      >
        <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">
          SINCE {year}
        </textPath>
      </text>
    </svg>
  );
};

export default CitizenSeal;
