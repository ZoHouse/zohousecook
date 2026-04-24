import React from "react";
import { MeshGradient } from "@paper-design/shaders-react";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "purple" | "lobby";
  onClick?: () => void;
  style?: React.CSSProperties;
}

// Samurai FX #01 — Hologram. Matches the lobby CitizenCard's holographic foil.
const HOLOGRAM_COLORS = ["#0051FF", "#4DFF00", "#FFE500", "#FF6F00", "#0051FF"];

const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = "",
  variant = "default",
  onClick,
  style: styleProp,
}) => {
  return (
    <div
      className={`relative rounded-[24px] backdrop-blur-[48px] ${className}`}
      style={{
        background:
          variant === "lobby"
            ? "#050505"
            : "linear-gradient(135deg, rgba(41,41,41,0.8), rgba(0,0,0,0.8))",
        boxShadow: "inset 0px -1px 24px rgba(255,255,255,0.4)",
        ...styleProp,
      }}
      onClick={onClick}
    >
      {variant === "lobby" && (
        <div
          aria-hidden
          className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none"
        >
          <MeshGradient
            colors={HOLOGRAM_COLORS}
            speed={0.6}
            scale={1.4}
            distortion={0.6}
            swirl={0.55}
            grainMixer={0.05}
            grainOverlay={0.08}
            fit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      )}
      {variant === "purple" && (
        <div
          className="absolute inset-0 rounded-[24px]"
          style={{
            background:
              "linear-gradient(-55deg, rgba(28,0,51,0.2), rgba(149,13,255,0.2))",
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GlowCard;
