import { cn } from "@zo/utils/font";
import Link from "next/link";
import React from "react";
import { rubikClassName, syneClassName } from "../../utils/font";

interface ZoClubProps {
  className?: string;
  downloadLinksClassName?: string;
}

const features: Array<{ emoji: string; text: string }> = [
  { emoji: "📊", text: "Track your milestones and XP" },
  { emoji: "🏆", text: "Compete on the founder leaderboard" },
  { emoji: "🎯", text: "Daily standups, showcases, events scored live" },
  { emoji: "🤝", text: "Connect with every founder in the house" },
];

const ZoClub: React.FC<ZoClubProps> = ({
  className,
  downloadLinksClassName,
}) => {
  return (
    <section
      className={cn(
        "p-6 pb-0 md:p-10 flex flex-col-reverse md:flex-row items-start gap-10 md:gap-20 relative z-20 bg-zui-dark overflow-hidden",
        className
      )}
    >
      <img
        className="flex-shrink-0 md:w-1/2"
        src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/b2846376-4783-42ee-8532-e7f1476b7e2a_20240829092150.png?w=720`}
        alt="iphone-mockup-club"
      />
      <div className="flex-1 min-w-0">
        <h3 className={cn("sub-heading-2 font-bold", syneClassName)}>
          Every Founder Gets Tracked
        </h3>
        <ul className={"space-y-4 mt-6"}>
          {features.map((feature, index) => (
            <li
              className={cn(
                "sub-heading-3 font-medium flex items-center gap-4",
                rubikClassName
              )}
              key={`feature-${index}`}
            >
              <span>{feature.emoji}</span>
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>

        <div
          className={cn(
            "hidden md:flex gap-6 items-center mt-10",
            downloadLinksClassName
          )}
        >
          <Link
            target="_blank"
            href={"https://play.google.com/store/apps/details?id=xyz.zo.club"}
          >
            <img
              src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/25843e38-7ea1-40aa-ac99-d624e805da2d_20240902062633.svg?w=320`}
              alt="android-app-download"
              className="w-48 h-14"
            />
          </Link>
          <Link
            target="_blank"
            href={"https://apps.apple.com/lb/app/zo-club/id6449470618"}
          >
            <img
              src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/b9bb0e46-9dec-4ebd-8326-304310bca844_20240902062722.svg?w=320`}
              alt="ios-app-download"
              className="w-48 h-14"
            />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ZoClub;
