import { cn } from "@zo/utils/font";
import { useWindowSize } from "@zo/utils/hooks";
import { useRouter } from "next/router";
import React from "react";
import { Button } from "../../ui";
import { rubikClassName, syneClassName } from "../../utils/font";

interface FounderMemberCardProps {}

const features: Array<{ emoji: string; text: string }> = [
  { emoji: "✨", text: "Top-tier membership" },
  { emoji: "😎", text: "Forever limited to 1,111 founders" },
  { emoji: "🏡", text: "24x7 access to all Zo Houses" },
  { emoji: "🎁", text: "Digital collectible airdrops" },
  { emoji: "🚪", text: "NFT-gated community access" },
  { emoji: "🤝", text: "Curated, exclusive IRL events" },
];

const FounderMemberCard: React.FC<FounderMemberCardProps> = () => {
  const router = useRouter();

  const { isMobile } = useWindowSize();

  const openMembership = () => {
    router.push("/membership");
  };

  const formatLabel = (label: string) => {
    const middle = Math.floor(label.length / 2);
    const spaceIndex = label.lastIndexOf(" ", middle);
    const breakPoint = spaceIndex !== -1 ? spaceIndex : middle;

    const firstHalf = label.slice(0, breakPoint).trim();
    const secondHalf = label.slice(breakPoint).trim();

    return (
      <>
        {firstHalf}
        <br />
        {secondHalf}
      </>
    );
  };

  return (
    <section
      className="border border-transparent rounded-2xl mt-20 md:mt-[120px] rotating-gradient-border inner-border"
    >
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-10 md:gap-0 bg-zui-dark p-6 md:px-20 md:py-16 m-0.5 rounded-xl">
        <div>
          <h3 className={cn("sub-heading-2 font-bold", syneClassName)}>
            Become a Founder <br />
            Member
          </h3>

          <div className="flex items-center gap-2 mt-6">
            <h4 className="text-2xl md:text-[56px] leading-6 md:leading-[80px] tracking-[1%] text-zui-yellow font-semibold md:font-bold">
              500+
            </h4>
            <span className="text-sm md:text-base leading-6 tracking-[1%] text-zui-white block w-[fit-content] text-left">
              {formatLabel("Zo World Founder Members")}
            </span>
          </div>

          {!isMobile && (
            <Button
              onClick={openMembership}
              className="hidden md:flex mt-10 w-full md:w-full"
              type="primary"
            >
              Become a Member
            </Button>
          )}
        </div>
        <div className="w-full md:w-auto">
          <ul className={cn("space-y-6", rubikClassName)}>
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
          <Button
            onClick={openMembership}
            className="md:hidden mt-10 w-full"
            type="primary"
          >
            Become a Founder
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FounderMemberCard;
