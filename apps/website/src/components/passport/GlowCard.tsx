import React from "react";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "purple";
  onClick?: () => void;
  style?: React.CSSProperties;
}

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
          variant === "purple"
            ? "linear-gradient(135deg, rgba(41,41,41,0.8), rgba(0,0,0,0.8))"
            : "linear-gradient(135deg, rgba(41,41,41,0.8), rgba(0,0,0,0.8))",
        boxShadow: "inset 0px -1px 24px rgba(255,255,255,0.4)",
        ...styleProp,
      }}
      onClick={onClick}
    >
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
