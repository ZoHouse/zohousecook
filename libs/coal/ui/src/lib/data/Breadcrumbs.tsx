import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import { useRouter } from "next/router";
import React from "react";
import { TextLink } from "../button";

export type Breadcrumb = {
  id: string;
  name: string;
  url: string;
};

interface BreadcrumbsProps {
  links: Breadcrumb[];
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ links, className }) => {
  const router = useRouter();

  const openLink = (url: string) => {
    router.push(url);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {links.map((link, i) => (
        <React.Fragment key={link.id}>
          <TextLink
            className={cn(
              i !== links.length - 1 ? "text-zui-white" : "text-zui-silver",
              "leading-none"
            )}
            typo="tertiary"
            onClick={openLink.bind(null, link.url)}
          >
            {link.name}
          </TextLink>
          {i !== links.length - 1 && (
            <Icon name="AngleRight" size={16} fill="#5A5A5A" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs;
