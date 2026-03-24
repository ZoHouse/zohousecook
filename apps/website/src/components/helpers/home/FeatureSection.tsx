import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import { useRouter } from "next/router";
import React from "react";
import patterns from "../../../patterns";
import IconCard, { IconCardProps } from "../../ui/IconCard";

interface Link {
  label: string;
  link: string;
  openLinkinNewTab?: boolean;
}
export interface FeatureSectionProps {
  title: string;
  subtitle?: string;
  features?: IconCardProps[];
  links?: Link[];
}

const patternsMapping = [
  patterns.ellipse?.src,
  patterns.square?.src,
  patterns.curves?.src,
  patterns.star?.src,
];

const FeatureSection: React.FC<FeatureSectionProps> = ({
  features,
  subtitle,
  title,
  links = [],
}) => {
  const router = useRouter();

  const openPage = (link: string, openLinkinNewTab: boolean = false) => {
    if (openLinkinNewTab) {
      window.open(link || "", "_blank");
    } else {
      router.push(link || "");
    }
  };

  return (
    <section className="mt-48 flex flex-col lg:mt-[380px]">
      <h1 className="zui-heading-1">{title}</h1>
      <span className="zui-heading-2 mt-6 lg:mt-2">{subtitle}</span>
      <div className="mt-20 grid lg:grid-cols-4 gap-6 grid-cols-1 md:grid-cols-2">
        {features?.map((feature: IconCardProps, index) => (
          <IconCard
            pattern={patternsMapping[index] || null}
            key={index}
            description={feature.description}
            icon={feature.icon}
            iconFill={feature.iconFill}
          />
        ))}
      </div>
      <div className="flex items-start md:items-center flex-col md:flex-row md:gap-28">
        {links.map((link: Link, index: number) => (
          <button
            key={index}
            className={cn(
              "group flex items-center space-x-5 md:space-x-10",
              index === 0 ? "mt-20" : "mt-10 md:mt-20"
            )}
            onClick={openPage.bind(null, link.link, link.openLinkinNewTab)}
          >
            <span className="text-[40px] lg:text-[120px] lg:leading-[154px] font-extrabold text-zui-neon font-bold">
              {link.label}
            </span>
            <div className="h-14 w-14 md:h-20 md:w-20 flex-shrink-0 lg:w-[120px] lg:h-[120px] relative grid place-content-center">
              <div className="absolute inset-0 cta-clip-path transition-all ease-in-out duration-100 animate-spin-slow bg-zui-neon" />
              <Icon
                className="relative h-6 w-6 md:h-10 md:w-10"
                name="ArrowRight"
                fill="#121212"
              />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default FeatureSection;
