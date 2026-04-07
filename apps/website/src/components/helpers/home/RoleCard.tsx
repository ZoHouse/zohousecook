import { cn } from "@zo/utils/font";
import React from "react";
import { rubikClassName, syneClassName } from "../../utils/font";

export interface RoleCardProps {
  icon: string;
  title: string;
  tagline: string;
  taglineColor: string;
  description: string;
  bullets: string[];
  bulletIcon?: string;
  bulletColor?: string;
  comingSoon?: boolean;
  proSection?: {
    text: string;
  };
}

const RoleCard: React.FC<RoleCardProps> = ({
  icon,
  title,
  tagline,
  taglineColor,
  description,
  bullets,
  bulletIcon = "✦",
  bulletColor = "text-amber-500",
  comingSoon,
  proSection,
}) => {
  return (
    <div className="w-full rounded-2xl p-6 bg-gradient-to-b from-zui-light/80 to-zui-dark border border-zui-stroke/30 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={cn("text-2xl font-bold", syneClassName)}>
              {title}
            </h3>
            {comingSoon && (
              <span className="text-[10px] font-semibold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                Coming Soon
              </span>
            )}
          </div>
          <p
            className={cn("text-sm font-medium italic", rubikClassName)}
            style={{ color: taglineColor }}
          >
            {tagline}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className={cn("mt-4 text-sm text-white/80 leading-relaxed", rubikClassName)}>
        {description}
      </p>

      {/* What you do */}
      <div className="mt-4">
        <p className={cn("text-xs font-semibold text-white/50 uppercase tracking-wider mb-3", rubikClassName)}>
          What you do
        </p>
        <ul className="space-y-2">
          {bullets.map((bullet, i) => (
            <li key={i} className={cn("flex items-start gap-2 text-sm text-white/90", rubikClassName)}>
              <span className={cn("mt-0.5 text-xs flex-shrink-0", bulletColor)}>{bulletIcon}</span>
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      {/* Pro Section */}
      {proSection && (
        <div className="mt-4 bg-zui-dark/60 rounded-xl p-4 border border-zui-stroke/20 flex items-start gap-3">
          <div className="flex-1">
            <p className={cn("text-xs font-semibold text-white/60 mb-1", rubikClassName)}>
              With Pro Passport
            </p>
            <p className={cn("text-xs text-white/70 leading-relaxed", rubikClassName)}>
              {proSection.text}
            </p>
          </div>
          <div className="flex-shrink-0 text-2xl">
            <span className="bg-gradient-to-br from-amber-400 to-purple-500 text-transparent bg-clip-text font-bold text-sm">
              PRO
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleCard;
